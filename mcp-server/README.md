# Remote Cloud MCP Server for CV Maker

Direct cloud Model Context Protocol (MCP) server built into **`https://cvmaker.pro.et`**.

---

## Zero Local Setup (Pure Cloud)

You do **not** need to run any local scripts or maintain code on your computer. Your hosted website serves MCP directly over secure HTTPS (SSE).

### 1. Get Your Key
1. Go to `https://cvmaker.pro.et/dashboard`.
2. Open the **AI Agent & MCP** tab.
3. Click **"Generate API Key"**.

---

### 2. Connect Your AI Assistant

#### For Cursor:
In Cursor Settings > **Features** > **MCP**:
- **Type:** `sse`
- **Name:** `cvmaker`
- **URL:** `https://cvmaker.pro.et/api/mcp/sse?key=cvm_live_YOUR_KEY`

Or in `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "cvmaker": {
      "url": "https://cvmaker.pro.et/api/mcp/sse?key=cvm_live_YOUR_KEY"
    }
  }
}
```

#### For Claude Desktop:
In `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "cvmaker": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://cvmaker.pro.et/api/mcp/sse?key=cvm_live_YOUR_KEY"
      ]
    }
  }
}
```
*(Anthropic's `mcp-remote` bridges Claude Desktop to your live HTTPS endpoint automatically).*

---

## Available Tools

- `get_personal_info`: Personal details, contact, bio summary, links.
- `get_career_history`: Work experience, education history.
- `get_skills_and_languages`: Skills with ratings and spoken languages.
- `list_documents`: Uploaded certificates, diplomas, portfolio files, and resumes.
- `get_document_details`: Inspect a specific document and download link.
- `get_cover_letters`: View tailored cover letters.
- `get_full_dossier`: Full aggregated profile in one context request.
