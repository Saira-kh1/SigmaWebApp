import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const TYPED_WORDS = ["Developers.", "Freelancers.", "Builders.", "Creators.", "You."];

const FEATURES = [
  {
    icon: "⚡",
    title: "Powered by Llama 3.3 70B",
    desc: "Enterprise-grade AI via Groq's ultra-fast inference — responses in milliseconds, not seconds.",
  },
  {
    icon: "💬",
    title: "Persistent Thread History",
    desc: "Every conversation saved and organized. Pick up right where you left off, across any session.",
  },
  {
    icon: "👤",
    title: "Try Before You Sign Up",
    desc: "Jump straight into a guest session — no account, no friction. Chat instantly, sign up when ready.",
  },
  {
    icon: "🔒",
    title: "Secure by Design",
    desc: "JWT authentication, bcrypt password hashing, and owner-scoped data. Your chats are yours alone.",
  },
  {
    icon: "✨",
    title: "Markdown & Code Rendering",
    desc: "Responses with syntax-highlighted code blocks, bold, tables — formatted the way developers expect.",
  },
  {
    icon: "🚀",
    title: "Full-Stack, Production-Ready",
    desc: "React + TypeScript frontend, Express backend, MongoDB — built to scale from day one.",
  },
];

export default function Landing() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typewriter effect
  useEffect(() => {
    const word = TYPED_WORDS[wordIndex];

    if (phase === "typing") {
      if (displayed.length < word.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed(word.slice(0, displayed.length + 1));
        }, 80);
      } else {
        timeoutRef.current = setTimeout(() => setPhase("pause"), 1600);
      }
    } else if (phase === "pause") {
      timeoutRef.current = setTimeout(() => setPhase("deleting"), 400);
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1));
        }, 40);
      } else {
        setWordIndex((i) => (i + 1) % TYPED_WORDS.length);
        setPhase("typing");
      }
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [displayed, phase, wordIndex]);

  return (
    <div
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      className="min-h-screen overflow-x-hidden text-white bg-gray-950"
    >
      {/* ── Background grid ── */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Glow blobs ── */}
      <div
        className="pointer-events-none fixed top-[-180px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20"
        style={{ background: "radial-gradient(ellipse, #16a34a 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse, #4ade80 0%, transparent 70%)" }}
      />

      {/* ══════════════════════ NAV ══════════════════════ */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span
            className="text-xl font-black tracking-tight"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
          >
            Σ<span className="text-green-400">IGMA</span>
            <span className="ml-1 font-light text-white/40">GPT</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-semibold text-black transition-all bg-green-500 rounded-lg hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/25"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative z-10 flex flex-col items-center px-6 pb-24 text-center pt-28">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-medium tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Llama 3.3 · 70B · Groq Inference
        </div>

        {/* Heading */}
        <h1
          className="text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-4 max-w-3xl"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          AI Built for
          <br />
          <span className="relative text-green-400">
            {displayed}
            <span className="inline-block w-0.5 h-14 bg-green-400 ml-1 align-middle animate-pulse" />
          </span>
        </h1>

        <p className="max-w-xl mt-6 text-lg leading-relaxed text-gray-400">
          A full-stack AI chat platform with persistent conversations, guest access, 
          and lightning-fast responses — built to production standards.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 mt-10 sm:flex-row">
          <Link
            to="/chat"
            className="group px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-base transition-all hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5"
          >
            Start Chatting Free
            <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            to="/register"
            className="px-8 py-4 border border-white/10 hover:border-white/25 text-white font-semibold rounded-xl text-base transition-all hover:bg-white/5 hover:-translate-y-0.5"
          >
            Create Account
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-500">No credit card required · Guest mode available</p>

        {/* ── Hero mockup ── */}
        <div className="w-full max-w-3xl mx-auto mt-16 overflow-hidden border shadow-2xl rounded-2xl border-white/10 shadow-black/60">
          {/* Window bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-white/5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-3 font-mono text-xs text-gray-500">sigmgpt.app/chat</span>
          </div>
          {/* Chat preview */}
          <div className="p-5 space-y-4 bg-gray-900">
            <MockMessage role="user" text="Explain REST vs GraphQL with a quick comparison table." />
            <MockMessage
              role="assistant"
              text={`Here's a concise comparison:\n\n| Feature | REST | GraphQL |\n|---|---|---|\n| Data fetching | Multiple endpoints | Single endpoint |\n| Over-fetching | Common | Eliminated |\n| Type system | Optional | Built-in |\n| Learning curve | Low | Moderate |\n\n**Bottom line:** Use REST for simple CRUD APIs. Use GraphQL when clients need flexible, precise data fetching.`}
            />
            <div className="flex gap-2 pt-2">
              <div className="flex-1 bg-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-500">
                Ask anything…
              </div>
              <div className="px-4 py-2.5 bg-green-500 rounded-lg text-sm font-semibold text-black">Send</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FEATURES ══════════════════════ */}
      <section className="relative z-10 max-w-5xl px-6 py-20 mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-green-400 font-semibold mb-3">
            What's Inside
          </p>
          <h2 className="text-4xl font-black tracking-tight">
            Everything you'd expect.
            <br />
            <span className="font-light text-gray-400">Plus a few things you wouldn't.</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-green-500/20 transition-all"
            >
              <div className="mb-4 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-base font-bold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
              <div className="absolute inset-0 transition-opacity opacity-0 pointer-events-none rounded-2xl group-hover:opacity-100"
                style={{ boxShadow: "inset 0 0 0 1px rgba(74,222,128,0.15)" }} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ CTA STRIP ══════════════════════ */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-px rounded-2xl" style={{ background: "linear-gradient(135deg, #16a34a40, #4ade8020, #16a34a40)" }}>
            <div className="px-8 bg-gray-950 rounded-2xl py-14">
              <h2 className="mb-4 text-4xl font-black tracking-tight">
                Ready to build smarter?
              </h2>
              <p className="mb-8 text-gray-400">
                Join in seconds. Your first conversation is one click away.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="px-8 py-3.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/25"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/chat"
                  className="px-8 py-3.5 border border-white/10 hover:border-white/25 rounded-xl transition-all hover:bg-white/5"
                >
                  Try as Guest →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer className="relative z-10 flex flex-col items-center justify-between gap-4 px-8 py-8 text-sm text-gray-500 border-t border-white/5 sm:flex-row">
        <span style={{ fontFamily: "monospace" }} className="font-bold text-white/30">
          ΣIGMA GPT
        </span>
        <span>Built with React · TypeScript · Express · MongoDB · Groq</span>
        <div className="flex gap-4">
          <Link to="/login" className="transition-colors hover:text-white">Login</Link>
          <Link to="/register" className="transition-colors hover:text-white">Register</Link>
        </div>
      </footer>
    </div>
  );
}

// ── Mini mock message component for hero preview ──
function MockMessage({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <div
      className={`max-w-[90%] rounded-xl p-3.5 text-sm ${
        role === "user"
          ? "ml-auto bg-green-500/15 border border-green-500/20"
          : "bg-gray-800/60 border border-white/5"
      }`}
    >
      <div className="text-xs font-semibold mb-1.5 opacity-50 uppercase tracking-wider">
        {role === "user" ? "You" : "SigmaGPT"}
      </div>
      <div className="text-xs leading-relaxed text-gray-200 whitespace-pre-line">{text}</div>
    </div>
  );
}