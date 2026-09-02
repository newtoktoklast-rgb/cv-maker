"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { dummyCVData, UserDocument } from "@/lib/types";
import DocumentVault from "@/components/documents/DocumentVault";
import DocumentMergerSection from "@/components/documents/DocumentMergerSection";


interface CVSummary {
  _id: string;
  templateId: string;
  personalInfo: { fullName: string; title: string };
  updatedAt: string;
}

interface CoverLetterSummary {
  _id: string;
  cvId?: string;
  title: string;
  templateId: string;
  recipient: { companyName: string; jobTitle: string; hiringManager: string };
  updatedAt: string;
}

interface Props {
  user: { name: string; email: string };
  cvs: CVSummary[];
  coverLetters?: CoverLetterSummary[];
  documents?: UserDocument[];
}

const templateLabels: Record<string, string> = {
  modern: "Swiss Modernist",
  classic: "Editorial Monograph",
  executive: "Executive Minimalist",
};

const templateColors: Record<string, string> = {
  modern: "#6366f1",
  classic: "#f59e0b",
  executive: "#38bdf8",
};

export default function DashboardClient({ user, cvs, coverLetters = [], documents = [] }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"resumes" | "letters" | "documents" | "merge">("resumes");
  const [deletingCV, setDeletingCV] = useState<string | null>(null);
  const [deletingLetter, setDeletingLetter] = useState<string | null>(null);
  const [creatingSample, setCreatingSample] = useState(false);


  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const handleCreateWithSample = async () => {
    setCreatingSample(true);
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dummyCVData),
      });
      if (res.ok) {
        const created = await res.json();
        router.push(`/dashboard/edit/${created._id}`);
      }
    } finally {
      setCreatingSample(false);
    }
  };

  const handleDeleteCV = async (id: string) => {
    if (!confirm("Are you sure you want to delete this CV?")) return;
    setDeletingCV(id);
    try {
      const res = await fetch(`/api/cv/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingCV(null);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cover letter?")) return;
    setDeletingLetter(id);
    try {
      const res = await fetch(`/api/cover-letter/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingLetter(null);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Studio Nav */}
      <nav className="dashboard-nav">
        <Link href="/dashboard" className="dashboard-nav-brand">
          <div className="dashboard-nav-brand-icon">
            <svg viewBox="0 0 24 24"><path fill="white" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
          </div>
          <span>CV Studio</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>{user.email}</span>
          </div>
          <button className="btn-secondary" onClick={handleSignOut} style={{ width: "auto", padding: "0.45rem 1rem", fontSize: "0.82rem" }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="dashboard-content">
        <div className="dashboard-welcome">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.25rem" }}>
            <div>
              <h1>Career Documents Studio</h1>
              <p>Manage resumes, cover letters, educational certificates & custom recommendations for {user.name}.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  width: "auto",
                  padding: "0.68rem 1.25rem",
                  fontSize: "0.86rem",
                  borderColor: "rgba(99, 102, 241, 0.4)",
                  background: activeTab === "merge" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.15)",
                  color: "#c7d2fe",
                }}
                onClick={() => setActiveTab("merge")}
              >
                ✨ Merge PDF Studio
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: "auto", padding: "0.68rem 1.25rem", fontSize: "0.86rem" }}
                onClick={handleCreateWithSample}
                disabled={creatingSample}
              >
                {creatingSample ? <span className="spinner" /> : "⚡"}
                {creatingSample ? "Creating Sample..." : "Quick Sample CV"}
              </button>
              <Link href="/dashboard/cover-letter/create">
                <button className="btn-secondary" style={{ width: "auto", padding: "0.68rem 1.25rem", fontSize: "0.86rem" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  New Cover Letter
                </button>
              </Link>
              <Link href="/dashboard/create">
                <button className="btn-primary" style={{ width: "auto", padding: "0.68rem 1.5rem", fontSize: "0.86rem" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Resume
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`builder-step ${activeTab === "resumes" ? "builder-step-active" : ""}`}
            onClick={() => setActiveTab("resumes")}
            style={{ borderRadius: "var(--radius-pill)", padding: "0.55rem 1.25rem", fontSize: "0.88rem" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Resumes ({cvs.length})
          </button>
          <button
            type="button"
            className={`builder-step ${activeTab === "letters" ? "builder-step-active" : ""}`}
            onClick={() => setActiveTab("letters")}
            style={{ borderRadius: "var(--radius-pill)", padding: "0.55rem 1.25rem", fontSize: "0.88rem" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Cover Letters ({coverLetters.length})
          </button>
          <button
            type="button"
            className={`builder-step ${activeTab === "documents" ? "builder-step-active" : ""}`}
            onClick={() => setActiveTab("documents")}
            style={{ borderRadius: "var(--radius-pill)", padding: "0.55rem 1.25rem", fontSize: "0.88rem" }}
          >
            <span>📑</span>
            Document Vault ({documents.length})
          </button>
          <button
            type="button"
            className={`builder-step ${activeTab === "merge" ? "builder-step-active" : ""}`}
            onClick={() => setActiveTab("merge")}
            style={{
              borderRadius: "var(--radius-pill)",
              padding: "0.55rem 1.25rem",
              fontSize: "0.88rem",
              borderColor: activeTab === "merge" ? "#6366f1" : "rgba(99, 102, 241, 0.4)",
              color: activeTab === "merge" ? "#c7d2fe" : "var(--text-secondary)",
              background: activeTab === "merge" ? "rgba(99, 102, 241, 0.2)" : "transparent",
            }}
          >
            <span>✨</span>
            Merge PDF Studio
          </button>
        </div>



        {/* TAB 1: RESUMES */}
        {activeTab === "resumes" && (
          <>
            {cvs.length === 0 ? (
              <div className="dashboard-empty glass-card">
                <div className="dashboard-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <h3>No resumes created yet</h3>
                <p>Generate a pre-filled sample CV to explore the layout in seconds, or start fresh.</p>
                <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: "auto", padding: "0.75rem 1.6rem" }}
                    onClick={handleCreateWithSample}
                    disabled={creatingSample}
                  >
                    {creatingSample ? <span className="spinner" /> : "⚡"}
                    {creatingSample ? "Generating..." : "Quick Start with Sample CV"}
                  </button>
                  <Link href="/dashboard/create">
                    <button className="btn-secondary" style={{ width: "auto", padding: "0.75rem 1.6rem" }}>
                      Start from Scratch
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="cv-grid">
                {cvs.map((cv) => {
                  const accentColor = templateColors[cv.templateId] || "#6366f1";
                  return (
                    <div key={cv._id} className="glass-card cv-card">
                      <div>
                        <div
                          className="cv-card-template"
                          style={{
                            borderColor: `${accentColor}40`,
                            background: `${accentColor}12`,
                            color: accentColor,
                          }}
                        >
                          <span className="cv-card-template-dot" style={{ background: accentColor }} />
                          {templateLabels[cv.templateId] || "Swiss Modernist"}
                        </div>

                        <h3 className="cv-card-name">{cv.personalInfo?.fullName || "Untitled Resume"}</h3>
                        <p className="cv-card-title">{cv.personalInfo?.title || "Professional Profile"}</p>
                      </div>

                      <div>
                        {cv.updatedAt && (
                          <p className="cv-card-date">
                            Last edited {new Date(cv.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}

                        <div className="cv-card-actions" style={{ flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Link href={`/dashboard/edit/${cv._id}`} style={{ flex: 1 }}>
                              <button className="btn-secondary cv-card-btn" style={{ width: "100%" }}>
                                Edit Resume
                              </button>
                            </Link>
                            <button
                              className="btn-danger cv-card-btn"
                              onClick={() => handleDeleteCV(cv._id)}
                              disabled={deletingCV === cv._id}
                            >
                              {deletingCV === cv._id ? "..." : "Delete"}
                            </button>
                          </div>

                          {/* Instant Cover Letter generation trigger */}
                          <Link href={`/dashboard/cover-letter/create?cvId=${cv._id}`}>
                            <button
                              className="btn-secondary cv-card-btn"
                              style={{
                                width: "100%",
                                borderColor: "rgba(99, 102, 241, 0.35)",
                                background: "rgba(99, 102, 241, 0.08)",
                                color: "#c7d2fe",
                              }}
                            >
                              📝 Write Matching Cover Letter
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: COVER LETTERS */}
        {activeTab === "letters" && (
          <>
            {coverLetters.length === 0 ? (
              <div className="dashboard-empty glass-card">
                <div className="dashboard-empty-icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.25)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h3>No cover letters created yet</h3>
                <p>Generate an articulate, tailored cover letter based on any of your saved resumes in seconds.</p>
                <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
                  <Link href="/dashboard/cover-letter/create">
                    <button className="btn-primary" style={{ width: "auto", padding: "0.75rem 1.6rem" }}>
                      ⚡ Create First Cover Letter
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="cv-grid">
                {coverLetters.map((letter) => {
                  const accentColor = templateColors[letter.templateId] || "#6366f1";
                  return (
                    <div key={letter._id} className="glass-card cv-card">
                      <div>
                        <div
                          className="cv-card-template"
                          style={{
                            borderColor: `${accentColor}40`,
                            background: `${accentColor}12`,
                            color: accentColor,
                          }}
                        >
                          <span className="cv-card-template-dot" style={{ background: accentColor }} />
                          {templateLabels[letter.templateId] || "Swiss Modernist"}
                        </div>

                        <h3 className="cv-card-name" style={{ fontSize: "1.1rem" }}>
                          {letter.recipient.companyName ? `${letter.recipient.companyName}` : "Company Application"}
                        </h3>
                        <p className="cv-card-title">
                          {letter.recipient.jobTitle || letter.title || "Cover Letter"}
                        </p>
                        {letter.recipient.hiringManager && (
                          <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginBottom: "0.5rem" }}>
                            To: {letter.recipient.hiringManager}
                          </p>
                        )}
                      </div>

                      <div>
                        {letter.updatedAt && (
                          <p className="cv-card-date">
                            Last edited {new Date(letter.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}

                        <div className="cv-card-actions">
                          <Link href={`/dashboard/cover-letter/edit/${letter._id}`} style={{ flex: 1 }}>
                            <button className="btn-secondary cv-card-btn" style={{ width: "100%" }}>
                              Edit Letter
                            </button>
                          </Link>
                          <button
                            className="btn-danger cv-card-btn"
                            onClick={() => handleDeleteLetter(letter._id)}
                            disabled={deletingLetter === letter._id}
                          >
                            {deletingLetter === letter._id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 3: DOCUMENTS VAULT */}
        {activeTab === "documents" && (
          <DocumentVault
            initialDocuments={documents}
            onOpenMerger={() => setActiveTab("merge")}
          />
        )}

        {/* TAB 4: MERGE PDF STUDIO */}
        {activeTab === "merge" && (
          <Suspense fallback={<div className="spinner" />}>
            <DocumentMergerSection
              cvs={cvs}
              coverLetters={coverLetters}
              documents={documents}
            />
          </Suspense>
        )}

      </main>
    </div>
  );
}


