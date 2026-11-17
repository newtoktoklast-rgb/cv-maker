# Personal Documents & Profile MCP Server

A secure Model Context Protocol (MCP) server that connects AI assistants (Claude Desktop, Cursor, Antigravity, etc.) to your CV Maker website documents and profile data with strict API key protection.

## Security Highlights

- **User Self-Service & Automatic Scoping:** Each user generates their own key directly in their Dashboard (`AI Agent & MCP` tab). The server automatically scopes all returned documents and resumes to that specific user account.
- **Strict Read-Only:** Exposes only read tools (`get_personal_info`, `list_documents`, etc.). The AI cannot modify, overwrite, or delete documents.
- **Instant Revocation:** If a key is revoked or regenerated in the dashboard, access is cut off immediately.
- **Private Data Protection:** Documents cannot be accessed without a valid active key matching that user.

---

## Quick Setup (1 Minute)

### 1. Generate Your Key on the Website
1. Log in to your CV Maker dashboard.
2. Click on the **AI Agent & MCP** tab.
3. Click **"Generate API Key"**.
4. Click **"Copy Key"** (or use the one-click **"Copy Configuration"** button which gives you the full JSON).

---

### 2. Configure Your AI Assistant

#### For Claude Desktop (`claude_desktop_config.json`):
Path on Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "my-profile": {
      "command": "node",
      "args": ["c:/Users/HP/cv-maker/mcp-server/index.mjs"],
      "env": {
        "WEBSITE_URL": "http://localhost:3000",
        "MCP_API_KEY": "cvm_live_YOUR_GENERATED_KEY"
      }
    }
  }
}
```

*(Replace `http://localhost:3000` with your live domain once your website is deployed, e.g. `https://your-domain.com`).*

#### For Cursor (`.cursor/mcp.json` or Settings > Features > MCP):

```json
{
  "mcpServers": {
    "my-profile": {
      "command": "node",
      "args": ["c:/Users/HP/cv-maker/mcp-server/index.mjs"],
      "env": {
        "WEBSITE_URL": "http://localhost:3000",
        "MCP_API_KEY": "cvm_live_YOUR_GENERATED_KEY"
      }
    }
  }
}
```

---

## Available Tools

| Tool | Description |
|---|---|
| `get_personal_info` | Retrieves your name, headline/title, email, phone, location, summary, and social links. |
| `get_career_history` | Retrieves all employment history, education, and custom sections. |
| `get_skills_and_languages` | Retrieves technical & soft skills (with ratings) and spoken languages. |
| `list_documents` | Lists all uploaded certificates, resumes, and portfolio documents with categories and URLs. |
| `get_document_details` | Inspects a specific document by its ID. |
| `get_cover_letters` | Retrieves stored cover letters. |
| `get_full_dossier` | Retrieves the entire profile and document portfolio in one call. |
