

// import { useEffect, useMemo, useRef, useState } from "react";
// import api from "../services/api";
// import { useAuth } from "../context/AuthContext";
// import ReactMarkdown from "react-markdown";
// import rehypeHighlight from "rehype-highlight";
// import "highlight.js/styles/github-dark.css";

// type Msg = { role: "user" | "assistant" | "system"; content: string; at?: string };
// type ThreadListItem = {
//   threadId: string;
//   title: string;
//   updatedAt: string;
//   createdAt: string;
// };

// // ── Copy-to-clipboard hook ──
// function useCopy() {
//   const [copied, setCopied] = useState<number | null>(null);
//   const copy = (text: string, idx: number) => {
//     navigator.clipboard.writeText(text).then(() => {
//       setCopied(idx);
//       setTimeout(() => setCopied(null), 2000);
//     });
//   };
//   return { copied, copy };
// }

// export default function Chat() {
//   const { user, logout, isGuest } = useAuth();
//   const { copied, copy } = useCopy();

//   const [threads, setThreads] = useState<ThreadListItem[]>([]);
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [input, setInput] = useState("");
//   const [loadingSend, setLoadingSend] = useState(false);
//   const [loadingThreads, setLoadingThreads] = useState(false);
//   const [err, setErr] = useState<string>("");

//   const bottomRef = useRef<HTMLDivElement | null>(null);
//   const inputRef = useRef<HTMLInputElement | null>(null);

//   const hasActive = Boolean(activeId);
//   const createThreadId = () =>
//     (crypto as any)?.randomUUID?.() ??
//     `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

//   const scrollToBottom = () =>
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });

//   // Guest storage helpers
//   const GUEST_CHAT_KEY = "guestChatMessages";
//   const saveGuestMessages = (msgs: Msg[]) => {
//     try { localStorage.setItem(GUEST_CHAT_KEY, JSON.stringify(msgs)); } catch {}
//   };
//   const loadGuestMessages = (): Msg[] => {
//     try {
//       const s = localStorage.getItem(GUEST_CHAT_KEY);
//       return s ? JSON.parse(s) : [];
//     } catch { return []; }
//   };
//   const clearGuestMessages = () => {
//     try { localStorage.removeItem(GUEST_CHAT_KEY); } catch {}
//   };

//   // Load threads / messages on mount
//   useEffect(() => {
//     if (isGuest) {
//       setMessages(loadGuestMessages());
//       setActiveId("guest-session");
//       setTimeout(scrollToBottom, 0);
//       return;
//     }
//     (async () => {
//       setLoadingThreads(true);
//       try {
//         const { data } = await api.get("/api/thread");
//         setThreads(data);
//         if (data?.length && !activeId) setActiveId(data[0].threadId);
//       } catch {
//         setErr("Failed to load threads.");
//       } finally {
//         setLoadingThreads(false);
//       }
//     })();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isGuest]);

//   // Load messages when active thread changes
//   useEffect(() => {
//     if (isGuest || !activeId) return;
//     (async () => {
//       try {
//         const { data } = await api.get(`/api/thread/${activeId}?skip=0&limit=500`);
//         setMessages(data.messages ?? []);
//         setTimeout(scrollToBottom, 0);
//       } catch {
//         setMessages([]);
//         setErr("Failed to load messages.");
//       }
//     })();
//   }, [activeId, isGuest]);

//   // Auto scroll
//   useEffect(() => { scrollToBottom(); }, [messages.length]);

//   // Send message
//   async function handleSend(e: React.FormEvent) {
//     e.preventDefault();
//     if (loadingSend) return;
//     const msg = input.trim();
//     if (!msg) return;

//     setLoadingSend(true);
//     setErr("");
//     const optimisticUser: Msg = { role: "user", content: msg, at: new Date().toISOString() };
//     let rollbackNeeded = true;

