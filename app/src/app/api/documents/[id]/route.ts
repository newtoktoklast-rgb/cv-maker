import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/db";
import { ObjectId } from "mongodb";
import { deleteFromCloudinary } from "@/lib/cloudinary";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const db = client.db();
  const doc = await db.collection("documents").findOne({
    _id: new ObjectId(id),
    userId: user.id,
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.publicId) {
    if (doc.publicId.startsWith("local_")) {
      const fileIdStr = doc.publicId.replace("local_", "");
      if (ObjectId.isValid(fileIdStr)) {
        await db.collection("document_files").deleteOne({ _id: new ObjectId(fileIdStr) });
      }
    } else {
      await deleteFromCloudinary(doc.publicId);
    }
  }

  await db.collection("documents").deleteOne({ _id: new ObjectId(id) });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const rotation = typeof body.rotation === "number" ? body.rotation : 0;

  const db = client.db();
  const result = await db.collection("documents").updateOne(
    { _id: new ObjectId(id), userId: user.id },
    { $set: { rotation, updatedAt: new Date().toISOString() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, rotation });
}

