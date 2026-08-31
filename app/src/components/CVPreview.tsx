"use client";

import { CVData } from "@/lib/types";
import ModernTemplate from "@/components/templates/ModernTemplate";
import ClassicTemplate from "@/components/templates/ClassicTemplate";
import ExecutiveTemplate from "@/components/templates/ExecutiveTemplate";
import MinimalistTemplate from "@/components/templates/MinimalistTemplate";
import CreativeTemplate from "@/components/templates/CreativeTemplate";
import TechnicalTemplate from "@/components/templates/TechnicalTemplate";
import { useRef } from "react";

interface Props {
  data: CVData;
}

export default function CVPreview({ data }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const printContents = printRef.current;
    if (!printContents) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.personalInfo.fullName || "Resume"} - CV Studio</title>
          <style>${getPrintStyles(data.templateId)}</style>
        </head>
        <body>
          ${printContents.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="cv-preview-wrapper">
      <div className="cv-preview-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1" }} />
          <span className="cv-preview-label">Live A4 Preview</span>
        </div>
        <button className="btn-primary cv-preview-download" onClick={handleDownload} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export A4 PDF
        </button>
      </div>
      <div className="cv-preview-scroll">
        <div className="cv-preview-page" ref={printRef}>
          {data.templateId === "modern" && <ModernTemplate data={data} />}
          {data.templateId === "classic" && <ClassicTemplate data={data} />}
          {data.templateId === "executive" && <ExecutiveTemplate data={data} />}
          {data.templateId === "minimalist" && <MinimalistTemplate data={data} />}
          {data.templateId === "creative" && <CreativeTemplate data={data} />}
          {data.templateId === "technical" && <TechnicalTemplate data={data} />}
        </div>
      </div>
    </div>
  );
}

