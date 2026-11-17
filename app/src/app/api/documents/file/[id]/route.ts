import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import client from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { validateMcpKey } from "@/lib/mcp-core";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id || !ObjectId.isValid(id)) {
      return new NextResponse("Invalid file ID", { status: 400 });
    }

    // 1. Authenticate either via user session OR via MCP API key
    let authenticatedUserId: string | null = null;

    // Check user session
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      authenticatedUserId = session.user.id;
    } else {
      // Check MCP API Key from header or query param
      const { searchParams } = new URL(req.url);
      const key =
        req.headers.get("x-api-key") ||
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        searchParams.get("key") ||
        searchParams.get("apiKey");

      authenticatedUserId = await validateMcpKey(key);
    }

    // Reject unauthenticated requests
    if (!authenticatedUserId) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required. Provide a valid session or '?key=YOUR_API_KEY'.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = client.db();
    const fileDoc = await db.collection("document_files").findOne({
      _id: new ObjectId(id),
    });

    if (!fileDoc || !fileDoc.data) {
      return new NextResponse("File not found", { status: 404 });
    }

    // 2. Strict ownership verification: Ensure file belongs to the authenticated user
    let isOwner = fileDoc.userId === authenticatedUserId;

    if (!isOwner) {
      // Check cross-reference in documents collection
      const docRecord = await db.collection("documents").findOne({
        userId: authenticatedUserId,
        $or: [
          { fileUrl: { $regex: id } },
          { publicId: `local_${id}` },
        ],
      });
      if (docRecord) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return new NextResponse(
        JSON.stringify({
          error: "Forbidden",
          message: "You do not have permission to access this file.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const buffer = Buffer.from(fileDoc.data.buffer || fileDoc.data);
    const contentType = fileDoc.mimeType || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Disposition": `inline; filename="${fileDoc.fileName || "document"}"`,
      },
    });
  } catch (error) {
    console.error("Error serving document file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
