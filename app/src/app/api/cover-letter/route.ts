import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/db";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = client.db();
  const letters = await db
    .collection("cover_letters")
    .find({ userId: user.id })
    .sort({ updatedAt: -1 })
    .toArray();

  const mapped = letters.map((l) => ({ ...l, _id: l._id.toString() }));
  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const now = new Date().toISOString();

  const doc = {
    userId: user.id,
    cvId: body.cvId || "",
    title: body.title || "Untitled Cover Letter",
    templateId: body.templateId || "modern",
    personalInfo: body.personalInfo,
    recipient: body.recipient,
    letterDetails: body.letterDetails,
    pdfBase64: body.pdfBase64 || "",
    createdAt: now,
    updatedAt: now,
  };


  const db = client.db();
  const result = await db.collection("cover_letters").insertOne(doc);

  return NextResponse.json({ _id: result.insertedId.toString(), ...doc }, { status: 201 });
}
