"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CVData,
  Experience,
  Education,
  Skill,
  Language,
  CustomSection,
  emptyCV,
  dummyCVData,
  generateId,
} from "@/lib/types";
import TemplateSelector from "@/components/templates/TemplateSelector";
import CVPreview from "@/components/CVPreview";
import ApiKeyModal from "@/components/ApiKeyModal";
import { getStoredApiKey } from "@/lib/gemini-client";
import { captureHtmlToPdfBase64 } from "@/lib/pdfCapture";


const STEPS = ["Personal", "Experience", "Education", "Skills", "Custom", "Preview"];
const SKILL_LEVEL_NAMES = ["Beginner", "Elementary", "Intermediate", "Advanced", "Expert"];

// Helper for date range validation
function getDateValidationError(startDate?: string, endDate?: string, current?: boolean): string | null {
  if (current || !startDate || !endDate) return null;
  
  // Extract 4-digit years if present
  const startMatch = startDate.match(/\b(19|20)\d{2}\b/);
  const endMatch = endDate.match(/\b(19|20)\d{2}\b/);

  if (startMatch && endMatch) {
    const startYear = parseInt(startMatch[0], 10);
    const endYear = parseInt(endMatch[0], 10);
    if (endYear < startYear) {
      return `⚠️ End date year (${endYear}) is before start date year (${startYear}).`;
    }
  }

  // Try standard Date parsing as fallback
  const startD = Date.parse(startDate);
  const endD = Date.parse(endDate);
  if (!isNaN(startD) && !isNaN(endD) && endD < startD) {
    return "⚠️ End date cannot be before start date.";
  }

  return null;
}

