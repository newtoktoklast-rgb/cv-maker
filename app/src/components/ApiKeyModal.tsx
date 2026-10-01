"use client";

import { useState, useEffect } from "react";
import { getStoredApiKey, setStoredApiKey } from "@/lib/gemini-client";
import { IconKey, IconX, IconCheck } from "@/components/Icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSaved }: Props) {
  const [key, setKey] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setKey(getStoredApiKey());
      setSavedMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(key);
    setSavedMsg("Gemini API Key saved in browser!");
    if (onSaved) onSaved();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setStoredApiKey("");
    setKey("");
    setSavedMsg("Cleared API key.");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "2rem",
          borderRadius: "var(--radius-lg)",
          position: "relative",
          animation: "card-enter 0.3s var(--ease-out-expo)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
              }}
            >
              <IconKey size={16} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Google Gemini API Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: "0.2rem 0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconX size={16} />
          </button>
        </div>

        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
          Gemini 2.0 Flash powers direct PDF resume extraction and AI cover letter generation. Enter your API key below or set <code style={{ background: "var(--bg-secondary)", padding: "2px 6px", borderRadius: 4 }}>GEMINI_API_KEY</code> in your environment.
        </p>

        <div className="form-group" style={{ marginBottom: "1.25rem" }}>
          <label className="form-label">Gemini API Key</label>
          <input
            type="password"
            className="form-input"
            placeholder="AIzaSy..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: "0.82rem", color: "var(--text-link)", textDecoration: "none" }}
          >
            Get a free API key at Google AI Studio ↗
          </a>
          {key && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: "none",
                border: "none",
                color: "var(--error)",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              Clear Key
            </button>
          )}
        </div>

        {savedMsg && (
          <div style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontWeight: 600 }}>
            <IconCheck size={14} />
            <span>{savedMsg}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} style={{ flex: 1.5 }}>
            Save API Key
          </button>
        </div>
      </div>
    </div>
  );
}
