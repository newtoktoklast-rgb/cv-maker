import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function captureHtmlToPdfBase64(element: HTMLElement): Promise<string | null> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: null,
    });


    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    return pdf.output("datauristring");
  } catch (error) {
    console.error("Failed to capture HTML to PDF base64:", error);
    return null;
  }
}