function getPrintStyles(templateId: string): string {
  const base = `
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Outfit', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
    @page { size: A4; margin: 0; }
  `;

  const modernCSS = `
    .cv-modern { display: flex; min-height: 297mm; width: 210mm; background: #fff; font-family: 'Outfit', sans-serif; }
    .cv-modern-sidebar { width: 72mm; background: #0f172a; color: #fff; padding: 36px 22px; display: flex; flex-direction: column; gap: 4px; border-right: 2px solid #334155; }
    .cv-modern-avatar { width: 68px; height: 68px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; margin: 0 auto 14px; border: 2px solid #475569; color: #f8fafc; }
    .cv-modern-name { font-size: 19px; font-weight: 800; text-align: center; margin-bottom: 3px; letter-spacing: -0.02em; color: #fff; }
    .cv-modern-title { font-size: 11.5px; text-align: center; color: #94a3b8; margin-bottom: 22px; font-weight: 500; }
    .cv-modern-section { margin-top: 18px; }
    .cv-modern-section-title { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 11px; padding-bottom: 5px; border-bottom: 1px solid #334155; color: #f59e0b; }
    .cv-modern-contact-item { display: flex; align-items: flex-start; gap: 8px; font-size: 9.5px; margin-bottom: 7px; line-height: 1.4; word-break: break-all; color: #cbd5e1; }
    .cv-modern-contact-item svg { width: 13px; height: 13px; flex-shrink: 0; margin-top: 1px; color: #f59e0b; }
    .cv-modern-skills { display: flex; flex-direction: column; gap: 8px; }
    .cv-modern-skill-header { font-size: 10px; margin-bottom: 3px; color: #e2e8f0; }
    .cv-modern-skill-bar { height: 5px; background: #1e293b; border-radius: 3px; overflow: hidden; }
    .cv-modern-skill-fill { height: 100%; background: #f59e0b; border-radius: 3px; }
    .cv-modern-lang { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 5px; color: #cbd5e1; }
    .cv-modern-lang-level { color: #94a3b8; font-size: 9px; }
    .cv-modern-main { flex: 1; padding: 36px 30px; }
    .cv-modern-main-section { margin-bottom: 22px; }
    .cv-modern-main-title { font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; padding-bottom: 5px; border-bottom: 2px solid #0f172a; }
    .cv-modern-summary { font-size: 10.5px; line-height: 1.65; color: #334155; }
    .cv-modern-entry { margin-bottom: 15px; }
    .cv-modern-entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
    .cv-modern-entry-title { font-size: 12px; font-weight: 700; color: #0f172a; }
    .cv-modern-entry-subtitle { font-size: 10.5px; color: #64748b; font-weight: 500; }
    .cv-modern-entry-date { font-size: 9.5px; color: #94a3b8; white-space: nowrap; margin-left: 12px; font-weight: 500; }
    .cv-modern-entry-desc { font-size: 10px; line-height: 1.6; color: #475569; margin-top: 4px; white-space: pre-line; }
    .cv-modern-custom-list { list-style: disc; margin-left: 16px; margin-top: 4px; }
    .cv-modern-custom-item { font-size: 10px; line-height: 1.6; color: #475569; margin-bottom: 3px; }
  `;

  const classicCSS = `
    .cv-classic { width: 210mm; min-height: 297mm; background: #faf8f5; padding: 40px 42px; font-family: 'Newsreader', Georgia, serif; color: #1c1917; }
    .cv-classic-header { text-align: center; margin-bottom: 4px; }
    .cv-classic-name { font-size: 28px; font-weight: 700; color: #1c1917; letter-spacing: 0.04em; text-transform: uppercase; }
    .cv-classic-title { font-size: 13.5px; color: #78716c; font-weight: 400; margin-top: 4px; font-style: italic; }
    .cv-classic-contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 10px; font-size: 9.5px; color: #57534e; font-family: 'Outfit', sans-serif; }
    .cv-classic-contact span:not(:last-child)::after { content: '·'; margin-left: 8px; color: #a8a29e; }
    .cv-classic-divider { border: none; border-top: 0.5px solid #d6d3d1; margin: 14px 0; }
    .cv-classic-section { margin-bottom: 4px; }
    .cv-classic-section-title { font-size: 13.5px; font-weight: 700; color: #1c1917; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
    .cv-classic-text { font-size: 10.5px; line-height: 1.7; color: #292524; }
    .cv-classic-entry { margin-bottom: 13px; }
    .cv-classic-entry-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .cv-classic-entry-title { font-size: 12px; font-weight: 700; color: #1c1917; }
    .cv-classic-entry-org { font-size: 10.5px; color: #57534e; font-style: italic; }
    .cv-classic-entry-date { font-size: 9.5px; color: #78716c; white-space: nowrap; font-family: 'Outfit', sans-serif; }
    .cv-classic-entry-desc { margin-top: 4px; white-space: pre-line; }
    .cv-classic-skills { display: flex; flex-wrap: wrap; gap: 6px; }
    .cv-classic-skill-tag { font-size: 9.5px; padding: 3px 10px; background: #f5f5f4; border: 0.5px solid #d6d3d1; border-radius: 2px; color: #44403c; font-family: 'Outfit', sans-serif; }
    .cv-classic-languages { display: flex; flex-wrap: wrap; gap: 14px; font-size: 10.5px; color: #292524; }
    .cv-classic-bottom { display: flex; gap: 40px; }
    .cv-classic-bottom .cv-classic-section { flex: 1; }
    .cv-classic-custom-list { list-style: disc; margin-left: 18px; margin-top: 4px; }
    .cv-classic-custom-list .cv-classic-text { margin-bottom: 3px; }
  `;

  const execCSS = `
    .cv-exec { width: 210mm; min-height: 297mm; background: #fff; font-family: 'Outfit', sans-serif; }
    .cv-exec-header { background: #090a10; color: #fff; padding: 34px 38px; text-align: center; border-bottom: 3px solid #6366f1; }
    .cv-exec-name { font-size: 29px; font-weight: 800; letter-spacing: 0.01em; color: #fff; }
    .cv-exec-title { font-size: 13.5px; font-weight: 500; color: #94a3b8; margin-top: 4px; }
    .cv-exec-contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-top: 14px; font-size: 9.5px; }
    .cv-exec-contact-item { display: flex; align-items: center; gap: 5px; color: #cbd5e1; }
    .cv-exec-contact-item svg { width: 12px; height: 12px; color: #818cf8; }
    .cv-exec-body { display: flex; gap: 0; padding: 30px 38px; }
    .cv-exec-left { flex: 1.45; padding-right: 26px; border-right: 0.5px solid #e2e8f0; }
    .cv-exec-right { flex: 1; padding-left: 26px; }
    .cv-exec-section { margin-bottom: 18px; }
    .cv-exec-section-title { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #0f172a; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #6366f1; }
    .cv-exec-text { font-size: 10.5px; line-height: 1.65; color: #334155; white-space: pre-line; }
    .cv-exec-entry { margin-bottom: 14px; }
    .cv-exec-entry-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .cv-exec-entry-title { font-size: 12px; font-weight: 700; color: #0f172a; }
    .cv-exec-entry-org { font-size: 10.5px; color: #64748b; margin-bottom: 4px; }
    .cv-exec-entry-date { font-size: 9.5px; color: #94a3b8; white-space: nowrap; }
    .cv-exec-entry-date-inline { font-size: 9.5px; color: #94a3b8; }
    .cv-exec-tags { display: flex; flex-wrap: wrap; gap: 5px; }
    .cv-exec-tag { font-size: 9px; padding: 3px 10px; background: #f1f5f9; color: #1e293b; border: 0.5px solid #cbd5e1; border-radius: 2px; font-weight: 600; }
    .cv-exec-lang { display: flex; justify-content: space-between; font-size: 10.5px; color: #334155; margin-bottom: 4px; }
    .cv-exec-lang-level { color: #94a3b8; font-size: 9.5px; }
    .cv-exec-custom-list { list-style: disc; margin-left: 16px; margin-top: 4px; }
    .cv-exec-custom-list .cv-exec-text { margin-bottom: 3px; }
  `;

  const minimalistCSS = `
    .cv-minimalist { width: 210mm; min-height: 297mm; background: #fff; padding: 42px 48px; font-family: 'Outfit', sans-serif; color: #090a10; }
    .cv-min-header { margin-bottom: 12px; }
    .cv-min-name { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; color: #090a10; }
    .cv-min-title { font-size: 14px; font-weight: 500; color: #64748b; margin-top: 2px; }
    .cv-min-contact-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px; font-size: 9.5px; color: #475569; }
    .cv-min-contact-row span:not(:last-child)::after { content: '│'; margin-left: 14px; color: #cbd5e1; }
    .cv-min-divider { height: 1px; background: #e2e8f0; margin: 16px 0; }
    .cv-min-section { margin-bottom: 20px; }
    .cv-min-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #090a10; margin-bottom: 10px; }
    .cv-min-text { font-size: 10.5px; line-height: 1.65; color: #334155; white-space: pre-line; }
    .cv-min-entry { margin-bottom: 14px; }
    .cv-min-entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
    .cv-min-entry-role { font-size: 12.5px; font-weight: 700; color: #090a10; }
    .cv-min-entry-company { font-size: 10.5px; color: #64748b; font-weight: 500; }
    .cv-min-entry-date { font-size: 9.5px; color: #94a3b8; font-weight: 500; }
    .cv-min-entry-desc { margin-top: 4px; }
    .cv-min-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .cv-min-skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
    .cv-min-skill-tag { font-size: 9.5px; padding: 4px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; color: #1e293b; font-weight: 500; }
    .cv-min-lang-list { display: flex; flex-direction: column; gap: 5px; }
    .cv-min-lang-item { display: flex; justify-content: space-between; font-size: 10px; color: #334155; }
    .cv-min-lang-level { color: #94a3b8; font-size: 9px; }
    .cv-min-custom-list { list-style: disc; margin-left: 18px; }
  `;

  const creativeCSS = `
    .cv-creative { width: 210mm; min-height: 297mm; background: #fff; font-family: 'Outfit', sans-serif; color: #1e293b; }
    .cv-cr-header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #fff; padding: 32px 38px 24px; }
    .cv-cr-header-content { display: flex; align-items: center; gap: 18px; margin-bottom: 16px; }
    .cv-cr-avatar { width: 56px; height: 56px; border-radius: 16px; background: #10b981; border: 2px solid #a7f3d0; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #fff; flex-shrink: 0; }
    .cv-cr-name { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
    .cv-cr-title { font-size: 12.5px; color: #a7f3d0; font-weight: 500; }
    .cv-cr-contact-bar { display: flex; flex-wrap: wrap; gap: 10px; }
    .cv-cr-contact-pill { display: flex; align-items: center; gap: 5px; background: rgba(255, 255, 255, 0.12); padding: 3px 10px; border-radius: 20px; font-size: 9px; color: #ecfdf5; }
    .cv-cr-contact-pill svg { width: 11px; height: 11px; color: #a7f3d0; }
    .cv-cr-body { display: flex; padding: 28px 36px; gap: 28px; }
    .cv-cr-main { flex: 1.6; }
    .cv-cr-sidebar { flex: 1; display: flex; flex-direction: column; gap: 18px; }
    .cv-cr-section { margin-bottom: 20px; }
    .cv-cr-section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #047857; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 2px solid #a7f3d0; }
    .cv-cr-text { font-size: 10px; line-height: 1.65; color: #334155; white-space: pre-line; }
    .cv-cr-entry { margin-bottom: 14px; }
    .cv-cr-entry-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .cv-cr-entry-title { font-size: 12px; font-weight: 700; color: #0f172a; }
    .cv-cr-entry-company { font-size: 10.5px; color: #059669; font-weight: 600; }
    .cv-cr-entry-date { font-size: 9px; color: #94a3b8; }
    .cv-cr-desc { margin-top: 4px; }
    .cv-cr-side-card { background: #f0fdf4; border: 1px solid #dcfce7; padding: 14px; border-radius: 8px; }
    .cv-cr-side-title { font-size: 11px; font-weight: 700; color: #047857; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .cv-cr-skills-list { display: flex; flex-direction: column; gap: 8px; }
    .cv-cr-skill-item { font-size: 9.5px; }
    .cv-cr-skill-info { margin-bottom: 3px; font-weight: 600; color: #166534; }
    .cv-cr-skill-bar { height: 4px; background: #dcfce7; border-radius: 2px; overflow: hidden; }
    .cv-cr-skill-fill { height: 100%; background: #10b981; border-radius: 2px; }
    .cv-cr-lang-list { display: flex; flex-direction: column; gap: 6px; }
    .cv-cr-lang-item { display: flex; justify-content: space-between; font-size: 9.5px; color: #166534; }
    .cv-cr-lang-badge { font-size: 8.5px; color: #047857; font-weight: 600; }
    .cv-cr-custom-list { list-style: disc; margin-left: 14px; font-size: 9.5px; color: #166534; }
  `;

  const technicalCSS = `
    .cv-tech { width: 210mm; min-height: 297mm; background: #fff; padding: 36px 40px; font-family: 'Outfit', sans-serif; color: #0f172a; }
    .cv-tech-header { background: #0f172a; color: #fff; padding: 24px 28px; border-radius: 6px; margin-bottom: 22px; border: 1px solid rgba(99, 102, 241, 0.4); }
    .cv-tech-header-top { display: flex; justify-content: space-between; align-items: center; }
    .cv-tech-name { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    .cv-tech-badge { font-family: monospace; font-size: 9px; padding: 3px 8px; background: rgba(99, 102, 241, 0.25); border: 1px solid #6366f1; color: #a5b4fc; border-radius: 4px; text-transform: uppercase; }
    .cv-tech-title { font-family: monospace; font-size: 11.5px; color: #10b981; margin-top: 4px; }
    .cv-tech-contact-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .cv-tech-contact-tag { font-family: monospace; font-size: 9px; background: #1e293b; color: #94a3b8; padding: 2px 8px; border-radius: 3px; }
    .cv-tech-section { margin-bottom: 18px; }
    .cv-tech-section-title { font-size: 11.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; font-family: monospace; }
    .cv-tech-prompt { color: #6366f1; font-weight: 900; margin-right: 4px; }
    .cv-tech-text { font-size: 10px; line-height: 1.6; color: #334155; }
    .cv-tech-skills-matrix { display: flex; flex-wrap: wrap; gap: 6px; }
    .cv-tech-skill-chip { display: flex; align-items: center; gap: 6px; padding: 3px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 3px; font-size: 9px; font-family: monospace; }
    .cv-tech-skill-name { font-weight: 700; color: #0f172a; }
    .cv-tech-skill-dots { color: #6366f1; font-size: 8px; }
    .cv-tech-entry { margin-bottom: 12px; }
    .cv-tech-entry-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .cv-tech-role { font-size: 11.5px; font-weight: 700; color: #0f172a; }
    .cv-tech-company { font-size: 10px; color: #6366f1; font-weight: 600; font-family: monospace; }
    .cv-tech-date { font-family: monospace; font-size: 9px; color: #64748b; }
    .cv-tech-desc-block { background: #f8fafc; border-left: 2px solid #cbd5e1; padding: 6px 10px; margin-top: 4px; border-radius: 0 4px 4px 0; }
    .cv-tech-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .cv-tech-lang-wrap { display: flex; flex-direction: column; gap: 4px; font-family: monospace; }
    .cv-tech-lang-row { display: flex; justify-content: space-between; font-size: 9.5px; color: #334155; }
    .cv-tech-lang-level { color: #10b981; }
    .cv-tech-list { list-style: square; margin-left: 16px; font-size: 9.5px; }
  `;

  const templateMap: Record<string, string> = {
    modern: modernCSS,
    classic: classicCSS,
    executive: execCSS,
    minimalist: minimalistCSS,
    creative: creativeCSS,
    technical: technicalCSS,
  };

  return base + (templateMap[templateId] || modernCSS);
}