//     try {
//       if (isGuest) {
//         const updated = [...messages, optimisticUser];
//         setMessages(updated);
//         setInput("");
//         const { data } = await api.post("/api/chat/guest", { message: msg });
//         const final = [
//           ...updated,
//           { role: "assistant" as const, content: data.reply, at: new Date().toISOString() },
//         ];
//         setMessages(final);
//         saveGuestMessages(final);
//         rollbackNeeded = false;
//         return;
//       }

//       const threadId = activeId ?? createThreadId();
//       setMessages((prev) => [...prev, optimisticUser]);
//       setInput("");
//       const { data } = await api.post("/api/chat", { threadId, message: msg });
//       if (!activeId) setActiveId(threadId);
//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", content: data.reply, at: new Date().toISOString() },
//       ]);
//       rollbackNeeded = false;
//       const tl = await api.get("/api/thread");
//       setThreads(tl.data);
//     } catch (error: any) {
//       const errorMsg =
//         error?.response?.data?.error || "Failed to send message. Please try again.";
//       setErr(
//         isGuest && errorMsg.includes("Rate limit")
//           ? errorMsg + " Sign up for unlimited access!"
//           : errorMsg
//       );
//     } finally {
//       setLoadingSend(false);
//       if (rollbackNeeded) setMessages((prev) => prev.slice(0, -1));
//     }
//   }

//   function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       if (!loadingSend && input.trim()) {
//         (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
//       }
//     }
//   }

//   function onNewThread() {
//     if (isGuest) {
//       if (window.confirm("Clear your chat history?")) {
//         clearGuestMessages();
//         setMessages([]);
//       }
//       return;
//     }
//     setActiveId(null);
//     setMessages([]);
//     setInput("");
//     setErr("");
//     inputRef.current?.focus();
//   }

//   async function onDeleteThread(e: React.MouseEvent, threadId: string) {
//     e.stopPropagation();
//     try {
//       await api.delete(`/api/thread/${threadId}`);
//       setThreads((prev) => prev.filter((t) => t.threadId !== threadId));
//       if (activeId === threadId) {
//         setActiveId(null);
//         setMessages([]);
//       }
//     } catch {
//       setErr("Failed to delete thread.");
//     }
//   }

//   const currentTitle = useMemo(() => {
//     if (isGuest) return "Guest Chat";
//     const t = threads.find((x) => x.threadId === activeId);
//     return t?.title || "New Conversation";
//   }, [threads, activeId, messages.length, isGuest]);

//   // Format relative time
//   function relativeTime(iso?: string) {
//     if (!iso) return "";
//     const d = new Date(iso);
//     const diff = (Date.now() - d.getTime()) / 1000;
//     if (diff < 60) return "Just now";
//     if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
//     if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
//     return d.toLocaleDateString();
//   }

//   return (
//     <div
//       className="flex h-screen text-white bg-gray-950"
//       style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
//     >
//       {/* ══════════ SIDEBAR (registered only) ══════════ */}
//       {!isGuest && (
//         <aside className="flex flex-col w-64 border-r bg-gray-900/60 border-white/5 backdrop-blur-sm">
//           {/* Sidebar header */}
//           <div className="p-4 border-b border-white/5">
//             <div className="flex items-center gap-1.5 mb-4">
//               <span
//                 className="text-lg font-black tracking-tight"
//                 style={{ fontFamily: "monospace" }}
//               >
//                 Σ<span className="text-green-400">GPT</span>
//               </span>
//             </div>
//             <button
//               onClick={onNewThread}
//               className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold bg-green-500 hover:bg-green-400 text-black rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20"
//             >
//               <span>+</span> New Chat
//             </button>
//           </div>

