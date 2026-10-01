"use client";

import { useState } from "react";
import { UserDocument } from "@/lib/types";

interface CVSummary {
  _id: string;
  personalInfo: { fullName: string; title: string };
  templateId: string;
}

interface CoverLetterSummary {
  _id: string;
  title: string;
  recipient: { companyName: string; jobTitle: string };
}

interface Props {
  cvs: CVSummary[];
  coverLetters: CoverLetterSummary[];
  documents: UserDocument[];
  onClose: () => void;
}

export default function DocumentMergerModal({ cvs, coverLetters, documents, onClose }: Props) {
  const [selectedCvId, setSelectedCvId] = useState<string>(cvs[0]?._id || "");
  const [selectedLetterId, setSelectedLetterId] = useState<string>(coverLetters[0]?._id || "");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(documents.map((d) => d._id));
  const [isMerging, setIsMerging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const selectAllDocs = () => {
    setSelectedDocIds(documents.map((d) => d._id));
  };

  const deselectAllDocs = () => {
    setSelectedDocIds([]);
  };

  const handleMerge = async () => {
    if (!selectedCvId && !selectedLetterId && selectedDocIds.length === 0) {
      setErrorMsg("Please select at least one item (CV, Cover Letter, or document) to merge.");
      return;
    }

    setIsMerging(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/documents/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvId: selectedCvId || undefined,
          coverLetterId: selectedLetterId || undefined,
          documentIds: selectedDocIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to merge PDF documents");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "Combined_Application_Portfolio.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate merged PDF.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, width: "95%", maxHeight: "90vh", padding: "1.75rem", overflowY: "auto" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Merge Portfolio into One PDF</h3>
            <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Combine your Resume, Cover Letter, and Educational/Recommendation certificates into 1 unified document.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "1.5rem", cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {errorMsg}
          </div>
        )}

        {/* Section 1: Resume Selection */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-primary)", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
            1. Select Resume (CV)
          </h4>

          {cvs.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)" }}>No saved resumes available.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  background: !selectedCvId ? "var(--bg-secondary)" : "transparent",
                  border: !selectedCvId ? "1px solid var(--border-strong)" : "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                <input
                  type="radio"
                  name="cvSelection"
                  checked={!selectedCvId}
                  onChange={() => setSelectedCvId("")}
                />
                <span style={{ color: "var(--text-secondary)" }}>Do not include a Resume</span>
              </label>

              {cvs.map((cv) => {
                const isSelected = selectedCvId === cv._id;
                return (
                  <label
                    key={cv._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      background: isSelected ? "var(--bg-secondary)" : "transparent",
                      border: isSelected ? "1px solid var(--border-strong)" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="cvSelection"
                      checked={isSelected}
                      onChange={() => setSelectedCvId(cv._id)}
                    />
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {cv.personalInfo?.fullName || "Untitled Resume"}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                        {cv.personalInfo?.title || "Professional CV"}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Cover Letter Selection */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-primary)", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
            2. Select Cover Letter
          </h4>

          {coverLetters.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)" }}>No saved cover letters available.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  background: !selectedLetterId ? "var(--bg-secondary)" : "transparent",
                  border: !selectedLetterId ? "1px solid var(--border-strong)" : "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                <input
                  type="radio"
                  name="letterSelection"
                  checked={!selectedLetterId}
                  onChange={() => setSelectedLetterId("")}
                />
                <span style={{ color: "var(--text-secondary)" }}>Do not include a Cover Letter</span>
              </label>

              {coverLetters.map((l) => {
                const isSelected = selectedLetterId === l._id;
                return (
                  <label
                    key={l._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      background: isSelected ? "var(--bg-secondary)" : "transparent",
                      border: isSelected ? "1px solid var(--border-strong)" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="letterSelection"
                      checked={isSelected}
                      onChange={() => setSelectedLetterId(l._id)}
                    />
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {l.recipient?.companyName ? `Cover Letter — ${l.recipient.companyName}` : l.title}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                        {l.recipient?.jobTitle || "Job Application"}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Educational & Recommendation Documents */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-primary)", letterSpacing: "0.05em", margin: 0 }}>
              3. Select Educational & Custom Certificates ({selectedDocIds.length}/{documents.length})
            </h4>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={selectAllDocs} type="button" style={{ background: "none", border: "none", color: "var(--text-primary)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>
                Select All
              </button>
              <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem" }}>|</span>
              <button onClick={deselectAllDocs} type="button" style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "0.75rem", cursor: "pointer" }}>
                Deselect All
              </button>
            </div>
          </div>

          {documents.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)" }}>
              No uploaded documents yet. Upload Grade 8, 10, 12, or recommendation certificates in the Document Vault first.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 220, overflowY: "auto" }}>
              {documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc._id);
                const categoryBadge = doc.category === "Custom" ? doc.customCategory || "Custom" : doc.category;
                return (
                  <label
                    key={doc._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      background: isSelected ? "var(--bg-secondary)" : "transparent",
                      border: isSelected ? "1px solid var(--border-strong)" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDocSelection(doc._id)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {doc.title}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.1rem 0.45rem",
                            borderRadius: "var(--radius-pill)",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {categoryBadge}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-tertiary)" }}>
                        {doc.fileName} • {doc.fileType.toUpperCase()}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", borderTop: "1px solid var(--border-default)", paddingTop: "1.25rem" }}>
          <button className="btn-secondary" onClick={onClose} style={{ width: "auto", padding: "0.65rem 1.35rem" }}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleMerge}
            disabled={isMerging}
            style={{ width: "auto", padding: "0.65rem 1.6rem" }}
          >
            {isMerging ? <span className="spinner" /> : null}
            {isMerging ? "Merging PDF Pages..." : "Download Merged PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
