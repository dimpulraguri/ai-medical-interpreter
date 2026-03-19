import Tesseract from "tesseract.js";
import pdfParse from "pdf-parse";
import { ocrScannedPdf } from "./pdfOcr.js";

export async function extractTextFromUpload(input: { mimeType: string; buffer: Buffer }) {
  const { mimeType, buffer } = input;

  if (mimeType === "application/pdf") {
    const parsed = await pdfParse(buffer);
    const text = (parsed.text ?? "").trim();
    if (text && text.length >= 40) return { text, method: "pdf-parse" as const };
    const ocr = await ocrScannedPdf(buffer);
    return { text: ocr.text, method: `pdf-ocr:${ocr.pagesOcred}` as const };
  }

  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const res = await Tesseract.recognize(buffer, "eng");
    const text = (res.data.text ?? "").trim();
    return { text, method: "tesseract" as const };
  }

  throw new Error(`Unsupported mimeType: ${mimeType}`);
}
