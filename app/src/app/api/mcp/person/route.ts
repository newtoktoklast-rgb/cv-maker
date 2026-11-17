import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/db";
import crypto from "crypto";
import { ObjectId } from "mongodb";

/**
 * Extracts client key from x-api-key or Authorization Bearer header.
 */
function extractClientKey(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  const xApiKey = req.headers.get("x-api-key");
  return xApiKey || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
}

/**
 * Validates against environment variable key using constant-time comparison.
 */
function isMasterEnvKey(clientKey: string): boolean {
  const secret = process.env.MCP_SECRET_API_KEY;
  if (!secret || secret.trim() === "") return false;

  const bufA = Buffer.from(clientKey);
  const bufB = Buffer.from(secret);

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(req: NextRequest) {
  const clientKey = extractClientKey(req);

  if (!clientKey) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Missing API key. Provide your key via 'x-api-key' or 'Authorization: Bearer <key>'.",
      },
      { status: 401 }
    );
  }

  try {
    const db = client.db();
    let targetUserId: string | null = null;

    // 1. Check user-generated API keys in MongoDB first
    const userKeyRecord = await db.collection("user_api_keys").findOne({ key: clientKey });

    if (userKeyRecord && userKeyRecord.userId) {
      targetUserId = userKeyRecord.userId;

      // Update lastUsedAt asynchronously
      db.collection("user_api_keys")
        .updateOne(
          { _id: userKeyRecord._id },
          { $set: { lastUsedAt: new Date().toISOString() } }
        )
        .catch(() => {});
    } else if (isMasterEnvKey(clientKey)) {
      // 2. Fallback to master environment key
      if (process.env.MCP_TARGET_USER_ID) {
        targetUserId = process.env.MCP_TARGET_USER_ID;
      } else if (process.env.MCP_TARGET_EMAIL) {
        const u = await db.collection("user").findOne({ email: process.env.MCP_TARGET_EMAIL });
        targetUserId = (u?._id?.toString() || u?.id) as string;
      } else {
        const singleUser = await db.collection("user").findOne({});
        targetUserId = (singleUser?._id?.toString() || singleUser?.id) as string;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or revoked API key.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource") || "all";
    const documentId = searchParams.get("id");

    const responseData: Record<string, unknown> = {
      targetUserId,
      timestamp: new Date().toISOString(),
    };

    // CVs & Personal Info
    if (resource === "all" || resource === "profile" || resource === "cv") {
      const cvs = await db
        .collection("cvs")
        .find({ userId: targetUserId })
        .sort({ updatedAt: -1 })
        .toArray();

      const mappedCvs = cvs.map((cv) => ({
        id: cv._id.toString(),
        templateId: cv.templateId,
        personalInfo: cv.personalInfo,
        experience: cv.experience,
        education: cv.education,
        skills: cv.skills,
        languages: cv.languages,
        customSections: cv.customSections,
        updatedAt: cv.updatedAt,
      }));

      responseData.cvs = mappedCvs;
      responseData.activeProfile = mappedCvs[0]?.personalInfo || null;
    }

    // Documents
    if (resource === "all" || resource === "documents" || resource === "document") {
      if (documentId) {
        let queryFilter: Record<string, unknown> = { userId: targetUserId };
        try {
          queryFilter = { userId: targetUserId, _id: new ObjectId(documentId) };
        } catch {
          queryFilter = { userId: targetUserId, _id: documentId };
        }

        const doc = await db.collection("documents").findOne(queryFilter as any);
        if (doc) {
          responseData.document = {
            id: doc._id.toString(),
            title: doc.title,
            category: doc.category,
            customCategory: doc.customCategory || "",
            fileUrl: doc.fileUrl,
            fileType: doc.fileType,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
        } else {
          responseData.document = null;
        }
      } else {
        const docs = await db
          .collection("documents")
          .find({ userId: targetUserId })
          .sort({ createdAt: -1 })
          .toArray();

        responseData.documents = docs.map((doc) => ({
          id: doc._id.toString(),
          title: doc.title,
          category: doc.category,
          customCategory: doc.customCategory || "",
          fileUrl: doc.fileUrl,
          fileType: doc.fileType,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }));
      }
    }

    // Cover Letters
    if (resource === "all" || resource === "cover-letters") {
      const letters = await db
        .collection("cover_letters")
        .find({ userId: targetUserId })
        .sort({ updatedAt: -1 })
        .toArray();

      responseData.coverLetters = letters.map((cl) => ({
        id: cl._id.toString(),
        jobTitle: cl.jobTitle,
        companyName: cl.companyName,
        recipientName: cl.recipientName,
        content: cl.content,
        updatedAt: cl.updatedAt,
      }));
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      {
        error: "InternalServerError",
        message: error.message || "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
