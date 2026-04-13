// import { Link, useNavigate } from "react-router-dom";
// import { useState } from "react";
// import api from "../services/api";

// export default function Register() {
//   const navigate = useNavigate();

//   const [name, setName] = useState<string>("");
//   const [email, setEmail] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [confirm, setConfirm] = useState<string>("");

//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string>("");

//   const passwordsMismatch = confirm.length > 0 && password !== confirm;
//   const canSubmit =
//     !!name.trim() &&
//     !!email.trim() &&
//     password.length >= 8 &&
//     !passwordsMismatch &&
//     !loading;

//   async function handleRegister(e: React.FormEvent) {
//     e.preventDefault();
//     setErr("");

//     if (!canSubmit) {
//       if (!name || !email || !password) setErr("All fields are required.");
//       else if (password.length < 8) setErr("Password must be at least 8 characters.");
//       else if (password !== confirm) setErr("Passwords do not match.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const { data } = await api.post("/auth/register", {
//         name: name.trim(),
//         email: email.trim(),
//         password,
//       });

//       // backend returns: { ok, user, token }
//       localStorage.setItem("token", data.token);
//       localStorage.setItem("user", JSON.stringify(data.user));

//       navigate("/chat");
//     } catch (error: any) {
//       const msg =
//         error?.response?.data?.error ||
//         "Registration failed. Please try again.";
//       setErr(msg);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="flex items-center justify-center min-h-screen px-3 text-white bg-gray-950">
//       <form
//         onSubmit={handleRegister}
//         className="w-full max-w-md p-8 bg-gray-900 shadow-lg rounded-xl"
//       >
//         <h2 className="mb-6 text-2xl font-bold text-center">Register</h2>

//         <div className="space-y-4">
//           <input
//             type="text"
//             placeholder="Full Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none"
//             autoComplete="name"
//           />

//           <input
//             type="email"
//             placeholder="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none"
//             autoComplete="email"
//           />

//           <div>
//             <input
//               type="password"
//               placeholder="Password (min 8 chars)"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none"
//               autoComplete="new-password"
//               minLength={8}
//             />
//             <p className="mt-1 text-xs text-gray-400">
//               Use at least 8 characters.
//             </p>
//           </div>

//           <input
//             type="password"
//             placeholder="Confirm Password"
//             value={confirm}
//             onChange={(e) => setConfirm(e.target.value)}
//             className={`w-full p-3 bg-gray-800 rounded-lg border focus:outline-none ${
//               passwordsMismatch ? "border-red-500" : "border-gray-700"
//             }`}
//             autoComplete="new-password"
//           />

//           {err && (
//             <div className="p-2 text-sm text-red-400 border border-red-800 rounded bg-red-950/40">
//               {err}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={!canSubmit}
//             className={`w-full py-3 rounded-lg transition ${
//               canSubmit
//                 ? "bg-green-500 hover:bg-green-600"
//                 : "bg-green-500/40 cursor-not-allowed"
//             }`}
//           >
//             {loading ? "Creating..." : "Sign Up"}
//           </button>
//         </div>

//         <p className="mt-4 text-center text-gray-400">
//           Already have an account?{" "}
//           <Link to="/login" className="text-green-400 hover:underline">
//             Login
//           </Link>
//         </p>
//       </form>
//     </div>
//   );
// }
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const passwordsMismatch = confirm.length > 0 && password !== confirm;
  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "text-red-400", "text-yellow-400", "text-green-400"];
  const strengthBg = ["", "bg-red-400", "bg-yellow-400", "bg-green-400"];

  const canSubmit =
    !!name.trim() &&
    !!email.trim() &&
    password.length >= 8 &&
    !passwordsMismatch &&
    !loading;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!canSubmit) {
      if (!name || !email || !password) setErr("All fields are required.");
      else if (password.length < 8) setErr("Password must be at least 8 characters.");
      else if (password !== confirm) setErr("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/chat");
    } catch (error: any) {
      setErr(error?.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4 py-8 text-white bg-gray-950"
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
          <p className="mt-2 text-sm text-gray-500">Create your free account</p>
        </div>

        {/* Card */}
        <div className="p-8 border shadow-2xl bg-gray-900/60 border-white/8 rounded-2xl backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-bold">Sign Up</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-sm placeholder-gray-600 transition-all border bg-gray-800/60 border-white/8 rounded-xl focus:outline-none focus:border-green-500/50 focus:bg-gray-800"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
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
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm placeholder-gray-600 transition-all border bg-gray-800/60 border-white/8 rounded-xl focus:outline-none focus:border-green-500/50 focus:bg-gray-800"
                autoComplete="new-password"
              />
              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          passwordStrength >= level ? strengthBg[passwordStrength] : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] mt-1 ${strengthColor[passwordStrength]}`}>
                    {strengthLabel[passwordStrength]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800/60 border rounded-xl text-sm focus:outline-none transition-all placeholder-gray-600 ${
                  passwordsMismatch
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/8 focus:border-green-500/50 focus:bg-gray-800"
                }`}
                autoComplete="new-password"
              />
              {passwordsMismatch && (
                <p className="text-[10px] text-red-400 mt-1">Passwords don't match</p>
              )}
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
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="pt-5 mt-5 text-center border-t border-white/5">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-green-400 transition-colors hover:text-green-300">
                Sign in
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