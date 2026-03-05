// ─── auth/ProtectedRoute.jsx ──────────────────────────────────────────────────
// Enforces role-based access. Wrap any component to restrict who can see it.
//
// Usage:
//   <ProtectedRoute role="inec">        ← INEC officials only
//   <ProtectedRoute role="voter">       ← voters only
//   <ProtectedRoute role="authenticated"> ← any logged-in user
//
// If access is denied, renders an AccessDenied banner instead of the content.

import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({ role, children, fallback }) {
  const { user, isInec, isVoter } = useAuth();

  const allowed =
    role === "inec"          ? isInec :
    role === "voter"         ? isVoter :
    role === "authenticated" ? !!user :
    false;

  if (allowed) return children;
  if (fallback) return fallback;
  return <AccessDenied role={role} user={user} />;
}

function AccessDenied({ role, user }) {
  const message =
    role === "inec"
      ? "This area is restricted to INEC officials. Please log in with your Staff ID."
      : role === "voter"
      ? "Please log in or register as a voter to access this area."
      : "You must be logged in to access this page.";

  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      minHeight:      "60vh",
      padding:        "3rem 2rem",
      textAlign:      "center",
      fontFamily:     "var(--font-sans)",
    }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#004d29", marginBottom: "0.75rem" }}>
        Access Restricted
      </div>
      <div style={{ fontSize: "0.9rem", color: "#555", maxWidth: "420px", lineHeight: 1.6 }}>
        {message}
      </div>
      {user && (
        <div style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "#888" }}>
          You are logged in as <strong>{user.name}</strong> ({user.role}). This role does not have access to this area.
        </div>
      )}
    </div>
  );
}
