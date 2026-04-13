// routes/chat.js
import express from "express";
import Thread from "../models/Thread.js";
import getLLMResponse, { getLLMStream } from "../utils/groq.js";
import { authRequired, authOrGuest, registeredOnly, isGuest } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiter for guest chat
const guestChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isGuest(req),
  message: { error: "Rate limit exceeded. Please sign up for unlimited chatting!" },
});

const clamp = (s, max = 120) => (typeof s === "string" ? s.slice(0, max) : "");

// SSE helper — writes a data line and flushes
function sseWrite(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  // flush if express-compression or similar is in use
  if (typeof res.flush === "function") res.flush();
}

// ─── Thread routes (registered only) ─────────────────────────────────────────

router.post("/test", authRequired, registeredOnly, async (req, res) => {
  try {
    const saved = await Thread.create({
      threadId: "test-" + Date.now(),
      ownerId: req.user.sub,
      title: "Testing new Thread",
      messages: [],
    });
    return res.json({ ok: true, threadId: saved.threadId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save in DB" });
  }
});

router.get("/thread", authRequired, registeredOnly, async (req, res) => {
  try {
    const { q, skip = 0, limit = 50 } = req.query;
    const filter = { ownerId: req.user.sub };
    if (q) filter.title = { $regex: String(q).trim(), $options: "i" };
    const threads = await Thread.find(filter, {
      _id: 0, threadId: 1, title: 1, updatedAt: 1, createdAt: 1, lastMessageAt: 1,
    })
      .sort({ updatedAt: -1 })
      .skip(Number(skip) || 0)
      .limit(Math.min(Number(limit) || 50, 200))
      .lean();
    return res.json(threads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch threads" });
  }
});

router.get("/thread/:threadId", authRequired, registeredOnly, async (req, res) => {
  try {
    const { threadId } = req.params;
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const thread = await Thread.findOne(
      { threadId, ownerId: req.user.sub },
      { _id: 0, threadId: 1, title: 1, messages: 1, updatedAt: 1, createdAt: 1 }
    ).lean();
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    const total = thread.messages.length;
    const messages = thread.messages.slice(skip, skip + limit);
    return res.json({ threadId, title: thread.title, total, skip, limit, messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch thread" });
  }
});

router.delete("/thread/:threadId", authRequired, registeredOnly, async (req, res) => {
  try {
    const deleted = await Thread.findOneAndDelete({
      threadId: req.params.threadId,
      ownerId: req.user.sub,
    });
    if (!deleted) return res.status(404).json({ error: "Thread not found" });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete thread" });
  }
});

// ─── Non-streaming chat (kept for compatibility) ──────────────────────────────

router.post("/chat", authRequired, registeredOnly, async (req, res) => {
  try {
    const threadId = String(req.body?.threadId || "").trim();
    const message = String(req.body?.message || "").trim();
    if (!threadId || !message)
      return res.status(400).json({ error: "Missing required fields: threadId, message" });
    if (threadId.length > 100)
      return res.status(400).json({ error: "threadId too long" });

    const now = new Date();
    await Thread.findOneAndUpdate(
      { threadId, ownerId: req.user.sub },
      {
        $setOnInsert: { threadId, ownerId: req.user.sub, title: clamp(message, 120), createdAt: now },
        $set: { updatedAt: now, lastMessageAt: now },
        $push: { messages: { role: "user", content: message, at: now } },
      },
      { upsert: true, new: false, projection: { _id: 0, threadId: 1 } }
    );

    let assistantReply = "";
    try {
      assistantReply = await getLLMResponse(message);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ error: e.message || "LLM request failed" });
    }

    await Thread.findOneAndUpdate(
      { threadId, ownerId: req.user.sub },
      {
        $set: { updatedAt: new Date(), lastMessageAt: new Date() },
        $push: { messages: { role: "assistant", content: assistantReply, at: new Date() } },
      }
    );

    return res.json({ reply: assistantReply, threadId, saved: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/chat/guest", authOrGuest, guestChatLimiter, async (req, res) => {
  try {
    if (!isGuest(req))
      return res.status(403).json({ error: "This endpoint is for guests only." });
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "Message is required" });
    let assistantReply = "";
    try {
      assistantReply = await getLLMResponse(message);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ error: e.message || "LLM request failed" });
    }
    return res.json({ reply: assistantReply, isGuest: true, saved: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// ─── STREAMING CHAT (registered users) ───────────────────────────────────────
/**
 * POST /api/chat/stream
 * Body: { threadId, message }
 * Streams the LLM reply as SSE, saves user msg + full reply to DB.
 */
router.post("/chat/stream", authRequired, registeredOnly, async (req, res) => {
  try {
    const threadId = String(req.body?.threadId || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!threadId || !message)
      return res.status(400).json({ error: "Missing required fields: threadId, message" });
    if (threadId.length > 100)
      return res.status(400).json({ error: "threadId too long" });

    // 1) Save user message (upsert thread)
    const now = new Date();
    await Thread.findOneAndUpdate(
      { threadId, ownerId: req.user.sub },
      {
        $setOnInsert: { threadId, ownerId: req.user.sub, title: clamp(message, 120), createdAt: now },
        $set: { updatedAt: now, lastMessageAt: now },
        $push: { messages: { role: "user", content: message, at: now } },
      },
      { upsert: true, new: false }
    );

    // 2) Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if proxied
    res.flushHeaders();

    // 3) Stream from Groq
    let fullReply = "";
    try {
      const stream = await getLLMStream([{ role: "user", content: message }]);
      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content || "";
        if (token) {
          fullReply += token;
          sseWrite(res, { token });
        }
      }
    } catch (e) {
      sseWrite(res, { error: e.message || "LLM stream failed" });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    // 4) Save assistant reply to DB
    try {
      await Thread.findOneAndUpdate(
        { threadId, ownerId: req.user.sub },
        {
          $set: { updatedAt: new Date(), lastMessageAt: new Date() },
          $push: { messages: { role: "assistant", content: fullReply, at: new Date() } },
        }
      );
    } catch (dbErr) {
      console.error("Failed to save assistant reply:", dbErr);
    }

    // 5) Signal done
    sseWrite(res, { done: true, threadId });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong" });
    } else {
      sseWrite(res, { error: "Something went wrong" });
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

// ─── STREAMING CHAT (guest users) ────────────────────────────────────────────
/**
 * POST /api/chat/guest/stream
 * Body: { message }
 * Streams reply as SSE — nothing saved to DB.
 */
router.post("/chat/guest/stream", authOrGuest, guestChatLimiter, async (req, res) => {
  try {
    if (!isGuest(req))
      return res.status(403).json({ error: "This endpoint is for guests only." });

    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "Message is required" });

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let fullReply = "";
    try {
      const stream = await getLLMStream([{ role: "user", content: message }]);
      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content || "";
        if (token) {
          fullReply += token;
          sseWrite(res, { token });
        }
      }
    } catch (e) {
      sseWrite(res, { error: e.message || "LLM stream failed" });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    sseWrite(res, { done: true, fullReply });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong" });
    } else {
      sseWrite(res, { error: "Something went wrong" });
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

export default router;