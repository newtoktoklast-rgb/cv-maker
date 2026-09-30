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

type Tab = "resumes" | "letters" | "documents" | "merge";

export default function DashboardClient({ user, cvs, coverLetters = [], documents = [] }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("resumes");
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
    if (!confirm("Delete this resume?")) return;
    setDeletingCV(id);
    try {
      const res = await fetch(`/api/cv/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingCV(null);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (!confirm("Delete this cover letter?")) return;
    setDeletingLetter(id);
    try {
      const res = await fetch(`/api/cover-letter/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingLetter(null);
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "resumes", label: "Resumes", count: cvs.length },
    { id: "letters", label: "Cover Letters", count: coverLetters.length },
    { id: "documents", label: "Documents", count: documents.length },
    { id: "merge", label: "Merge PDF" },
  ];

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <Link href="/dashboard" className="dashboard-nav-brand">
          <div className="dashboard-nav-brand-icon">
            <svg viewBox="0 0 24 24"><path fill="white" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
          </div>
          <span>CV Studio</span>
        </Link>

        <div className="dashboard-nav-right">
          <span className="dashboard-nav-email">{user.email}</span>
          <button className="btn-secondary btn-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user.name}.</p>
          </div>
          <div className="dashboard-header-actions">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleCreateWithSample}
              disabled={creatingSample}
            >
              {creatingSample ? <span className="spinner" /> : null}
              {creatingSample ? "Creating…" : "Sample CV"}
            </button>
            <Link href="/dashboard/cover-letter/create">
              <button className="btn-secondary btn-sm">New Cover Letter</button>
            </Link>
            <Link href="/dashboard/create">
              <button className="btn-primary btn-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Resume
              </button>
            </Link>
          </div>
        </div>

        <div className="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dashboard-tab ${activeTab === tab.id ? "dashboard-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="dashboard-tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "resumes" && (
          <>
            {cvs.length === 0 ? (
              <div className="dashboard-empty glass-card">
                <div className="dashboard-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <h3>No resumes yet</h3>
                <p>Start from scratch or load a pre-filled sample to explore the builder.</p>
                <div className="dashboard-empty-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: "auto", padding: "0.65rem 1.5rem" }}
                    onClick={handleCreateWithSample}
                    disabled={creatingSample}
                  >
                    {creatingSample ? <span className="spinner" /> : null}
                    {creatingSample ? "Creating…" : "Load Sample CV"}
                  </button>
                  <Link href="/dashboard/create">
                    <button className="btn-secondary" style={{ width: "auto", padding: "0.65rem 1.5rem" }}>
                      Start from Scratch
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="cv-grid">
                {cvs.map((cv) => (
                  <div key={cv._id} className="cv-card glass-card">
                    <div>
                      <div className="cv-card-template">
                        <span className="cv-card-template-dot" />
                        {templateLabels[cv.templateId] || "Resume"}
                      </div>
                      <h3 className="cv-card-name">{cv.personalInfo?.fullName || "Untitled Resume"}</h3>
                      <p className="cv-card-title">{cv.personalInfo?.title || "Professional Profile"}</p>
                    </div>
                    <div>
                      {cv.updatedAt && (
                        <p className="cv-card-date">
                          Updated {new Date(cv.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                      <div className="cv-card-actions">
                        <Link href={`/dashboard/edit/${cv._id}`} style={{ flex: 1 }}>
                          <button className="btn-secondary cv-card-btn" style={{ width: "100%" }}>Edit</button>
                        </Link>
                        <Link href={`/dashboard/cover-letter/create?cvId=${cv._id}`} style={{ flex: 1 }}>
                          <button className="btn-secondary cv-card-btn" style={{ width: "100%" }}>Cover Letter</button>
                        </Link>
                        <button
                          className="btn-danger cv-card-btn"
                          onClick={() => handleDeleteCV(cv._id)}
                          disabled={deletingCV === cv._id}
                        >
                          {deletingCV === cv._id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "letters" && (
          <>
            {coverLetters.length === 0 ? (
              <div className="dashboard-empty glass-card">
                <div className="dashboard-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h3>No cover letters yet</h3>
                <p>Generate a tailored cover letter from any of your saved resumes.</p>
                <div className="dashboard-empty-actions">
                  <Link href="/dashboard/cover-letter/create">
                    <button className="btn-primary" style={{ width: "auto", padding: "0.65rem 1.5rem" }}>
                      Create Cover Letter
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="cv-grid">
                {coverLetters.map((letter) => (
                  <div key={letter._id} className="cv-card glass-card">
                    <div>
                      <div className="cv-card-template">
                        <span className="cv-card-template-dot" />
                        {templateLabels[letter.templateId] || "Cover Letter"}
                      </div>
                      <h3 className="cv-card-name" style={{ fontSize: "1.05rem" }}>
                        {letter.recipient.companyName || "Company Application"}
                      </h3>
                      <p className="cv-card-title">{letter.recipient.jobTitle || letter.title || "Cover Letter"}</p>
                      {letter.recipient.hiringManager && (
                        <p className="cv-card-date">To: {letter.recipient.hiringManager}</p>
                      )}
                    </div>
                    <div>
                      {letter.updatedAt && (
                        <p className="cv-card-date">
                          Updated {new Date(letter.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                      <div className="cv-card-actions">
                        <Link href={`/dashboard/cover-letter/edit/${letter._id}`} style={{ flex: 1 }}>
                          <button className="btn-secondary cv-card-btn" style={{ width: "100%" }}>Edit</button>
                        </Link>
                        <button
                          className="btn-danger cv-card-btn"
                          onClick={() => handleDeleteLetter(letter._id)}
                          disabled={deletingLetter === letter._id}
                        >
                          {deletingLetter === letter._id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "documents" && (
          <DocumentVault initialDocuments={documents} onOpenMerger={() => setActiveTab("merge")} />
        )}

        {activeTab === "merge" && (
          <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><span className="spinner" /></div>}>
            <DocumentMergerSection cvs={cvs} coverLetters={coverLetters} documents={documents} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
