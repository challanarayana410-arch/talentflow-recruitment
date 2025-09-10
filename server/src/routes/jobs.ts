import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const { status, department, search } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: jobs.map(job => ({
        ...job,
        applicantCount: job._count.applications,
      })),
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        applications: {
          include: {
            candidate: true,
          },
          orderBy: { appliedAt: 'desc' },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch job' });
  }
});

// Create job
router.post('/', async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      description,
      requirements,
      skillsRequired,
      skillsPreferred,
      benefits,
    } = req.body;

    const job = await prisma.job.create({
      data: {
        title,
        department,
        location,
        employmentType,
        experienceLevel,
        salaryMin,
        salaryMax,
        description,
        requirements: requirements || [],
        skillsRequired: skillsRequired || [],
        skillsPreferred: skillsPreferred || [],
        benefits: benefits || [],
      },
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ success: false, error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', async (req, res) => {
  try {
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ success: false, error: 'Failed to update job' });
  }
});

// Get candidates for a job
router.get('/:id/candidates', async (req, res) => {
  try {
    const { stage, status } = req.query;

    const where: any = { jobId: req.params.id };
    if (stage) where.stage = stage;
    if (status) where.status = status;

    const applications = await prisma.application.findMany({
      where,
      include: {
        candidate: true,
        interviews: true,
        evaluations: true,
      },
      orderBy: [
        { matchScore: 'desc' },
        { appliedAt: 'desc' },
      ],
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch candidates' });
  }
});

export default router;
