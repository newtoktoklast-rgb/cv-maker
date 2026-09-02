"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CVData, CoverLetterData, emptyCoverLetter, dummyCoverLetterData, dummyCVData } from "@/lib/types";
import { generateCoverLetterFromCV } from "@/lib/cover-letter-generator";
import CoverLetterPreview from "./CoverLetterPreview";
import ApiKeyModal from "@/components/ApiKeyModal";
import { getStoredApiKey } from "@/lib/gemini-client";
import { captureHtmlToPdfBase64 } from "@/lib/pdfCapture";


interface Props {
  initial?: CoverLetterData;
  letterId?: string;
  userCVs: CVData[];
  initialCvId?: string;
}

const STEPS = [
  "1. Target & Source CV",
  "2. Recipient & Details",
  "3. Letter Content",
  "4. Template & Export",
];

const templateOptions = [
  {
    id: "modern" as const,
    name: "Swiss Modernist",
    badge: "Atelier",
    desc: "Deep slate header, initials monogram & amber accent contacts",
  },
  {
    id: "classic" as const,
    name: "Editorial Monograph",
    badge: "Meridian",
    desc: "Literary Newsreader serif, ivory paper & formal middot header",
  },
  {
    id: "executive" as const,
    name: "Executive Minimalist",
    badge: "Metropolis",
    desc: "Obsidian header banner, electric indigo accent & clean metadata",
  },
];

