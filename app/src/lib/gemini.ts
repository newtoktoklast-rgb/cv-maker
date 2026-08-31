import { CVData, CoverLetterDetails } from "./types";

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.7-flash";

function getApiKey(customKey?: string): string {
  const key = customKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Gemini API key is required. Please provide an API key in the UI or set GEMINI_API_KEY in your .env file."
    );
  }
  return key;
}

export async function generateCoverLetterAI(
  cv: CVData,
  target: {
    companyName: string;
    jobTitle: string;
    hiringManager?: string;
    jobDescription?: string;
    tone?: string;
  },
  customApiKey?: string
): Promise<CoverLetterDetails> {
  const apiKey = getApiKey(customApiKey);

  const prompt = `
You are an expert executive career strategist and award-winning resume writer.
Craft an articulate, deeply persuasive, high-impact cover letter based on the candidate's CV and the target company and role.

CANDIDATE CV DATA:
${JSON.stringify(cv, null, 2)}

TARGET OPPORTUNITY:
- Company: ${target.companyName}
- Job Title: ${target.jobTitle}
- Hiring Manager/Team: ${target.hiringManager || "Hiring Team"}
- Desired Tone: ${target.tone || "Professional and Authoritative"}
${target.jobDescription ? `- Target Job Description & Requirements:\n${target.jobDescription}` : ""}

GUIDELINES:
1. Opening Paragraph: A compelling hook connecting the candidate's high-level background to the company's mission and the specific role.
2. Body Paragraph 1: Highlight 2-3 specific, quantified achievements from their actual CV experience (e.g. percentages, revenue, latency reductions, user scale) directly relevant to the target role.
3. Body Paragraph 2: Demonstrate strong alignment with the company's culture and job requirements, referencing top technical/domain competencies from the CV.
4. Closing Paragraph: An enthusiastic, confident call-to-action expressing readiness for an interview.
5. Sound genuine, human, and authoritative. Avoid generic AI clichés like "In today's fast-paced digital world" or "I am thrilled to apply".

Respond ONLY with a valid JSON object strictly matching this schema:
{
  "date": "Month DD, YYYY",
  "greeting": "Dear ...",
  "openingParagraph": "...",
  "bodyParagraph1": "...",
  "bodyParagraph2": "...",
  "closingParagraph": "...",
  "signOff": "Sincerely,"
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Empty response received from Gemini API.");

  try {
    const parsed = JSON.parse(rawText);
    return {
      date: parsed.date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      greeting: parsed.greeting || `Dear ${target.hiringManager || "Hiring Team"},`,
      openingParagraph: parsed.openingParagraph || "",
      bodyParagraph1: parsed.bodyParagraph1 || "",
      bodyParagraph2: parsed.bodyParagraph2 || "",
      closingParagraph: parsed.closingParagraph || "",
      signOff: parsed.signOff || "Sincerely,",
    };
  } catch (e) {
    throw new Error(`Failed to parse Gemini response as JSON: ${rawText}`);
  }
}

export async function parseResumePdfAI(
  pdfBase64: string,
  customApiKey?: string
): Promise<Partial<CVData>> {
  const apiKey = getApiKey(customApiKey);

  const prompt = `
You are an expert ATS parser and resume data extraction system.
Extract all relevant resume information from this attached PDF resume document and structure it accurately into clean JSON.

EXTRACTION INSTRUCTIONS:
- personalInfo: Extract fullName, title/headline, email, phone, location/address, summary/objective, website, and linkedin.
- experience: Array of work history items with:
  - id: unique string (e.g. "exp-1")
  - company: company name
  - position: job title
  - startDate: e.g. "2021" or "Jan 2021"
  - endDate: e.g. "Present" or "2023"
  - current: boolean (true if currently working there)
  - description: detailed bullet points with achievements and metrics
- education: Array of degrees with:
  - id: unique string (e.g. "edu-1")
  - institution: school/university name
  - degree: e.g. "Bachelor of Science", "Master of Arts"
  - field: major / field of study
  - startDate: e.g. "2016"
  - endDate: e.g. "2020"
  - description: honors, coursework, or activities
- skills: Array of skills found with:
  - id: unique string (e.g. "sk-1")
  - name: skill name
  - level: integer 1 to 5 (estimate 4 or 5 for key skills mentioned prominently)
- languages: Array of spoken languages with:
  - id: unique string (e.g. "lang-1")
  - name: language name
  - proficiency: one of "Beginner", "Elementary", "Intermediate", "Advanced", "Native"
- customSections: Array of other sections found (e.g. "Certifications", "Awards", "Projects", "Publications", "Volunteering", "Hobbies") with:
  - id: unique string (e.g. "cust-1")
  - title: section title
  - items: array of { id: string, text: string }

Respond ONLY with a valid JSON object matching this structure:
{
  "personalInfo": {
    "fullName": "...",
    "title": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "summary": "...",
    "website": "...",
    "linkedin": "..."
  },
  "experience": [...],
  "education": [...],
  "skills": [...],
  "languages": [...],
  "customSections": [...]
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini PDF parsing error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Empty extraction response received from Gemini API.");

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(`Failed to parse extracted PDF data as JSON: ${rawText}`);
  }
}
