"use client";

import { useState } from "react";
import { UserDocument, DocCategory } from "@/lib/types";

interface Props {
  initialDocuments: UserDocument[];
  onOpenMerger?: () => void;
}

const BUILTIN_CATEGORIES: { id: DocCategory; label: string; icon: string }[] = [
  { id: "CV", label: "CV / Resume Store", icon: "📄" },
  { id: "Cover Letter", label: "Cover Letter Store", icon: "✉️" },
  { id: "Grade8", label: "Grade 8", icon: "🏫" },
  { id: "Grade10", label: "Grade 10", icon: "📜" },
  { id: "Grade12", label: "Grade 12", icon: "🎓" },
  { id: "University Certificate", label: "University Certificate", icon: "🏛️" },
];

export default function DocumentVault({ initialDocuments, onOpenMerger }: Props) {
  const [documents, setDocuments] = useState<UserDocument[]>(initialDocuments);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null);

  // Extract unique custom categories from existing documents
  const existingCustomCats = Array.from(
    new Set(
      documents
        .filter((d) => d.category === "Custom" && d.customCategory)
        .map((d) => d.customCategory as string)
    )
  );

  const [customCategories, setCustomCategories] = useState<string[]>(
    existingCustomCats.length > 0 ? existingCustomCats : ["Recommendation Letter"]
  );

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Grade10");
  const [customCategory, setCustomCategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "CV") return doc.category === "CV";
    if (selectedCategory === "Cover Letter") return doc.category === "Cover Letter";
    if (selectedCategory === "Grade8") return doc.category === "Grade8";
    if (selectedCategory === "Grade10") return doc.category === "Grade10";
    if (selectedCategory === "Grade12") return doc.category === "Grade12";
    if (selectedCategory === "University Certificate") return doc.category === "University Certificate";
    return doc.category === "Custom" && doc.customCategory === selectedCategory;
  });


  const handleCreateNewCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      setCustomCategories((prev) => [...prev, trimmed]);
    }
    setSelectedCategory(trimmed);
    setNewCatInput("");
    setShowAddCatModal(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setErrorMsg("Please select at least one file (PDF or Image photo).");
      return;
    }

    const isBuiltin = BUILTIN_CATEGORIES.some((c) => c.id === category);
    const finalCategory: DocCategory = isBuiltin ? (category as DocCategory) : "Custom";
    const finalCustomCategory = isBuiltin ? "" : category === "NEW_CUSTOM" ? customCategory.trim() : category;

    if (!isBuiltin && !finalCustomCategory) {
      setErrorMsg("Please provide a name for the custom category.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");

    try {
      const uploadedDocs: UserDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const baseTitle = title.trim() || file.name.replace(/\.[^/.]+$/, "");
        const docTitle = files.length > 1 ? `${baseTitle} (Page ${i + 1})` : baseTitle;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", docTitle);
        formData.append("category", finalCategory);
        formData.append("customCategory", finalCustomCategory);

        const res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Failed to upload file ${file.name}`);
        }

        const newDoc = await res.json();
        uploadedDocs.push(newDoc);
      }

      setDocuments((prev) => [...uploadedDocs, ...prev]);

      // Add custom category to list if new
      if (finalCustomCategory && !customCategories.includes(finalCustomCategory)) {
        setCustomCategories((prev) => [...prev, finalCustomCategory]);
      }

      setShowModal(false);
      setTitle("");
      setFiles([]);
      setCustomCategory("");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d._id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleRotate = async (docId: string, currentRotation: number = 0, delta: number) => {
    const newRotation = (currentRotation + delta + 360) % 360;
    setDocuments((prev) =>
      prev.map((d) => (d._id === docId ? { ...d, rotation: newRotation } : d))
    );
    if (previewDoc && previewDoc._id === docId) {
      setPreviewDoc((prev) => (prev ? { ...prev, rotation: newRotation } : null));
    }

    try {
      await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotation: newRotation }),
      });
    } catch (err) {
      console.error("Failed to update rotation:", err);
    }
  };


  const openUploadModal = (presetCat?: string) => {
    const target = presetCat || selectedCategory;
    if (target && target !== "ALL") {
      setCategory(target);
    }
    setShowModal(true);
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Action Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Educational & Reference Documents
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Store multiple files, pages, and photos for Grade 8, Grade 10, Grade 12, University, and custom stores.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {onOpenMerger && (
            <button
              className="btn-secondary"
              onClick={onOpenMerger}
              style={{
                width: "auto",
                padding: "0.65rem 1.25rem",
                fontSize: "0.86rem",
                borderColor: "rgba(99, 102, 241, 0.4)",
                background: "rgba(99, 102, 241, 0.12)",
                color: "#c7d2fe",
              }}
            >
              ✨ Go to Merge PDF Studio
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => openUploadModal()}
            style={{ width: "auto", padding: "0.65rem 1.35rem", fontSize: "0.86rem" }}
          >
            + Upload Document / Photo
          </button>
        </div>
      </div>


      {/* Category Pills & Plus Sign Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.75rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        {/* All Documents */}
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`builder-step ${selectedCategory === "ALL" ? "builder-step-active" : ""}`}
          style={{
            borderRadius: "var(--radius-pill)",
            padding: "0.45rem 1.1rem",
            fontSize: "0.84rem",
            whiteSpace: "nowrap",
          }}
        >
          <span>📁</span>
          <span>All Documents</span>
          <span
            style={{
              background: selectedCategory === "ALL" ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
              padding: "0.1rem 0.45rem",
              borderRadius: "10px",
              fontSize: "0.75rem",
            }}
          >
            {documents.length}
          </span>
        </button>

        {/* Builtin Categories */}
        {BUILTIN_CATEGORIES.map((cat) => {
          const count = documents.filter((d) => d.category === cat.id).length;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`builder-step ${isActive ? "builder-step-active" : ""}`}
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "0.45rem 1.1rem",
                fontSize: "0.84rem",
                whiteSpace: "nowrap",
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                style={{
                  background: isActive ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  padding: "0.1rem 0.45rem",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Custom Categories */}
        {customCategories.map((cName) => {
          const count = documents.filter(
            (d) => d.category === "Custom" && d.customCategory === cName
          ).length;
          const isActive = selectedCategory === cName;
          return (
            <button
              key={cName}
              onClick={() => setSelectedCategory(cName)}
              className={`builder-step ${isActive ? "builder-step-active" : ""}`}
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "0.45rem 1.1rem",
                fontSize: "0.84rem",
                whiteSpace: "nowrap",
                borderColor: isActive ? "#34d399" : undefined,
                color: isActive ? "#34d399" : undefined,
              }}
            >
              <span>⭐</span>
              <span>{cName}</span>
              <span
                style={{
                  background: isActive ? "rgba(52, 211, 153, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  padding: "0.1rem 0.45rem",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Plus Button to add a new category with custom name */}
        <button
          type="button"
          onClick={() => setShowAddCatModal(true)}
          style={{
            borderRadius: "var(--radius-pill)",
            padding: "0.45rem 1rem",
            fontSize: "0.84rem",
            background: "rgba(52, 211, 153, 0.12)",
            border: "1px dashed rgba(52, 211, 153, 0.5)",
            color: "#34d399",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            whiteSpace: "nowrap",
          }}
          title="Add new category store"
        >
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* Active Category Store Header Banner */}
      {selectedCategory !== "ALL" && (
        <div
          className="glass-card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            borderRadius: "12px",
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "white" }}>
              📁 {selectedCategory} Category Store
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.2rem 0 0" }}>
              {filteredDocs.length} {filteredDocs.length === 1 ? "document / page" : "documents / pages"} stored in this category. You can add as many documents or photo pages as needed.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => openUploadModal(selectedCategory)}
            style={{ width: "auto", padding: "0.5rem 1.2rem", fontSize: "0.84rem" }}
          >
            + Add Document to {selectedCategory}
          </button>
        </div>
      )}

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="dashboard-empty glass-card" style={{ padding: "3rem 1.5rem" }}>
          <div className="dashboard-empty-icon" style={{ fontSize: "2.5rem" }}>
            📑
          </div>
          <h3 style={{ marginTop: "1rem" }}>No documents in {selectedCategory === "ALL" ? "this vault" : selectedCategory}</h3>
          <p style={{ maxWidth: 420, margin: "0.5rem auto 1.5rem" }}>
            Upload your Grade 8, Grade 10, Grade 12, University certificates, or custom category documents as images or PDFs.
          </p>
          <button
            className="btn-primary"
            onClick={() => openUploadModal(selectedCategory === "ALL" ? undefined : selectedCategory)}
            style={{ width: "auto", padding: "0.65rem 1.5rem" }}
          >
            + Add First Document to {selectedCategory === "ALL" ? "Vault" : selectedCategory}
          </button>
        </div>

      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {filteredDocs.map((doc) => {
            const isImage = doc.fileType === "image";
            const categoryBadge = doc.category === "Custom" ? doc.customCategory || "Custom" : doc.category;

            return (
              <div key={doc._id} className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1.25rem" }}>
                <div>
                  {/* Category Tag & File Type */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.65rem",
                        borderRadius: "12px",
                        background: "rgba(99, 102, 241, 0.15)",
                        color: "#a5b4fc",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                      }}
                    >
                      {categoryBadge}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        background: isImage ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: isImage ? "#34d399" : "#fbbf24",
                        textTransform: "uppercase",
                      }}
                    >
                      {isImage ? "PHOTO / IMG" : "PDF"}
                    </span>
                  </div>

                  {/* Document Title */}
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem", wordBreak: "break-word" }}>
                    {doc.title}
                  </h4>

                  <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginBottom: "1rem" }}>
                    {doc.fileName} • {(doc.fileSize / 1024).toFixed(1)} KB
                  </p>

                  {/* Thumbnail Preview */}
                  <div
                    onClick={() => setPreviewDoc(doc)}
                    style={{
                      height: 140,
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px dashed var(--border-default)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      overflow: "hidden",
                      marginBottom: "0.75rem",
                      position: "relative",
                    }}
                  >
                    {isImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={doc.fileUrl}
                        alt={doc.title}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          transform: `rotate(${doc.rotation || 0}deg)`,
                          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: "0 auto 0.25rem", color: "#fbbf24" }}>
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <span style={{ fontSize: "0.75rem" }}>Click to Preview PDF</span>
                      </div>
                    )}
                  </div>

                  {/* Rotation Toolbar for Image Photos */}
                  {isImage && (
                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", marginBottom: "0.75rem" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleRotate(doc._id, doc.rotation || 0, -90)}
                        title="Rotate 90° Left"
                        style={{ padding: "0.25rem 0.55rem", fontSize: "0.76rem" }}
                      >
                        ↺ Rotate Left
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleRotate(doc._id, doc.rotation || 0, 90)}
                        title="Rotate 90° Right"
                        style={{ padding: "0.25rem 0.55rem", fontSize: "0.76rem" }}
                      >
                        ↻ Rotate Right
                      </button>
                      {doc.rotation && doc.rotation !== 0 ? (
                        <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600, marginLeft: "auto" }}>
                          {doc.rotation}°
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setPreviewDoc(doc)}
                    style={{ flex: 1, padding: "0.45rem", fontSize: "0.8rem" }}
                  >
                    Preview
                  </button>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={doc.fileName}
                    style={{ textDecoration: "none" }}
                  >
                    <button className="btn-secondary" style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem" }}>
                      ⬇️
                    </button>
                  </a>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(doc._id)}
                    disabled={deletingId === doc._id}
                    style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem" }}
                  >
                    {deletingId === doc._id ? "..." : "🗑️"}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Category Name Modal (Triggered by + Sign) */}
      {showAddCatModal && (
        <div className="modal-backdrop" onClick={() => setShowAddCatModal(false)}>
          <div
            className="glass-card modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: "1.5rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>➕ Add New Category Store</h3>
              <button
                onClick={() => setShowAddCatModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "1.5rem", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateNewCatSubmit}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Recommendation Letter, Driving License, Work Reference"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid var(--border-default)",
                    color: "white",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddCatModal(false)}
                  style={{ width: "auto", padding: "0.55rem 1.1rem" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "auto", padding: "0.55rem 1.35rem" }}
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="glass-card modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Add Educational / Custom Document</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "1.5rem", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUploadSubmit}>
              {/* Category Selector */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Document Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid var(--border-default)",
                    color: "white",
                    fontSize: "0.9rem",
                  }}
                >
                  <optgroup label="Standard Educational Grades">
                    <option value="Grade8">Grade 8 Certificate / Marksheet</option>
                    <option value="Grade10">Grade 10 Certificate / Marksheet</option>
                    <option value="Grade12">Grade 12 Certificate / Marksheet</option>
                    <option value="University Certificate">University Degree / Certificate</option>
                  </optgroup>

                  {customCategories.length > 0 && (
                    <optgroup label="Custom Categories">
                      {customCategories.map((cName) => (
                        <option key={cName} value={cName}>
                          ⭐ {cName}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <option value="NEW_CUSTOM">➕ Add New Category Name...</option>
                </select>
              </div>

              {/* Custom Category Input if NEW_CUSTOM selected */}
              {category === "NEW_CUSTOM" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Recommendation Letter, Internship Certificate, License"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid var(--border-default)",
                      color: "white",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              )}

              {/* Document Title */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Document Title / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. High School Leaving Certificate 2022"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid var(--border-default)",
                    color: "white",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              {/* File Input */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Select File(s) or Photo Page(s) * (Select one or multiple)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px dashed var(--border-default)",
                    color: "white",
                    fontSize: "0.85rem",
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.35rem", display: "block" }}>
                  Select 1 or multiple files/photos at once (e.g. Page 1, Page 2, Page 3 of certificate). Max 10MB per file.
                </span>
                {files.length > 0 && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#34d399", fontWeight: 600 }}>
                    ✓ Ready to upload {files.length} {files.length === 1 ? "file/page" : "files/pages"} into this category
                  </div>
                )}
              </div>


              {/* Form Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  style={{ width: "auto", padding: "0.6rem 1.2rem" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUploading}
                  style={{ width: "auto", padding: "0.6rem 1.5rem" }}
                >
                  {isUploading ? <span className="spinner" /> : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="modal-backdrop" onClick={() => setPreviewDoc(null)}>
          <div
            className="glass-card modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 800, width: "90%", maxHeight: "90vh", padding: "1.5rem", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{previewDoc.title}</h3>
                <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                  {previewDoc.category === "Custom" ? previewDoc.customCategory : previewDoc.category} • {previewDoc.fileName}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleRotate(previewDoc._id, previewDoc.rotation || 0, -90)}
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                >
                  ↺ Rotate Left
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleRotate(previewDoc._id, previewDoc.rotation || 0, 90)}
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                >
                  ↻ Rotate Right
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: "1.5rem", cursor: "pointer", marginLeft: "0.5rem" }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 400, background: "#0f172a", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
              {previewDoc.fileType === "image" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "65vh",
                    objectFit: "contain",
                    transform: `rotate(${previewDoc.rotation || 0}deg)`,
                    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              ) : (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  style={{
                    width: "100%",
                    height: "70vh",
                    border: "none",
                    transform: `rotate(${previewDoc.rotation || 0}deg)`,
                    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
