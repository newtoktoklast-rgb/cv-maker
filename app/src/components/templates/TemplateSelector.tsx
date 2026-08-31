"use client";

import { TemplateId } from "@/lib/types";

interface Props {
  selected: TemplateId;
  onSelect: (id: TemplateId) => void;
}

const templates: {
  id: TemplateId;
  name: string;
  description: string;
  badge: string;
  colors: string[];
}[] = [
  {
    id: "modern",
    name: "Swiss Modernist",
    description: "Deep slate sidebar, high-density grid & amber accents",
    badge: "Atelier",
    colors: ["#0f172a", "#f59e0b", "#ffffff"],
  },
  {
    id: "classic",
    name: "Editorial Monograph",
    description: "Warm paper tone, literary serif type & balanced margins",
    badge: "Meridian",
    colors: ["#1c1917", "#78716c", "#faf8f5"],
  },
  {
    id: "executive",
    name: "Executive Minimalist",
    description: "Obsidian header bar, dual-column balance & skill chips",
    badge: "Metropolis",
    colors: ["#090a10", "#6366f1", "#ffffff"],
  },
  {
    id: "minimalist",
    name: "Nordic Precision",
    description: "Spacious whitespace, crisp sans-serif & subtle divider rules",
    badge: "Nordic",
    colors: ["#ffffff", "#090a10", "#e2e8f0"],
  },
  {
    id: "creative",
    name: "Creative Studio",
    description: "Emerald header banner, split sidebar, avatar & pill tags",
    badge: "Vanguard",
    colors: ["#059669", "#10b981", "#ecfdf5"],
  },
  {
    id: "technical",
    name: "Technical Architect",
    description: "Terminal contrast header, monospace tags & code matrix",
    badge: "DevOps",
    colors: ["#0f172a", "#6366f1", "#10b981"],
  },
];

