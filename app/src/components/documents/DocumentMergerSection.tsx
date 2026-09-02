"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UserDocument, CVData, CoverLetterData } from "@/lib/types";
import CVPreview from "@/components/CVPreview";
import CoverLetterPreview from "@/components/cover-letter/CoverLetterPreview";
import { captureHtmlToPdfBase64 } from "@/lib/pdfCapture";

interface CVSummary {
  _id: string;
  personalInfo: { fullName: string; title: string };
  templateId: string;
  updatedAt: string;
}

interface CoverLetterSummary {
  _id: string;
  title: string;
  templateId?: string;
  recipient: { companyName: string; jobTitle: string };
  updatedAt: string;
}

interface Props {
  cvs: CVSummary[];
  coverLetters: CoverLetterSummary[];
  documents: UserDocument[];
}

export interface OrderedSequenceItem {
  id: string;
  type: "cv" | "cover_letter" | "document";
  title: string;
  subtitle: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
}

export default function DocumentMergerSection({ cvs, coverLetters, documents }: Props) {
  const searchParams = useSearchParams();
  const queryCvId = searchParams?.get("selectedCvId");
  const queryLetterId = searchParams?.get("selectedLetterId");

  const [selectedCvId, setSelectedCvId] = useState<string>(queryCvId || cvs[0]?._id || "");
  const [selectedLetterId, setSelectedLetterId] = useState<string>(queryLetterId || coverLetters[0]?._id || "");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(documents.map((d) => d._id));
  const [orderedItems, setOrderedItems] = useState<OrderedSequenceItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [fullCvData, setFullCvData] = useState<CVData | null>(null);
  const [fullLetterData, setFullLetterData] = useState<CoverLetterData | null>(null);

  const [previewSingleDoc, setPreviewSingleDoc] = useState<UserDocument | null>(null);
  const [docRotations, setDocRotations] = useState<Record<string, number>>({});

  const handleRotateDoc = async (e: React.MouseEvent, docId: string, currentRotation: number = 0, delta: number = 90) => {
    e.stopPropagation();
    e.preventDefault();
    const nextRotation = (currentRotation + delta + 360) % 360;
    setDocRotations((prev) => ({ ...prev, [docId]: nextRotation }));
    try {
      await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotation: nextRotation }),
      });
    } catch (err) {
      console.error("Failed to update document rotation:", err);
    }
  };



  useEffect(() => {
    if (queryCvId && cvs.some((c) => c._id === queryCvId)) {
      setSelectedCvId(queryCvId);
    }
    if (queryLetterId && coverLetters.some((l) => l._id === queryLetterId)) {
      setSelectedLetterId(queryLetterId);
    }
  }, [queryCvId, queryLetterId, cvs, coverLetters]);


  // Fetch full CVData when selectedCvId changes
  useEffect(() => {
    if (!selectedCvId) {
      setFullCvData(null);
      return;
    }
    fetch(`/api/cv/${selectedCvId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setFullCvData(data);
      })
      .catch(() => {});
  }, [selectedCvId]);

  // Fetch full CoverLetterData when selectedLetterId changes
  useEffect(() => {
    if (!selectedLetterId) {
      setFullLetterData(null);
      return;
    }
    fetch(`/api/cover-letter/${selectedLetterId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setFullLetterData(data);
      })
      .catch(() => {});
  }, [selectedLetterId]);

  // Helper to capture live DOM preview snapshot
  const getRenderedSnapshots = async () => {
    let cvPdfBase64: string | undefined;
    let letterPdfBase64: string | undefined;

    const cvEl = document.querySelector("#merger-cv-preview-container .cv-preview-page") as HTMLElement;
    if (cvEl) {
      const b64 = await captureHtmlToPdfBase64(cvEl);
      if (b64) cvPdfBase64 = b64;
    }

    const clEl = (document.querySelector("#merger-cl-preview-container .cl-preview-page") as HTMLElement) || (document.querySelector("#merger-cl-preview-container .cv-preview-page") as HTMLElement);
    if (clEl) {
      const b64 = await captureHtmlToPdfBase64(clEl);
      if (b64) letterPdfBase64 = b64;
    }

    return { cvPdfBase64, letterPdfBase64 };
  };

  // Sync selected items with orderedItems state preserving user custom order
  useEffect(() => {
    setOrderedItems((prevItems) => {
      const activeMap = new Map(prevItems.map((item) => [`${item.type}_${item.id}`, item]));
      const newSequence: OrderedSequenceItem[] = [];

      const getTplLabel = (tId?: string) => {
        if (!tId) return "Modern Template";
        return `${tId.charAt(0).toUpperCase() + tId.slice(1)} Template`;
      };

      if (selectedCvId) {
        const cv = cvs.find((c) => c._id === selectedCvId);
        if (cv) {
          const key = `cv_${cv._id}`;
          const existing = activeMap.get(key);
          const tLabel = getTplLabel(cv.templateId);
          newSequence.push(
            existing || {
              id: cv._id,
              type: "cv",
              title: cv.personalInfo?.fullName ? `Resume — ${cv.personalInfo.fullName}` : "Resume / CV",
              subtitle: `${tLabel} • ${cv.personalInfo?.title || "Professional Profile"}`,
              borderColor: "#6366f1",
              badgeBg: "rgba(99, 102, 241, 0.2)",
              badgeColor: "#a5b4fc",
            }
          );
        }
      }

      if (selectedLetterId) {
        const letter = coverLetters.find((l) => l._id === selectedLetterId);
        if (letter) {
          const key = `cover_letter_${letter._id}`;
          const existing = activeMap.get(key);
          const tLabel = getTplLabel(letter.templateId);
          newSequence.push(
            existing || {
              id: letter._id,
              type: "cover_letter",
              title: letter.recipient?.companyName ? `Cover Letter — ${letter.recipient.companyName}` : letter.title,
              subtitle: `${tLabel} • ${letter.recipient?.jobTitle || "Job Application"}`,
              borderColor: "#f59e0b",
              badgeBg: "rgba(245, 158, 11, 0.2)",
              badgeColor: "#fcd34d",
            }
          );
        }
      }

      documents.forEach((doc) => {
        if (selectedDocIds.includes(doc._id)) {
          const key = `document_${doc._id}`;
          const existing = activeMap.get(key);
          const storeName = doc.customCategory || doc.category || "Attachment";
          newSequence.push(
            existing || {
              id: doc._id,
              type: "document",
              title: doc.title,
              subtitle: `${storeName} Store • ${doc.fileType.toUpperCase()}`,
              borderColor: "#10b981",
              badgeBg: "rgba(16, 185, 129, 0.2)",
              badgeColor: "#6ee7b7",
            }
          );
        }
      });

      // Keep only items that are still selected
      return newSequence.filter(item => 
        (item.type === 'cv' && selectedCvId === item.id) ||
        (item.type === 'cover_letter' && selectedLetterId === item.id) ||
        (item.type === 'document' && selectedDocIds.includes(item.id))
      );
    });
  }, [selectedCvId, selectedLetterId, selectedDocIds, cvs, coverLetters, documents]);

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const selectAllDocs = () => {
    setSelectedDocIds(documents.map((d) => d._id));
  };

  const deselectAllDocs = () => {
    setSelectedDocIds([]);
  };


  const moveItemUp = (index: number) => {
    if (index === 0) return;
    setOrderedItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const moveItemDown = (index: number) => {
    if (index === orderedItems.length - 1) return;
    setOrderedItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const removeItem = (item: OrderedSequenceItem) => {
    if (item.type === "cv") setSelectedCvId("");
    else if (item.type === "cover_letter") setSelectedLetterId("");
    else if (item.type === "document") {
      setSelectedDocIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setOrderedItems((prev) => {
      const next = [...prev];
      const [draggedItem] = next.splice(draggedIndex, 1);
      next.splice(index, 0, draggedItem);
      return next;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (orderedItems.length === 0) {
      setErrorMsg("Please select at least one item (CV, Cover Letter, or certificate document) to merge.");
      return;
    }

    setIsMerging(true);
    setErrorMsg("");

    try {
      const payloadItems = orderedItems.map((item) => ({
        id: item.id,
        type: item.type,
      }));

      const { cvPdfBase64, letterPdfBase64 } = await getRenderedSnapshots();

      const res = await fetch("/api/documents/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedItems: payloadItems,
          cvId: selectedCvId || undefined,
          coverLetterId: selectedLetterId || undefined,
          documentIds: selectedDocIds,
          cvPdfBase64,
          letterPdfBase64,
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
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate merged PDF.");
    } finally {
      setIsMerging(false);
    }
  };

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handlePreviewMergedPdf = async () => {
    if (orderedItems.length === 0) {
      setErrorMsg("Please select at least one item (CV, Cover Letter, or certificate document) to merge.");
      return;
    }

    setIsPreviewing(true);
    setErrorMsg("");

    try {
      const payloadItems = orderedItems.map((item) => ({
        id: item.id,
        type: item.type,
      }));

      const { cvPdfBase64, letterPdfBase64 } = await getRenderedSnapshots();

      const res = await fetch("/api/documents/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedItems: payloadItems,
          cvId: selectedCvId || undefined,
          coverLetterId: selectedLetterId || undefined,
          documentIds: selectedDocIds,
          cvPdfBase64,
          letterPdfBase64,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate merged PDF preview");
      }

      const blob = await res.blob();
      const pdfBlobUrl = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(pdfBlobUrl);
      setShowPreviewModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate merged PDF preview.");
    } finally {
      setIsPreviewing(false);
    }
  };


  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Workspace Header */}
      <div className="glass-card" style={{ padding: "1.75rem", marginBottom: "1.75rem", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(52, 211, 153, 0.08) 100%)", border: "1px solid rgba(99, 102, 241, 0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.25rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "20px", background: "rgba(99, 102, 241, 0.2)", color: "#c7d2fe", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              <span>✨ Dedicated Studio</span>
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0, color: "white" }}>
              Merge PDF Studio & Custom Sequence Reorder
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "0.35rem", maxWidth: 620 }}>
              Select your CV, Cover Letter, and Educational/Reference Documents, then drag or use <strong>↑ Move Up / ↓ Move Down</strong> to rearrange the exact page sequence. Preview full-screen before downloading.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="btn-secondary"
              onClick={handlePreviewMergedPdf}
              disabled={isPreviewing || isMerging || orderedItems.length === 0}
              style={{ width: "auto", padding: "0.75rem 1.25rem", fontSize: "0.88rem", borderColor: "rgba(99, 102, 241, 0.4)", background: "rgba(99, 102, 241, 0.12)", color: "#c7d2fe" }}
            >
              {isPreviewing ? <span className="spinner" /> : "👁️ Preview Merged PDF"}
            </button>

            <button
              className="btn-primary"
              onClick={handleMerge}
              disabled={isMerging || isPreviewing || orderedItems.length === 0}
              style={{ width: "auto", padding: "0.75rem 1.5rem", fontSize: "0.88rem" }}
            >
              {isMerging ? <span className="spinner" /> : "⚡ Download Combined PDF"}
            </button>
          </div>
        </div>
      </div>


      {errorMsg && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "0.85rem 1.1rem", borderRadius: "10px", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
          {errorMsg}
        </div>
      )}

      {/* Grid Workspace Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "1.5rem" }}>
        
        {/* Column 1: Document Vault Stores Selection */}
        <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#34d399", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <span>📂</span> 1. Select Resumes & Portfolio Documents ({selectedDocIds.length}/{documents.length})
            </h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={selectAllDocs} type="button" style={{ background: "none", border: "none", color: "#a5b4fc", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600 }}>
                Select All
              </button>
              <span style={{ color: "var(--text-tertiary)", fontSize: "0.78rem" }}>|</span>
              <button onClick={deselectAllDocs} type="button" style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "0.78rem", cursor: "pointer" }}>
                Clear
              </button>
            </div>
          </div>


          {documents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-tertiary)" }}>
              <p>No documents stored yet.</p>
              <span style={{ fontSize: "0.8rem" }}>Upload Grade 8, 10, 12, Uni certificates, or custom recommendation letters in the Document Vault tab.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1, maxHeight: 440 }}>
              {Array.from(
                documents.reduce((map, doc) => {
                  const key = doc.category === "Custom" ? doc.customCategory || "Custom Category" : doc.category;
                  if (!map.has(key)) map.set(key, []);
                  map.get(key)!.push(doc);
                  return map;
                }, new Map<string, UserDocument[]>()).entries()
              ).map(([catName, catDocs]) => {
                const allCatSelected = catDocs.every((d) => selectedDocIds.includes(d._id));
                const toggleCatGroup = () => {
                  const catIds = catDocs.map((d) => d._id);
                  if (allCatSelected) {
                    setSelectedDocIds((prev) => prev.filter((id) => !catIds.includes(id)));
                  } else {
                    setSelectedDocIds((prev) => Array.from(new Set([...prev, ...catIds])));
                  }
                };

                return (
                  <div key={catName} style={{ background: "rgba(15, 23, 42, 0.4)", borderRadius: "8px", padding: "0.75rem", border: "1px solid var(--border-default)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a5b4fc" }}>
                        📁 {catName} ({catDocs.length} {catDocs.length === 1 ? "file" : "files"})
                      </span>
                      <button
                        type="button"
                        onClick={toggleCatGroup}
                        style={{ background: "none", border: "none", color: allCatSelected ? "#34d399" : "var(--text-tertiary)", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600 }}
                      >
                        {allCatSelected ? "✓ Deselect Store" : "+ Select Entire Store"}
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {catDocs.map((doc) => {
                        const isSelected = selectedDocIds.includes(doc._id);
                        const effectiveRotation = docRotations[doc._id] !== undefined ? docRotations[doc._id] : (doc.rotation || 0);

                        return (
                          <label
                            key={doc._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.55rem 0.75rem",
                              borderRadius: "6px",
                              background: isSelected ? "rgba(16, 185, 129, 0.15)" : "rgba(30, 41, 59, 0.6)",
                              border: isSelected ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.05)",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDocSelection(doc._id)}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "white", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span>{doc.title}</span>
                                {effectiveRotation > 0 && (
                                  <span style={{ fontSize: "0.7rem", background: "rgba(245, 158, 11, 0.2)", color: "#fcd34d", padding: "0.1rem 0.45rem", borderRadius: "10px", fontWeight: 600 }}>
                                    🔄 {effectiveRotation}° Rotated
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "0.74rem", color: "var(--text-tertiary)" }}>
                                {doc.fileName} • {doc.fileType.toUpperCase()}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setPreviewSingleDoc(doc);
                                }}
                                title="Inspect & preview document"
                                style={{
                                  background: "rgba(52, 211, 153, 0.15)",
                                  border: "1px solid rgba(52, 211, 153, 0.35)",
                                  color: "#6ee7b7",
                                  fontSize: "0.72rem",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                👁️ Preview
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRotateDoc(e, doc._id, effectiveRotation)}
                                title="Rotate page 90 degrees clockwise"
                                style={{
                                  background: "rgba(99, 102, 241, 0.15)",
                                  border: "1px solid rgba(99, 102, 241, 0.35)",
                                  color: "#a5b4fc",
                                  fontSize: "0.72rem",
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                🔄 {effectiveRotation > 0 ? `${effectiveRotation}°` : "Rotate"}
                              </button>
                            </div>

                          </label>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Live Rearrangeable Page Sequence (Drag & Drop or Move Up/Down) */}
        <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "rgba(15, 23, 42, 0.85)" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>📦</span> PDF Page Order ({orderedItems.length})
              </h3>
              <span style={{ fontSize: "0.72rem", color: "#a5b4fc", background: "rgba(99, 102, 241, 0.15)", padding: "0.2rem 0.5rem", borderRadius: "10px" }}>
                Drag or use ↑ ↓
              </span>
            </div>

            {orderedItems.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                No items selected yet. Check items on the left to build your portfolio.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", maxHeight: 420, overflowY: "auto", paddingRight: "0.25rem" }}>
                {orderedItems.map((item, index) => (
                  <div
                    key={`${item.type}_${item.id}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      background: "rgba(30, 41, 59, 0.8)",
                      border: `1px solid ${item.borderColor}`,
                      cursor: "grab",
                      opacity: draggedIndex === index ? 0.4 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Drag Handle */}
                    <span style={{ color: "var(--text-tertiary)", cursor: "grab", fontSize: "0.9rem", userSelect: "none" }}>
                      ⋮⋮
                    </span>

                    {/* Order Number Badge */}
                    <span
                      style={{
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.45rem",
                        borderRadius: "12px",
                        background: item.badgeBg,
                        color: item.badgeColor,
                        minWidth: "26px",
                        textAlign: "center",
                      }}
                    >
                      #{index + 1}
                    </span>

                    {/* Item Details */}
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>{item.title}</span>
                        {item.type === "document" && (() => {
                          const matchedDoc = documents.find((d) => d._id === item.id);
                          const rot = docRotations[item.id] !== undefined ? docRotations[item.id] : (matchedDoc?.rotation || 0);
                          return rot > 0 ? (
                            <span style={{ fontSize: "0.68rem", color: "#fcd34d", background: "rgba(245, 158, 11, 0.2)", padding: "0.1rem 0.35rem", borderRadius: "8px", fontWeight: 600 }}>
                              🔄 {rot}°
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                        {item.subtitle}
                      </div>
                    </div>


                    {/* Move Up & Move Down Buttons */}
                    <div style={{ display: "flex", gap: "0.2rem", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => moveItemUp(index)}
                        disabled={index === 0}
                        title="Move Up"
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "none",
                          color: index === 0 ? "rgba(255,255,255,0.2)" : "white",
                          borderRadius: "4px",
                          width: "24px",
                          height: "24px",
                          cursor: index === 0 ? "default" : "pointer",
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItemDown(index)}
                        disabled={index === orderedItems.length - 1}
                        title="Move Down"
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "none",
                          color: index === orderedItems.length - 1 ? "rgba(255,255,255,0.2)" : "white",
                          borderRadius: "4px",
                          width: "24px",
                          height: "24px",
                          cursor: index === orderedItems.length - 1 ? "default" : "pointer",
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        title="Remove from Sequence"
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "none",
                          color: "#fca5a5",
                          borderRadius: "4px",
                          width: "24px",
                          height: "24px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          marginLeft: "0.2rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "1.25rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              <span>Sequence Order:</span>
              <span style={{ fontWeight: 700, color: "#34d399" }}>
                {orderedItems.length} {orderedItems.length === 1 ? "item" : "items"} in custom order
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePreviewMergedPdf}
                disabled={isPreviewing || isMerging || orderedItems.length === 0}
                style={{ width: "100%", padding: "0.75rem", fontSize: "0.88rem", borderColor: "rgba(99, 102, 241, 0.4)", background: "rgba(99, 102, 241, 0.12)", color: "#c7d2fe" }}
              >
                {isPreviewing ? <span className="spinner" /> : "👁️ Preview Merged PDF Portfolio"}
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleMerge}
                disabled={isMerging || isPreviewing || orderedItems.length === 0}
                style={{ width: "100%", padding: "0.85rem", fontSize: "0.92rem" }}
              >
                {isMerging ? <span className="spinner" /> : "⚡ Download Combined PDF Portfolio"}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Merged PDF Full-Screen Live Preview Modal */}
      {showPreviewModal && previewPdfUrl && (
        <div className="modal-backdrop" onClick={() => setShowPreviewModal(false)}>
          <div
            className="glass-card modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 960,
              width: "92%",
              height: "90vh",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>👁️</span> Merged Portfolio Live Preview
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                  {orderedItems.length} items merged in custom sequence • Inspect all pages below before downloading
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <a href={previewPdfUrl} download="Combined_Application_Portfolio.pdf" style={{ textDecoration: "none" }}>
                  <button className="btn-primary" style={{ padding: "0.55rem 1.35rem", fontSize: "0.86rem" }}>
                    ⬇️ Download Combined PDF
                  </button>
                </a>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "1.6rem", cursor: "pointer", marginLeft: "0.5rem" }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ flex: 1, background: "#0f172a", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <iframe
                src={previewPdfUrl}
                title="Merged PDF Portfolio Live Preview"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Individual Document Interactive Preview & Rotation Modal */}
      {previewSingleDoc && (
        <div className="modal-backdrop" onClick={() => setPreviewSingleDoc(null)}>
          <div
            className="glass-card modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 850, width: "92%", height: "88vh", padding: "1.5rem", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>📄</span> {previewSingleDoc.title}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                  {previewSingleDoc.customCategory || previewSingleDoc.category} Store • {previewSingleDoc.fileName}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {(() => {
                  const currentRot = docRotations[previewSingleDoc._id] !== undefined ? docRotations[previewSingleDoc._id] : (previewSingleDoc.rotation || 0);
                  return (
                    <>
                      <span style={{ fontSize: "0.8rem", color: "#fcd34d", background: "rgba(245, 158, 11, 0.2)", padding: "0.25rem 0.65rem", borderRadius: "12px", fontWeight: 600 }}>
                        🔄 {currentRot}° Angle
                      </span>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={(e) => handleRotateDoc(e, previewSingleDoc._id, currentRot, -90)}
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        ↺ Rotate Left
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={(e) => handleRotateDoc(e, previewSingleDoc._id, currentRot, 90)}
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        ↻ Rotate 90°
                      </button>
                    </>
                  );
                })()}
                <button
                  onClick={() => setPreviewSingleDoc(null)}
                  style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "1.6rem", cursor: "pointer", marginLeft: "0.5rem" }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ flex: 1, background: "#0f172a", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
              {(() => {
                const currentRot = docRotations[previewSingleDoc._id] !== undefined ? docRotations[previewSingleDoc._id] : (previewSingleDoc.rotation || 0);
                const isImage = previewSingleDoc.fileType === "image" || previewSingleDoc.fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i);

                return isImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewSingleDoc.fileUrl}
                    alt={previewSingleDoc.title}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "68vh",
                      objectFit: "contain",
                      transform: `rotate(${currentRot}deg)`,
                      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                ) : (
                  <iframe
                    src={previewSingleDoc.fileUrl}
                    title={previewSingleDoc.title}
                    style={{
                      width: "100%",
                      height: "70vh",
                      border: "none",
                      transform: `rotate(${currentRot}deg)`,
                      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "210mm", minHeight: "297mm", pointerEvents: "none", opacity: 0 }}>
        {fullCvData && (
          <div id="merger-cv-preview-container" style={{ width: "210mm", minHeight: "297mm" }}>
            <CVPreview data={fullCvData} />
          </div>
        )}
        {fullLetterData && (
          <div id="merger-cl-preview-container" style={{ width: "210mm", minHeight: "297mm" }}>
            <CoverLetterPreview data={fullLetterData} />
          </div>
        )}
      </div>
    </div>
  );
}



