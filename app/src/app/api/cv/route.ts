import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/db";
import { ObjectId } from "mongodb";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = client.db();
  const cvs = await db
    .collection("cvs")
    .find({ userId: user.id })
    .sort({ updatedAt: -1 })
    .toArray();

  const mapped = cvs.map((cv) => ({ ...cv, _id: cv._id.toString() }));
  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const now = new Date().toISOString();

  const doc = {
    userId: user.id,
    templateId: body.templateId || "modern",
    personalInfo: body.personalInfo,
    experience: body.experience || [],
    education: body.education || [],
    skills: body.skills || [],
    languages: body.languages || [],
    customSections: body.customSections || [],
    createdAt: now,
    updatedAt: now,
  };

  const db = client.db();
  const result = await db.collection("cvs").insertOne(doc);

  return NextResponse.json({ _id: result.insertedId.toString(), ...doc }, { status: 201 });
}
