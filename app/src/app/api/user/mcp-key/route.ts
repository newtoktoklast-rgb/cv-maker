import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import client from "@/lib/db";
import crypto from "crypto";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// GET: Fetch current user's MCP API key status
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = client.db();
  const keyRecord = await db.collection("user_api_keys").findOne({ userId: user.id });

  if (!keyRecord) {
    return NextResponse.json({ hasKey: false });
  }

  return NextResponse.json({
    hasKey: true,
    key: keyRecord.key,
    createdAt: keyRecord.createdAt,
    lastUsedAt: keyRecord.lastUsedAt || null,
  });
}

// POST: Generate (or regenerate) an API key for the current user
export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newKey = `cvm_live_${crypto.randomBytes(24).toString("hex")}`;
  const now = new Date().toISOString();

  const db = client.db();
  await db.collection("user_api_keys").updateOne(
    { userId: user.id },
    {
      $set: {
        userId: user.id,
        userEmail: user.email,
        key: newKey,
        createdAt: now,
        lastUsedAt: null,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({
    success: true,
    key: newKey,
    createdAt: now,
  });
}

// DELETE: Revoke the API key
export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = client.db();
  await db.collection("user_api_keys").deleteOne({ userId: user.id });

  return NextResponse.json({ success: true, message: "API key revoked successfully." });
}