export default function CoverLetterBuilder({ initial, letterId, userCVs, initialCvId }: Props) {
  const router = useRouter();

  // Find preselected CV
  const defaultCvId = initial?.cvId || initialCvId || (userCVs.length > 0 ? userCVs[0]._id : "");

  const [formData, setFormData] = useState<CoverLetterData>(() => {
    if (initial) return initial;
    const base = { ...emptyCoverLetter };
    if (defaultCvId) {
      const match = userCVs.find((c) => c._id === defaultCvId);
      if (match) {
        base.cvId = defaultCvId;
        base.personalInfo = { ...match.personalInfo };
      }
    }
    return base;
  });

  const [selectedCvId, setSelectedCvId] = useState<string>(defaultCvId || "");
  const [targetCompany, setTargetCompany] = useState(formData.recipient.companyName || "");
  const [targetRole, setTargetRole] = useState(formData.recipient.jobTitle || "");
  const [hiringManager, setHiringManager] = useState(formData.recipient.hiringManager || "Hiring Manager");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<"confident" | "professional" | "creative" | "executive">("professional");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [notification, setNotification] = useState("");

  const handleGenerateWithGemini = async () => {
    const chosen = selectedCvId === "dummy"
      ? dummyCVData
      : userCVs.find((c) => c._id === selectedCvId) || userCVs[0] || dummyCVData;

    if (!targetCompany.trim() || !targetRole.trim()) {
      alert("Please enter a target company name and job title.");
      return;
    }

    setGeneratingAI(true);
    setNotification("✨ Gemini AI is analyzing your CV and composing your letter...");

    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv: chosen,
          target: {
            companyName: targetCompany,
            jobTitle: targetRole,
            hiringManager,
            jobDescription,
            tone,
          },
          customApiKey: getStoredApiKey() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.error && json.error.toLowerCase().includes("api key")) {
          setApiKeyModalOpen(true);
        }
        throw new Error(json.error || "Failed to generate cover letter.");
      }

      const letterDetails = json.letterDetails;
      setFormData((prev) => ({
        ...prev,
        title: `Cover Letter — ${targetRole} at ${targetCompany}`,
        cvId: selectedCvId,
        personalInfo: { ...chosen.personalInfo },
        recipient: {
          ...prev.recipient,
          companyName: targetCompany,
          jobTitle: targetRole,
          hiringManager,
        },
        letterDetails,
      }));

      setNotification("✓ Cover letter crafted with Gemini 2.0 Flash!");
      setTimeout(() => setNotification(""), 5000);
    } catch (err: any) {
      setNotification(err.message || "Gemini generation failed.");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Sync candidate personal info when changing selected CV
  const handleSelectCV = (id: string) => {
    setSelectedCvId(id);
    const chosen = id === "dummy" ? dummyCVData : userCVs.find((c) => c._id === id);
    if (chosen) {
      setFormData((prev) => ({
        ...prev,
        cvId: id,
        personalInfo: { ...chosen.personalInfo },
      }));
    }
  };

  const handleGenerate = () => {
    const chosen = selectedCvId === "dummy"
      ? dummyCVData
      : userCVs.find((c) => c._id === selectedCvId) || userCVs[0] || dummyCVData;

    const generated = generateCoverLetterFromCV(chosen, {
      companyName: targetCompany || "Target Company",
      jobTitle: targetRole || chosen.personalInfo.title || "Target Role",
      hiringManager: hiringManager || "Hiring Manager",
      tone,
    });

    setFormData((prev) => ({
      ...prev,
      title: `Cover Letter — ${targetRole || chosen.personalInfo.title || "Role"} at ${targetCompany || "Company"}`,
      cvId: selectedCvId,
      personalInfo: { ...chosen.personalInfo },
      recipient: {
        ...prev.recipient,
        companyName: targetCompany,
        jobTitle: targetRole,
        hiringManager,
      },
      letterDetails: generated,
    }));

    setNotification("✨ Cover letter generated from CV!");
    setTimeout(() => setNotification(""), 3000);
  };

  const handleLoadDummy = () => {
    setFormData({ ...dummyCoverLetterData });
    setTargetCompany(dummyCoverLetterData.recipient.companyName);
    setTargetRole(dummyCoverLetterData.recipient.jobTitle);
    setHiringManager(dummyCoverLetterData.recipient.hiringManager);
    setNotification("⚡ Loaded sample cover letter data!");
    setTimeout(() => setNotification(""), 3000);
  };

  const base64ToBlob = (base64: string, mimeType = "application/pdf") => {
    const cleanB64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const byteCharacters = atob(cleanB64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleSave = async (redirectToMerger: boolean = false) => {
    setSaving(true);
    try {
      let pdfBase64: string | undefined;
      const previewEl = (document.querySelector(".cl-preview-page") as HTMLElement) || (document.querySelector(".cv-preview-page") as HTMLElement);
      if (previewEl) {
        const base64 = await captureHtmlToPdfBase64(previewEl);
        if (base64) pdfBase64 = base64;
      }

      const payload = {
        ...formData,
        pdfBase64,
      };

      const url = letterId ? `/api/cover-letter/${letterId}` : "/api/cover-letter";
      const method = letterId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        const savedId = letterId || resData._id;

        // Automatically upload generated PDF to Document Vault under category "Cover Letter"
        if (pdfBase64) {
          try {
            const blob = base64ToBlob(pdfBase64);
            const compName = formData.recipient.companyName || "Application";
            const docFormData = new FormData();
            docFormData.append("file", blob, `${compName}_Cover_Letter.pdf`);
            docFormData.append("title", `Cover Letter — ${compName}`);
            docFormData.append("category", "Cover Letter");
            await fetch("/api/documents", { method: "POST", body: docFormData });
          } catch (uploadErr) {
            console.error("Failed to upload Cover Letter PDF to document store:", uploadErr);
          }
        }

        setNotification("✓ Saved successfully!");
        if (redirectToMerger && savedId) {
          setTimeout(() => router.push(`/dashboard/documents?selectedLetterId=${savedId}`), 400);
        } else {
          setTimeout(() => router.push("/dashboard"), 400);
        }
      } else {
        alert("Failed to save cover letter.");
      }



    } catch {
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="builder-layout">
      {/* Top Toolbar */}
      <div className="builder-top-toolbar">
        <div className="builder-top-toolbar-left">
          <span className="builder-title-badge">Cover Letter Studio</span>
          <span className="builder-current-step-label">{STEPS[step]}</span>
          {notification && (
            <span style={{ color: "#34d399", fontSize: "0.85rem", fontWeight: 600 }}>
              {notification}
            </span>
          )}
        </div>

        <div className="builder-top-toolbar-actions">
          <button
            type="button"
            className="btn-clear-data"
            onClick={() => setApiKeyModalOpen(true)}
            title="Configure Google Gemini API Key"
          >
            🔑 AI Key
          </button>
          <button
            type="button"
            className="btn-dummy-data"
            onClick={handleLoadDummy}
            title="Populate with sample cover letter"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Auto-Fill Sample
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "auto", padding: "0.5rem 1.25rem", fontSize: "0.84rem" }}
            onClick={() => handleSave(false)}

            disabled={saving}
          >
            {saving ? <span className="spinner" /> : "💾 Save Cover Letter"}
          </button>
        </div>
      </div>

      {/* Progress Navigation */}
      <div className="builder-progress">
        {STEPS.map((label, i) => (
          <button
            key={label}
            className={`builder-step ${i === step ? "builder-step-active" : ""} ${i < step ? "builder-step-done" : ""}`}
            onClick={() => setStep(i)}
            type="button"
          >
            <span className="builder-step-num">{i < step ? "✓" : i + 1}</span>
            <span className="builder-step-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="builder-body">
        <div className="builder-form-area">
          {/* STEP 0: Target Role & Source CV */}
          {step === 0 && (
            <div className="builder-section animate-in">
              <h2 className="builder-section-title">Select Source CV & Target Role</h2>
              <p className="builder-section-desc">
                Choose one of your saved CVs. We will automatically analyze your work history, metrics, and skills to craft an articulate, tailored cover letter.
              </p>

              <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label className="form-label">Select Source CV</label>
                  <select
                    className="form-input"
                    value={selectedCvId}
                    onChange={(e) => handleSelectCV(e.target.value)}
                  >
                    {userCVs.map((cv) => (
                      <option key={cv._id} value={cv._id}>
                        {cv.personalInfo.fullName} — {cv.personalInfo.title || "Resume"} ({new Date(cv.updatedAt || "").toLocaleDateString()})
                      </option>
                    ))}
                    <option value="dummy">Alexander Vance — Sample CV (Stripe, Airbnb, Next.js)</option>
                  </select>
                </div>

                <div className="builder-grid-2">
                  <div className="form-group">
                    <label className="form-label">Target Company Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Stripe, Apple, Figma"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Job Title *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Senior Frontend Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    />
                  </div>
                </div>

                <div className="builder-grid-2">
                  <div className="form-group">
                    <label className="form-label">Hiring Manager or Team</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Jane Doe, Hiring Committee"
                      value={hiringManager}
                      onChange={(e) => setHiringManager(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tone of Voice</label>
                    <select
                      className="form-input"
                      value={tone}
                      onChange={(e) => setTone(e.target.value as any)}
                    >
                      <option value="professional">Professional & Balanced</option>
                      <option value="confident">Confident & High-Impact</option>
                      <option value="executive">Executive & Strategic</option>
                      <option value="creative">Creative & Human</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Job Description / Requirements (Optional, for deep AI alignment)</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Paste the job description, required skills, or team goals here to generate a tailored ATS-optimized letter..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{
                      flex: 1.5,
                      padding: "0.85rem 1.6rem",
                      background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                      minWidth: "220px",
                    }}
                    onClick={handleGenerateWithGemini}
                    disabled={generatingAI}
                  >
                    {generatingAI ? <span className="spinner" /> : "✨"}
                    {generatingAI ? "Gemini AI Generating..." : "AI Generate with Gemini 2.0"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, padding: "0.85rem 1.4rem", minWidth: "160px" }}
                    onClick={handleGenerate}
                  >
                    ⚡ Quick Template Fill
                  </button>
                </div>
              </div>

              <div className="builder-nav">
                <button type="button" className="btn-primary builder-nav-btn" onClick={() => setStep(1)}>
                  Continue to Details →
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Sender & Recipient Details */}
          {step === 1 && (
            <div className="builder-section animate-in">
              <h2 className="builder-section-title">Sender & Recipient Information</h2>
              <p className="builder-section-desc">Review your sender contact details and recipient address info.</p>

              <h3 className="builder-sub-title">Your Contact Information (From CV)</h3>
              <div className="builder-grid-2">
                <div className="form-group">
                  <label className="form-label">Your Full Name</label>
                  <input
                    className="form-input"
                    value={formData.personalInfo.fullName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, fullName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Professional Title</label>
                  <input
                    className="form-input"
                    value={formData.personalInfo.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, title: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="builder-grid-3">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    value={formData.personalInfo.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, email: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={formData.personalInfo.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, phone: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    className="form-input"
                    value={formData.personalInfo.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, location: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <h3 className="builder-sub-title" style={{ marginTop: "1.5rem" }}>Recipient Address & Date</h3>
              <div className="builder-grid-2">
                <div className="form-group">
                  <label className="form-label">Letter Date</label>
                  <input
                    className="form-input"
                    value={formData.letterDetails.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        letterDetails: { ...formData.letterDetails, date: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hiring Manager Name</label>
                  <input
                    className="form-input"
                    value={formData.recipient.hiringManager}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipient: { ...formData.recipient, hiringManager: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="builder-grid-3">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    className="form-input"
                    value={formData.recipient.companyName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipient: { ...formData.recipient, companyName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department (Optional)</label>
                  <input
                    className="form-input"
                    value={formData.recipient.department || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipient: { ...formData.recipient, department: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Location / Address</label>
                  <input
                    className="form-input"
                    placeholder="e.g. San Francisco, CA"
                    value={formData.recipient.companyAddress || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipient: { ...formData.recipient, companyAddress: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="builder-nav">
                <button type="button" className="btn-secondary builder-nav-btn" onClick={() => setStep(0)}>
                  ← Back
                </button>
                <button type="button" className="btn-primary builder-nav-btn" onClick={() => setStep(2)}>
                  Continue to Letter Body →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Letter Content Paragraphs */}
          {step === 2 && (
            <div className="builder-section animate-in">
              <h2 className="builder-section-title">Letter Paragraphs</h2>
              <p className="builder-section-desc">Fine-tune the narrative flow, hook, and closing arguments.</p>

              <div className="form-group">
                <label className="form-label">Salutation / Greeting</label>
                <input
                  className="form-input"
                  value={formData.letterDetails.greeting}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      letterDetails: { ...formData.letterDetails, greeting: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Opening Paragraph (The Hook & Motivation)</label>
                <textarea
                  className="form-input form-textarea"
                  rows={4}
                  value={formData.letterDetails.openingParagraph}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      letterDetails: { ...formData.letterDetails, openingParagraph: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Body Paragraph 1 (Proven Experience & CV Metrics)</label>
                <textarea
                  className="form-input form-textarea"
                  rows={5}
                  value={formData.letterDetails.bodyParagraph1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      letterDetails: { ...formData.letterDetails, bodyParagraph1: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Body Paragraph 2 (Skills, Culture & Company Alignment)</label>
                <textarea
                  className="form-input form-textarea"
                  rows={5}
                  value={formData.letterDetails.bodyParagraph2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      letterDetails: { ...formData.letterDetails, bodyParagraph2: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Closing Paragraph (Call to Action & Appreciation)</label>
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  value={formData.letterDetails.closingParagraph}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      letterDetails: { ...formData.letterDetails, closingParagraph: e.target.value },
                    })
                  }
                />
              </div>

              <div className="builder-grid-2">
                <div className="form-group">
                  <label className="form-label">Sign-Off</label>
                  <input
                    className="form-input"
                    value={formData.letterDetails.signOff}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        letterDetails: { ...formData.letterDetails, signOff: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cover Letter Title / Document Name</label>
                  <input
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="builder-nav">
                <button type="button" className="btn-secondary builder-nav-btn" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="button" className="btn-primary builder-nav-btn" onClick={() => setStep(3)}>
                  Choose Template & Preview →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Template & Export */}
          {step === 3 && (
            <div className="builder-section animate-in">
              <h2 className="builder-section-title">Select Template Style</h2>
              <p className="builder-section-desc">Choose a design that coordinates with your CV.</p>

              <div className="template-selector-grid" style={{ marginBottom: "2rem" }}>
                {templateOptions.map((t) => (
                  <button
                    key={t.id}
                    className={`template-card ${formData.templateId === t.id ? "template-card-active" : ""}`}
                    onClick={() => setFormData({ ...formData, templateId: t.id })}
                    type="button"
                    style={{ padding: "1.25rem" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span className="template-card-name" style={{ fontSize: "1.05rem" }}>{t.name}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-primary)" }}>
                        {t.badge}
                      </span>
                    </div>
                    <span className="template-card-desc">{t.desc}</span>
                  </button>
                ))}
              </div>

              <div className="builder-nav" style={{ marginTop: 0 }}>
                <button type="button" className="btn-secondary builder-nav-btn" onClick={() => setStep(2)}>
                  ← Back to Content
                </button>
                <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-secondary builder-nav-btn"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                  >
                    {saving && <span className="spinner" />}
                    {saving ? "Saving..." : "💾 Save & Exit"}
                  </button>
                  <button
                    type="button"
                    className="btn-primary builder-nav-btn"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}
                    title="Capture rendered PDF snapshot and open in Merge PDF Studio with zero mismatch"
                  >
                    {saving ? <span className="spinner" /> : "✨"}
                    {saving ? "Creating PDF..." : "Save & Open in PDF Merger Studio"}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Live A4 Preview Sticky Sidebar */}
        <div className="builder-preview builder-preview-visible">
          <CoverLetterPreview data={formData} />
        </div>
      </div>

      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    </div>
  );
}
