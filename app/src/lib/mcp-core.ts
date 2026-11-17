import client from "@/lib/db";
import { ObjectId } from "mongodb";
import crypto from "crypto";

export async function validateMcpKey(key: string | null): Promise<string | null> {
  if (!key || typeof key !== "string" || key.trim() === "") {
    return null;
  }

  const cleanKey = key.trim();
  const db = client.db();

  // 1. Check user-generated keys in MongoDB
  const keyRecord = await db.collection("user_api_keys").findOne({ key: cleanKey });
  if (keyRecord && keyRecord.userId) {
    // Asynchronously update lastUsedAt
    db.collection("user_api_keys")
      .updateOne({ _id: keyRecord._id }, { $set: { lastUsedAt: new Date().toISOString() } })
      .catch(() => {});
    return keyRecord.userId;
  }

  // 2. Check master env key if configured
  const masterKey = process.env.MCP_SECRET_API_KEY;
  if (masterKey && masterKey.trim() !== "") {
    const bufA = Buffer.from(cleanKey);
    const bufB = Buffer.from(masterKey);
    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      if (process.env.MCP_TARGET_USER_ID) return process.env.MCP_TARGET_USER_ID;
      if (process.env.MCP_TARGET_EMAIL) {
        const u = await db.collection("user").findOne({ email: process.env.MCP_TARGET_EMAIL });
        return (u?._id?.toString() || u?.id) as string;
      }
      const singleUser = await db.collection("user").findOne({});
      return (singleUser?._id?.toString() || singleUser?.id) as string;
    }
  }

  return null;
}

export const MCP_TOOLS = [
  {
    name: "get_personal_info",
    description: "Get the person's full name, professional title, contact details, bio summary, website, and LinkedIn.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_career_history",
    description: "Get full employment history, roles, companies, dates, achievements, and education history.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_skills_and_languages",
    description: "Get technical skills, soft skills (with ratings), and spoken languages.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_documents",
    description: "List all uploaded certificates, diplomas, portfolio files, and resumes with their download links.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_document_details",
    description: "Get full details and file URL for a specific document by its ID.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string", description: "The unique ID of the document" },
      },
      required: ["documentId"],
    },
  },
  {
    name: "get_cover_letters",
    description: "Retrieve tailored cover letters saved in this person's account.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_full_dossier",
    description: "Retrieve complete aggregated information: personal info, experience, skills, education, and documents.",
    inputSchema: { type: "object", properties: {} },
  },
];

export async function executeMcpTool(name: string, args: Record<string, unknown> = {}, userId: string) {
  const db = client.db();

  switch (name) {
    case "get_personal_info": {
      const activeCv = await db.collection("cvs").findOne({ userId }, { sort: { updatedAt: -1 } });
      if (!activeCv || !activeCv.personalInfo) {
        return { content: [{ type: "text", text: "No profile information found." }] };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                personalInfo: activeCv.personalInfo,
                languages: activeCv.languages || [],
                lastUpdated: activeCv.updatedAt,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "get_career_history": {
      const activeCv = await db.collection("cvs").findOne({ userId }, { sort: { updatedAt: -1 } });
      if (!activeCv) {
        return { content: [{ type: "text", text: "No career history found." }] };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                experience: activeCv.experience || [],
                education: activeCv.education || [],
                customSections: activeCv.customSections || [],
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "get_skills_and_languages": {
      const activeCv = await db.collection("cvs").findOne({ userId }, { sort: { updatedAt: -1 } });
      if (!activeCv) {
        return { content: [{ type: "text", text: "No skills data found." }] };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                skills: activeCv.skills || [],
                languages: activeCv.languages || [],
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "list_documents": {
      const docs = await db.collection("documents").find({ userId }).sort({ createdAt: -1 }).toArray();
      const mapped = docs.map((doc) => ({
        id: doc._id.toString(),
        title: doc.title,
        category: doc.category,
        customCategory: doc.customCategory || "",
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(mapped, null, 2) }],
      };
    }

    case "get_document_details": {
      const docId = String(args?.documentId || "");
      let queryFilter: Record<string, unknown> = { userId };
      try {
        queryFilter = { userId, _id: new ObjectId(docId) };
      } catch {
        queryFilter = { userId, _id: docId };
      }

      const doc = await db.collection("documents").findOne(queryFilter as any);
      if (!doc) {
        return { content: [{ type: "text", text: `Document '${docId}' not found.` }] };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
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
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "get_cover_letters": {
      const letters = await db.collection("cover_letters").find({ userId }).sort({ updatedAt: -1 }).toArray();
      const mapped = letters.map((l) => ({
        id: l._id.toString(),
        jobTitle: l.jobTitle,
        companyName: l.companyName,
        recipientName: l.recipientName,
        content: l.content,
        updatedAt: l.updatedAt,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(mapped, null, 2) }],
      };
    }

    case "get_full_dossier": {
      const cvs = await db.collection("cvs").find({ userId }).sort({ updatedAt: -1 }).toArray();
      const docs = await db.collection("documents").find({ userId }).sort({ createdAt: -1 }).toArray();
      const letters = await db.collection("cover_letters").find({ userId }).sort({ updatedAt: -1 }).toArray();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                activeCv: cvs[0] ? { ...cvs[0], _id: cvs[0]._id.toString() } : null,
                allCvsCount: cvs.length,
                documents: docs.map((d) => ({
                  id: d._id.toString(),
                  title: d.title,
                  category: d.category,
                  fileUrl: d.fileUrl,
                  fileType: d.fileType,
                  fileName: d.fileName,
                })),
                coverLetters: letters.map((l) => ({
                  id: l._id.toString(),
                  jobTitle: l.jobTitle,
                  companyName: l.companyName,
                  content: l.content,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Tool not found: ${name}`);
  }
}

export async function handleMcpRpcMessage(payload: any, userId: string) {
  const { jsonrpc, id, method, params } = payload;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: "cvmaker-remote-mcp",
          version: "1.0.0",
        },
      },
    };
  }

  if (method === "notifications/initialized") {
    // Client notification, no JSON-RPC response needed
    return null;
  }

  if (method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: MCP_TOOLS,
      },
    };
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};
    try {
      const toolResult = await executeMcpTool(toolName, toolArgs, userId);
      return {
        jsonrpc: "2.0",
        id,
        result: toolResult,
      };
    } catch (err: any) {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          isError: true,
          content: [{ type: "text", text: `Error: ${err.message}` }],
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`,
    },
  };
}

