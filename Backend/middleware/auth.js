// middleware/auth.js
import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, email, role, name, iat, exp } or { sub, role: "guest", isGuest: true }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// NEW: Optional auth - allows both authenticated and guest users
export function optionalAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
    } else {
      req.user = null; // No token provided, user is anonymous
    }
    next();
  } catch (err) {
    // Invalid token, treat as anonymous
    req.user = null;
    next();
  }
}

// NEW: Auth that allows guests but requires at least a guest token
export function authOrGuest(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

    if (!token) {
      return res.status(401).json({ 
        error: "Authentication required",
        hint: "Get a guest token from /auth/guest or sign up"
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    
    // Both regular users and guests can proceed
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// NEW: Block guests - only allow registered users
export function registeredOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (req.user.isGuest) {
    return res.status(403).json({ 
      error: "This feature requires registration",
      hint: "Please sign up to access this feature"
    });
  }
  
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Guests never have special roles
    if (req.user.isGuest) {
      return res.status(403).json({ error: "Guests cannot access this resource" });
    }
    
    next();
  };
}

// NEW: Helper to check if user is guest
export function isGuest(req) {
  return req.user && req.user.isGuest === true;
}

// NEW: Helper to check if user is registered
export function isRegistered(req) {
  return req.user && !req.user.isGuest;
}
 