import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get pipeline metrics
router.get('/pipeline', async (req, res) => {
  try {
    const { jobId, startDate, endDate } = req.query;

    const where: any = {};
    if (jobId) where.jobId = jobId;
    if (startDate || endDate) {
      where.appliedAt = {};
      if (startDate) where.appliedAt.gte = new Date(startDate as string);
      if (endDate) where.appliedAt.lte = new Date(endDate as string);
    }

    // Get stage counts
    const stageCounts = await prisma.application.groupBy({
      by: ['stage'],
      where,
      _count: true,
    });

    // Get status counts
    const statusCounts = await prisma.application.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Calculate average time in each stage (simplified)
    const applications = await prisma.application.findMany({
      where,
      select: {
        stage: true,
        appliedAt: true,
        updatedAt: true,
      },
    });

    const stageMetrics = stageCounts.map(sc => ({
      stage: sc.stage,
      count: sc._count,
    }));

    // Calculate conversion rates
    const totalApplied = stageCounts.reduce((sum, s) => sum + s._count, 0);
    const funnel = [
      { stage: 'Applied', count: totalApplied, rate: 100 },
      { stage: 'Screening', count: stageCounts.find(s => s.stage !== 'resume_review')?._count || 0, rate: 0 },
      { stage: 'Interview', count: stageCounts.find(s => ['technical', 'onsite'].includes(s.stage))?._count || 0, rate: 0 },
      { stage: 'Offer', count: stageCounts.find(s => s.stage === 'offer')?._count || 0, rate: 0 },
      { stage: 'Hired', count: statusCounts.find(s => s.status === 'hired')?._count || 0, rate: 0 },
    ];

    // Calculate conversion rates
    for (let i = 1; i < funnel.length; i++) {
      funnel[i].rate = funnel[i - 1].count > 0
        ? Math.round((funnel[i].count / funnel[i - 1].count) * 100)
        : 0;
    }

    res.json({
      success: true,
      data: {
        stageMetrics,
        statusCounts: statusCounts.map(sc => ({ status: sc.status, count: sc._count })),
        funnel,
        totalApplications: totalApplied,
        averageTimeToHire: 21, // Placeholder - would calculate from actual data
      },
    });
  } catch (error) {
    console.error('Error fetching pipeline metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pipeline metrics' });
  }
});

// Get diversity metrics
router.get('/diversity', async (req, res) => {
  try {
    // Note: In a real implementation, you'd need to collect demographic data
    // This is mock data for demonstration
    const diversityMetrics = {
      gender: {
        applied: { male: 52, female: 45, other: 3 },
        interviewed: { male: 50, female: 47, other: 3 },
        hired: { male: 48, female: 50, other: 2 },
      },
      ethnicity: {
        applied: { white: 45, asian: 25, hispanic: 15, black: 10, other: 5 },
        interviewed: { white: 42, asian: 28, hispanic: 16, black: 9, other: 5 },
        hired: { white: 40, asian: 30, hispanic: 17, black: 8, other: 5 },
      },
      veteranStatus: {
        applied: { veteran: 8, nonVeteran: 92 },
        interviewed: { veteran: 10, nonVeteran: 90 },
        hired: { veteran: 12, nonVeteran: 88 },
      },
      biasIndicators: [
        { metric: 'Gender parity at interview stage', score: 95, status: 'good' },
        { metric: 'Ethnic representation in hiring', score: 88, status: 'good' },
        { metric: 'Age diversity in shortlists', score: 72, status: 'attention' },
      ],
    };

    res.json({ success: true, data: diversityMetrics });
  } catch (error) {
    console.error('Error fetching diversity metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch diversity metrics' });
  }
});

// Get source effectiveness
router.get('/sources', async (req, res) => {
  try {
    const sourceCounts = await prisma.candidate.groupBy({
      by: ['source'],
      _count: true,
    });

    // Get hired by source (would need to join with applications)
    const applications = await prisma.application.findMany({
      where: { status: 'hired' },
      include: {
        candidate: {
          select: { source: true },
        },
      },
    });

    const hiredBySource: Record<string, number> = {};
    applications.forEach(app => {
      const source = app.candidate.source || 'unknown';
      hiredBySource[source] = (hiredBySource[source] || 0) + 1;
    });

    const sourceMetrics = sourceCounts.map(sc => {
      const source = sc.source || 'unknown';
      const applied = sc._count;
      const hired = hiredBySource[source] || 0;
      return {
        source,
        applied,
        hired,
        conversionRate: applied > 0 ? Math.round((hired / applied) * 100) : 0,
        // Cost per hire would come from external tracking
        costPerHire: source === 'referral' ? 500 : source === 'linkedin' ? 2500 : 1500,
      };
    });

    res.json({ success: true, data: sourceMetrics });
  } catch (error) {
    console.error('Error fetching source metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch source metrics' });
  }
});

// Get recruiter performance
router.get('/recruiters', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'recruiter' },
      include: {
        _count: {
          select: { interviews: true },
        },
      },
    });

    // Mock performance data
    const recruiterMetrics = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      interviewsConducted: user._count.interviews,
      hiresThisMonth: Math.floor(Math.random() * 5) + 1,
      averageTimeToFill: Math.floor(Math.random() * 15) + 15,
      candidateSatisfaction: Math.round((Math.random() * 2 + 3) * 10) / 10,
    }));

    res.json({ success: true, data: recruiterMetrics });
  } catch (error) {
    console.error('Error fetching recruiter metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recruiter metrics' });
  }
});

export default router;
