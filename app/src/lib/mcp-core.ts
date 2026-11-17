import client from "@/lib/db";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import zlib from "zlib";

function extractTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const raw = buffer.toString("binary");
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;
    const textPieces: string[] = [];

    while ((match = streamRegex.exec(raw)) !== null) {
      let streamData = Buffer.from(match[1], "binary");
      try {
        streamData = zlib.inflateSync(streamData);
      } catch {
        // stream was not deflated, use raw
      }
      const streamText = streamData.toString("latin1");
      const tjRegex = /\(([^)]+)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(streamText)) !== null) {
        textPieces.push(tjMatch[1]);
      }
      const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
      let arrayMatch;
      while ((arrayMatch = arrayTjRegex.exec(streamText)) !== null) {
        const innerRegex = /\(([^)]+)\)/g;
        let innerMatch;
        while ((innerMatch = innerRegex.exec(arrayMatch[1])) !== null) {
          textPieces.push(innerMatch[1]);
        }
      }
    }

    const result = textPieces.join(" ").replace(/\\([()\\])/g, "$1").trim();
    if (result && result.length > 20) {
      return result;
    }

    // Fallback: extract any readable string sequences
    const asciiStrings = raw.match(/[\x20-\x7E]{4,}/g);
    if (asciiStrings && asciiStrings.length > 0) {
      const filtered = asciiStrings
        .filter((s) => !s.startsWith("/") && !s.includes("Font") && !s.includes("ProcSet") && !s.includes("PDF"))
        .join(" ")
        .slice(0, 4000);
      if (filtered.length > 50) return filtered;
    }

    return "No readable text stream found in this PDF (it may be a scanned image or flattened).";
  } catch (err: any) {
    return `Could not parse PDF text: ${err.message}`;
  }
}

