// import { createContext, useContext, useEffect, useMemo, useState } from "react";
// import axios from "axios";

// type User = { id: string; name: string; email: string; role: string };
// type AuthCtx = {
//   user: User | null;
//   token: string | null;
//   isAuthed: boolean;
//   isGuest: boolean;
//   setAuth: (u: User, t: string) => void;
//   logout: () => void;
// };

// const Ctx = createContext<AuthCtx | null>(null);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [isGuest, setIsGuest] = useState(false);
//   const [isInitialized, setIsInitialized] = useState(false);

//   // Load from localStorage and create guest token if needed
//   useEffect(() => {
//     const initAuth = async () => {
//       const t = localStorage.getItem("token");
//       const u = localStorage.getItem("user");
//       const guestToken = localStorage.getItem("guestToken");

//       // Case 1: User has a regular token and user data
//       if (t && u) {
//         setToken(t);
//         try {
//           const parsedUser = JSON.parse(u);
//           setUser(parsedUser);
//           setIsGuest(false);
//         } catch {
//           // Invalid user data, clear it
//           localStorage.removeItem("token");
//           localStorage.removeItem("user");
//         }
//       }
//       // Case 2: User has a guest token
//       else if (guestToken) {
//         setToken(guestToken);
//         setIsGuest(true);
//         setUser({
//           id: "guest",
//           name: "Guest User",
//           email: "",
//           role: "guest",
//         });
//       }
//       // Case 3: No token at all - create a guest session
//       else {
//         await createGuestSession();
//       }

//       setIsInitialized(true);
//     };

//     initAuth();
//   }, []);

//   // Create a new guest session
//   const createGuestSession = async () => {
//     try {
//       const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
//       const response = await axios.post(`${API_URL}/auth/guest`);
      
//       if (response.data.token) {
//         const guestToken = response.data.token;
//         localStorage.setItem("guestToken", guestToken);
//         setToken(guestToken);
//         setIsGuest(true);
//         setUser({
//           id: "guest",
//           name: "Guest User",
//           email: "",
//           role: "guest",
//         });
//       }
//     } catch (error) {
//       console.error("Failed to create guest session:", error);
//       // Even if guest token creation fails, allow the user to continue
//       // They just won't be able to chat until they sign up
//     }
//   };

//   const setAuth = (u: User, t: string) => {
//     // Clear any existing guest token when user logs in
//     localStorage.removeItem("guestToken");
    
//     setUser(u);
//     setToken(t);
//     setIsGuest(false);
//     localStorage.setItem("token", t);
//     localStorage.setItem("user", JSON.stringify(u));
//   };

//   const logout = () => {
//     setUser(null);
//     setToken(null);
//     setIsGuest(false);
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     localStorage.removeItem("guestToken");
//     localStorage.removeItem("guestChatMessages"); // Clear guest chat history
    
//     // Create a new guest session after logout
//     createGuestSession();
//   };

//   const value = useMemo(
//     () => ({
//       user,
//       token,
//       isAuthed: !!token && !isGuest,
//       isGuest,
//       setAuth,
//       logout,
//     }),
//     [user, token, isGuest]
//   );

//   // Don't render children until auth is initialized
//   if (!isInitialized) {
//     return (
//       <div className="flex items-center justify-center h-screen text-white bg-gray-950">
//         <div className="text-center">
//           <div className="mb-2 text-xl">Loading...</div>
//           <div className="text-sm text-gray-400">Initializing chat</div>
//         </div>
//       </div>
//     );
//   }

//   return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
// }

// export function useAuth() {
//   const v = useContext(Ctx);
//   if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
//   return v;
// }

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

type User = { id: string; name: string; email: string; role: string };
type AuthCtx = {
  user: User | null;
  token: string | null;
  isAuthed: boolean;
  isGuest: boolean;
  setAuth: (u: User, t: string) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

// ✅ FIX: use VITE_API_BASE_URL consistently (matches api.ts and .env.local)
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      const guestToken = localStorage.getItem("guestToken");

      if (t && u) {
        // Registered user
        setToken(t);
        try {
          setUser(JSON.parse(u));
          setIsGuest(false);
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          await createGuestSession();
        }
      } else if (guestToken) {
        // Returning guest — verify token isn't expired by checking payload
        try {
          const payload = parseJwt(guestToken);
          if (payload?.exp && payload.exp * 1000 < Date.now()) {
            // ✅ FIX: auto-refresh expired guest token instead of silently failing
            localStorage.removeItem("guestToken");
            await createGuestSession();
          } else {
            setToken(guestToken);
            setIsGuest(true);
            setUser({ id: "guest", name: "Guest User", email: "", role: "guest" });
          }
        } catch {
          await createGuestSession();
        }
      } else {
        await createGuestSession();
      }

      setIsInitialized(true);
    };

    initAuth();
  }, []);

  const createGuestSession = async () => {
    try {
      // ✅ FIX: was using VITE_API_URL (undefined) — now uses VITE_API_BASE_URL
      const response = await axios.post(`${API_URL}/auth/guest`);
      if (response.data.token) {
        const guestToken = response.data.token;
        localStorage.setItem("guestToken", guestToken);
        setToken(guestToken);
        setIsGuest(true);
        setUser({ id: "guest", name: "Guest User", email: "", role: "guest" });
      }
    } catch (error) {
      console.error("Failed to create guest session:", error);
      // Set as guest anyway so ProtectedRoute lets them through
      setIsGuest(true);
      setUser({ id: "guest", name: "Guest User", email: "", role: "guest" });
    }
  };

  const setAuth = (u: User, t: string) => {
    localStorage.removeItem("guestToken");
    setUser(u);
    setToken(t);
    setIsGuest(false);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsGuest(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("guestToken");
    localStorage.removeItem("guestChatMessages");
    createGuestSession();
  };

  const value = useMemo(
    () => ({ user, token, isAuthed: !!token && !isGuest, isGuest, setAuth, logout }),
    [user, token, isGuest]
  );

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-950">
        <div className="text-center">
          <div className="mb-2 text-xl">Loading…</div>
          <div className="text-sm text-gray-400">Initializing SigmaGPT</div>
        </div>
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}

// Helper: decode JWT payload without verifying (client-side only, for expiry check)
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}