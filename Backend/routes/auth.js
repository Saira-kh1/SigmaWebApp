// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/user.js";
import { authRequired } from "../middleware/auth.js";
import { randomBytes } from "crypto";

const router = express.Router();

/* -------------------- helpers -------------------- */
function must(val) {
  return typeof val === "string" ? val.trim() : "";
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function signTokenOrThrow(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role, name: user.name },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
  );
}

// NEW: Function to generate guest token
function signGuestToken() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  
  const guestId = `guest_${randomBytes(16).toString('hex')}`;
  
  return jwt.sign(
    { sub: guestId, role: "guest", isGuest: true },
    secret,
    { expiresIn: "24h" } // Guest tokens expire in 24 hours
  );
}

/* ----------------- rate limiting ----------------- */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// NEW: Separate rate limiter for guest users (more restrictive)
const guestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Only 10 requests per minute for guests
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please sign up for unlimited access." }
});

router.use(authLimiter);

/**
 * NEW ROUTE: POST /auth/guest
 * Creates a temporary guest session
 */
router.post("/guest", guestLimiter, async (req, res) => {
  try {
    const token = signGuestToken();
    
    return res.status(200).json({
      ok: true,
      isGuest: true,
      token,
      message: "Guest session created. Sign up to save your conversations!"
    });
  } catch (err) {
    console.error("GUEST SESSION error:", err);
    return res.status(500).json({ error: "Failed to create guest session" });
  }
});

/**
 * POST /auth/register
 * body: { name, email, password }
 */
router.post("/register", async (req, res) => {
  try {
    const name = must(req.body?.name);
    const email = must(req.body?.email).toLowerCase();
    const password = must(req.body?.password);

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password are required" });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "user",
    });

    const token = signTokenOrThrow(user);

    return res.status(201).json({
      ok: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("REGISTER error:", err);
    const msg = err?.message?.includes("JWT_SECRET")
      ? "Server configuration error"
      : "Registration failed";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const email = must(req.body?.email).toLowerCase();
    const password = must(req.body?.password);

    if (!email || !password) return res.status(400).json({ error: "email, password required" });
    if (!isEmail(email)) return res.status(400).json({ error: "Invalid email address" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signTokenOrThrow(user);

    return res.json({
      ok: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("LOGIN error:", err);
    const msg = err?.message?.includes("JWT_SECRET")
      ? "Server configuration error"
      : "Login failed";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /auth/me (protected)
 * headers: Authorization: Bearer <token>
 */
router.get("/me", authRequired, async (req, res) => {
  try {
    // NEW: Handle guest users
    if (req.user.isGuest) {
      return res.json({ 
        ok: true, 
        user: { 
          id: req.user.sub, 
          role: "guest", 
          isGuest: true,
          name: "Guest User"
        } 
      });
    }

    const user = await User.findById(req.user.sub, { passwordHash: 0 }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error("ME error:", err);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

export default router;