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
  const [showKey, setShowKey] = useState(false);
  const [origin, setOrigin] = useState("http://localhost:3000");
  const [activeConfigTab, setActiveConfigTab] = useState<"claude" | "cursor">("claude");

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

  const claudeConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        "my-cv-profile": {
          command: "node",
          args: ["<PATH_TO_MCP_SERVER>/index.mjs"],
          env: {
            WEBSITE_URL: origin,
            MCP_API_KEY: data?.key || "YOUR_GENERATED_API_KEY",
          },
        },
      },
    },
    null,
    2
  );

  const cursorConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        "my-cv-profile": {
          command: "node",
          args: ["<PATH_TO_MCP_SERVER>/index.mjs"],
          env: {
            WEBSITE_URL: origin,
            MCP_API_KEY: data?.key || "YOUR_GENERATED_API_KEY",
          },
        },
      },
    },
    null,
    2
  );

  const currentSnippet = activeConfigTab === "claude" ? claudeConfigSnippet : cursorConfigSnippet;

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
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
              AI Assistant & MCP Keys
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Connect your favorite AI assistant (Claude Desktop, Cursor, ChatGPT, or Antigravity) to your profile.
              Your AI can read your resumes, work experience, and uploaded documents through the secure Model Context Protocol.
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
                ? "This secret key grants read-only access to your resumes and documents."
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
                <strong>Last used:</strong>{" "}
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
              Click the button below to generate a secure 256-bit API key. You will be able to paste this key into your AI setup to give it direct access to your CV and documents.
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

      {/* Setup Instructions & Pre-made Config */}
      {data?.hasKey && (
        <div className="glass-card" style={{ padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>
              AI Client Configuration
            </h3>
            <button
              type="button"
              onClick={handleCopyConfig}
              className="btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {copiedConfig ? <IconCheck /> : <IconCopy />}
              {copiedConfig ? "Copied Config!" : "Copy Configuration"}
            </button>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Add this snippet to your AI assistant’s MCP settings:
          </p>

          {/* Config Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <button
              type="button"
              className={`btn-sm ${activeConfigTab === "claude" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveConfigTab("claude")}
              style={{ fontSize: "0.75rem" }}
            >
              Claude Desktop (claude_desktop_config.json)
            </button>
            <button
              type="button"
              className={`btn-sm ${activeConfigTab === "cursor" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveConfigTab("cursor")}
              style={{ fontSize: "0.75rem" }}
            >
              Cursor (mcp.json)
            </button>
          </div>

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
          <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.75rem" }}>
            * Note: Replace <code>&lt;PATH_TO_MCP_SERVER&gt;</code> with the local path to your <code>mcp-server</code> folder (e.g. <code>c:/Users/HP/cv-maker/mcp-server</code>).
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
          <strong style={{ color: "var(--text-primary)" }}>Private & Scoped:</strong> Each user has their own unique API key. The MCP server will strictly fetch your own resumes and documents—never another user’s data. Access is strictly read-only and can be revoked at any time.
        </div>
      </div>
    </div>
  );
}

