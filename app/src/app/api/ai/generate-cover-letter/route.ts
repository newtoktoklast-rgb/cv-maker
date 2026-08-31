import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetterAI } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cv, target, customApiKey } = body;

    if (!cv || !target?.companyName || !target?.jobTitle) {
      return NextResponse.json(
        { error: "CV data, target company name, and job title are required." },
        { status: 400 }
      );
    }

    const letterDetails = await generateCoverLetterAI(cv, target, customApiKey);
    return NextResponse.json({ letterDetails });
  } catch (err: any) {
    console.error("Gemini Cover Letter Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate cover letter with Gemini API." },
      { status: 500 }
    );
  }
}
