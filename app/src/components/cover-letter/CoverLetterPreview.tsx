"use client";

import { CoverLetterData } from "@/lib/types";
import ModernCoverLetter from "./ModernCoverLetter";
import ClassicCoverLetter from "./ClassicCoverLetter";
import ExecutiveCoverLetter from "./ExecutiveCoverLetter";
import { useRef } from "react";

interface Props {
  data: CoverLetterData;
}

export default function CoverLetterPreview({ data }: Props) {
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
          <title>${data.title || "Cover Letter"} - CV Studio</title>
          <style>${getCoverLetterPrintStyles(data.templateId)}</style>
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
          <span className="cv-preview-label">Live A4 Letter Preview</span>
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
          {data.templateId === "modern" && <ModernCoverLetter data={data} />}
          {data.templateId === "classic" && <ClassicCoverLetter data={data} />}
          {data.templateId === "executive" && <ExecutiveCoverLetter data={data} />}
        </div>
      </div>
    </div>
  );
}

function getCoverLetterPrintStyles(templateId: string): string {
  const base = `
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Outfit', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; color: #1e293b; }
    @page { size: A4; margin: 0; }
  `;

  const modernCSS = `
    .cl-modern { width: 210mm; min-height: 297mm; background: #ffffff; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; }
    .cl-modern-header { background: #0f172a; color: #ffffff; padding: 34px 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #f59e0b; }
    .cl-modern-avatar { width: 56px; height: 56px; border-radius: 50%; background: #1e293b; border: 2px solid #475569; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #ffffff; flex-shrink: 0; margin-right: 18px; }
    .cl-modern-identity { flex: 1; }
    .cl-modern-name { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; margin-bottom: 2px; }
    .cl-modern-title { font-size: 13px; color: #94a3b8; font-weight: 500; }
    .cl-modern-contacts { display: flex; flex-direction: column; gap: 4px; font-size: 10px; color: #cbd5e1; text-align: right; }
    .cl-modern-contact-item { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
    .cl-modern-contact-item svg { width: 12px; height: 12px; color: #f59e0b; }
    .cl-modern-body { padding: 40px 48px; flex: 1; display: flex; flex-direction: column; }
    .cl-modern-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .cl-modern-date { font-size: 12px; font-weight: 600; color: #64748b; }
    .cl-modern-recipient { font-size: 12px; color: #334155; line-height: 1.5; text-align: right; }
    .cl-modern-recipient-name { font-weight: 700; color: #0f172a; font-size: 13px; }
    .cl-modern-recipient-role { color: #f59e0b; font-weight: 600; }
    .cl-modern-recipient-company { font-weight: 600; }
    .cl-modern-recipient-sub { color: #64748b; }
    .cl-modern-salutation { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 18px; }
    .cl-modern-content { display: flex; flex-direction: column; gap: 16px; flex: 1; }
    .cl-modern-paragraph { font-size: 12px; line-height: 1.72; color: #334155; text-align: justify; }
    .cl-modern-signoff { margin-top: 36px; padding-top: 18px; }
    .cl-modern-signoff-word { font-size: 12.5px; color: #64748b; margin-bottom: 24px; }
    .cl-modern-signature-name { font-size: 14px; font-weight: 700; color: #0f172a; }
    .cl-modern-signature-title { font-size: 11.5px; color: #64748b; margin-top: 2px; }
  `;

  const classicCSS = `
    .cl-classic { width: 210mm; min-height: 297mm; background: #faf8f5; padding: 46px 52px; font-family: 'Newsreader', Georgia, serif; color: #1c1917; display: flex; flex-direction: column; }
    .cl-classic-header { text-align: center; margin-bottom: 8px; }
    .cl-classic-name { font-size: 26px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #1c1917; }
    .cl-classic-title { font-size: 13.5px; color: #78716c; font-style: italic; margin-top: 3px; font-weight: 400; }
    .cl-classic-contacts { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 10px; font-size: 10px; color: #57534e; font-family: 'Outfit', sans-serif; }
    .cl-classic-contact-item:not(:last-child)::after { content: '·'; margin-left: 8px; color: #a8a29e; }
    .cl-classic-divider { border: none; border-top: 0.5px solid #d6d3d1; margin: 18px 0 26px; }
    .cl-classic-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; font-size: 12px; }
    .cl-classic-date { color: #78716c; font-style: italic; }
    .cl-classic-recipient { line-height: 1.5; color: #292524; text-align: right; }
    .cl-classic-recipient-name { font-weight: 700; color: #1c1917; }
    .cl-classic-recipient-role { font-style: italic; color: #78716c; }
    .cl-classic-recipient-company { font-weight: 600; }
    .cl-classic-recipient-sub { color: #57534e; font-size: 11px; }
    .cl-classic-salutation { font-size: 14px; font-weight: 700; margin-bottom: 18px; }
    .cl-classic-content { display: flex; flex-direction: column; gap: 16px; flex: 1; }
    .cl-classic-paragraph { font-size: 12.5px; line-height: 1.75; color: #292524; text-align: justify; text-indent: 1.5em; }
    .cl-classic-paragraph:first-child { text-indent: 0; }
    .cl-classic-signoff { margin-top: 36px; }
    .cl-classic-signoff-word { font-size: 13px; font-style: italic; color: #57534e; margin-bottom: 24px; }
    .cl-classic-signature-name { font-size: 14.5px; font-weight: 700; color: #1c1917; }
  `;

  const execCSS = `
    .cl-exec { width: 210mm; min-height: 297mm; background: #ffffff; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; }
    .cl-exec-header { background: #090a10; color: #ffffff; padding: 36px 44px; border-bottom: 3px solid #6366f1; }
    .cl-exec-name { font-size: 28px; font-weight: 800; letter-spacing: 0.01em; color: #ffffff; margin-bottom: 3px; }
    .cl-exec-title { font-size: 13.5px; color: #94a3b8; font-weight: 500; margin-bottom: 12px; }
    .cl-exec-contacts { display: flex; flex-wrap: wrap; gap: 16px; font-size: 10px; }
    .cl-exec-contact-item { display: flex; align-items: center; gap: 5px; color: #cbd5e1; }
    .cl-exec-contact-item svg { width: 12px; height: 12px; color: #818cf8; }
    .cl-exec-body { padding: 40px 48px; flex: 1; display: flex; flex-direction: column; }
    .cl-exec-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 1px solid #e2e8f0; padding-bottom: 18px; }
    .cl-exec-recipient { font-size: 12px; color: #334155; line-height: 1.5; }
    .cl-exec-recipient-name { font-weight: 700; color: #0f172a; font-size: 13px; }
    .cl-exec-recipient-role { color: #6366f1; font-weight: 600; }
    .cl-exec-recipient-company { font-weight: 600; }
    .cl-exec-recipient-sub { color: #64748b; }
    .cl-exec-date { font-size: 12px; font-weight: 600; color: #64748b; }
    .cl-exec-salutation { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 18px; }
    .cl-exec-content { display: flex; flex-direction: column; gap: 16px; flex: 1; }
    .cl-exec-paragraph { font-size: 12px; line-height: 1.72; color: #334155; text-align: justify; }
    .cl-exec-signoff { margin-top: 36px; padding-top: 18px; }
    .cl-exec-signoff-word { font-size: 12.5px; color: #64748b; margin-bottom: 24px; }
    .cl-exec-signature-name { font-size: 14px; font-weight: 700; color: #0f172a; }
    .cl-exec-signature-title { font-size: 11.5px; color: #64748b; margin-top: 2px; }
  `;

  const map: Record<string, string> = {
    modern: modernCSS,
    classic: classicCSS,
    executive: execCSS,
  };

  return base + (map[templateId] || modernCSS);
}