//           {/* Thread list */}
//           <div className="flex-1 p-2 overflow-auto">
//             {loadingThreads ? (
//               <div className="p-3 text-xs text-center text-gray-500">Loading threads…</div>
//             ) : threads.length ? (
//               <div className="space-y-0.5">
//                 {threads.map((t) => (
//                   <div
//                     key={t.threadId}
//                     onClick={() => setActiveId(t.threadId)}
//                     className={`group flex items-start justify-between gap-1 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
//                       activeId === t.threadId
//                         ? "bg-white/10 text-white"
//                         : "text-gray-400 hover:bg-white/5 hover:text-white"
//                     }`}
//                   >
//                     <div className="flex-1 min-w-0">
//                       <div className="text-xs font-medium leading-snug truncate">
//                         {t.title || "Untitled"}
//                       </div>
//                       <div className="text-[10px] text-gray-500 mt-0.5">
//                         {relativeTime(t.updatedAt)}
//                       </div>
//                     </div>
//                     <button
//                       title="Delete"
//                       onClick={(e) => onDeleteThread(e, t.threadId)}
//                       className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs px-1 mt-0.5 shrink-0"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="p-4 text-xs text-center text-gray-600">
//                 No conversations yet.
//                 <br />Start one above!
//               </div>
//             )}
//           </div>

//           {/* User footer */}
//           <div className="p-3 border-t border-white/5">
//             <div className="flex items-center justify-between px-2">
//               <div className="flex items-center gap-2">
//                 <div className="flex items-center justify-center text-xs font-bold text-green-400 border rounded-full w-7 h-7 bg-green-500/20 border-green-500/30">
//                   {user?.name?.[0]?.toUpperCase() ?? "U"}
//                 </div>
//                 <span className="text-xs text-gray-300 font-medium truncate max-w-[100px]">
//                   {user?.name}
//                 </span>
//               </div>
//               <button
//                 onClick={logout}
//                 className="px-2 py-1 text-xs text-gray-500 transition-colors rounded hover:text-white hover:bg-white/5"
//               >
//                 Sign out
//               </button>
//             </div>
//           </div>
//         </aside>
//       )}

//       {/* ══════════ MAIN AREA ══════════ */}
//       <main className="flex flex-col flex-1 min-w-0">

//         {/* Header */}
//         <header className="flex items-center justify-between px-6 py-3 border-b bg-gray-900/40 border-white/5 backdrop-blur-sm h-14 shrink-0">
//           <div className="flex items-center gap-3">
//             {isGuest && (
//               <span
//                 className="text-base font-black tracking-tight"
//                 style={{ fontFamily: "monospace" }}
//               >
//                 Σ<span className="text-green-400">IGMA</span>
//                 <span className="ml-1 text-sm font-light text-white/30">GPT</span>
//               </span>
//             )}
//             <div className="flex items-center gap-2">
//               <span className="max-w-xs text-sm font-semibold text-white truncate">
//                 {currentTitle}
//               </span>
//               {isGuest && (
//                 <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium">
//                   Guest
//                 </span>
//               )}
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             {/* Model badge */}
//             <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
//               <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
//               Llama 3.3 · 70B
//             </div>
//             {isGuest && (
//               <div className="flex items-center gap-2">
//                 <a
//                   href="/login"
//                   className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
//                 >
//                   Sign In
//                 </a>
//                 <a
//                   href="/register"
//                   className="px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-400 text-black rounded-lg transition-all"
//                 >
//                   Sign Up
//                 </a>
//               </div>
//             )}
//           </div>
//         </header>

//         {/* Guest banner */}
//         {isGuest && (
//           <div className="flex items-center justify-between px-6 py-2.5 border-b border-blue-700/20 bg-blue-950/20">
//             <span className="text-xs text-blue-300/80">
//               💡 Guest mode — messages are stored locally and not saved to our servers.
//             </span>
//             <a href="/register" className="ml-4 text-xs font-medium text-blue-400 hover:text-blue-300 shrink-0">
//               Sign up for free →
//             </a>
//           </div>
//         )}

//         {/* Messages */}
//         <div className="flex-1 px-4 py-6 overflow-auto">
//           <div className="max-w-3xl mx-auto space-y-6">

