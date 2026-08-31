import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { parseResumePdfAI } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let pdfBase64 = "";
    let customApiKey: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      customApiKey = (formData.get("customApiKey") as string) || undefined;

      if (!file) {
        return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      pdfBase64 = Buffer.from(bytes).toString("base64");
    } else {
      const body = await req.json();
      pdfBase64 = body.pdfBase64;
      customApiKey = body.customApiKey;
    }

    if (!pdfBase64) {
      return NextResponse.json({ error: "Missing PDF base64 content." }, { status: 400 });
    }

    const parsedData = await parseResumePdfAI(pdfBase64, customApiKey);
    return NextResponse.json({ data: parsedData });
  } catch (err: any) {
    console.error("Gemini PDF Parsing Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to parse PDF resume with Gemini API." },
      { status: 500 }
    );
  }
}