export default function TemplateSelector({ selected, onSelect }: Props) {
  return (
    <div className="template-selector">
      <h3 className="template-selector-title">Select Resume Typography & Layout (6 Professional Styles)</h3>
      <div className="template-selector-grid">
        {templates.map((t) => (
          <button
            key={t.id}
            className={`template-card ${selected === t.id ? "template-card-active" : ""}`}
            onClick={() => onSelect(t.id)}
            type="button"
          >
            {/* Mini preview */}
            <div className="template-preview-mini">
              {t.id === "modern" && (
                <div className="mini-modern">
                  <div className="mini-modern-sidebar" style={{ background: "#0f172a" }}>
                    <div className="mini-circle" style={{ background: "#1e293b", border: "1px solid #475569" }} />
                    <div className="mini-line w60" style={{ background: "#ffffff" }} />
                    <div className="mini-line w40" style={{ background: "#94a3b8" }} />
                    <div className="mini-spacer" />
                    <div className="mini-line w50" style={{ background: "#f59e0b" }} />
                    <div className="mini-bar" style={{ background: "#334155" }} />
                    <div className="mini-bar" style={{ background: "#334155" }} />
                  </div>
                  <div className="mini-modern-main">
                    <div className="mini-line-dark w80" style={{ height: 3, background: "#0f172a" }} />
                    <div className="mini-line-dark w60" />
                    <div className="mini-spacer" />
                    <div className="mini-line-dark w90" style={{ height: 3, background: "#0f172a" }} />
                    <div className="mini-line-dark w70" />
                    <div className="mini-line-dark w85" />
                    <div className="mini-spacer" />
                    <div className="mini-line-dark w75" />
                  </div>
                </div>
              )}
              {t.id === "classic" && (
                <div className="mini-classic">
                  <div className="mini-classic-header">
                    <div className="mini-line-dark w60" style={{ height: 5, margin: "0 auto", background: "#1c1917" }} />
                    <div className="mini-line-dark w40" style={{ height: 2, margin: "3px auto 0", background: "#78716c" }} />
                  </div>
                  <div className="mini-hr" style={{ background: "#d6d3d1" }} />
                  <div className="mini-line-dark w30" style={{ height: 3, background: "#1c1917" }} />
                  <div className="mini-line-dark w90" />
                  <div className="mini-line-dark w80" />
                  <div className="mini-hr" style={{ background: "#d6d3d1" }} />
                  <div className="mini-line-dark w30" style={{ height: 3, background: "#1c1917" }} />
                  <div className="mini-line-dark w85" />
                  <div className="mini-line-dark w70" />
                </div>
              )}
              {t.id === "executive" && (
                <div className="mini-exec">
                  <div className="mini-exec-header" style={{ background: "#090a10", borderBottom: "1.5px solid #6366f1" }}>
                    <div className="mini-line w70" style={{ height: 5, margin: "0 auto", background: "#ffffff" }} />
                    <div className="mini-line w40" style={{ height: 2, margin: "3px auto 0", background: "#94a3b8" }} />
                  </div>
                  <div className="mini-exec-body">
                    <div className="mini-exec-col">
                      <div className="mini-line-dark w80" style={{ height: 3, background: "#0f172a" }} />
                      <div className="mini-line-dark w90" />
                      <div className="mini-line-dark w70" />
                      <div className="mini-line-dark w85" />
                    </div>
                    <div className="mini-exec-col">
                      <div className="mini-line-dark w70" style={{ height: 3, background: "#0f172a" }} />
                      <div className="mini-line-dark w80" />
                      <div className="mini-line-dark w60" />
                    </div>
                  </div>
                </div>
              )}
              {t.id === "minimalist" && (
                <div className="mini-classic" style={{ background: "#ffffff" }}>
                  <div className="mini-classic-header" style={{ textTransform: "uppercase" }}>
                    <div className="mini-line-dark w70" style={{ height: 6, background: "#090a10" }} />
                    <div className="mini-line-dark w40" style={{ height: 2, marginTop: 3, background: "#64748b" }} />
                  </div>
                  <div className="mini-hr" style={{ background: "#e2e8f0", margin: "6px 0" }} />
                  <div className="mini-line-dark w40" style={{ height: 3, background: "#090a10" }} />
                  <div className="mini-line-dark w90" style={{ background: "#475569" }} />
                  <div className="mini-line-dark w80" style={{ background: "#475569" }} />
                </div>
              )}
              {t.id === "creative" && (
                <div className="mini-modern">
                  <div className="mini-modern-sidebar" style={{ background: "#059669", width: "40%" }}>
                    <div className="mini-circle" style={{ background: "#10b981", border: "1px solid #a7f3d0" }} />
                    <div className="mini-line w70" style={{ background: "#ffffff" }} />
                    <div className="mini-spacer" />
                    <div className="mini-bar" style={{ background: "#10b981" }} />
                    <div className="mini-bar" style={{ background: "#10b981" }} />
                  </div>
                  <div className="mini-modern-main" style={{ width: "60%" }}>
                    <div className="mini-line-dark w80" style={{ height: 3, background: "#059669" }} />
                    <div className="mini-line-dark w90" />
                    <div className="mini-line-dark w70" />
                  </div>
                </div>
              )}
              {t.id === "technical" && (
                <div className="mini-exec">
                  <div className="mini-exec-header" style={{ background: "#0f172a", borderBottom: "1.5px solid #10b981" }}>
                    <div className="mini-line w80" style={{ height: 4, background: "#6366f1" }} />
                    <div className="mini-line w50" style={{ height: 2, marginTop: 2, background: "#10b981" }} />
                  </div>
                  <div className="mini-exec-body">
                    <div className="mini-exec-col">
                      <div className="mini-line-dark w90" style={{ height: 3, background: "#6366f1" }} />
                      <div className="mini-line-dark w70" />
                      <div className="mini-line-dark w85" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="template-card-info">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span className="template-card-name">{t.name}</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-primary)", letterSpacing: "0.04em" }}>
                  {t.badge}
                </span>
              </div>
              <span className="template-card-desc">{t.description}</span>
            </div>
            {selected === t.id && (
              <div className="template-card-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
