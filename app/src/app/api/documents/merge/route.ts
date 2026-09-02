import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/db";
import { ObjectId } from "mongodb";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

import { CVData, CoverLetterData } from "@/lib/types";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// Utility to wrap text into lines fitting a maximum width
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Render CV pages into PDFDocument matching exact user template (Modern, Executive, Creative, Technical, Classic, Minimalist)
async function appendCVToPdf(mergedPdf: PDFDocument, cv: CVData) {
  if (cv.pdfBase64) {
    try {
      const base64Data = cv.pdfBase64.includes(",") ? cv.pdfBase64.split(",")[1] : cv.pdfBase64;
      const cvPdfBuf = Buffer.from(base64Data, "base64");
      const externalPdf = await PDFDocument.load(cvPdfBuf);
      const copiedPages = await mergedPdf.copyPages(externalPdf, externalPdf.getPageIndices());
      for (const p of copiedPages) {
        mergedPdf.addPage(p);
      }
      return;
    } catch (e) {
      console.warn("Failed to load CV pdfBase64, using template renderer:", e);
    }
  }

  const page = mergedPdf.addPage([595.28, 841.89]); // A4 size
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await mergedPdf.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();
  const templateId = cv.templateId || "modern";


  if (templateId === "modern") {
    // ==================== MODERN TEMPLATE (Dark Sidebar + Amber Accents) ====================
    const sidebarWidth = 175;

    // Sidebar Background (Dark Slate #0f172a)
    page.drawRectangle({
      x: 0,
      y: 0,
      width: sidebarWidth,
      height: height,
      color: rgb(0.06, 0.09, 0.16),
    });

    let sy = height - 45;
    const sMargin = 16;
    const sContentW = sidebarWidth - sMargin * 2;

    // Avatar Circle & Initials
    const initials = cv.personalInfo.fullName
      ? cv.personalInfo.fullName.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "CV";

    page.drawCircle({
      x: sidebarWidth / 2,
      y: sy - 20,
      size: 26,
      color: rgb(0.12, 0.16, 0.23),
      borderColor: rgb(0.28, 0.33, 0.41),
      borderWidth: 1.5,
    });

    const initW = fontBold.widthOfTextAtSize(initials, 13);
    page.drawText(initials, {
      x: sidebarWidth / 2 - initW / 2,
      y: sy - 25,
      size: 13,
      font: fontBold,
      color: rgb(0.97, 0.98, 0.99),
    });
    sy -= 62;

    // Sidebar Name & Title
    const sNameLines = wrapText(cv.personalInfo.fullName || "Your Name", fontBold, 13, sContentW);
    for (const line of sNameLines) {
      const w = fontBold.widthOfTextAtSize(line, 13);
      page.drawText(line, {
        x: sidebarWidth / 2 - w / 2,
        y: sy,
        size: 13,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      sy -= 15;
    }
    sy -= 2;

    if (cv.personalInfo.title) {
      const sTitleLines = wrapText(cv.personalInfo.title, fontRegular, 9, sContentW);
      for (const line of sTitleLines) {
        const w = fontRegular.widthOfTextAtSize(line, 9);
        page.drawText(line, {
          x: sidebarWidth / 2 - w / 2,
          y: sy,
          size: 9,
          font: fontRegular,
          color: rgb(0.58, 0.64, 0.72),
        });
        sy -= 12;
      }
    }
    sy -= 15;

    // Sidebar Section Header Helper
    const drawSidebarHeader = (title: string) => {
      page.drawText(title.toUpperCase(), {
        x: sMargin,
        y: sy,
        size: 8.5,
        font: fontBold,
        color: rgb(0.96, 0.62, 0.04), // Amber #f59e0b
      });
      sy -= 6;
      page.drawLine({
        start: { x: sMargin, y: sy },
        end: { x: sidebarWidth - sMargin, y: sy },
        thickness: 0.75,
        color: rgb(0.2, 0.25, 0.33),
      });
      sy -= 12;
    };

    // Contact Block
    drawSidebarHeader("Contact");
    const contacts = [
      cv.personalInfo.email,
      cv.personalInfo.phone,
      cv.personalInfo.location,
      cv.personalInfo.website,
      cv.personalInfo.linkedin,
    ].filter(Boolean);

    for (const cStr of contacts) {
      if (!cStr || sy < 30) break;
      const cLines = wrapText(cStr, fontRegular, 8, sContentW);
      for (const l of cLines) {
        page.drawText(l, {
          x: sMargin,
          y: sy,
          size: 8,
          font: fontRegular,
          color: rgb(0.8, 0.84, 0.88),
        });
        sy -= 11;
      }
      sy -= 2;
    }
    sy -= 10;

    // Skills Block with Progress Bars
    if (cv.skills && cv.skills.length > 0 && sy > 40) {
      drawSidebarHeader("Skills");
      for (const sk of cv.skills) {
        if (sy < 40) break;
        page.drawText(sk.name, {
          x: sMargin,
          y: sy,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.88, 0.91, 0.94),
        });
        sy -= 10;
        // Skill Bar
        page.drawRectangle({
          x: sMargin,
          y: sy,
          width: sContentW,
          height: 3.5,
          color: rgb(0.12, 0.16, 0.23),
        });
        const fillW = (sContentW * Math.min(5, Math.max(1, sk.level))) / 5;
        page.drawRectangle({
          x: sMargin,
          y: sy,
          width: fillW,
          height: 3.5,
          color: rgb(0.96, 0.62, 0.04), // Amber fill
        });
        sy -= 12;
      }
      sy -= 10;
    }

    // Languages Block
    if (cv.languages && cv.languages.length > 0 && sy > 40) {
      drawSidebarHeader("Languages");
      for (const lang of cv.languages) {
        if (sy < 30) break;
        page.drawText(lang.name, {
          x: sMargin,
          y: sy,
          size: 8.5,
          font: fontBold,
          color: rgb(0.88, 0.91, 0.94),
        });
        if (lang.proficiency) {
          const pW = fontRegular.widthOfTextAtSize(lang.proficiency, 7.5);
          page.drawText(lang.proficiency, {
            x: sidebarWidth - sMargin - pW,
            y: sy,
            size: 7.5,
            font: fontRegular,
            color: rgb(0.58, 0.64, 0.72),
          });
        }
        sy -= 13;
      }
    }

    // ==================== MAIN CONTENT COLUMN (Right) ====================
    const mainX = sidebarWidth + 24;
    const mainW = width - mainX - 25;
    let my = height - 40;

    const drawMainSectionHeader = (title: string) => {
      page.drawText(title.toUpperCase(), {
        x: mainX,
        y: my,
        size: 11,
        font: fontBold,
        color: rgb(0.06, 0.09, 0.16),
      });
      my -= 5;
      page.drawLine({
        start: { x: mainX, y: my },
        end: { x: width - 25, y: my },
        thickness: 1.5,
        color: rgb(0.96, 0.62, 0.04), // Amber accent line
      });
      my -= 14;
    };

    // Professional Summary
    if (cv.personalInfo.summary) {
      drawMainSectionHeader("Professional Summary");
      const sumLines = wrapText(cv.personalInfo.summary, fontRegular, 9.2, mainW);
      for (const line of sumLines) {
        if (my < 30) break;
        page.drawText(line, {
          x: mainX,
          y: my,
          size: 9.2,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.3),
        });
        my -= 13;
      }
      my -= 12;
    }

    // Work Experience
    if (cv.experience && cv.experience.length > 0 && my > 40) {
      drawMainSectionHeader("Work Experience");
      for (const exp of cv.experience) {
        if (my < 40) break;
        page.drawText(exp.position || "Position", {
          x: mainX,
          y: my,
          size: 10,
          font: fontBold,
          color: rgb(0.06, 0.09, 0.16),
        });

        const dateStr = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`;
        const dW = fontRegular.widthOfTextAtSize(dateStr, 8.5);
        page.drawText(dateStr, {
          x: width - 25 - dW,
          y: my,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.47, 0.53, 0.6),
        });
        my -= 13;

        if (exp.company) {
          page.drawText(exp.company, {
            x: mainX,
            y: my,
            size: 9,
            font: fontOblique,
            color: rgb(0.38, 0.4, 0.95), // Indigo
          });
          my -= 13;
        }

        if (exp.description) {
          const descLines = exp.description.split("\n");
          for (const rawLine of descLines) {
            const wrapped = wrapText(rawLine, fontRegular, 8.8, mainW - 8);
            for (const l of wrapped) {
              if (my < 30) break;
              page.drawText(l, {
                x: mainX + 6,
                y: my,
                size: 8.8,
                font: fontRegular,
                color: rgb(0.25, 0.3, 0.35),
              });
              my -= 12;
            }
          }
        }
        my -= 10;
      }
      my -= 8;
    }

    // Education
    if (cv.education && cv.education.length > 0 && my > 40) {
      drawMainSectionHeader("Education & Qualifications");
      for (const edu of cv.education) {
        if (my < 30) break;
        const degreeStr = `${edu.degree || ""} ${edu.field ? "in " + edu.field : ""}`;
        page.drawText(degreeStr, {
          x: mainX,
          y: my,
          size: 9.5,
          font: fontBold,
          color: rgb(0.06, 0.09, 0.16),
        });

        const eDate = `${edu.startDate || ""} - ${edu.endDate || ""}`;
        const eDW = fontRegular.widthOfTextAtSize(eDate, 8.5);
        page.drawText(eDate, {
          x: width - 25 - eDW,
          y: my,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.47, 0.53, 0.6),
        });
        my -= 13;

        if (edu.institution) {
          page.drawText(edu.institution, {
            x: mainX,
            y: my,
            size: 8.8,
            font: fontOblique,
            color: rgb(0.35, 0.4, 0.5),
          });
          my -= 12;
        }
        my -= 6;
      }
    }

    // Custom Sections (Certifications, Awards, Hobbies, Projects)
    if (cv.customSections && cv.customSections.length > 0 && my > 30) {
      for (const sec of cv.customSections) {
        if (!sec.title && (!sec.items || sec.items.length === 0)) continue;
        if (my < 40) break;
        drawMainSectionHeader(sec.title || "Additional Information");
        for (const item of sec.items) {
          if (!item.text) continue;
          if (my < 30) break;
          const wrapped = wrapText(item.text, fontRegular, 8.8, mainW - 6);
          for (const l of wrapped) {
            if (my < 30) break;
            page.drawText(`•  ${l}`, { x: mainX, y: my, size: 8.8, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
            my -= 12;
          }
        }
        my -= 8;
      }
    }
  } else if (templateId === "executive") {

    // ==================== EXECUTIVE TEMPLATE (Navy Top Banner + Gold Accents) ====================
    // Top Navy Header Banner (#1e293b)
    page.drawRectangle({
      x: 0,
      y: height - 115,
      width: width,
      height: 115,
      color: rgb(0.12, 0.16, 0.23),
    });

    let hy = height - 35;
    // Centered Name
    const nameStr = cv.personalInfo.fullName || "Your Name";
    const nW = fontBold.widthOfTextAtSize(nameStr, 22);
    page.drawText(nameStr, {
      x: width / 2 - nW / 2,
      y: hy,
      size: 22,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    hy -= 20;

    // Centered Title
    if (cv.personalInfo.title) {
      const tStr = cv.personalInfo.title.toUpperCase();
      const tW = fontBold.widthOfTextAtSize(tStr, 11);
      page.drawText(tStr, {
        x: width / 2 - tW / 2,
        y: hy,
        size: 11,
        font: fontBold,
        color: rgb(0.96, 0.62, 0.04), // Amber Gold
      });
      hy -= 20;
    }

    // Centered Contact Bar
    const contactStr = [
      cv.personalInfo.email,
      cv.personalInfo.phone,
      cv.personalInfo.location,
      cv.personalInfo.website,
    ].filter(Boolean).join("   •   ");

    if (contactStr) {
      const cW = fontRegular.widthOfTextAtSize(contactStr, 8.5);
      page.drawText(contactStr, {
        x: width / 2 - cW / 2,
        y: hy,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.8, 0.84, 0.88),
      });
    }

    // Main Body Content
    const margin = 40;
    const contentW = width - margin * 2;
    let y = height - 135;

    const drawExecHeader = (title: string) => {
      page.drawText(title.toUpperCase(), {
        x: margin,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.23),
      });
      y -= 5;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1.5,
        color: rgb(0.96, 0.62, 0.04),
      });
      y -= 14;
    };

    if (cv.personalInfo.summary) {
      drawExecHeader("Executive Profile");
      const sumLines = wrapText(cv.personalInfo.summary, fontRegular, 9.5, contentW);
      for (const l of sumLines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
        y -= 13;
      }
      y -= 12;
    }

    if (cv.experience && cv.experience.length > 0 && y > 40) {
      drawExecHeader("Leadership & Work Experience");
      for (const exp of cv.experience) {
        if (y < 40) break;
        page.drawText(exp.position || "Position", { x: margin, y, size: 10, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        const dStr = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`;
        const dW = fontRegular.widthOfTextAtSize(dStr, 8.5);
        page.drawText(dStr, { x: width - margin - dW, y, size: 8.5, font: fontRegular, color: rgb(0.45, 0.5, 0.55) });
        y -= 13;

        if (exp.company) {
          page.drawText(exp.company, { x: margin, y, size: 9, font: fontOblique, color: rgb(0.96, 0.62, 0.04) });
          y -= 13;
        }

        if (exp.description) {
          const lines = exp.description.split("\n");
          for (const rawL of lines) {
            const wrapped = wrapText(rawL, fontRegular, 9, contentW - 8);
            for (const l of wrapped) {
              if (y < 30) break;
              page.drawText(l, { x: margin + 6, y, size: 9, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
              y -= 12;
            }
          }
        }
        y -= 10;
      }
      y -= 8;
    }

    if (cv.education && cv.education.length > 0 && y > 40) {
      drawExecHeader("Education & Credentials");
      for (const edu of cv.education) {
        if (y < 30) break;
        page.drawText(`${edu.degree || ""} ${edu.field ? "in " + edu.field : ""} — ${edu.institution || ""}`, { x: margin, y, size: 9.5, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        y -= 13;
      }
    }

    // Custom Sections
    if (cv.customSections && cv.customSections.length > 0 && y > 30) {
      for (const sec of cv.customSections) {
        if (!sec.title && (!sec.items || sec.items.length === 0)) continue;
        if (y < 40) break;
        drawExecHeader(sec.title || "Additional Information");
        for (const item of sec.items) {
          if (!item.text) continue;
          if (y < 30) break;
          const wrapped = wrapText(item.text, fontRegular, 9, contentW - 6);
          for (const l of wrapped) {
            if (y < 30) break;
            page.drawText(`•  ${l}`, { x: margin + 6, y, size: 9, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
            y -= 12;
          }
        }
        y -= 8;
      }
    }
  } else if (templateId === "creative") {

    // ==================== CREATIVE TEMPLATE (Purple Banner + 2-Column Layout) ====================
    page.drawRectangle({
      x: 0,
      y: height - 110,
      width: width,
      height: 110,
      color: rgb(0.55, 0.36, 0.96),
    });

    const initials = cv.personalInfo.fullName
      ? cv.personalInfo.fullName.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "CV";

    page.drawCircle({
      x: 50,
      y: height - 55,
      size: 25,
      color: rgb(1, 1, 1),
    });
    const initW = fontBold.widthOfTextAtSize(initials, 13);
    page.drawText(initials, {
      x: 50 - initW / 2,
      y: height - 60,
      size: 13,
      font: fontBold,
      color: rgb(0.55, 0.36, 0.96),
    });

    page.drawText(cv.personalInfo.fullName || "Your Full Name", {
      x: 90,
      y: height - 45,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    if (cv.personalInfo.title) {
      page.drawText(cv.personalInfo.title, {
        x: 90,
        y: height - 63,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.93, 0.9, 1),
      });
    }

    const cParts = [cv.personalInfo.email, cv.personalInfo.phone, cv.personalInfo.location].filter(Boolean);
    if (cParts.length > 0) {
      page.drawText(cParts.join("  •  "), {
        x: 90,
        y: height - 85,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.95, 0.93, 1),
      });
    }

    let y = height - 130;
    const mainX = 35;
    const mainW = 340;
    const sideX = 400;
    const sideW = width - sideX - 35;
    let mainY = y;
    let sideY = y;

    const drawCrMainHeader = (title: string) => {
      page.drawText(title, { x: mainX, y: mainY, size: 11, font: fontBold, color: rgb(0.55, 0.36, 0.96) });
      mainY -= 4;
      page.drawLine({ start: { x: mainX, y: mainY }, end: { x: mainX + mainW, y: mainY }, thickness: 1, color: rgb(0.9, 0.85, 1) });
      mainY -= 14;
    };

    if (cv.personalInfo.summary) {
      drawCrMainHeader("About Me");
      const lines = wrapText(cv.personalInfo.summary, fontRegular, 9, mainW);
      for (const l of lines) {
        if (mainY < 30) break;
        page.drawText(l, { x: mainX, y: mainY, size: 9, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
        mainY -= 13;
      }
      mainY -= 10;
    }

    if (cv.experience && cv.experience.length > 0) {
      drawCrMainHeader("Experience");
      for (const exp of cv.experience) {
        if (mainY < 30) break;
        page.drawText(exp.position || "Position", { x: mainX, y: mainY, size: 9.5, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        const dStr = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`;
        const dW = fontRegular.widthOfTextAtSize(dStr, 8);
        page.drawText(dStr, { x: mainX + mainW - dW, y: mainY, size: 8, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });
        mainY -= 13;
        if (exp.company) {
          page.drawText(exp.company, { x: mainX, y: mainY, size: 8.5, font: fontOblique, color: rgb(0.55, 0.36, 0.96) });
          mainY -= 13;
        }
        if (exp.description) {
          const descs = exp.description.split("\n");
          for (const d of descs) {
            const wrapped = wrapText(d, fontRegular, 8.5, mainW - 6);
            for (const l of wrapped) {
              if (mainY < 30) break;
              page.drawText(l, { x: mainX + 4, y: mainY, size: 8.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
              mainY -= 12;
            }
          }
        }
        mainY -= 8;
      }
      mainY -= 6;
    }

    if (cv.education && cv.education.length > 0) {
      drawCrMainHeader("Education");
      for (const edu of cv.education) {
        if (mainY < 30) break;
        page.drawText(`${edu.degree || ""} ${edu.field ? "in " + edu.field : ""}`, { x: mainX, y: mainY, size: 9.2, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        mainY -= 13;
        if (edu.institution) {
          page.drawText(edu.institution, { x: mainX, y: mainY, size: 8.5, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });
          mainY -= 13;
        }
        mainY -= 6;
      }
    }

    const drawCrSideHeader = (title: string) => {
      page.drawText(title.toUpperCase(), { x: sideX, y: sideY, size: 9.5, font: fontBold, color: rgb(0.55, 0.36, 0.96) });
      sideY -= 4;
      page.drawLine({ start: { x: sideX, y: sideY }, end: { x: sideX + sideW, y: sideY }, thickness: 1, color: rgb(0.9, 0.85, 1) });
      sideY -= 12;
    };

    if (cv.skills && cv.skills.length > 0) {
      drawCrSideHeader("Skills & Expertise");
      for (const sk of cv.skills) {
        if (sideY < 30) break;
        page.drawText(sk.name, { x: sideX, y: sideY, size: 8.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
        sideY -= 10;
        page.drawRectangle({ x: sideX, y: sideY, width: sideW, height: 3, color: rgb(0.92, 0.94, 0.97) });
        const fillW = (sideW * Math.min(5, Math.max(1, sk.level))) / 5;
        page.drawRectangle({ x: sideX, y: sideY, width: fillW, height: 3, color: rgb(0.55, 0.36, 0.96) });
        sideY -= 12;
      }
      sideY -= 8;
    }

    if (cv.languages && cv.languages.length > 0) {
      drawCrSideHeader("Languages");
      for (const lang of cv.languages) {
        if (sideY < 30) break;
        page.drawText(lang.name, { x: sideX, y: sideY, size: 8.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) });
        if (lang.proficiency) {
          const pW = fontRegular.widthOfTextAtSize(lang.proficiency, 7.5);
          page.drawText(lang.proficiency, { x: sideX + sideW - pW, y: sideY, size: 7.5, font: fontRegular, color: rgb(0.55, 0.36, 0.96) });
        }
        sideY -= 13;
      }
    }

    // Custom Sections in Creative Sidebar
    if (cv.customSections && cv.customSections.length > 0 && sideY > 30) {
      for (const sec of cv.customSections) {
        if (!sec.title && (!sec.items || sec.items.length === 0)) continue;
        if (sideY < 40) break;
        drawCrSideHeader(sec.title || "Custom Section");
        for (const item of sec.items) {
          if (!item.text) continue;
          if (sideY < 30) break;
          const wrapped = wrapText(item.text, fontRegular, 8, sideW);
          for (const l of wrapped) {
            if (sideY < 30) break;
            page.drawText(`• ${l}`, { x: sideX, y: sideY, size: 8, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
            sideY -= 11;
          }
        }
        sideY -= 8;
      }
    }
  } else if (templateId === "technical") {

    // ==================== TECHNICAL TEMPLATE (Cyan Accents + Code Brackets) ====================
    const margin = 40;
    const contentW = width - margin * 2;
    let y = height - margin;

    page.drawRectangle({ x: margin, y: y - 2, width: contentW, height: 4, color: rgb(0.05, 0.65, 0.91) });
    y -= 25;

    page.drawText(cv.personalInfo.fullName || "Developer / Engineer", { x: margin, y, size: 20, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
    y -= 18;

    if (cv.personalInfo.title) {
      page.drawText(`// ${cv.personalInfo.title}`, { x: margin, y, size: 11, font: fontBold, color: rgb(0.05, 0.65, 0.91) });
      y -= 18;
    }

    const cParts = [cv.personalInfo.email, cv.personalInfo.phone, cv.personalInfo.location, cv.personalInfo.website].filter(Boolean);
    if (cParts.length > 0) {
      page.drawText(cParts.join("  |  "), { x: margin, y, size: 8.5, font: fontRegular, color: rgb(0.4, 0.45, 0.52) });
      y -= 18;
    }

    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.75, color: rgb(0.85, 0.88, 0.92) });
    y -= 20;

    const drawTechHeader = (title: string) => {
      page.drawText(`[ ${title.toUpperCase()} ]`, { x: margin, y, size: 10.5, font: fontBold, color: rgb(0.05, 0.65, 0.91) });
      y -= 14;
    };

    if (cv.personalInfo.summary) {
      drawTechHeader("SUMMARY");
      const lines = wrapText(cv.personalInfo.summary, fontRegular, 9, contentW);
      for (const l of lines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
        y -= 13;
      }
      y -= 10;
    }

    if (cv.skills && cv.skills.length > 0) {
      drawTechHeader("TECHNICAL SKILLS");
      const skStr = cv.skills.map((s) => s.name).join("  •  ");
      const skLines = wrapText(skStr, fontRegular, 9, contentW);
      for (const l of skLines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.12, 0.16, 0.23) });
        y -= 13;
      }
      y -= 10;
    }

    if (cv.experience && cv.experience.length > 0) {
      drawTechHeader("WORK EXPERIENCE");
      for (const exp of cv.experience) {
        if (y < 30) break;
        page.drawText(`${exp.position || "Position"} @ ${exp.company || "Company"}`, { x: margin, y, size: 9.5, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        const dStr = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`;
        const dW = fontRegular.widthOfTextAtSize(dStr, 8);
        page.drawText(dStr, { x: width - margin - dW, y, size: 8, font: fontRegular, color: rgb(0.45, 0.5, 0.55) });
        y -= 13;
        if (exp.description) {
          const descs = exp.description.split("\n");
          for (const d of descs) {
            const wrapped = wrapText(d, fontRegular, 8.5, contentW - 8);
            for (const l of wrapped) {
              if (y < 30) break;
              page.drawText(l, { x: margin + 6, y, size: 8.5, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
              y -= 12;
            }
          }
        }
        y -= 8;
      }
      y -= 8;
    }

    if (cv.education && cv.education.length > 0) {
      drawTechHeader("EDUCATION");
      for (const edu of cv.education) {
        if (y < 30) break;
        page.drawText(`${edu.degree || ""} ${edu.field ? "in " + edu.field : ""} — ${edu.institution || ""}`, { x: margin, y, size: 9.2, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        y -= 13;
      }
      y -= 8;
    }

    if (cv.languages && cv.languages.length > 0 && y > 30) {
      drawTechHeader("LANGUAGES");
      const langStr = cv.languages.map((l) => `${l.name} (${l.proficiency || "Native"})`).join("  •  ");
      const langLines = wrapText(langStr, fontRegular, 8.8, contentW);
      for (const l of langLines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 8.8, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
        y -= 13;
      }
      y -= 8;
    }

    if (cv.customSections && cv.customSections.length > 0 && y > 30) {
      for (const sec of cv.customSections) {
        if (!sec.title && (!sec.items || sec.items.length === 0)) continue;
        if (y < 40) break;
        drawTechHeader(sec.title.toUpperCase());
        for (const item of sec.items) {
          if (!item.text) continue;
          if (y < 30) break;
          const wrapped = wrapText(item.text, fontRegular, 8.8, contentW - 6);
          for (const l of wrapped) {
            if (y < 30) break;
            page.drawText(`> ${l}`, { x: margin, y, size: 8.8, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
            y -= 12;
          }
        }
        y -= 8;
      }
    }
  } else if (templateId === "classic") {

    // ==================== CLASSIC TEMPLATE (Warm Paper Tone #faf8f5 + Double Dividers) ====================
    // Draw full page warm paper tone background (#faf8f5)
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(0.98, 0.97, 0.96),
    });

    const margin = 45;
    const contentW = width - margin * 2;
    let y = height - margin;


    const nameStr = cv.personalInfo.fullName || "Your Full Name";
    const nW = fontBold.widthOfTextAtSize(nameStr, 20);
    page.drawText(nameStr, { x: width / 2 - nW / 2, y, size: 20, font: fontBold, color: rgb(0.09, 0.11, 0.17) });
    y -= 18;

    if (cv.personalInfo.title) {
      const tW = fontOblique.widthOfTextAtSize(cv.personalInfo.title, 11);
      page.drawText(cv.personalInfo.title, { x: width / 2 - tW / 2, y, size: 11, font: fontOblique, color: rgb(0.35, 0.4, 0.48) });
      y -= 16;
    }

    const cParts = [cv.personalInfo.email, cv.personalInfo.phone, cv.personalInfo.location, cv.personalInfo.website].filter(Boolean);
    if (cParts.length > 0) {
      const cStr = cParts.join("   |   ");
      const cW = fontRegular.widthOfTextAtSize(cStr, 8.5);
      page.drawText(cStr, { x: width / 2 - cW / 2, y, size: 8.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
      y -= 18;
    }

    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.2, 0.25, 0.3) });
    y -= 3;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.4, 0.45, 0.5) });
    y -= 20;

    const drawClassicHeader = (title: string) => {
      page.drawText(title.toUpperCase(), { x: margin, y, size: 10.5, font: fontBold, color: rgb(0.09, 0.11, 0.17) });
      y -= 4;
      page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.75, color: rgb(0.7, 0.75, 0.8) });
      y -= 14;
    };

    if (cv.personalInfo.summary) {
      drawClassicHeader("Professional Summary");
      const lines = wrapText(cv.personalInfo.summary, fontRegular, 9.2, contentW);
      for (const l of lines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 9.2, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
        y -= 13;
      }
      y -= 10;
    }

    if (cv.experience && cv.experience.length > 0) {
      drawClassicHeader("Professional Experience");
      for (const exp of cv.experience) {
        if (y < 30) break;
        page.drawText(exp.position || "Position", { x: margin, y, size: 9.8, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        const dStr = `${exp.startDate || ""} — ${exp.current ? "Present" : exp.endDate || ""}`;
        const dW = fontRegular.widthOfTextAtSize(dStr, 8.5);
        page.drawText(dStr, { x: width - margin - dW, y, size: 8.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
        y -= 13;
        if (exp.company) {
          page.drawText(exp.company, { x: margin, y, size: 9, font: fontOblique, color: rgb(0.3, 0.35, 0.4) });
          y -= 13;
        }
        if (exp.description) {
          const descs = exp.description.split("\n");
          for (const d of descs) {
            const wrapped = wrapText(d, fontRegular, 8.8, contentW - 6);
            for (const l of wrapped) {
              if (y < 30) break;
              page.drawText(l, { x: margin + 6, y, size: 8.8, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
              y -= 12;
            }
          }
        }
        y -= 8;
      }
      y -= 8;
    }

    if (cv.education && cv.education.length > 0) {
      drawClassicHeader("Education");
      for (const edu of cv.education) {
        if (y < 30) break;
        page.drawText(`${edu.degree || ""}${edu.field ? " in " + edu.field : ""}`, { x: margin, y, size: 9.5, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        y -= 13;
        if (edu.institution) {
          page.drawText(edu.institution, { x: margin, y, size: 8.8, font: fontOblique, color: rgb(0.35, 0.4, 0.45) });
          y -= 13;
        }
        y -= 6;
      }
      y -= 8;
    }

    if (cv.skills && cv.skills.length > 0) {
      drawClassicHeader("Skills");
      const skStr = cv.skills.map((s) => s.name).join("   •   ");
      const skLines = wrapText(skStr, fontRegular, 9, contentW);
      for (const l of skLines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
        y -= 13;
      }
      y -= 8;
    }

    if (cv.languages && cv.languages.length > 0 && y > 30) {
      drawClassicHeader("Languages");
      const langStr = cv.languages.map((l) => `${l.name} (${l.proficiency || "Proficient"})`).join("   •   ");
      const langLines = wrapText(langStr, fontRegular, 9, contentW);
      for (const l of langLines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
        y -= 13;
      }
      y -= 8;
    }

    if (cv.customSections && cv.customSections.length > 0 && y > 30) {
      for (const sec of cv.customSections) {
        if (!sec.title && (!sec.items || sec.items.length === 0)) continue;
        if (y < 40) break;
        drawClassicHeader(sec.title);
        for (const item of sec.items) {
          if (!item.text) continue;
          if (y < 30) break;
          const wrapped = wrapText(item.text, fontRegular, 9, contentW - 6);
          for (const l of wrapped) {
            if (y < 30) break;
            page.drawText(`•  ${l}`, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
            y -= 12;
          }
        }
        y -= 8;
      }
    }
  } else {

    // ==================== MINIMALIST TEMPLATE (Clean Whitespace + Subtle Dividers) ====================
    const margin = 45;
    const contentW = width - margin * 2;
    let y = height - margin;

    page.drawText(cv.personalInfo.fullName || "Curriculum Vitae", { x: margin, y, size: 20, font: fontBold, color: rgb(0.09, 0.11, 0.17) });
    y -= 18;

    if (cv.personalInfo.title) {
      page.drawText(cv.personalInfo.title, { x: margin, y, size: 11, font: fontRegular, color: rgb(0.45, 0.5, 0.55) });
      y -= 16;
    }

    const cParts = [cv.personalInfo.email, cv.personalInfo.phone, cv.personalInfo.location, cv.personalInfo.website].filter(Boolean);
    if (cParts.length > 0) {
      page.drawText(cParts.join("   •   "), { x: margin, y, size: 8.5, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });
      y -= 18;
    }

    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.88, 0.9, 0.92) });
    y -= 20;

    const drawMinHeader = (title: string) => {
      page.drawText(title, { x: margin, y, size: 10, font: fontBold, color: rgb(0.15, 0.18, 0.25) });
      y -= 14;
    };

    if (cv.personalInfo.summary) {
      drawMinHeader("Summary");
      const lines = wrapText(cv.personalInfo.summary, fontRegular, 9, contentW);
      for (const l of lines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
        y -= 13;
      }
      y -= 12;
    }

    if (cv.experience && cv.experience.length > 0) {
      drawMinHeader("Experience");
      for (const exp of cv.experience) {
        if (y < 30) break;
        page.drawText(`${exp.position || "Position"} — ${exp.company || "Company"}`, { x: margin, y, size: 9.5, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        const dStr = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`;
        const dW = fontRegular.widthOfTextAtSize(dStr, 8);
        page.drawText(dStr, { x: width - margin - dW, y, size: 8, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });
        y -= 13;
        if (exp.description) {
          const descs = exp.description.split("\n");
          for (const d of descs) {
            const wrapped = wrapText(d, fontRegular, 8.5, contentW - 6);
            for (const l of wrapped) {
              if (y < 30) break;
              page.drawText(l, { x: margin + 4, y, size: 8.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
              y -= 12;
            }
          }
        }
        y -= 8;
      }
      y -= 8;
    }

    if (cv.education && cv.education.length > 0) {
      drawMinHeader("Education");
      for (const edu of cv.education) {
        if (y < 30) break;
        page.drawText(`${edu.degree || ""} ${edu.field ? "in " + edu.field : ""} — ${edu.institution || ""}`, { x: margin, y, size: 9.2, font: fontBold, color: rgb(0.12, 0.16, 0.23) });
        y -= 13;
      }
      y -= 8;
    }

    if (cv.skills && cv.skills.length > 0) {
      drawMinHeader("Skills");
      const skStr = cv.skills.map((s) => s.name).join("  •  ");
      const skLines = wrapText(skStr, fontRegular, 8.8, contentW);
      for (const l of skLines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 8.8, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
        y -= 13;
      }
      y -= 8;
    }

    if (cv.languages && cv.languages.length > 0 && y > 30) {
      drawMinHeader("Languages");
      const langStr = cv.languages.map((l) => `${l.name} (${l.proficiency || "Proficient"})`).join("  •  ");
      const langLines = wrapText(langStr, fontRegular, 8.8, contentW);
      for (const l of langLines) {
        if (y < 30) break;
        page.drawText(l, { x: margin, y, size: 8.8, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
        y -= 13;
      }
      y -= 8;
    }

    if (cv.customSections && cv.customSections.length > 0 && y > 30) {
      for (const sec of cv.customSections) {
        if (!sec.title && (!sec.items || sec.items.length === 0)) continue;
        if (y < 40) break;
        drawMinHeader(sec.title);
        for (const item of sec.items) {
          if (!item.text) continue;
          if (y < 30) break;
          const wrapped = wrapText(item.text, fontRegular, 8.8, contentW - 6);
          for (const l of wrapped) {
            if (y < 30) break;
            page.drawText(`•  ${l}`, { x: margin, y, size: 8.8, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
            y -= 12;
          }
        }
        y -= 8;
      }
    }
  }


}

// Render Cover Letter into PDFDocument matching user template
async function appendCoverLetterToPdf(mergedPdf: PDFDocument, letter: CoverLetterData) {
  if (letter.pdfBase64) {
    try {
      const base64Data = letter.pdfBase64.includes(",") ? letter.pdfBase64.split(",")[1] : letter.pdfBase64;
      const letterPdfBuf = Buffer.from(base64Data, "base64");
      const externalPdf = await PDFDocument.load(letterPdfBuf);
      const copiedPages = await mergedPdf.copyPages(externalPdf, externalPdf.getPageIndices());
      for (const p of copiedPages) {
        mergedPdf.addPage(p);
      }
      return;
    } catch (e) {
      console.warn("Failed to load Cover Letter pdfBase64, using template renderer:", e);
    }
  }

  const page = mergedPdf.addPage([595.28, 841.89]);
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const templateId = letter.templateId || "modern";
  const margin = 45;
  const contentWidth = width - margin * 2;


  let y = height - margin;

  if (templateId === "executive") {
    // Executive Cover Letter Header
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: rgb(0.12, 0.16, 0.23),
    });

    const nameStr = letter.personalInfo.fullName || "Applicant";
    const nW = fontBold.widthOfTextAtSize(nameStr, 20);
    page.drawText(nameStr, { x: width / 2 - nW / 2, y: height - 40, size: 20, font: fontBold, color: rgb(1, 1, 1) });

    const cStr = [letter.personalInfo.email, letter.personalInfo.phone, letter.personalInfo.location].filter(Boolean).join("   •   ");
    if (cStr) {
      const cW = fontRegular.widthOfTextAtSize(cStr, 8.5);
      page.drawText(cStr, { x: width / 2 - cW / 2, y: height - 65, size: 8.5, font: fontRegular, color: rgb(0.96, 0.62, 0.04) });
    }

    y = height - 120;
  } else {
    // Modern / Creative Header Accent Bar
    page.drawRectangle({
      x: margin,
      y: y - 2,
      width: contentWidth,
      height: 4,
      color: templateId === "creative" ? rgb(0.55, 0.36, 0.96) : rgb(0.96, 0.62, 0.04),
    });
    y -= 25;

    page.drawText(letter.personalInfo.fullName || "Applicant", { x: margin, y, size: 20, font: fontBold, color: rgb(0.09, 0.11, 0.17) });
    y -= 18;

    const senderContact = [letter.personalInfo.email, letter.personalInfo.phone, letter.personalInfo.location].filter(Boolean).join("  |  ");
    if (senderContact) {
      page.drawText(senderContact, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });
      y -= 20;
    }

    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.75, color: rgb(0.88, 0.9, 0.94) });
    y -= 25;
  }

  // Date
  page.drawText(letter.letterDetails.date || new Date().toLocaleDateString(), { x: margin, y, size: 9.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
  y -= 25;

  // Recipient Block
  if (letter.recipient.hiringManager) {
    page.drawText(letter.recipient.hiringManager, { x: margin, y, size: 10, font: fontBold, color: rgb(0.12, 0.15, 0.22) });
    y -= 14;
  }
  if (letter.recipient.jobTitle) {
    page.drawText(`Re: Application for ${letter.recipient.jobTitle}`, { x: margin, y, size: 10, font: fontBold, color: rgb(0.38, 0.4, 0.95) });
    y -= 14;
  }
  if (letter.recipient.companyName) {
    page.drawText(letter.recipient.companyName, { x: margin, y, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
    y -= 14;
  }
  if (letter.recipient.companyAddress) {
    page.drawText(letter.recipient.companyAddress, { x: margin, y, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
    y -= 14;
  }
  y -= 15;

  // Greeting
  const greetingText = letter.letterDetails.greeting || `Dear ${letter.recipient.hiringManager || "Hiring Manager"},`;
  page.drawText(greetingText, { x: margin, y, size: 10, font: fontBold, color: rgb(0.09, 0.11, 0.17) });
  y -= 20;

  // Body Paragraphs
  const paragraphs = [
    letter.letterDetails.openingParagraph,
    letter.letterDetails.bodyParagraph1,
    letter.letterDetails.bodyParagraph2,
    letter.letterDetails.closingParagraph,
  ].filter(Boolean);

  for (const para of paragraphs) {
    if (!para || !para.trim()) continue;
    const lines = wrapText(para, fontRegular, 9.5, contentWidth);
    for (const l of lines) {
      if (y < margin + 30) break;
      page.drawText(l, { x: margin, y, size: 9.5, font: fontRegular, color: rgb(0.2, 0.23, 0.28) });
      y -= 14;
    }
    y -= 12;
  }


  // Sign off
  y -= 10;
  page.drawText(letter.letterDetails.signOff || "Sincerely,", { x: margin, y, size: 10, font: fontRegular, color: rgb(0.2, 0.23, 0.28) });
  y -= 20;
  page.drawText(letter.personalInfo.fullName || "Applicant", { x: margin, y, size: 10.5, font: fontBold, color: rgb(0.1, 0.12, 0.18) });
}

// Fetch file helper
async function fetchFileBuffer(url: string, db: any): Promise<Buffer> {
  if (url.startsWith("data:")) {
    const base64Data = url.split(",")[1];
    return Buffer.from(base64Data, "base64");
  }

  if (url.includes("/api/documents/file/")) {
    const fileId = url.split("/api/documents/file/")[1];
    if (fileId && ObjectId.isValid(fileId)) {
      const fileDoc = await db.collection("document_files").findOne({ _id: new ObjectId(fileId) });
      if (fileDoc && fileDoc.data) {
        return Buffer.from(fileDoc.data.buffer || fileDoc.data);
      }
    }
  }

  const fetchUrl = url.startsWith("/") ? `http://localhost:3000${url}` : url;
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`Failed to fetch file from ${url}`);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}


export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { cvId, coverLetterId, documentIds, orderedItems, cvPdfBase64, letterPdfBase64 } = body as {
      cvId?: string;
      coverLetterId?: string;
      documentIds?: string[];
      orderedItems?: { id: string; type: "cv" | "cover_letter" | "document" }[];
      cvPdfBase64?: string;
      letterPdfBase64?: string;
    };


    const db = client.db();
    const mergedPdf = await PDFDocument.create();

    const processSingleDocument = async (doc: any) => {
      if (!doc || !doc.fileUrl) return;
      try {
        const fileBuf = await fetchFileBuffer(doc.fileUrl, db);

        if (doc.fileType === "pdf" || doc.fileName.toLowerCase().endsWith(".pdf")) {
          const externalPdf = await PDFDocument.load(fileBuf);
          const copiedPages = await mergedPdf.copyPages(externalPdf, externalPdf.getPageIndices());
          const rotationDeg = (doc.rotation || 0) % 360;
          for (const p of copiedPages) {
            if (rotationDeg > 0) {
              const currentAngle = p.getRotation().angle;
              p.setRotation(degrees((currentAngle + rotationDeg) % 360));
            }
            mergedPdf.addPage(p);
          }
        }
 else {
          // Image document (JPG / PNG)
          const page = mergedPdf.addPage([595.28, 841.89]);
          const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
          const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);

          const { width, height } = page.getSize();
          const margin = 40;

          // Title header for the attachment
          const categoryLabel = doc.category === "Custom" ? doc.customCategory || "Attachment" : doc.category;
          page.drawText(`${categoryLabel.toUpperCase()}: ${doc.title}`, {
            x: margin,
            y: height - margin,
            size: 12,
            font: fontBold,
            color: rgb(0.1, 0.12, 0.18),
          });

          page.drawText(`File: ${doc.fileName}`, {
            x: margin,
            y: height - margin - 14,
            size: 8.5,
            font: fontRegular,
            color: rgb(0.4, 0.45, 0.55),
          });

          // Embed image
          let embeddedImage;
          if (
            doc.fileName.toLowerCase().endsWith(".png") ||
            doc.fileUrl.startsWith("data:image/png")
          ) {
            embeddedImage = await mergedPdf.embedPng(fileBuf);
          } else {
            embeddedImage = await mergedPdf.embedJpg(fileBuf);
          }

          const imgDims = embeddedImage.scale(1);
          const maxImgWidth = width - margin * 2;
          const maxImgHeight = height - margin * 2 - 40;

          const rotationDeg = (doc.rotation || 0) % 360;
          const is90or270 = rotationDeg === 90 || rotationDeg === 270;

          const effectiveW = is90or270 ? imgDims.height : imgDims.width;
          const effectiveH = is90or270 ? imgDims.width : imgDims.height;

          let scaleRatio = Math.min(maxImgWidth / effectiveW, maxImgHeight / effectiveH);
          if (scaleRatio > 1) scaleRatio = 1;

          const scaledW = imgDims.width * scaleRatio;
          const scaledH = imgDims.height * scaleRatio;

          const centerX = margin + maxImgWidth / 2;
          const centerY = height - margin - 35 - maxImgHeight / 2;

          let drawX = centerX - scaledW / 2;
          let drawY = centerY - scaledH / 2;

          if (rotationDeg === 90) {
            drawX = centerX + scaledH / 2;
            drawY = centerY - scaledW / 2;
          } else if (rotationDeg === 180) {
            drawX = centerX + scaledW / 2;
            drawY = centerY + scaledH / 2;
          } else if (rotationDeg === 270) {
            drawX = centerX - scaledH / 2;
            drawY = centerY + scaledW / 2;
          }

          page.drawImage(embeddedImage, {
            x: drawX,
            y: drawY,
            width: scaledW,
            height: scaledH,
            rotate: degrees(rotationDeg),
          });
        }
      } catch (docErr) {
        console.error(`Failed to process attachment ${doc.title}:`, docErr);
      }
    };

    if (orderedItems && Array.isArray(orderedItems) && orderedItems.length > 0) {
      // User-defined explicit sequence
      for (const item of orderedItems) {
        if (!item.id || !ObjectId.isValid(item.id)) continue;
        const objId = new ObjectId(item.id);

        if (item.type === "cv") {
          const cvDoc = await db.collection("cvs").findOne({ _id: objId, userId: user.id });
          if (cvDoc) {
            const docData = { ...cvDoc } as unknown as CVData;
            if (cvPdfBase64) docData.pdfBase64 = cvPdfBase64;
            await appendCVToPdf(mergedPdf, docData);
          }
        } else if (item.type === "cover_letter") {
          const letterDoc = await db.collection("cover_letters").findOne({ _id: objId, userId: user.id });
          if (letterDoc) {
            const letterData = { ...letterDoc } as unknown as CoverLetterData;
            if (letterPdfBase64) letterData.pdfBase64 = letterPdfBase64;
            await appendCoverLetterToPdf(mergedPdf, letterData);
          }
        } else if (item.type === "document") {
          const doc = await db.collection("documents").findOne({ _id: objId, userId: user.id });
          if (doc) await processSingleDocument(doc);
        }
      }
    } else {
      // Legacy default order sequence: CV -> Cover Letter -> Documents
      if (cvId && ObjectId.isValid(cvId)) {
        const cvDoc = await db.collection("cvs").findOne({ _id: new ObjectId(cvId), userId: user.id });
        if (cvDoc) {
          const docData = { ...cvDoc } as unknown as CVData;
          if (cvPdfBase64) docData.pdfBase64 = cvPdfBase64;
          await appendCVToPdf(mergedPdf, docData);
        }
      }

      if (coverLetterId && ObjectId.isValid(coverLetterId)) {
        const letterDoc = await db.collection("cover_letters").findOne({ _id: new ObjectId(coverLetterId), userId: user.id });
        if (letterDoc) {
          const letterData = { ...letterDoc } as unknown as CoverLetterData;
          if (letterPdfBase64) letterData.pdfBase64 = letterPdfBase64;
          await appendCoverLetterToPdf(mergedPdf, letterData);
        }
      }


      if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
        const validObjectIds = documentIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
        if (validObjectIds.length > 0) {
          const docs = await db.collection("documents").find({ _id: { $in: validObjectIds }, userId: user.id }).toArray();
          const docsMap = new Map(docs.map((d) => [d._id.toString(), d]));
          for (const docId of documentIds) {
            const doc = docsMap.get(docId);
            if (doc) await processSingleDocument(doc);
          }
        }
      }
    }


    // Save final combined PDF
    const finalPdfBytes = await mergedPdf.save();

    return new NextResponse(Buffer.from(finalPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Application_Portfolio.pdf"',
      },
    });

  } catch (error: any) {
    console.error("PDF Merge failed:", error);
    return NextResponse.json({ error: error.message || "Failed to merge PDF documents" }, { status: 500 });
  }
}