//             {/* Empty state */}
//             {!hasActive && !isGuest && (
//               <div className="flex flex-col items-center justify-center h-full pt-24 text-center">
//                 <div className="mb-4 text-5xl" style={{ fontFamily: "monospace", fontWeight: 900 }}>
//                   Σ<span className="text-green-400">GPT</span>
//                 </div>
//                 <p className="text-sm text-gray-500">Start a new conversation above.</p>
//               </div>
//             )}

//             {isGuest && messages.length === 0 && (
//               <div className="flex flex-col items-center justify-center pt-20 text-center">
//                 <div className="mb-5 text-5xl" style={{ fontFamily: "monospace", fontWeight: 900 }}>
//                   Σ<span className="text-green-400">GPT</span>
//                 </div>
//                 <p className="mb-2 text-lg font-semibold text-white">Welcome to SigmaGPT</p>
//                 <p className="max-w-sm text-sm text-gray-500">
//                   You're in guest mode. Ask me anything — I'm powered by Llama 3.3 70B.
//                 </p>
//                 <div className="grid w-full max-w-md grid-cols-2 gap-3 mt-8 text-sm">
//                   {[
//                     "Explain REST vs GraphQL",
//                     "Write a Python web scraper",
//                     "How does JWT auth work?",
//                     "Best practices for MongoDB",
//                   ].map((prompt) => (
//                     <button
//                       key={prompt}
//                       onClick={() => setInput(prompt)}
//                       className="px-4 py-3 text-xs text-left text-gray-300 transition-all border rounded-xl border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15"
//                     >
//                       {prompt} →
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {err && (
//               <div className="px-4 py-3 text-sm text-red-300 border rounded-xl border-red-800/50 bg-red-950/30">
//                 ⚠ {err}
//               </div>
//             )}

//             {/* Message bubbles */}
//             {messages.map((m, i) => (
//               <div
//                 key={i}
//                 className={`flex gap-3 items-start ${m.role === "user" ? "flex-row-reverse" : ""}`}
//               >
//                 {/* Avatar */}
//                 <div
//                   className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
//                     m.role === "user"
//                       ? "bg-green-500/20 border border-green-500/30 text-green-400"
//                       : "bg-white/5 border border-white/10 text-gray-400"
//                   }`}
//                 >
//                   {m.role === "user"
//                     ? (user?.name?.[0] ?? "U").toUpperCase()
//                     : "Σ"}
//                 </div>

//                 {/* Bubble */}
//                 <div
//                   className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${
//                     m.role === "user"
//                       ? "bg-green-500/12 border border-green-500/20 rounded-tr-md"
//                       : "bg-white/4 border border-white/8 rounded-tl-md"
//                   }`}
//                 >
//                   {/* Role label */}
//                   <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-40">
//                     {m.role === "user" ? (user?.name ?? "You") : "SigmaGPT"}
//                   </div>

//                   {/* Content */}
//                   <div className="text-sm leading-relaxed prose-sm prose prose-invert max-w-none">
//                     <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
//                       {m.content}
//                     </ReactMarkdown>
//                   </div>

//                   {/* Footer row */}
//                   <div className="flex items-center justify-between gap-3 mt-2">
//                     <span className="text-[10px] text-gray-600">{relativeTime(m.at)}</span>
//                     {m.role === "assistant" && (
//                       <button
//                         onClick={() => copy(m.content, i)}
//                         className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-500 hover:text-gray-300 transition-all"
//                       >
//                         {copied === i ? "✓ Copied" : "Copy"}
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}

//             {/* Typing indicator */}
//             {loadingSend && (
//               <div className="flex items-start gap-3">
//                 <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-gray-400 border rounded-full bg-white/5 border-white/10">
//                   Σ
//                 </div>
//                 <div className="px-4 py-3 border bg-white/4 border-white/8 rounded-2xl rounded-tl-md">
//                   <div className="flex gap-1.5 items-center h-5">
//                     {[0, 1, 2].map((i) => (
//                       <span
//                         key={i}
//                         className="w-1.5 h-1.5 rounded-full bg-green-400"
//                         style={{
//                           animation: "bounce 1s infinite",
//                           animationDelay: `${i * 0.2}s`,
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div ref={bottomRef} />
//           </div>
//         </div>

//         {/* Input bar */}
//         <div className="px-4 pb-4 shrink-0">
//           <div className="max-w-3xl mx-auto">
//             <form
//               onSubmit={handleSend}
//               className="flex gap-2 p-2 border bg-gray-900/80 border-white/10 rounded-2xl backdrop-blur-sm"
//             >
//               {isGuest && (
//                 <button
//                   type="button"
//                   onClick={onNewThread}
//                   className="px-3 py-2 text-xs text-gray-400 transition-all border hover:text-white border-white/8 hover:border-white/15 rounded-xl"
//                   title="Clear guest chat"
//                 >
//                   Clear
//                 </button>
//               )}
//               <input
//                 ref={inputRef}
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={onKeyDown}
//                 placeholder={isGuest ? "Ask anything… (guest mode)" : "Ask anything…"}
//                 className="flex-1 px-2 py-2 text-sm placeholder-gray-600 bg-transparent focus:outline-none"
//               />
//               <button
//                 type="submit"
//                 disabled={loadingSend || !input.trim()}
//                 className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
//                   input.trim() && !loadingSend
//                     ? "bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/20"
//                     : "bg-white/5 text-gray-600 cursor-not-allowed"
//                 }`}
//               >
//                 {loadingSend ? "…" : "Send"}
//               </button>
//             </form>
//             <p className="text-center text-[10px] text-gray-600 mt-2">
//               SigmaGPT · Llama 3.3 70B · Responses may be inaccurate
//             </p>
//           </div>
//         </div>
//       </main>

//       {/* Bounce keyframe */}
//       <style>{`
//         @keyframes bounce {
//           0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
//           40% { transform: translateY(-5px); opacity: 1; }
//         }
//       `}</style>
//     </div>
//   );
// }

import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

type Msg = { role: "user" | "assistant" | "system"; content: string; at?: string };
type ThreadListItem = { threadId: string; title: string; updatedAt: string; createdAt: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function useCopy() {
  const [copied, setCopied] = useState<number | null>(null);
  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  return { copied, copy };
}

function relativeTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

// ── Thinking animation (shown before first token) ──────────────────────────
const THINKING_STEPS = [
  "Thinking…",
  "Reading your message…",
  "Formulating response…",
  "Almost there…",
];

function ThinkingBubble() {
  const [step, setStep] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const s = setInterval(() => setStep((x) => Math.min(x + 1, THINKING_STEPS.length - 1)), 900);
    const t = setInterval(() => setTick((x) => (x + 1) % 4), 380);
    return () => { clearInterval(s); clearInterval(t); };
  }, []);

  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-gray-400 border rounded-full bg-white/5 border-white/10 shrink-0">
        Σ
      </div>
      <div className="px-4 py-3 border bg-white/4 border-white/8 rounded-2xl rounded-tl-md">
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 opacity-40">
          SigmaGPT
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 transition-opacity bg-green-400 rounded-full"
                style={{ opacity: tick > i ? 1 : 0.2, transition: "opacity 0.2s" }}
              />
            ))}
          </div>
          <span className="text-sm italic text-gray-400">{THINKING_STEPS[step]}</span>
        </div>
      </div>
    </div>
  );
}