export async function validateMcpKey(key: string | null): Promise<string | null> {
  if (!key || typeof key !== "string" || key.trim() === "") {
    return null;
  }

  const cleanKey = key.trim();
  const db = client.db();

  // 1. Check user-generated keys in MongoDB
  const keyRecord = await db.collection("user_api_keys").findOne({ key: cleanKey });
  if (keyRecord && keyRecord.userId) {
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

async function getOrCreateActiveCv(db: ReturnType<typeof client.db>, userId: string) {
  let activeCv = await db.collection("cvs").findOne({ userId }, { sort: { updatedAt: -1 } });
  if (!activeCv) {
    const now = new Date().toISOString();
    const newCv = {
      userId,
      templateId: "modern",
      personalInfo: {
        fullName: "",
        title: "",
        email: "",
        phone: "",
        location: "",
        summary: "",
        website: "",
        linkedin: "",
      },
      experience: [],
      education: [],
      skills: [],
      languages: [],
      customSections: [],
      createdAt: now,
      updatedAt: now,
    };
    const res = await db.collection("cvs").insertOne(newCv);
    activeCv = { ...newCv, _id: res.insertedId };
  }
  return activeCv;
}

export const MCP_TOOLS = [
  // ================= READ TOOLS =================
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
    name: "read_document_content",
    description: "Read the actual readable text contents inside an uploaded PDF document, certificate, diploma, or resume.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string", description: "The unique ID or title of the document to read" },
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

  // ================= WRITE / MUTATION TOOLS =================
  {
    name: "update_personal_info",
    description: "Update the person's headline, name, bio summary, contact email, phone, location, website, or LinkedIn.",
    inputSchema: {
      type: "object",
      properties: {
        fullName: { type: "string", description: "Full legal or professional name" },
        title: { type: "string", description: "Professional title / headline (e.g. Senior Software Architect)" },
        email: { type: "string", description: "Contact email" },
        phone: { type: "string", description: "Phone number" },
        location: { type: "string", description: "City, Country or Remote" },
        summary: { type: "string", description: "Professional summary / bio paragraph" },
        website: { type: "string", description: "Personal portfolio website URL" },
        linkedin: { type: "string", description: "LinkedIn profile URL" },
      },
    },
  },
  {
    name: "add_work_experience",
    description: "Add a new work experience or job role to the person's CV.",
    inputSchema: {
      type: "object",
      properties: {
        company: { type: "string", description: "Company or organization name" },
        position: { type: "string", description: "Job title or role" },
        startDate: { type: "string", description: "Start date (e.g. 'Jan 2022' or '2022-01')" },
        endDate: { type: "string", description: "End date (e.g. 'Present', 'Dec 2024') - leave blank if current" },
        current: { type: "boolean", description: "Whether this is their current position" },
        description: { type: "string", description: "Key achievements, responsibilities, impact metrics" },
      },
      required: ["company", "position"],
    },
  },
  {
    name: "update_work_experience",
    description: "Update an existing work experience item by its ID or by company name.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the experience item to modify (or specify company)" },
        company: { type: "string", description: "Company name to find or update" },
        position: { type: "string", description: "New job title" },
        startDate: { type: "string", description: "Updated start date" },
        endDate: { type: "string", description: "Updated end date" },
        current: { type: "boolean", description: "Whether this is their current position" },
        description: { type: "string", description: "Updated description / achievements" },
      },
    },
  },
  {
    name: "delete_work_experience",
    description: "Remove a work experience item from the CV by ID or company name.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Experience ID or company name to delete" },
      },
      required: ["id"],
    },
  },
  {
    name: "add_education",
    description: "Add an education degree, certification, or university qualification.",
    inputSchema: {
      type: "object",
      properties: {
        institution: { type: "string", description: "School, University, or Institution name" },
        degree: { type: "string", description: "Degree or qualification (e.g. 'Bachelor of Science')" },
        field: { type: "string", description: "Field of study (e.g. 'Computer Science')" },
        startDate: { type: "string", description: "Start year/date" },
        endDate: { type: "string", description: "Graduation year/date" },
        description: { type: "string", description: "Honors, awards, or relevant coursework" },
      },
      required: ["institution", "degree"],
    },
  },
  {
    name: "delete_education",
    description: "Delete an education entry by ID or institution name.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Education ID or institution name to remove" },
      },
      required: ["id"],
    },
  },
  {
    name: "update_skills",
    description: "Add or replace skills with proficiency ratings (level 1-5).",
    inputSchema: {
      type: "object",
      properties: {
        skills: {
          type: "array",
          description: "List of skills",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Skill name (e.g. TypeScript, Next.js, Kubernetes)" },
              level: { type: "number", description: "Proficiency level from 1 (Novice) to 5 (Expert)" },
            },
            required: ["name"],
          },
        },
        mode: {
          type: "string",
          enum: ["append", "replace"],
          description: "'append' adds new skills to existing list; 'replace' overwrites the entire list.",
        },
      },
      required: ["skills"],
    },
  },
  {
    name: "update_languages",
    description: "Add or replace languages with proficiency level.",
    inputSchema: {
      type: "object",
      properties: {
        languages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Language name (e.g. English, French, Amharic)" },
              proficiency: {
                type: "string",
                enum: ["Beginner", "Elementary", "Intermediate", "Advanced", "Native"],
              },
            },
            required: ["name", "proficiency"],
          },
        },
      },
      required: ["languages"],
    },
  },
  {
    name: "save_cover_letter",
    description: "Create or update a tailored cover letter for a job opportunity.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Cover letter ID if updating an existing one. Omit to create new." },
        title: { type: "string", description: "Title (e.g. 'Cover Letter - Stripe Lead Engineer')" },
        companyName: { type: "string", description: "Target company" },
        jobTitle: { type: "string", description: "Target role title" },
        hiringManager: { type: "string", description: "Hiring Manager or Committee name" },
        department: { type: "string", description: "Target department or team" },
        companyAddress: { type: "string", description: "Company address if known" },
        greeting: { type: "string", description: "Greeting line (e.g. 'Dear Hiring Committee,')" },
        openingParagraph: { type: "string", description: "Opening hook paragraph" },
        bodyParagraph1: { type: "string", description: "Body paragraph 1: core experience match" },
        bodyParagraph2: { type: "string", description: "Body paragraph 2: achievements and culture fit" },
        closingParagraph: { type: "string", description: "Call to action and conclusion" },
        signOff: { type: "string", description: "Sign-off line (e.g. 'Sincerely,')" },
      },
      required: ["companyName", "jobTitle", "bodyParagraph1"],
    },
  },
  {
    name: "update_document_metadata",
    description: "Update title, category, or tags of an uploaded document.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string", description: "Document ID" },
        title: { type: "string", description: "New document title" },
        category: { type: "string", description: "Category: 'resume', 'certificate', 'diploma', 'portfolio', 'other'" },
        customCategory: { type: "string", description: "Custom label if category is 'other'" },
      },
      required: ["documentId"],
    },
  },
];

