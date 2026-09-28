import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not defined in environment variables.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

/**
 * Analyzes resume text against a job description using Gemini.
 * @param {string} resumeText - The parsed text from the PDF resume.
 * @param {string} jobDescription - The job description.
 * @returns {Promise<object>} The structured analysis object.
 */
export async function analyzeResume(resumeText, jobDescription) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Please configure a valid GEMINI_API_KEY in your .env.local file.');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `
You are an expert Technical Recruiter and ATS (Applicant Tracking System) parser.
Your task is to analyze the following candidate resume text against the provided job description.
Assess the match objectively and output a JSON object containing:
1. "score": An integer match rating from 0 to 100 representing how well the resume matches the requirements.
2. "summary": A high-level 2-3 sentence overview assessing candidate suitability.
3. "matchedSkills": A list of skills, programming languages, tools, or frameworks mentioned in BOTH the resume and the job description.
4. "missingSkills": A list of skills, tools, or qualifications requested in the job description that are NOT found in the resume.
5. "suggestions": A list of 3-5 specific, constructive improvements the candidate could make to their resume (e.g. skills to add, project framing, formatting suggestions) to better align with the job description.
6. "educationMatch": A brief 1-sentence assessment of whether the candidate's academic background matches the job requirements.
7. "experienceMatch": A brief 1-sentence assessment of whether the candidate's work history matches the required years of experience and level of seniority.

Resume Text:
"""
${resumeText}
"""

Job Description:
"""
${jobDescription}
"""

Return ONLY a valid JSON object matching this schema:
{
  "score": number,
  "summary": string,
  "matchedSkills": [string],
  "missingSkills": [string],
  "suggestions": [string],
  "educationMatch": string,
  "experienceMatch": string
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to analyze resume using Gemini AI: ' + error.message);
  }
}
