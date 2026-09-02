import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/db";
import { uploadFileToCloudinary } from "@/lib/cloudinary";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = client.db();
  const docs = await db
    .collection("documents")
    .find({ userId: user.id })
    .sort({ createdAt: -1 })
    .toArray();

  const mapped = docs.map((doc) => ({
    _id: doc._id.toString(),
    userId: doc.userId,
    title: doc.title,
    category: doc.category,
    customCategory: doc.customCategory || "",
    fileUrl: doc.fileUrl,
    fileType: doc.fileType,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    publicId: doc.publicId || "",
    rotation: doc.rotation || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));


  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Untitled Document";
    const category = (formData.get("category") as string) || "Custom";
    const customCategory = (formData.get("customCategory") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "application/octet-stream";
    const fileType = mimeType.startsWith("image/") ? "image" : "pdf";

    const db = client.db();

    // 1. Try Cloudinary Upload
    let fileUrl = "";
    let publicId = "";

    const cloudRes = await uploadFileToCloudinary(buffer, file.name, mimeType);
    if (cloudRes && cloudRes.url) {
      fileUrl = cloudRes.url;
      publicId = cloudRes.publicId;
    } else {
      // 2. High-reliability MongoDB binary asset storage
      const fileInsertResult = await db.collection("document_files").insertOne({
        userId: user.id,
        fileName: file.name,
        mimeType,
        data: buffer,
        createdAt: new Date().toISOString(),
      });
      fileUrl = `/api/documents/file/${fileInsertResult.insertedId.toString()}`;
      publicId = `local_${fileInsertResult.insertedId.toString()}`;
    }

    const now = new Date().toISOString();
    const documentRecord = {
      userId: user.id,
      title,
      category,
      customCategory,
      fileUrl,
      fileType,
      fileName: file.name,
      fileSize: file.size,
      publicId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("documents").insertOne(documentRecord);

    return NextResponse.json(
      {
        _id: result.insertedId.toString(),
        ...documentRecord,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to upload document:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
