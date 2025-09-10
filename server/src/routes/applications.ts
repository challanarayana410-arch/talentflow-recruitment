import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all applications
router.get('/', async (req, res) => {
  try {
    const { status, stage, jobId, candidateId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (stage) where.stage = stage;
    if (jobId) where.jobId = jobId;
    if (candidateId) where.candidateId = candidateId;

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: {
          select: { id: true, title: true, department: true },
        },
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true, currentTitle: true },
        },
        interviews: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
});

// Create application
router.post('/', async (req, res) => {
  try {
    const { jobId, candidateId, coverLetter, referralSource, matchScore, matchDetails } = req.body;

    // Check if application already exists
    const existing = await prisma.application.findUnique({
      where: {
        jobId_candidateId: { jobId, candidateId },
      },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Application already exists' });
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId,
        coverLetter,
        referralSource,
        matchScore,
        matchDetails,
      },
      include: {
        job: true,
        candidate: true,
      },
    });

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ success: false, error: 'Failed to create application' });
  }
});

// Update application status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, stage, rejectionReason } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (stage) updateData.stage = stage;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        job: true,
        candidate: true,
      },
    });

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ success: false, error: 'Failed to update application' });
  }
});

// Schedule interview
router.post('/:id/schedule', async (req, res) => {
  try {
    const {
      interviewerId,
      interviewType,
      scheduledAt,
      durationMinutes,
      location,
      meetingLink,
    } = req.body;

    const interview = await prisma.interview.create({
      data: {
        applicationId: req.params.id,
        interviewerId,
        interviewType,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes || 60,
        location,
        meetingLink,
      },
    });

    // Update application stage
    await prisma.application.update({
      where: { id: req.params.id },
      data: { stage: 'interview', status: 'interview' },
    });

    res.status(201).json({ success: true, data: interview });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ success: false, error: 'Failed to schedule interview' });
  }
});

// Add evaluation
router.post('/:id/evaluate', async (req, res) => {
  try {
    const {
      evaluatorId,
      stage,
      technicalScore,
      communicationScore,
      cultureFitScore,
      overallScore,
      recommendation,
      strengths,
      weaknesses,
      comments,
    } = req.body;

    const evaluation = await prisma.evaluation.create({
      data: {
        applicationId: req.params.id,
        evaluatorId,
        stage,
        technicalScore,
        communicationScore,
        cultureFitScore,
        overallScore,
        recommendation,
        strengths,
        weaknesses,
        comments,
      },
    });

    res.status(201).json({ success: true, data: evaluation });
  } catch (error) {
    console.error('Error adding evaluation:', error);
    res.status(500).json({ success: false, error: 'Failed to add evaluation' });
  }
});

// Get application details
router.get('/:id', async (req, res) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        job: true,
        candidate: true,
        interviews: {
          include: {
            interviewer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { scheduledAt: 'asc' },
        },
        evaluations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch application' });
  }
});

export default router;
