import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MatchResult {
  jobId: string;
  jobTitle: string;
  matchScore: number; // 0-100
  matchDetails: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    overallFit: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  highlights: string[];
  concerns: string[];
}

export async function matchCandidateToJobs(
  candidate: any,
  jobs: any[]
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];

  for (const job of jobs) {
    const match = await calculateJobMatch(candidate, job);
    results.push(match);
  }

  // Sort by match score descending
  results.sort((a, b) => b.matchScore - a.matchScore);

  return results;
}

async function calculateJobMatch(candidate: any, job: any): Promise<MatchResult> {
  const candidateSkills = candidate.skills?.technical || [];
  const requiredSkills = job.skillsRequired || [];
  const preferredSkills = job.skillsPreferred || [];

  // Basic skill matching
  const allJobSkills = [...new Set([...requiredSkills, ...preferredSkills])];
  const matchedSkills = candidateSkills.filter((skill: string) =>
    allJobSkills.some((jobSkill: string) =>
      skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
      jobSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );
  const missingSkills = requiredSkills.filter((skill: string) =>
    !candidateSkills.some((candSkill: string) =>
      skill.toLowerCase().includes(candSkill.toLowerCase()) ||
      candSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  // Calculate basic scores
  const skillsMatchPct = requiredSkills.length > 0
    ? (matchedSkills.length / requiredSkills.length) * 100
    : 100;

  const experienceYears = Number(candidate.experienceYears) || 0;
  const experienceMatchPct = calculateExperienceMatch(experienceYears, job.experienceLevel);

  // Use AI for more nuanced matching
  const aiAnalysis = await getAIMatchAnalysis(candidate, job);

  const matchScore = Math.round(
    (skillsMatchPct * 0.4) +
    (experienceMatchPct * 0.3) +
    (aiAnalysis.cultureFit * 0.2) +
    (aiAnalysis.overallFit * 0.1)
  );

  return {
    jobId: job.id,
    jobTitle: job.title,
    matchScore: Math.min(100, Math.max(0, matchScore)),
    matchDetails: {
      skillsMatch: Math.round(skillsMatchPct),
      experienceMatch: Math.round(experienceMatchPct),
      educationMatch: aiAnalysis.educationMatch,
      overallFit: aiAnalysis.overallFit,
    },
    matchedSkills,
    missingSkills,
    highlights: aiAnalysis.highlights,
    concerns: aiAnalysis.concerns,
  };
}

function calculateExperienceMatch(candidateYears: number, jobLevel: string): number {
  const levelRequirements: Record<string, { min: number; ideal: number; max: number }> = {
    entry: { min: 0, ideal: 1, max: 3 },
    mid: { min: 2, ideal: 4, max: 7 },
    senior: { min: 5, ideal: 8, max: 15 },
    lead: { min: 7, ideal: 10, max: 20 },
    executive: { min: 10, ideal: 15, max: 30 },
  };

  const req = levelRequirements[jobLevel] || levelRequirements.mid;

  if (candidateYears < req.min) {
    return Math.max(0, (candidateYears / req.min) * 70);
  } else if (candidateYears <= req.ideal) {
    return 80 + ((candidateYears - req.min) / (req.ideal - req.min)) * 20;
  } else if (candidateYears <= req.max) {
    return 100;
  } else {
    // Overqualified - slight penalty
    return Math.max(70, 100 - ((candidateYears - req.max) * 2));
  }
}

async function getAIMatchAnalysis(
  candidate: any,
  job: any
): Promise<{
  cultureFit: number;
  overallFit: number;
  educationMatch: number;
  highlights: string[];
  concerns: string[];
}> {
  try {
    const prompt = `Analyze the fit between this candidate and job opening.

CANDIDATE:
- Current Role: ${candidate.currentTitle || 'N/A'} at ${candidate.currentCompany || 'N/A'}
- Experience: ${candidate.experienceYears || 0} years
- Skills: ${JSON.stringify(candidate.skills?.technical || [])}
- Education: ${JSON.stringify(candidate.education || [])}

JOB:
- Title: ${job.title}
- Level: ${job.experienceLevel}
- Required Skills: ${JSON.stringify(job.skillsRequired || [])}
- Description: ${job.description?.substring(0, 500) || 'N/A'}

Provide analysis as JSON:
{
  "cultureFit": number (0-100),
  "overallFit": number (0-100),
  "educationMatch": number (0-100),
  "highlights": ["string"] - 2-3 positive points,
  "concerns": ["string"] - 0-2 potential concerns
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR recruiter. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('AI match analysis error:', error);
  }

  // Default values if AI fails
  return {
    cultureFit: 70,
    overallFit: 70,
    educationMatch: 70,
    highlights: ['Candidate meets basic requirements'],
    concerns: [],
  };
}

export default matchCandidateToJobs;
