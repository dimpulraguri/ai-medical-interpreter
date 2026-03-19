import { Router } from "express";
import multer from "multer";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { saveEncryptedUpload } from "../services/storage.js";
import { extractTextFromUpload } from "../services/ocr.js";
import { interpretMedicalReport } from "../services/reportInterpreter.js";
import { encryptJson, decryptJson } from "../services/encryption.js";
import { Report } from "../models/Report.js";
import { writeAuditLog } from "../services/audit.js";

export const reportRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === "application/pdf" || file.mimetype === "image/png" || file.mimetype === "image/jpeg";
    if (!ok) return cb(new Error("Unsupported file type"));
    cb(null, true);
  }
});

reportRoutes.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const items = await Report.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select({ filename: 1, status: 1, createdAt: 1 });
    res.json({
      reports: items.map((r) => ({
        id: r._id.toString(),
        filename: r.filename,
        status: r.status,
        createdAt: r.createdAt.toISOString()
      }))
    });
  })
);

reportRoutes.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const rep = await Report.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!rep) return res.status(404).json({ error: "Report not found" });

    const extractedText = decryptJson<string>(rep.extractedTextEnc);
    const abnormalFindings = decryptJson(rep.abnormalFindingsEnc);
    const aiExplanation = decryptJson<string>(rep.aiExplanationEnc);

    res.json({
      report: {
        id: rep._id.toString(),
        filename: rep.filename,
        status: rep.status,
        createdAt: rep.createdAt.toISOString(),
        extractedText,
        abnormalFindings,
        aiExplanation
      }
    });
  })
);

reportRoutes.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Missing file" });

    const { storageKey } = await saveEncryptedUpload(file.buffer, file.originalname);
    const report = await Report.create({
      userId: req.user!.id,
      filename: file.originalname,
      mimeType: file.mimetype,
      storageKey,
      status: "processing"
    });

    void writeAuditLog({
      req,
      event: "reports.upload",
      status: 201,
      userId: req.user!.id,
      meta: { reportId: report._id.toString(), filename: file.originalname, mimeType: file.mimetype, size: file.size }
    });

    try {
      const { text } = await extractTextFromUpload({ mimeType: file.mimetype, buffer: file.buffer });
      if (!text || text.length < 20) {
        report.status = "failed";
        report.extractedTextEnc = encryptJson(text ?? "");
        await report.save();
        return res.status(422).json({
          error:
            "Could not extract readable text. If this PDF is scanned, try uploading a clear photo (JPG/PNG) or a digital PDF."
        });
      }

      const interpretation = await interpretMedicalReport(text);

      report.status = "ready";
      report.extractedTextEnc = encryptJson(text);
      report.aiExplanationEnc = encryptJson(
        [
          interpretation.explanationMarkdown,
          "",
          "## What to do",
          ...interpretation.whatToDo.map((x) => `- ${x}`),
          "",
          "## What to avoid",
          ...interpretation.whatToAvoid.map((x) => `- ${x}`),
          "",
          "## Food to eat",
          ...interpretation.foodToEat.map((x) => `- ${x}`),
          "",
          "## Food to avoid",
          ...interpretation.foodToAvoid.map((x) => `- ${x}`),
          "",
          "## Lifestyle",
          ...interpretation.lifestyle.map((x) => `- ${x}`),
          "",
          "## Exercise",
          ...interpretation.exercise.map((x) => `- ${x}`),
          "",
          "## Possible reasons",
          ...interpretation.reasons.map((x) => `- ${x}`),
          "",
          "## Consult a real doctor when",
          ...interpretation.consultDoctorWhen.map((x) => `- ${x}`),
          "",
          `**Disclaimer:** ${interpretation.disclaimer}`
        ].join("\n")
      );
      report.abnormalFindingsEnc = encryptJson(interpretation.abnormalFindings);
      await report.save();

      res.status(201).json({ reportId: report._id.toString() });
    } catch (err) {
      report.status = "failed";
      await report.save();
      void writeAuditLog({
        req,
        event: "reports.interpret_failed",
        status: 500,
        userId: req.user!.id,
        meta: { reportId: report._id.toString() }
      });
      throw err;
    }
  })
);
