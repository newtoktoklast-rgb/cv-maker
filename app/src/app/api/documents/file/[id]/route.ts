import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id || !ObjectId.isValid(id)) {
      return new NextResponse("Invalid file ID", { status: 400 });
    }

    const db = client.db();
    const fileDoc = await db.collection("document_files").findOne({
      _id: new ObjectId(id),
    });

    if (!fileDoc || !fileDoc.data) {
      return new NextResponse("File not found", { status: 404 });
    }

    const buffer = Buffer.from(fileDoc.data.buffer || fileDoc.data);
    const contentType = fileDoc.mimeType || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${fileDoc.fileName || "document"}"`,
      },
    });
  } catch (error) {
    console.error("Error serving document file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
