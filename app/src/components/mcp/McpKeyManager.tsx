"use client";

import { useState, useEffect } from "react";
import { IconKey, IconCheck, IconCopy } from "@/components/Icons";

interface KeyData {
  hasKey: boolean;
  key?: string;
  createdAt?: string;
  lastUsedAt?: string | null;
}

export default function McpKeyManager() {
  const [data, setData] = useState<KeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [origin, setOrigin] = useState("https://cvmaker.pro.et");
  const [activeConfigTab, setActiveConfigTab] = useState<"cursor" | "claude" | "url">("cursor");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    fetchKeyData();
  }, []);

  const fetchKeyData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/mcp-key");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load MCP key", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (data?.hasKey && !confirm("Generating a new API key will invalidate your previous key. Continue?")) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch("/api/user/mcp-key", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setData({
          hasKey: true,
          key: json.key,
          createdAt: json.createdAt,
          lastUsedAt: null,
        });
        setShowKey(true);
      }
    } catch (err) {
      console.error("Failed to generate key", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!confirm("Are you sure you want to revoke this API key? Any connected AI assistants will immediately lose access.")) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch("/api/user/mcp-key", { method: "DELETE" });
      if (res.ok) {
        setData({ hasKey: false });
        setShowKey(false);
      }
    } catch (err) {
      console.error("Failed to revoke key", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (!data?.key) return;
    navigator.clipboard.writeText(data.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const userKey = data?.key || "YOUR_GENERATED_API_KEY";
  const remoteSseUrl = `${origin}/api/mcp/sse?key=${userKey}`;

  const cursorConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        "cvmaker": {
          url: remoteSseUrl,
        },
      },
    },
    null,
    2
  );

  const claudeConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        "cvmaker": {
          command: "npx",
          args: ["-y", "mcp-remote", remoteSseUrl],
        },
      },
    },
    null,
    2
  );

  const currentSnippet = activeConfigTab === "cursor" ? cursorConfigSnippet : claudeConfigSnippet;

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(remoteSseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Intro Header */}
      <div className="glass-card" style={{ padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconKey />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              Hosted AI Agent (Remote MCP)
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Connect your AI assistant (Cursor, Claude Desktop, ChatGPT, Antigravity) directly to your hosted account on{" "}
              <strong>{origin}</strong> via Remote MCP. No local script files or downloads required!
            </p>
          </div>
        </div>
      </div>

      {/* API Key Status Card */}
      <div className="glass-card" style={{ padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Personal Access Key
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 2 }}>
              {data?.hasKey
                ? "This secret key authenticates your AI assistant over secure HTTPS."
                : "No active key. Generate one below to connect your AI assistant."}
            </p>
          </div>

          {data?.hasKey ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--success-bg)",
                color: "var(--success)",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--success)",
                }}
              />
              Active
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 10px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--accent-soft)",
                color: "var(--text-tertiary)",
                fontSize: "0.8rem",
              }}
            >
              Not Configured
            </span>
          )}
        </div>

        {data?.hasKey ? (
          <div>
            {/* Key Field with Toggle and Copy */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "0.6rem 0.85rem",
                fontFamily: "monospace",
                fontSize: "0.9rem",
                marginBottom: "1rem",
              }}
            >
              <span style={{ flex: 1, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {showKey ? data.key : data.key ? `${data.key.slice(0, 12)}••••••••••••••••••••••••••••••••` : ""}
              </span>

              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="btn-secondary btn-sm"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              >
                {showKey ? "Hide" : "Reveal"}
              </button>

              <button
                type="button"
                onClick={handleCopyKey}
                className="btn-primary btn-sm"
                style={{ padding: "4px 12px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {copiedKey ? <IconCheck /> : <IconCopy />}
                {copiedKey ? "Copied!" : "Copy Key"}
              </button>
            </div>

            {/* Timestamps */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.5rem",
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
              }}
            >
              {data.createdAt && (
                <span>
                  <strong>Created:</strong>{" "}
                  {new Date(data.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              <span>
                <strong>Last used by AI:</strong>{" "}
                {data.lastUsedAt
                  ? new Date(data.lastUsedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })
                  : "Never"}
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={handleGenerateKey}
                disabled={actionLoading}
                className="btn-secondary btn-sm"
              >
                {actionLoading ? "Processing…" : "Regenerate Key"}
              </button>
              <button
                type="button"
                onClick={handleRevokeKey}
                disabled={actionLoading}
                className="btn-danger btn-sm"
              >
                Revoke Key
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              Click below to generate your private access key. Your hosted website will serve your documents directly to your AI over secure HTTPS.
            </p>
            <button
              type="button"
              onClick={handleGenerateKey}
              disabled={actionLoading}
              className="btn-primary"
              style={{ width: "auto", padding: "0.6rem 1.5rem" }}
            >
              {actionLoading ? "Generating…" : "Generate API Key"}
            </button>
          </div>
        )}
      </div>

      {/* Cloud MCP Configuration Options */}
      {data?.hasKey && (
        <div className="glass-card" style={{ padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Remote Cloud Connection (No local files required)
            </h3>
            {activeConfigTab !== "url" ? (
              <button
                type="button"
                onClick={handleCopyConfig}
                className="btn-secondary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {copiedConfig ? <IconCheck /> : <IconCopy />}
                {copiedConfig ? "Copied Config!" : "Copy Configuration"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCopyUrl}
                className="btn-secondary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {copiedUrl ? <IconCheck /> : <IconCopy />}
                {copiedUrl ? "Copied URL!" : "Copy Endpoint URL"}
              </button>
            )}
          </div>

          {/* Config Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <button
              type="button"
              className={`btn-sm ${activeConfigTab === "cursor" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveConfigTab("cursor")}
              style={{ fontSize: "0.75rem" }}
            >
              Cursor (Direct SSE URL)
            </button>
            <button
              type="button"
              className={`btn-sm ${activeConfigTab === "claude" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveConfigTab("claude")}
              style={{ fontSize: "0.75rem" }}
            >
              Claude Desktop (npx mcp-remote)
            </button>
            <button
              type="button"
              className={`btn-sm ${activeConfigTab === "url" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveConfigTab("url")}
              style={{ fontSize: "0.75rem" }}
            >
              Direct Remote URL
            </button>
          </div>

          {activeConfigTab === "url" ? (
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Remote SSE Stream URL:
                </span>
                <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-primary)", wordBreak: "break-all", marginTop: 4 }}>
                  {remoteSseUrl}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Remote JSON-RPC POST Endpoint:
                </span>
                <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-primary)", wordBreak: "break-all", marginTop: 4 }}>
                  {origin}/api/mcp?key={userKey}
                </div>
              </div>
            </div>
          ) : (
            <pre
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                fontFamily: "monospace",
                fontSize: "0.82rem",
                color: "var(--text-primary)",
                overflowX: "auto",
                lineHeight: 1.4,
              }}
            >
              {currentSnippet}
            </pre>
          )}

          <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.75rem" }}>
            * Connects directly to <code>{origin}</code> over HTTPS. No local server files or code repository setup needed on your client computer.
          </p>
        </div>
      )}

      {/* Security note */}
      <div
        style={{
          border: "1px dashed var(--border-default)",
          borderRadius: "var(--radius-md)",
          padding: "1rem 1.25rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-start",
          backgroundColor: "var(--bg-card)",
        }}
      >
        <div style={{ color: "var(--success)", marginTop: 2 }}>
          <IconCheck />
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--text-primary)" }}>Direct Cloud Security:</strong> Requests hitting your hosted website must include your unique key. Every request is isolated strictly to your account’s documents, resumes, and cover letters. Your AI assistant can read your documents as well as update your CV, add work experiences, adjust skills, and write cover letters directly.
        </div>
      </div>
    </div>
  );
}