export async function executeMcpTool(name: string, args: Record<string, any> = {}, userId: string) {
  const db = client.db();
  const now = new Date().toISOString();

  switch (name) {
    // ================= READ IMPLEMENTATIONS =================
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

    case "read_document_content": {
      const docId = String(args?.documentId || "");
      let queryFilter: Record<string, unknown> = { userId };
      try {
        queryFilter = { userId, _id: new ObjectId(docId) };
      } catch {
        queryFilter = { userId, $or: [{ _id: docId }, { title: { $regex: docId, $options: "i" } }] };
      }

      const doc = await db.collection("documents").findOne(queryFilter as any);
      if (!doc) {
        return {
          isError: true,
          content: [{ type: "text", text: `Document '${docId}' not found in your account.` }],
        };
      }

      let buffer: Buffer | null = null;
      let contentType = doc.fileType === "image" ? "image/jpeg" : "application/pdf";

      if (doc.fileUrl && doc.fileUrl.startsWith("/api/documents/file/")) {
        const fileId = doc.fileUrl.replace("/api/documents/file/", "").split("?")[0];
        try {
          const fileDoc = await db.collection("document_files").findOne({ _id: new ObjectId(fileId) });
          if (fileDoc && fileDoc.data) {
            buffer = Buffer.from(fileDoc.data.buffer || fileDoc.data);
            contentType = fileDoc.mimeType || contentType;
          }
        } catch (e) {
          console.error("Failed to read local document_files:", e);
        }
      } else if (doc.fileUrl && doc.fileUrl.startsWith("http")) {
        try {
          const remoteRes = await fetch(doc.fileUrl);
          if (remoteRes.ok) {
            const arr = await remoteRes.arrayBuffer();
            buffer = Buffer.from(arr);
          }
        } catch (e) {
          console.error("Failed to fetch remote document:", e);
        }
      }

      if (!buffer) {
        return {
          content: [
            {
              type: "text",
              text: `Found document metadata for "${doc.title}", but could not load file binary stream.`,
            },
          ],
        };
      }

      const extractedText = extractTextFromPdfBuffer(buffer);

      return {
        content: [
          {
            type: "text",
            text: `📄 DOCUMENT: "${doc.title}" (${doc.fileName || "file"})\nCategory: ${doc.category}\nFile Size: ${doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "unknown"}\n\n--- EXTRACTED CONTENT ---\n${extractedText}`,
          },
        ],
      };
    }

    case "get_cover_letters": {
      const letters = await db.collection("cover_letters").find({ userId }).sort({ updatedAt: -1 }).toArray();
      const mapped = letters.map((l) => ({
        id: l._id.toString(),
        jobTitle: l.recipient?.jobTitle || l.jobTitle,
        companyName: l.recipient?.companyName || l.companyName,
        recipientName: l.recipient?.hiringManager || l.recipientName,
        details: l.letterDetails,
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
                  title: l.title,
                  companyName: l.recipient?.companyName || l.companyName,
                  jobTitle: l.recipient?.jobTitle || l.jobTitle,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // ================= WRITE / MUTATION IMPLEMENTATIONS =================
    case "update_personal_info": {
      const activeCv = await getOrCreateActiveCv(db, userId);
      const currentInfo = activeCv.personalInfo || {};

      const updatedInfo = {
        fullName: args.fullName !== undefined ? String(args.fullName) : currentInfo.fullName || "",
        title: args.title !== undefined ? String(args.title) : currentInfo.title || "",
        email: args.email !== undefined ? String(args.email) : currentInfo.email || "",
        phone: args.phone !== undefined ? String(args.phone) : currentInfo.phone || "",
        location: args.location !== undefined ? String(args.location) : currentInfo.location || "",
        summary: args.summary !== undefined ? String(args.summary) : currentInfo.summary || "",
        website: args.website !== undefined ? String(args.website) : currentInfo.website || "",
        linkedin: args.linkedin !== undefined ? String(args.linkedin) : currentInfo.linkedin || "",
      };

      await db.collection("cvs").updateOne(
        { _id: activeCv._id },
        {
          $set: {
            personalInfo: updatedInfo,
            updatedAt: now,
          },
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Personal profile updated successfully!\n${JSON.stringify(updatedInfo, null, 2)}`,
          },
        ],
      };
    }

    case "add_work_experience": {
      const activeCv = await getOrCreateActiveCv(db, userId);
      const experienceList = activeCv.experience || [];

      const newExp = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        company: String(args.company || "").trim(),
        position: String(args.position || "").trim(),
        startDate: String(args.startDate || "").trim(),
        endDate: String(args.endDate || (args.current ? "Present" : "")).trim(),
        current: Boolean(args.current),
        description: String(args.description || "").trim(),
      };

      experienceList.unshift(newExp);

      await db.collection("cvs").updateOne(
        { _id: activeCv._id },
        {
          $set: {
            experience: experienceList,
            updatedAt: now,
          },
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Added experience at ${newExp.company} (${newExp.position}). ID: ${newExp.id}`,
          },
        ],
      };
    }

    case "update_work_experience": {
      const activeCv = await getOrCreateActiveCv(db, userId);
      const experienceList = [...(activeCv.experience || [])];

      const matchId = args.id ? String(args.id) : null;
      const matchCompany = args.company ? String(args.company).toLowerCase() : null;

      const index = experienceList.findIndex(
        (e: any) => (matchId && e.id === matchId) || (matchCompany && e.company.toLowerCase().includes(matchCompany))
      );

      if (index === -1) {
        return {
          isError: true,
          content: [{ type: "text", text: `Could not find work experience matching ID '${matchId}' or company '${args.company}'` }],
        };
      }

      const existing = experienceList[index];
      const updated = {
        ...existing,
        company: args.company !== undefined ? String(args.company) : existing.company,
        position: args.position !== undefined ? String(args.position) : existing.position,
        startDate: args.startDate !== undefined ? String(args.startDate) : existing.startDate,
        endDate: args.endDate !== undefined ? String(args.endDate) : existing.endDate,
        current: args.current !== undefined ? Boolean(args.current) : existing.current,
        description: args.description !== undefined ? String(args.description) : existing.description,
      };

      experienceList[index] = updated;

      await db.collection("cvs").updateOne(
        { _id: activeCv._id },
        {
          $set: {
            experience: experienceList,
            updatedAt: now,
          },
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Updated work experience for ${updated.company} (${updated.position}).`,
          },
        ],
      };
    }

    case "delete_work_experience": {
      const activeCv = await getOrCreateActiveCv(db, userId);
      const target = String(args.id || "");

      const originalLen = (activeCv.experience || []).length;
      const filtered = (activeCv.experience || []).filter(
        (e: any) => e.id !== target && !e.company.toLowerCase().includes(target.toLowerCase())
      );

      if (filtered.length === originalLen) {
        return {
          content: [{ type: "text", text: `No experience item found matching '${target}'.` }],
        };
      }

      await db.collection("cvs").updateOne(
        { _id: activeCv._id },
        {
          $set: {
            experience: filtered,
            updatedAt: now,
          },
        }
      );

      return {
        content: [{ type: "text", text: `✅ Removed experience matching '${target}'. (${originalLen - filtered.length} item removed)` }],
      };
    }

    case "add_education": {
      const activeCv = await getOrCreateActiveCv(db, userId);
      const educationList = activeCv.education || [];

      const newEdu = {
        id: `edu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        institution: String(args.institution || "").trim(),
        degree: String(args.degree || "").trim(),
        field: String(args.field || "").trim(),
        startDate: String(args.startDate || "").trim(),
        endDate: String(args.endDate || "").trim(),
        description: String(args.description || "").trim(),
      };

      educationList.unshift(newEdu);

      await db.collection("cvs").updateOne(
        { _id: activeCv._id },
        {
          $set: {
            education: educationList,
            updatedAt: now,
          },
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Added education at ${newEdu.institution} - ${newEdu.degree}. ID: ${newEdu.id}`,
          },
        ],
      };
    }

    case "delete_education": {
      const activeCv = await getOrCreateActiveCv(db, userId);
      const target = String(args.id || "");

      const originalLen = (activeCv.education || []).length;
      const filtered = (activeCv.education || []).filter(
        (e: any) => e.id !== target && !e.institution.toLowerCase().includes(target.toLowerCase())
      );

      if (filtered.length === originalLen) {
        return {
          content: [{ type: "text", text: `No education entry found matching '${target}'.` }],
        };
      }

      await db.collection("cvs").updateOne(
        { _id: activeCv._id },
        {
          $set: {
            education: filtered,
            updatedAt: now,
          },
        }
      );

      return {
        content: [{ type: "text", text: `✅ Removed education matching '${target}'.` }],
      };
    }

    case "update_skills": {
      const activeCv = await getOrCreateActiveCv(db, userId);
      const incomingSkills: any[] = Array.isArray(args.skills) ? args.skills : [];
      const mode = args.mode || "append";

      const formatted = incomingSkills.map((s) => ({
        id: `skill_${Math.random().toString(36).substring(2, 8)}`,
        name: String(s.name || "").trim(),
        level: Number(s.level) || 4,
      }));

      let finalSkills = formatted;
      if (mode === "append") {
        const existing = activeCv.skills || [];
        const existingNames = new Set(existing.map((s: any) => s.name.toLowerCase()));
        finalSkills = [...existing];
        for (const f of formatted) {
          if (!existingNames.has(f.name.toLowerCase())) {
            finalSkills.push(f);
          }
        }
      }

      await db.collection("cvs").updateOne(
        { _id: activeCv._id },
        {
          $set: {
            skills: finalSkills,
            updatedAt: now,
          },
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Updated skills list! Total skills now: ${finalSkills.length}.`,
          },
        ],
      };
    }

    case "update_languages": {
      const activeCv = await getOrCreateActiveCv(db, userId);
      const incomingLanguages: any[] = Array.isArray(args.languages) ? args.languages : [];

      const formatted = incomingLanguages.map((l) => ({
        id: `lang_${Math.random().toString(36).substring(2, 8)}`,
        name: String(l.name || "").trim(),
        proficiency: String(l.proficiency || "Intermediate"),
      }));

      await db.collection("cvs").updateOne(
        { _id: activeCv._id },
        {
          $set: {
            languages: formatted,
            updatedAt: now,
          },
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Updated languages list! (${formatted.length} languages configured).`,
          },
        ],
      };
    }

    case "save_cover_letter": {
      const activeCv = await getOrCreateActiveCv(db, userId);

      const recipient = {
        hiringManager: String(args.hiringManager || "Hiring Manager"),
        companyName: String(args.companyName || "").trim(),
        department: String(args.department || "").trim(),
        companyAddress: String(args.companyAddress || "").trim(),
        jobTitle: String(args.jobTitle || "").trim(),
      };

      const letterDetails = {
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        greeting: String(args.greeting || `Dear ${recipient.hiringManager || "Hiring Team"},`),
        openingParagraph: String(args.openingParagraph || "").trim(),
        bodyParagraph1: String(args.bodyParagraph1 || "").trim(),
        bodyParagraph2: String(args.bodyParagraph2 || "").trim(),
        closingParagraph: String(args.closingParagraph || "").trim(),
        signOff: String(args.signOff || "Sincerely,"),
      };

      const title = String(args.title || `Cover Letter - ${recipient.jobTitle} at ${recipient.companyName}`);

      if (args.id) {
        let q: any = { userId };
        try {
          q = { userId, _id: new ObjectId(String(args.id)) };
        } catch {
          q = { userId, _id: String(args.id) };
        }

        await db.collection("cover_letters").updateOne(q, {
          $set: {
            title,
            recipient,
            letterDetails,
            updatedAt: now,
          },
        });

        return {
          content: [{ type: "text", text: `✅ Cover letter '${title}' updated successfully.` }],
        };
      } else {
        const newDoc = {
          userId,
          cvId: activeCv._id.toString(),
          title,
          templateId: "modern",
          personalInfo: activeCv.personalInfo,
          recipient,
          letterDetails,
          createdAt: now,
          updatedAt: now,
        };

        const insertRes = await db.collection("cover_letters").insertOne(newDoc);
        return {
          content: [
            {
              type: "text",
              text: `✅ Created new cover letter '${title}'! ID: ${insertRes.insertedId.toString()}`,
            },
          ],
        };
      }
    }

    case "update_document_metadata": {
      const docId = String(args.documentId || "");
      let q: any = { userId };
      try {
        q = { userId, _id: new ObjectId(docId) };
      } catch {
        q = { userId, _id: docId };
      }

      const updateFields: Record<string, any> = { updatedAt: now };
      if (args.title) updateFields.title = String(args.title).trim();
      if (args.category) updateFields.category = String(args.category).trim();
      if (args.customCategory !== undefined) updateFields.customCategory = String(args.customCategory).trim();

      const res = await db.collection("documents").updateOne(q, { $set: updateFields });

      if (res.matchedCount === 0) {
        return {
          isError: true,
          content: [{ type: "text", text: `Document with ID '${docId}' not found.` }],
        };
      }

      return {
        content: [{ type: "text", text: `✅ Document metadata updated for '${docId}'.` }],
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
          version: "1.1.0",
        },
      },
    };
  }

  if (method === "notifications/initialized") {
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
