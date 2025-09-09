import OpenAI from 'openai';
import pdf from 'pdf-parse';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ParsedResume {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary?: string;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    description?: string;
    achievements?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear?: number;
    gpa?: number;
    field?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages?: string[];
    certifications?: string[];
  };
  totalExperienceYears: number;
}

export async function parseResume(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ParsedResume> {
  // Extract text from PDF
  let resumeText = '';

  if (mimeType === 'application/pdf') {
    const pdfData = await pdf(fileBuffer);
    resumeText = pdfData.text;
  } else {
    // For Word docs, we'd use a different library
    // For now, treat as plain text
    resumeText = fileBuffer.toString('utf-8');
  }

  // Use GPT-4 to parse the resume
  const prompt = `You are an expert HR recruiter and resume parser. Parse the following resume and extract structured information.

Resume Text:
${resumeText}

Extract and return a JSON object with the following structure:
{
  "contact": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "portfolio": "string or null"
  },
  "summary": "string or null - professional summary if present",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string or null",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM, YYYY, or 'present'",
      "description": "string or null",
      "achievements": ["string"] - list of quantifiable achievements
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "graduationYear": number or null,
      "gpa": number or null,
      "field": "string or null - field of study"
    }
  ],
  "skills": {
    "technical": ["string"] - programming languages, tools, frameworks,
    "soft": ["string"] - communication, leadership, etc.,
    "languages": ["string"] - spoken languages,
    "certifications": ["string"] - professional certifications
  },
  "totalExperienceYears": number - total years of professional experience
}

Important:
- Extract email carefully - it's required
- Calculate total experience years from work history
- Normalize skill names (e.g., "JS" -> "JavaScript")
- Order experience from most recent to oldest
- Only include verifiable information from the resume

Return ONLY the JSON object, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a professional resume parser. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content) as ParsedResume;

    // Validate required fields
    if (!parsed.contact?.email) {
      throw new Error('Could not extract email from resume');
    }

    // Set defaults for missing fields
    parsed.experience = parsed.experience || [];
    parsed.education = parsed.education || [];
    parsed.skills = parsed.skills || { technical: [], soft: [] };
    parsed.totalExperienceYears = parsed.totalExperienceYears || 0;

    return parsed;
  } catch (error) {
    console.error('Error parsing resume with AI:', error);

    // Return a minimal parsed result
    return {
      contact: {
        firstName: 'Unknown',
        lastName: 'Candidate',
        email: extractEmail(resumeText) || 'unknown@example.com',
      },
      experience: [],
      education: [],
      skills: { technical: [], soft: [] },
      totalExperienceYears: 0,
    };
  }
}

function extractEmail(text: string): string | null {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

export default parseResume;
