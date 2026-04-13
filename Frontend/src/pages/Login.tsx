// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import api from "../services/api";
// import { useAuth } from "../context/AuthContext";

// export default function Login() {
//   const nav = useNavigate();
//   const loc = useLocation();
//   const { setAuth, isAuthed } = useAuth();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [err, setErr] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showPwd, setShowPwd] = useState(false);

//   // If already authed, bounce to /chat (handles refresh/back nav)
//   useEffect(() => {
//     if (isAuthed) {
//       const redirectTo = (loc.state as any)?.from || "/chat";
//       nav(redirectTo, { replace: true });
//     }
//   }, [isAuthed, loc.state, nav]);

//   const canSubmit =
//     Boolean(email.trim()) && Boolean(password) && !loading;

//   async function handleLogin(e: React.FormEvent) {
//     e.preventDefault();
//     setErr("");
//     if (!canSubmit) return;

//     try {
//       setLoading(true);
//       const { data } = await api.post("/auth/login", {
//         email: email.trim(),
//         password,
//       });
//       setAuth(data.user, data.token);
//       const redirectTo = (loc.state as any)?.from || "/chat";
//       nav(redirectTo, { replace: true });
//     } catch (error: unknown) {
//       // try to pull a meaningful message
//       let msg = "Login failed. Please try again.";
//       if (typeof error === "object" && error && "response" in error) {
//         const anyErr = error as any;
//         const status = anyErr?.response?.status;
//         const apiMsg = anyErr?.response?.data?.error;
//         if (apiMsg) msg = apiMsg;
//         else if (status === 401) msg = "Invalid email or password.";
//         else if (status === 429) msg = "Too many attempts. Please wait a minute.";
//       }
//       setErr(msg);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="flex items-center justify-center min-h-screen px-3 text-white bg-gray-950">
//       <form onSubmit={handleLogin} className="w-full max-w-md p-8 bg-gray-900 shadow-lg rounded-xl">
//         <h2 className="mb-6 text-2xl font-bold text-center">Login</h2>

//         <div className="space-y-4">
//           <input
//             type="email"
//             placeholder="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none"
//             autoComplete="email"
//           />

//           <div className="relative">
//             <input
//               type={showPwd ? "text" : "password"}
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full p-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none"
//               autoComplete="current-password"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPwd((s) => !s)}
//               className="absolute px-2 py-1 text-sm text-gray-300 -translate-y-1/2 right-2 top-1/2 hover:text-white"
//               aria-label={showPwd ? "Hide password" : "Show password"}
//             >
//               {showPwd ? "Hide" : "Show"}
//             </button>
//           </div>

//           {err && (
//             <div className="p-2 text-sm text-red-400 border border-red-800 rounded bg-red-950/40">
//               {err}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={!canSubmit}
//             className={`w-full py-3 rounded-lg transition ${
//               canSubmit ? "bg-green-500 hover:bg-green-600" : "bg-green-500/40 cursor-not-allowed"
//             }`}
//           >
//             {loading ? "Signing in..." : "Sign In"}
//           </button>
//         </div>

//         <p className="mt-4 text-center text-gray-400">
//           No account?{" "}
//           <Link to="/register" className="text-green-400 hover:underline">
//             Create one
//           </Link>
//         </p>
//       </form>
//     </div>
//   );
// }

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { setAuth, isAuthed } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (isAuthed) {
      const redirectTo = (loc.state as any)?.from || "/chat";
      nav(redirectTo, { replace: true });
    }
  }, [isAuthed, loc.state, nav]);

  const canSubmit = Boolean(email.trim()) && Boolean(password) && !loading;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!canSubmit) return;
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });
      setAuth(data.user, data.token);
      nav((loc.state as any)?.from || "/chat", { replace: true });
    } catch (error: unknown) {
      let msg = "Login failed. Please try again.";
      if (typeof error === "object" && error && "response" in error) {
        const anyErr = error as any;
        const status = anyErr?.response?.status;
        const apiMsg = anyErr?.response?.data?.error;
        if (apiMsg) msg = apiMsg;
        else if (status === 401) msg = "Invalid email or password.";
        else if (status === 429) msg = "Too many attempts. Please wait a minute.";
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4 text-white bg-gray-950"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none fixed top-[-200px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-15"
        style={{ background: "radial-gradient(ellipse, #16a34a 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <span
              className="text-3xl font-black tracking-tight"
              style={{ fontFamily: "monospace" }}
            >
              Σ<span className="text-green-400">IGMA</span>
              <span className="ml-1 text-2xl font-light text-white/30">GPT</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">Welcome back</p>
        </div>

        {/* Card */}
        <div className="p-8 border shadow-2xl bg-gray-900/60 border-white/8 rounded-2xl backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-bold">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm placeholder-gray-600 transition-all border bg-gray-800/60 border-white/8 rounded-xl focus:outline-none focus:border-green-500/50 focus:bg-gray-800"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-16 text-sm placeholder-gray-600 transition-all border bg-gray-800/60 border-white/8 rounded-xl focus:outline-none focus:border-green-500/50 focus:bg-gray-800"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute px-1 text-xs text-gray-500 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-300"
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {err && (
              <div className="text-red-400 text-xs bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2.5">
                ⚠ {err}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                canSubmit
                  ? "bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
                  : "bg-green-500/20 text-green-500/40 cursor-not-allowed"
              }`}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="pt-5 mt-5 text-center border-t border-white/5">
            <p className="text-sm text-gray-500">
              No account?{" "}
              <Link to="/register" className="font-medium text-green-400 transition-colors hover:text-green-300">
                Create one free
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-center text-gray-600">
          Or{" "}
          <Link to="/chat" className="text-gray-400 transition-colors hover:text-white">
            continue as guest →
          </Link>
        </p>
      </div>
    </div>
  );
}