export default function CVBuilder({
  initial,
  cvId,
}: {
  initial?: Omit<CVData, "userId">;
  cvId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<{ text: string; isError?: boolean } | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; undoAction?: () => void } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Omit<CVData, "userId">>(
    initial || { ...emptyCV }
  );

  const showToast = (message: string, undoAction?: () => void) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, undoAction });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPdfNotice({ text: "Please select a valid PDF file.", isError: true });
      return;
    }

    setParsingPdf(true);
    setPdfNotice({ text: "✨ Gemini AI is analyzing your resume PDF and extracting structured data..." });

    try {
      const formPayload = new FormData();
      formPayload.append("file", file);
      const customKey = getStoredApiKey();
      if (customKey) {
        formPayload.append("customApiKey", customKey);
      }

      const res = await fetch("/api/ai/parse-pdf", {
        method: "POST",
        body: formPayload,
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.error && json.error.toLowerCase().includes("api key")) {
          setApiKeyModalOpen(true);
        }
        throw new Error(json.error || "Failed to extract data from PDF.");
      }

      const parsed = json.data;
      if (parsed) {
        setFormData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            ...(parsed.personalInfo || {}),
          },
          experience: (parsed.experience || []).map((exp: any, i: number) => ({
            id: exp.id || generateId(),
            company: exp.company || "",
            position: exp.position || "",
            startDate: exp.startDate || "",
            endDate: exp.endDate || "",
            current: Boolean(exp.current),
            description: exp.description || "",
          })),
          education: (parsed.education || []).map((edu: any, i: number) => ({
            id: edu.id || generateId(),
            institution: edu.institution || "",
            degree: edu.degree || "",
            field: edu.field || "",
            startDate: edu.startDate || "",
            endDate: edu.endDate || "",
            description: edu.description || "",
          })),
          skills: (parsed.skills || []).map((sk: any, i: number) => ({
            id: sk.id || generateId(),
            name: sk.name || "",
            level: typeof sk.level === "number" ? sk.level : 4,
          })),
          languages: (parsed.languages || []).map((lang: any, i: number) => ({
            id: lang.id || generateId(),
            name: lang.name || "",
            proficiency: lang.proficiency || "Intermediate",
          })),
          customSections: (parsed.customSections || []).map((cs: any, i: number) => ({
            id: cs.id || generateId(),
            title: cs.title || "Additional Section",
            items: (cs.items || []).map((it: any, j: number) => ({
              id: it.id || generateId(),
              text: typeof it === "string" ? it : it.text || "",
            })),
          })),
        }));

        setPdfNotice({ text: `✓ Successfully extracted resume from "${file.name}" with Gemini AI!` });
        setStep(0);
        setTimeout(() => setPdfNotice(null), 6000);
      }
    } catch (err: any) {
      setPdfNotice({ text: err.message || "Failed to parse PDF resume.", isError: true });
    } finally {
      setParsingPdf(false);
    }
  };

  const updatePersonal = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  // ---- Experience helpers with Undo ----
  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { id: generateId(), company: "", position: "", startDate: "", endDate: "", current: false, description: "" },
      ],
    }));
  };
  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };
  const removeExperience = (id: string) => {
    const targetIdx = formData.experience.findIndex((e) => e.id === id);
    const targetItem = formData.experience[targetIdx];
    if (!targetItem) return;

    setFormData((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== id) }));
    showToast("Work experience entry removed", () => {
      setFormData((prev) => {
        const copy = [...prev.experience];
        copy.splice(targetIdx, 0, targetItem);
        return { ...prev, experience: copy };
      });
    });
  };

  // ---- Education helpers with Undo ----
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { id: generateId(), institution: "", degree: "", field: "", startDate: "", endDate: "", description: "" },
      ],
    }));
  };
  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };
  const removeEducation = (id: string) => {
    const targetIdx = formData.education.findIndex((e) => e.id === id);
    const targetItem = formData.education[targetIdx];
    if (!targetItem) return;

    setFormData((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));
    showToast("Education entry removed", () => {
      setFormData((prev) => {
        const copy = [...prev.education];
        copy.splice(targetIdx, 0, targetItem);
        return { ...prev, education: copy };
      });
    });
  };

  // ---- Skill helpers with Undo ----
  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { id: generateId(), name: "", level: 3 }],
    }));
  };
  const updateSkill = (id: string, field: keyof Skill, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };
  const removeSkill = (id: string) => {
    const targetIdx = formData.skills.findIndex((s) => s.id === id);
    const targetItem = formData.skills[targetIdx];
    if (!targetItem) return;

    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s.id !== id) }));
    showToast("Skill removed", () => {
      setFormData((prev) => {
        const copy = [...prev.skills];
        copy.splice(targetIdx, 0, targetItem);
        return { ...prev, skills: copy };
      });
    });
  };

  // ---- Language helpers with Undo ----
  const addLanguage = () => {
    setFormData((prev) => ({
      ...prev,
      languages: [...prev.languages, { id: generateId(), name: "", proficiency: "Intermediate" as const }],
    }));
  };
  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    }));
  };
  const removeLanguage = (id: string) => {
    const targetIdx = formData.languages.findIndex((l) => l.id === id);
    const targetItem = formData.languages[targetIdx];
    if (!targetItem) return;

    setFormData((prev) => ({ ...prev, languages: prev.languages.filter((l) => l.id !== id) }));
    showToast("Language removed", () => {
      setFormData((prev) => {
        const copy = [...prev.languages];
        copy.splice(targetIdx, 0, targetItem);
        return { ...prev, languages: copy };
      });
    });
  };

  // ---- Custom Section helpers with Undo ----
  const addCustomSection = () => {
    setFormData((prev) => ({
      ...prev,
      customSections: [
        ...prev.customSections,
        { id: generateId(), title: "", items: [{ id: generateId(), text: "" }] },
      ],
    }));
  };
  const addCustomSectionWithTitle = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      customSections: [
        ...prev.customSections,
        { id: generateId(), title, items: [{ id: generateId(), text: "" }] },
      ],
    }));
  };
  const updateCustomSectionTitle = (sectionId: string, title: string) => {
    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((s) =>
        s.id === sectionId ? { ...s, title } : s
      ),
    }));
  };
  const removeCustomSection = (sectionId: string) => {
    const targetIdx = formData.customSections.findIndex((s) => s.id === sectionId);
    const targetItem = formData.customSections[targetIdx];
    if (!targetItem) return;

    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((s) => s.id !== sectionId),
    }));
    showToast(`Custom section "${targetItem.title || 'Untitled'}" removed`, () => {
      setFormData((prev) => {
        const copy = [...prev.customSections];
        copy.splice(targetIdx, 0, targetItem);
        return { ...prev, customSections: copy };
      });
    });
  };

  const addCustomSectionItem = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((s) =>
        s.id === sectionId
          ? { ...s, items: [...s.items, { id: generateId(), text: "" }] }
          : s
      ),
    }));
  };
  const updateCustomSectionItem = (sectionId: string, itemId: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, text } : i)) }
          : s
      ),
    }));
  };
  const removeCustomSectionItem = (sectionId: string, itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      customSections: prev.customSections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
          : s
      ),
    }));
  };

  const fillDummyData = () => {
    const sample = {
      templateId: formData.templateId || "modern",
      personalInfo: { ...dummyCVData.personalInfo },
      experience: dummyCVData.experience.map((exp) => ({ ...exp, id: generateId() })),
      education: dummyCVData.education.map((edu) => ({ ...edu, id: generateId() })),
      skills: dummyCVData.skills.map((skill) => ({ ...skill, id: generateId() })),
      languages: dummyCVData.languages.map((lang) => ({ ...lang, id: generateId() })),
      customSections: dummyCVData.customSections.map((sec) => ({
        ...sec,
        id: generateId(),
        items: sec.items.map((item) => ({ ...item, id: generateId() })),
      })),
    };
    setFormData(sample);
    showToast("Loaded sample CV data");
  };

  const executeClearAllData = () => {
    setFormData({ ...emptyCV, templateId: formData.templateId });
    setResetModalOpen(false);
    showToast("CV data cleared");
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
    setSaveError(null);
    try {
      let pdfBase64: string | undefined;
      const previewEl = document.querySelector(".cv-preview-page") as HTMLElement;
      if (previewEl) {
        const base64 = await captureHtmlToPdfBase64(previewEl);
        if (base64) pdfBase64 = base64;
      }

      const payload = {
        ...formData,
        pdfBase64,
      };

      const url = cvId ? `/api/cv/${cvId}` : "/api/cv";
      const method = cvId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned error (${res.status})`);
      }

      const resData = await res.json().catch(() => ({}));
      const savedId = cvId || resData._id;

      // Automatically upload generated PDF to Document Vault under category "CV"
      if (pdfBase64) {
        try {
          const blob = base64ToBlob(pdfBase64);
          const fullName = formData.personalInfo.fullName || "Resume";
          const docFormData = new FormData();
          docFormData.append("file", blob, `${fullName}_CV.pdf`);
          docFormData.append("title", `Resume — ${fullName}`);
          docFormData.append("category", "CV");
          await fetch("/api/documents", { method: "POST", body: docFormData });
        } catch (uploadErr) {
          console.error("Failed to upload CV PDF to document store:", uploadErr);
        }
      }

      if (redirectToMerger && savedId) {
        router.push(`/dashboard/documents?selectedCvId=${savedId}`);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      console.error("Save failed:", err);
      setSaveError(err.message || "Failed to save CV data to server. Please try again.");
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="builder-layout">
      {/* Top Toolbar */}
      <div className="builder-top-toolbar">
        <div className="builder-top-toolbar-left">
          <span className="builder-title-badge">
            {cvId ? "Editing CV" : "New CV"}
          </span>
          <span className="builder-current-step-label">
            Step {step + 1} of {STEPS.length}: <strong>{STEPS[step]}</strong>
          </span>
        </div>
        <div className="builder-top-toolbar-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePdfFileChange}
            accept="application/pdf"
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="btn-dummy-data"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsingPdf}
            title="Upload an existing resume PDF to auto-fill all form fields with Gemini AI"
            style={{ borderColor: "rgba(168, 85, 247, 0.4)", background: "rgba(168, 85, 247, 0.12)", color: "#e9d5ff" }}
          >
            {parsingPdf ? <span className="spinner" /> : "📄"}
            {parsingPdf ? "Gemini Parsing PDF..." : "Auto-Fill from PDF"}
          </button>
          <button
            type="button"
            className="btn-dummy-data"
            onClick={fillDummyData}
            title="Populate all fields with comprehensive sample CV data"
          >
            ⚡ Sample Data
          </button>
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
            className="btn-clear-data"
            onClick={() => setResetModalOpen(true)}
            title="Reset form and clear all fields"
          >
            Reset
          </button>
        </div>
      </div>

      {saveError && (
        <div
          className="glass-card"
          style={{
            padding: "0.85rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderColor: "rgba(251, 113, 133, 0.4)",
            background: "rgba(251, 113, 133, 0.12)",
            color: "var(--error)",
            fontSize: "0.88rem",
            fontWeight: 500,
          }}
        >
          <span>❌ <strong>Save Error:</strong> {saveError}</span>
          <button
            type="button"
            onClick={() => handleSave(false)}

            className="btn-primary"
            style={{ padding: "0.3rem 0.8rem", fontSize: "0.78rem", width: "auto" }}
          >
            Retry Save
          </button>
        </div>
      )}

      {pdfNotice && (
        <div
          className="glass-card"
          style={{
            padding: "0.85rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderColor: pdfNotice.isError ? "rgba(251, 113, 133, 0.35)" : "rgba(168, 85, 247, 0.35)",
            background: pdfNotice.isError ? "rgba(251, 113, 133, 0.1)" : "rgba(168, 85, 247, 0.1)",
            color: pdfNotice.isError ? "var(--error)" : "#e9d5ff",
            fontSize: "0.88rem",
            fontWeight: 500,
          }}
        >
          <span>{pdfNotice.text}</span>
          <button
            type="button"
            onClick={() => setPdfNotice(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1rem" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Progress */}
      <div className="builder-progress">
        {STEPS.map((label, i) => (
          <button
            key={label}
            data-step-index={i}
            className={`builder-step ${i === step ? "builder-step-active" : ""} ${i < step ? "builder-step-done" : ""}`}
            onClick={() => setStep(i)}
            type="button"
          >
            <span className="builder-step-num">{i < step ? "✓" : i + 1}</span>
            <span className="builder-step-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="builder-body">
        {/* Form Area */}
        <div className="builder-form-area">
          {/* Step 0: Personal */}
          {step === 0 && (
            <div className="builder-section animate-in">
              {!formData.personalInfo.fullName && (
                <div className="dummy-banner glass-card">
                  <div className="dummy-banner-text">
                    <span style={{ fontSize: "1.2rem", marginRight: "0.4rem" }}>✨</span>
                    <span>
                      <strong>Have an existing CV?</strong> Upload your PDF to let Gemini AI extract your experience, or load sample data.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn-primary dummy-banner-btn"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)" }}
                    >
                      📄 Upload Resume PDF
                    </button>
                    <button type="button" className="btn-secondary dummy-banner-btn" onClick={fillDummyData}>
                      Load Sample Data
                    </button>
                  </div>
                </div>
              )}

              <h2 className="builder-section-title">Personal Information</h2>
              <p className="builder-section-desc">Tell us about yourself</p>
              <div className="builder-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="John Doe" value={formData.personalInfo.fullName} onChange={(e) => updatePersonal("fullName", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Professional Title</label>
                  <input className="form-input" placeholder="Senior Software Engineer" value={formData.personalInfo.title} onChange={(e) => updatePersonal("title", e.target.value)} />
                </div>
              </div>
              <div className="builder-grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="john@example.com" value={formData.personalInfo.email} onChange={(e) => updatePersonal("email", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="+1 (555) 123-4567" value={formData.personalInfo.phone} onChange={(e) => updatePersonal("phone", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="New York, NY" value={formData.personalInfo.location} onChange={(e) => updatePersonal("location", e.target.value)} />
              </div>
              <div className="builder-grid-2">
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-input" placeholder="https://johndoe.com" value={formData.personalInfo.website} onChange={(e) => updatePersonal("website", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">LinkedIn</label>
                  <input className="form-input" placeholder="linkedin.com/in/johndoe" value={formData.personalInfo.linkedin} onChange={(e) => updatePersonal("linkedin", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Professional Summary</label>
                <textarea className="form-input form-textarea" placeholder="A brief description of your professional background and goals..." rows={4} value={formData.personalInfo.summary} onChange={(e) => updatePersonal("summary", e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 1: Experience */}
          {step === 1 && (
            <div className="builder-section animate-in">
              <h2 className="builder-section-title">Work Experience</h2>
              <p className="builder-section-desc">Add your professional experience</p>
              {formData.experience.map((exp, idx) => {
                const dateErr = getDateValidationError(exp.startDate, exp.endDate, exp.current);
                return (
                  <div key={exp.id} className="builder-entry glass-card">
                    <div className="builder-entry-header">
                      <span className="builder-entry-num">#{idx + 1}</span>
                      <button className="builder-entry-remove" onClick={() => removeExperience(exp.id)} type="button">Remove</button>
                    </div>
                    <div className="builder-grid-2">
                      <div className="form-group">
                        <label className="form-label">Position</label>
                        <input className="form-input" placeholder="Software Engineer" value={exp.position} onChange={(e) => updateExperience(exp.id, "position", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Company</label>
                        <input className="form-input" placeholder="Google" value={exp.company} onChange={(e) => updateExperience(exp.id, "company", e.target.value)} />
                      </div>
                    </div>
                    <div className="builder-grid-3">
                      <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input className="form-input" placeholder="Jan 2020" value={exp.startDate} onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Date</label>
                        <input className="form-input" placeholder="Dec 2023" disabled={exp.current} value={exp.current ? "Present" : exp.endDate} onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">&nbsp;</label>
                        <label className="form-checkbox">
                          <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(exp.id, "current", e.target.checked)} />
                          <span>Currently working</span>
                        </label>
                      </div>
                    </div>
                    {dateErr && (
                      <div className="date-warning-badge">
                        {dateErr}
                      </div>
                    )}
                    <div className="form-group" style={{ marginTop: "0.85rem" }}>
                      <label className="form-label">Description</label>
                      <textarea className="form-input form-textarea" rows={3} placeholder="Describe your responsibilities and achievements..." value={exp.description} onChange={(e) => updateExperience(exp.id, "description", e.target.value)} />
                    </div>
                  </div>
                );
              })}
              <button className="builder-add-btn" onClick={addExperience} type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Experience
              </button>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div className="builder-section animate-in">
              <h2 className="builder-section-title">Education</h2>
              <p className="builder-section-desc">Add your educational background</p>
              {formData.education.map((edu, idx) => {
                const dateErr = getDateValidationError(edu.startDate, edu.endDate);
                return (
                  <div key={edu.id} className="builder-entry glass-card">
                    <div className="builder-entry-header">
                      <span className="builder-entry-num">#{idx + 1}</span>
                      <button className="builder-entry-remove" onClick={() => removeEducation(edu.id)} type="button">Remove</button>
                    </div>
                    <div className="builder-grid-2">
                      <div className="form-group">
                        <label className="form-label">Degree</label>
                        <input className="form-input" placeholder="Bachelor of Science" value={edu.degree} onChange={(e) => updateEducation(edu.id, "degree", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Field of Study</label>
                        <input className="form-input" placeholder="Computer Science" value={edu.field} onChange={(e) => updateEducation(edu.id, "field", e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Institution</label>
                      <input className="form-input" placeholder="MIT" value={edu.institution} onChange={(e) => updateEducation(edu.id, "institution", e.target.value)} />
                    </div>
                    <div className="builder-grid-2">
                      <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input className="form-input" placeholder="Sep 2016" value={edu.startDate} onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Date</label>
                        <input className="form-input" placeholder="Jun 2020" value={edu.endDate} onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)} />
                      </div>
                    </div>
                    {dateErr && (
                      <div className="date-warning-badge">
                        {dateErr}
                      </div>
                    )}
                    <div className="form-group" style={{ marginTop: "0.85rem" }}>
                      <label className="form-label">Description (optional)</label>
                      <textarea className="form-input form-textarea" rows={2} placeholder="Honors, GPA, relevant coursework..." value={edu.description} onChange={(e) => updateEducation(edu.id, "description", e.target.value)} />
                    </div>
                  </div>
                );
              })}
              <button className="builder-add-btn" onClick={addEducation} type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Education
              </button>
            </div>
          )}

          {/* Step 3: Skills & Languages */}
          {step === 3 && (
            <div className="builder-section animate-in">
              <h2 className="builder-section-title">Skills & Languages</h2>
              <p className="builder-section-desc">Highlight what you know</p>

              <h3 className="builder-sub-title">Skills</h3>
              {formData.skills.map((skill) => (
                <div key={skill.id} className="builder-inline-entry">
                  <input className="form-input builder-inline-input" placeholder="e.g. React, Python" value={skill.name} onChange={(e) => updateSkill(skill.id, "name", e.target.value)} />
                  <div className="builder-level-picker">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" className={`builder-level-dot ${skill.level >= n ? "builder-level-dot-active" : ""}`} onClick={() => updateSkill(skill.id, "level", n)} title={`Level ${n}: ${SKILL_LEVEL_NAMES[n - 1]}`} />
                    ))}
                  </div>
                  <span className="skill-level-tag">
                    {SKILL_LEVEL_NAMES[Math.max(0, Math.min(4, skill.level - 1))]}
                  </span>
                  <button className="builder-inline-remove" onClick={() => removeSkill(skill.id)} type="button">×</button>
                </div>
              ))}
              <button className="builder-add-btn builder-add-btn-sm" onClick={addSkill} type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Skill
              </button>

              <h3 className="builder-sub-title" style={{ marginTop: "2rem" }}>Languages</h3>
              {formData.languages.map((lang) => (
                <div key={lang.id} className="builder-inline-entry">
                  <input className="form-input builder-inline-input" placeholder="e.g. English" value={lang.name} onChange={(e) => updateLanguage(lang.id, "name", e.target.value)} />
                  <select className="form-input builder-inline-select" value={lang.proficiency} onChange={(e) => updateLanguage(lang.id, "proficiency", e.target.value)}>
                    <option>Beginner</option>
                    <option>Elementary</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Native</option>
                  </select>
                  <button className="builder-inline-remove" onClick={() => removeLanguage(lang.id)} type="button">×</button>
                </div>
              ))}
              <button className="builder-add-btn builder-add-btn-sm" onClick={addLanguage} type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Language
              </button>
            </div>
          )}

          {/* Step 4: Custom Sections */}
          {step === 4 && (
            <div className="builder-section animate-in">
              <h2 className="builder-section-title">Custom Sections</h2>
              <p className="builder-section-desc">Add extra sections like Hobbies, Awards, Certifications, Projects, Volunteering — anything you want!</p>

              <div className="custom-section-quick-add" style={{ marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginRight: "0.5rem" }}>
                  Quick Add:
                </span>
                <div className="custom-section-suggestions" style={{ display: "inline-flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {[
                    { label: "🏆 Awards", title: "Awards & Honors" },
                    { label: "🎯 Hobbies", title: "Hobbies & Interests" },
                    { label: "📜 Certifications", title: "Certifications" },
                    { label: "💼 Projects", title: "Projects" },
                    { label: "🤝 Volunteering", title: "Volunteering" },
                    { label: "📖 Publications", title: "Publications" },
                  ].map((s) => (
                    <button
                      key={s.title}
                      type="button"
                      className="custom-section-suggestion-tag"
                      onClick={() => addCustomSectionWithTitle(s.title)}
                    >
                      + {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.customSections.map((section, sIdx) => (
                <div key={section.id} className="builder-entry glass-card custom-section-card">
                  <div className="builder-entry-header">
                    <span className="builder-entry-num">Section #{sIdx + 1}</span>
                    <button className="builder-entry-remove" onClick={() => removeCustomSection(section.id)} type="button">Remove Section</button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Section Title</label>
                    <input
                      className="form-input custom-section-title-input"
                      placeholder="e.g. Hobbies, Awards, Certifications, Projects..."
                      value={section.title}
                      onChange={(e) => updateCustomSectionTitle(section.id, e.target.value)}
                    />
                  </div>

                  <label className="form-label" style={{ marginBottom: "0.5rem" }}>Answers / Details / Items</label>
                  {section.items.map((item, iIdx) => (
                    <div key={item.id} className="builder-inline-entry">
                      <span className="custom-item-num">{iIdx + 1}.</span>
                      <input
                        className="form-input builder-inline-input"
                        placeholder="e.g. Winner of 2024 National Hackathon or Photography & Chess..."
                        value={item.text}
                        onChange={(e) => updateCustomSectionItem(section.id, item.id, e.target.value)}
                      />
                      <button className="builder-inline-remove" onClick={() => removeCustomSectionItem(section.id, item.id)} type="button">×</button>
                    </div>
                  ))}
                  <button className="builder-add-btn builder-add-btn-sm" onClick={() => addCustomSectionItem(section.id)} type="button" style={{ marginTop: "0.25rem" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Another Item / Answer
                  </button>
                </div>
              ))}

              <button className="builder-add-btn" onClick={addCustomSection} type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                + Add Custom Section (Custom Title & Answer)
              </button>
            </div>
          )}

          {/* Step 5: Preview + Template */}
          {step === 5 && (
            <div className="builder-section animate-in">
              <TemplateSelector
                selected={formData.templateId}
                onSelect={(id) => setFormData((prev) => ({ ...prev, templateId: id }))}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="builder-nav">
            {step > 0 && (
              <button className="btn-secondary builder-nav-btn" onClick={() => setStep(step - 1)} type="button">← Back</button>
            )}
            <div style={{ flex: 1 }} />
            {step < STEPS.length - 1 && (
              <button className="btn-primary builder-nav-btn" onClick={() => setStep(step + 1)} type="button">Next →</button>
            )}
            {step === STEPS.length - 1 && (
              <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                <button className="btn-secondary builder-nav-btn" onClick={() => handleSave(false)} disabled={saving} type="button">
                  {saving && <span className="spinner" />}
                  {saving ? "Saving..." : cvId ? "💾 Update CV" : "💾 Save CV"}
                </button>
                <button
                  className="btn-primary builder-nav-btn"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  type="button"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}
                  title="Capture rendered PDF snapshot and open in Merge PDF Studio with zero mismatch"
                >
                  {saving ? <span className="spinner" /> : "✨"}
                  {saving ? "Creating PDF..." : "Save & Open in PDF Merger Studio"}
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Live Preview (visible on last step or larger screens) */}
        <div className={`builder-preview ${step === 5 ? "builder-preview-visible" : ""}`}>
          <CVPreview data={{ ...formData, userId: "" }} />
        </div>
      </div>

      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="reset-modal-overlay" onClick={() => setResetModalOpen(false)}>
          <div className="reset-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="reset-modal-icon">⚠️</div>
            <h3 className="reset-modal-title">Clear all CV fields?</h3>
            <p className="reset-modal-desc">
              This action will reset your personal info, experience, education, skills, and custom sections. This cannot be undone once confirmed.
            </p>
            <div className="reset-modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setResetModalOpen(false)}
                style={{ width: "auto", padding: "0.55rem 1.1rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={executeClearAllData}
                style={{ width: "auto", padding: "0.55rem 1.1rem", background: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)", borderColor: "#fb7185" }}
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Undo Toast */}
      {toast && (
        <div className="toast-container">
          <div className="toast-card">
            <span>✨ {toast.message}</span>
            {toast.undoAction && (
              <button
                type="button"
                className="toast-undo-btn"
                onClick={() => {
                  toast.undoAction?.();
                  setToast(null);
                }}
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
