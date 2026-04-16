import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  overall_score: number;
  headline: string;
  summary: string;
  subscores: {
    skills: { score: number; weight: number; note: string };
    experience: { score: number; weight: number; note: string };
    education: { score: number; weight: number; note: string };
    certifications: { score: number; weight: number; note: string };
  };
  gaps: Array<{
    skill: string;
    status: 'missing' | 'partial' | 'match' | 'strength' | 'irrelevant';
    priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strength' | 'Ignore';
    notes: string;
  }>;
  suggestions: Array<{
    icon: string;
    title: string;
    body: string;
    color: string;
  }>;
}

export async function analyzeMatch(resume: string, jd: string): Promise<AnalysisResult> {
  const prompt = `You are an expert resume-JD match analyser. Analyse the provided resume against the job description and return a structured JSON report.

RESUME:
${resume}

JOB DESCRIPTION:
${jd}

Rules:
- gaps array: list 6-10 most important skills/requirements (both gaps AND matches).
- suggestions: 3-5 specific, actionable suggestions.
- Be accurate and specific based on the actual resume and JD content provided.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a professional hiring manager and technical recruiter. Your goal is to provide honest, helpful, and data-driven resume matching analysis. Always return the response in the specified JSON format.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overall_score: { type: Type.INTEGER },
          headline: { type: Type.STRING },
          summary: { type: Type.STRING },
          subscores: {
            type: Type.OBJECT,
            properties: {
              skills: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  weight: { type: Type.INTEGER },
                  note: { type: Type.STRING }
                },
                required: ["score", "weight", "note"]
              },
              experience: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  weight: { type: Type.INTEGER },
                  note: { type: Type.STRING }
                },
                required: ["score", "weight", "note"]
              },
              education: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  weight: { type: Type.INTEGER },
                  note: { type: Type.STRING }
                },
                required: ["score", "weight", "note"]
              },
              certifications: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  weight: { type: Type.INTEGER },
                  note: { type: Type.STRING }
                },
                required: ["score", "weight", "note"]
              }
            },
            required: ["skills", "experience", "education", "certifications"]
          },
          gaps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["missing", "partial", "match", "strength", "irrelevant"] },
                priority: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low", "Strength", "Ignore"] },
                notes: { type: Type.STRING }
              },
              required: ["skill", "status", "priority", "notes"]
            }
          },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                icon: { type: Type.STRING },
                title: { type: Type.STRING },
                body: { type: Type.STRING },
                color: { type: Type.STRING }
              },
              required: ["icon", "title", "body", "color"]
            }
          }
        },
        required: ["overall_score", "headline", "summary", "subscores", "gaps", "suggestions"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as AnalysisResult;
}
