import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { parseResume } from '../ai/resumeParser';
import { matchCandidateToJobs } from '../ai/jobMatcher';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  },
});

// Get all candidates
router.get('/', async (req, res) => {
  try {
    const { search, skills, source } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { currentTitle: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (source) where.source = source;

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        applications: {
          include: {
            job: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch candidates' });
  }
});

// Get candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: req.params.id },
      include: {
        applications: {
          include: {
            job: true,
            interviews: true,
            evaluations: true,
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    res.json({ success: true, data: candidate });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch candidate' });
  }
});

// Create candidate
router.post('/', async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      location,
      linkedinUrl,
      portfolioUrl,
      source,
    } = req.body;

    // Check if candidate exists
    const existing = await prisma.candidate.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Candidate with this email already exists' });
    }

    const candidate = await prisma.candidate.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        source: source || 'direct',
      },
    });

    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ success: false, error: 'Failed to create candidate' });
  }
});

// Parse resume and create/update candidate
router.post('/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No resume file provided' });
    }

    // Parse the resume using AI
    const parsedResume = await parseResume(req.file.buffer, req.file.mimetype);

    // Check if candidate exists
    let candidate = await prisma.candidate.findUnique({
      where: { email: parsedResume.contact.email },
    });

    const candidateData = {
      email: parsedResume.contact.email,
      firstName: parsedResume.contact.firstName,
      lastName: parsedResume.contact.lastName,
      phone: parsedResume.contact.phone,
      location: parsedResume.contact.location,
      linkedinUrl: parsedResume.contact.linkedin,
      parsedResume: JSON.parse(JSON.stringify(parsedResume)),
      skills: parsedResume.skills,
      experienceYears: parsedResume.totalExperienceYears,
      currentTitle: parsedResume.experience?.[0]?.title,
      currentCompany: parsedResume.experience?.[0]?.company,
      education: JSON.parse(JSON.stringify(parsedResume.education)),
      source: req.body.source || 'resume_upload',
    };

    if (candidate) {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: candidateData,
      });
    } else {
      candidate = await prisma.candidate.create({
        data: candidateData,
      });
    }

    res.json({
      success: true,
      data: {
        candidate,
        parsedResume,
      },
    });
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ success: false, error: 'Failed to parse resume' });
  }
});

// Match candidate to jobs
router.post('/:id/match', async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: req.params.id },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const jobs = await prisma.job.findMany({
      where: { status: 'open' },
    });

    const matches = await matchCandidateToJobs(candidate, jobs);

    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('Error matching candidate:', error);
    res.status(500).json({ success: false, error: 'Failed to match candidate to jobs' });
  }
});

// Add note to candidate
router.post('/:id/notes', async (req, res) => {
  try {
    const { content, isPrivate, authorId } = req.body;

    const note = await prisma.candidateNote.create({
      data: {
        candidateId: req.params.id,
        authorId,
        content,
        isPrivate: isPrivate || false,
      },
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, error: 'Failed to add note' });
  }
});

export default router;
