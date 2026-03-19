import { env } from "../config/env.js";
import Tesseract from "tesseract.js";

export async function ocrScannedPdf(buffer: Buffer) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("@napi-rs/canvas");

  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const maxPages = Math.min(env.PDF_OCR_MAX_PAGES, pdf.numPages);
  const texts: string[] = [];

  for (let p = 1; p <= maxPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d");

    await page.render({ canvasContext: ctx as any, viewport }).promise;
    const png = canvas.toBuffer("image/png");

    const res = await Tesseract.recognize(png, "eng");
    const t = (res.data.text ?? "").trim();
    if (t) texts.push(t);
  }

  return { text: texts.join("\n\n"), pagesOcred: maxPages };
}