// ── Message bubble with optional streaming cursor ──────────────────────────
function AssistantBubble({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  return (
    <div className="text-sm leading-relaxed prose-sm prose prose-invert max-w-none">
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
      {isStreaming && (
        <span
          className="inline-block w-[2px] h-[1em] bg-green-400 ml-0.5 align-text-bottom"
          style={{ animation: "cursorBlink 0.65s step-end infinite" }}
        />
      )}
    </div>
  );
}

// ── Main Chat component ─────────────────────────────────────────────────────
export default function Chat() {
  const { user, logout, isGuest } = useAuth();
  const { copied, copy } = useCopy();

  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null);
  const [err, setErr] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const createThreadId = () =>
    (crypto as any)?.randomUUID?.() ??
    `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const GUEST_KEY = "guestChatMessages";
  const saveGuest = (msgs: Msg[]) => { try { localStorage.setItem(GUEST_KEY, JSON.stringify(msgs)); } catch {} };
  const loadGuest = (): Msg[] => { try { const s = localStorage.getItem(GUEST_KEY); return s ? JSON.parse(s) : []; } catch { return []; } };
  const clearGuest = () => { try { localStorage.removeItem(GUEST_KEY); } catch {} };

  useEffect(() => {
    if (isGuest) {
      setMessages(loadGuest());
      setActiveId("guest-session");
      setTimeout(scrollToBottom, 0);
      return;
    }
    (async () => {
      setLoadingThreads(true);
      try {
        const { data } = await api.get("/api/thread");
        setThreads(data);
        if (data?.length) setActiveId(data[0].threadId);
      } catch { setErr("Failed to load threads."); }
      finally { setLoadingThreads(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  useEffect(() => {
    if (isGuest || !activeId) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/thread/${activeId}?skip=0&limit=500`);
        setMessages(data.messages ?? []);
        setTimeout(scrollToBottom, 0);
      } catch { setMessages([]); setErr("Failed to load messages."); }
    })();
  }, [activeId, isGuest]);

  useEffect(() => { scrollToBottom(); }, [messages.length, isThinking]);

  // ── Streaming send ────────────────────────────────────────────────────────
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (loadingSend) return;
    const msg = input.trim();
    if (!msg) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoadingSend(true);
    setIsThinking(true);
    setErr("");

    const userMsg: Msg = { role: "user", content: msg, at: new Date().toISOString() };
    const snapshotMessages = [...messages, userMsg];
    setMessages(snapshotMessages);
    setInput("");

    const threadId = (activeId && !isGuest) ? activeId : createThreadId();
    if (!activeId && !isGuest) setActiveId(threadId);

    const token = localStorage.getItem("token") || localStorage.getItem("guestToken") || "";
    const endpoint = isGuest
      ? `${API_BASE}/api/chat/guest/stream`
      : `${API_BASE}/api/chat/stream`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(isGuest ? { message: msg } : { threadId, message: msg }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        let errMsg = "Failed to get response.";
        try { errMsg = JSON.parse(text)?.error || errMsg; } catch {}
        throw new Error(errMsg);
      }

      // Append empty assistant placeholder
      const assistantIdx = snapshotMessages.length;
      setMessages((prev) => [...prev, { role: "assistant", content: "", at: new Date().toISOString() }]);
      setStreamingIdx(assistantIdx);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstToken = true;
      let fullReply = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break outer;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) { setErr(parsed.error); break outer; }

            if (parsed.token) {
              if (firstToken) { setIsThinking(false); firstToken = false; }
              fullReply += parsed.token;
              const snap = fullReply;
              setMessages((prev) => {
                const msgs = [...prev];
                if (msgs[assistantIdx]) msgs[assistantIdx] = { ...msgs[assistantIdx], content: snap };
                return msgs;
              });
            }

            if (parsed.done && isGuest) {
              setMessages((prev) => { saveGuest(prev); return prev; });
            }
          } catch {}
        }
      }

      setStreamingIdx(null);

      if (!isGuest) {
        try { const tl = await api.get("/api/thread"); setThreads(tl.data); } catch {}
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      setErr(error?.message || "Failed to send message. Please try again.");
      setMessages(snapshotMessages.slice(0, -1));
    } finally {
      setLoadingSend(false);
      setIsThinking(false);
      setStreamingIdx(null);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loadingSend && input.trim()) (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
    }
  }

  function onNewThread() {
    if (loadingSend) abortRef.current?.abort();
    if (isGuest) {
      if (window.confirm("Clear your chat history?")) { clearGuest(); setMessages([]); }
      return;
    }
    setActiveId(null); setMessages([]); setInput(""); setErr("");
    inputRef.current?.focus();
  }

  async function onDeleteThread(e: React.MouseEvent, threadId: string) {
    e.stopPropagation();
    try {
      await api.delete(`/api/thread/${threadId}`);
      setThreads((prev) => prev.filter((t) => t.threadId !== threadId));
      if (activeId === threadId) { setActiveId(null); setMessages([]); }
    } catch { setErr("Failed to delete thread."); }
  }

  const currentTitle = useMemo(() => {
    if (isGuest) return "Guest Chat";
    const t = threads.find((x) => x.threadId === activeId);
    return t?.title || "New Conversation";
  }, [threads, activeId, isGuest]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen text-white bg-gray-950" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* ══ SIDEBAR ═══════════════════════════════════════════════════════════ */}
      {!isGuest && (
        <aside className="flex flex-col w-64 border-r bg-gray-900/60 border-white/5 backdrop-blur-sm">
          <div className="p-4 border-b border-white/5">
            <div className="mb-4 text-lg font-black tracking-tight" style={{ fontFamily: "monospace" }}>
              Σ<span className="text-green-400">GPT</span>
            </div>
            <button
              onClick={onNewThread}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold bg-green-500 hover:bg-green-400 text-black rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20"
            >
              + New Chat
            </button>
          </div>

          <div className="flex-1 p-2 overflow-auto">
            {loadingThreads ? (
              <div className="p-3 text-xs text-center text-gray-500">Loading…</div>
            ) : threads.length ? (
              <div className="space-y-0.5">
                {threads.map((t) => (
                  <div
                    key={t.threadId}
                    onClick={() => setActiveId(t.threadId)}
                    className={`group flex items-start justify-between gap-1 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      activeId === t.threadId ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{t.title || "Untitled"}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{relativeTime(t.updatedAt)}</div>
                    </div>
                    <button
                      onClick={(e) => onDeleteThread(e, t.threadId)}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs px-1 mt-0.5 shrink-0"
                    >✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-xs text-center text-gray-600">No conversations yet.<br />Start one above!</div>
            )}
          </div>

          <div className="p-3 border-t border-white/5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center text-xs font-bold text-green-400 border rounded-full w-7 h-7 bg-green-500/20 border-green-500/30">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="text-xs text-gray-300 font-medium truncate max-w-[100px]">{user?.name}</span>
              </div>
              <button onClick={logout} className="px-2 py-1 text-xs text-gray-500 transition-colors rounded hover:text-white hover:bg-white/5">
                Sign out
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ══ MAIN ══════════════════════════════════════════════════════════════ */}
      <main className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b bg-gray-900/40 border-white/5 backdrop-blur-sm h-14 shrink-0">
          <div className="flex items-center gap-3">
            {isGuest && (
              <span className="text-base font-black tracking-tight" style={{ fontFamily: "monospace" }}>
                Σ<span className="text-green-400">IGMA</span>
                <span className="ml-1 text-sm font-light text-white/30">GPT</span>
              </span>
            )}
            <span className="max-w-xs text-sm font-semibold text-white truncate">{currentTitle}</span>
            {isGuest && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium">Guest</span>
            )}
            {loadingSend && !isThinking && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium animate-pulse">● Streaming</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Llama 3.3 · 70B
            </div>
            {isGuest && (
              <>
                <a href="/login" className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all">Sign In</a>
                <a href="/register" className="px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-400 text-black rounded-lg transition-all">Sign Up</a>
              </>
            )}
          </div>
        </header>

        {/* Guest banner */}
        {isGuest && (
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-blue-700/20 bg-blue-950/20">
            <span className="text-xs text-blue-300/80">💡 Guest mode — messages are stored locally only.</span>
            <a href="/register" className="ml-4 text-xs font-medium text-blue-400 hover:text-blue-300 shrink-0">Sign up for free →</a>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 px-4 py-6 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Empty state — registered */}
            {!activeId && !isGuest && (
              <div className="flex flex-col items-center justify-center pt-24 text-center">
                <div className="mb-4 text-5xl font-black" style={{ fontFamily: "monospace" }}>
                  Σ<span className="text-green-400">GPT</span>
                </div>
                <p className="text-sm text-gray-500">Start a new conversation above.</p>
              </div>
            )}

            {/* Empty state — guest */}
            {isGuest && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-20 text-center">
                <div className="mb-5 text-5xl font-black" style={{ fontFamily: "monospace" }}>
                  Σ<span className="text-green-400">GPT</span>
                </div>
                <p className="mb-2 text-lg font-semibold text-white">Welcome to SigmaGPT</p>
                <p className="max-w-sm text-sm text-gray-500">You're in guest mode. Ask me anything — powered by Llama 3.3 70B.</p>
                <div className="grid w-full max-w-md grid-cols-2 gap-3 mt-8">
                  {["Explain REST vs GraphQL", "Write a Python web scraper", "How does JWT auth work?", "Best practices for MongoDB"].map((p) => (
                    <button
                      key={p}
                      onClick={() => { setInput(p); inputRef.current?.focus(); }}
                      className="px-4 py-3 text-xs text-left text-gray-300 transition-all border rounded-xl border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15"
                    >
                      {p} →
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {err && (
              <div className="px-4 py-3 text-sm text-red-300 border rounded-xl border-red-800/50 bg-red-950/30">⚠ {err}</div>
            )}

            {/* Message list */}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 items-start ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  m.role === "user"
                    ? "bg-green-500/20 border border-green-500/30 text-green-400"
                    : "bg-white/5 border border-white/10 text-gray-400"
                }`}>
                  {m.role === "user" ? (user?.name?.[0] ?? "U").toUpperCase() : "Σ"}
                </div>

                {/* Bubble */}
                <div className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-green-500/12 border border-green-500/20 rounded-tr-md"
                    : "bg-white/4 border border-white/8 rounded-tl-md"
                }`}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-40">
                    {m.role === "user" ? (user?.name ?? "You") : "SigmaGPT"}
                  </div>

                  {m.role === "assistant" ? (
                    <AssistantBubble content={m.content} isStreaming={streamingIdx === i} />
                  ) : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                  )}

                  <div className="flex items-center justify-between gap-3 mt-2">
                    <span className="text-[10px] text-gray-600">{relativeTime(m.at)}</span>
                    {m.role === "assistant" && streamingIdx !== i && m.content && (
                      <button
                        onClick={() => copy(m.content, i)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-500 hover:text-gray-300 transition-all"
                      >
                        {copied === i ? "✓ Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking bubble — before first token */}
            {isThinking && <ThinkingBubble />}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSend}
              className="flex gap-2 p-2 border bg-gray-900/80 border-white/10 rounded-2xl backdrop-blur-sm"
            >
              {isGuest && (
                <button type="button" onClick={onNewThread} className="px-3 py-2 text-xs text-gray-400 transition-all border hover:text-white border-white/8 hover:border-white/15 rounded-xl">
                  Clear
                </button>
              )}
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={loadingSend ? "Waiting for response…" : isGuest ? "Ask anything… (guest mode)" : "Ask anything…"}
                disabled={loadingSend}
                className="flex-1 px-2 py-2 text-sm placeholder-gray-600 bg-transparent focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loadingSend || !input.trim()}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  input.trim() && !loadingSend
                    ? "bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/20"
                    : "bg-white/5 text-gray-600 cursor-not-allowed"
                }`}
              >
                {loadingSend ? "●●●" : "Send"}
              </button>
            </form>
            <p className="text-center text-[10px] text-gray-600 mt-2">
              SigmaGPT · Llama 3.3 70B · Responses may be inaccurate
            </p>
          </div>
        </div>
      </main>

      {/* Keyframes */}
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}