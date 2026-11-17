#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const WEBSITE_URL = (process.env.WEBSITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const API_KEY = process.env.MCP_API_KEY;

if (!API_KEY) {
  console.error("FATAL: Environment variable 'MCP_API_KEY' is missing.");
  console.error("Set MCP_API_KEY in your MCP client configuration (e.g., Claude Desktop, Cursor).");
  process.exit(1);
}

/**
 * Communicates securely with the Next.js backend using the secret API key.
 */
async function fetchFromWebsite(resource = "all", extraParams = {}) {
  const query = new URLSearchParams({ resource, ...extraParams });
  const url = `${WEBSITE_URL}/api/mcp/person?${query.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
      "Accept": "application/json",
      "User-Agent": "Person-Profile-MCP/1.0",
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Website error [HTTP ${res.status}]: ${errorBody}`);
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || "Invalid response structure from website.");
  }

  return json.data;
}

const server = new Server(
  {
    name: "person-documents-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_personal_info",
        description:
          "Retrieve personal details, contact info, job title, bio/summary, and social links (LinkedIn, website).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_career_history",
        description:
          "Retrieve complete work experience, employment timeline, roles, and education background.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_skills_and_languages",
        description:
          "Retrieve technical skills, soft skills (with ratings), and spoken languages.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_documents",
        description:
          "List all uploaded documents (certificates, diplomas, portfolio files, recommendations) with categories and secure links.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_document_details",
        description:
          "Get detailed information and file link for a specific document by its document ID.",
        inputSchema: {
          type: "object",
          properties: {
            documentId: {
              type: "string",
              description: "The unique ID of the document to inspect",
            },
          },
          required: ["documentId"],
        },
      },
      {
        name: "get_cover_letters",
        description:
          "Retrieve previously generated or saved cover letters with job title and recipient details.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_full_dossier",
        description:
          "Retrieve complete aggregated information: personal info, experience, skills, education, and documents list in one call.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Execute tool requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_personal_info": {
        const data = await fetchFromWebsite("cv");
        const activeCv = data.cvs?.[0];
        if (!activeCv || !activeCv.personalInfo) {
          return {
            content: [{ type: "text", text: "No personal information found in the database." }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  personalInfo: activeCv.personalInfo,
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
        const data = await fetchFromWebsite("cv");
        const activeCv = data.cvs?.[0];
        if (!activeCv) {
          return { content: [{ type: "text", text: "No CV data found." }] };
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
        const data = await fetchFromWebsite("cv");
        const activeCv = data.cvs?.[0];
        if (!activeCv) {
          return { content: [{ type: "text", text: "No CV data found." }] };
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
        const data = await fetchFromWebsite("documents");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data.documents || [], null, 2),
            },
          ],
        };
      }

      case "get_document_details": {
        const documentId = args?.documentId;
        if (!documentId) {
          throw new Error("Missing required argument 'documentId'.");
        }
        const data = await fetchFromWebsite("document", { id: String(documentId) });
        if (!data.document) {
          return {
            content: [{ type: "text", text: `Document with ID '${documentId}' was not found.` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data.document, null, 2),
            },
          ],
        };
      }

      case "get_cover_letters": {
        const data = await fetchFromWebsite("cover-letters");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data.coverLetters || [], null, 2),
            },
          ],
        };
      }

      case "get_full_dossier": {
        const data = await fetchFromWebsite("all");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unsupported tool: ${name}`);
    }
  } catch (err) {
    const error = err;
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `[MCP Error] ${error.message || String(error)}`,
        },
      ],
    };
  }
});

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);

