import { Router } from "express";
import { ChatSendSchema } from "@ami/shared";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ChatThread } from "../models/ChatThread.js";
import { Report } from "../models/Report.js";
import { decryptJson, encryptJson } from "../services/encryption.js";
import { doctorChatReply } from "../services/chatDoctor.js";
import { writeAuditLog } from "../services/audit.js";

export const chatRoutes = Router();

chatRoutes.get(
  "/history",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const thread = await ChatThread.findOne({ userId: req.user!.id });
    if (!thread) return res.json({ messages: [] });
    const messages = thread.messages.slice(-50).map((m) => ({
      id: m._id.toString(),
      role: m.role,
      content: decryptJson<string>(m.contentEnc) ?? "",
      createdAt: m.createdAt.toISOString()
    }));
    res.json({ messages });
  })
);

chatRoutes.post(
  "/send",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { message } = ChatSendSchema.parse(req.body);
    const thread = (await ChatThread.findOne({ userId: req.user!.id })) ?? (await ChatThread.create({ userId: req.user!.id, messages: [] }));

    const recent = thread.messages.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant",
      content: decryptJson<string>(m.contentEnc) ?? ""
    }));

    const latestReport = await Report.findOne({ userId: req.user!.id, status: "ready" })
      .sort({ createdAt: -1 })
      .select({ abnormalFindingsEnc: 1 });
    const recentAbnormalFindings = latestReport ? decryptJson(latestReport.abnormalFindingsEnc) : null;

    thread.messages.push({ role: "user", contentEnc: encryptJson(message) });
    const reply = await doctorChatReply({ userMessage: message, recent, context: { recentAbnormalFindings } });
    thread.messages.push({ role: "assistant", contentEnc: encryptJson(reply || "I’m here with you—can you share a bit more detail?") });
    await thread.save();

    void writeAuditLog({
      req,
      event: "chat.send",
      status: 200,
      userId: req.user!.id,
      meta: { threadId: thread._id.toString(), messageLength: message.length, replyLength: (reply ?? "").length }
    });

    res.json({
      message: reply,
      createdAt: new Date().toISOString()
    });
  })
);
