import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useAuth0 } from "@auth0/auth0-react";

const CLIENT_ID = "944851307431-lbrke4j7c5cfgsp73j60ejhna4t8cs31.apps.googleusercontent.com";

export default function LoginPage() {
  const { loginWithGoogle, error } = useAuth();
  const { loginWithRedirect, error: auth0Error } = useAuth0();
  const btnRef = useRef(null);

  useEffect(() => {
    // Load the GSI script once
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogle();
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []); // eslint-disable-line

  function initGoogle() {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: ({ credential }) => loginWithGoogle(credential),
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo mark */}
        <div style={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="var(--accent)" />
            <path d="M12 20h16M20 12v16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your account to continue</p>

        {(error || auth0Error) && <p style={styles.error}>{error || auth0Error.message}</p>}

        {/* Google renders its button into this div */}
        <div ref={btnRef} style={styles.googleBtn} />

        <div style={styles.divider}>or</div>

        <button
          type="button"
          onClick={() => loginWithRedirect()}
          style={styles.auth0Btn}
        >
          Continue with Auth0
        </button>

        <p style={styles.fine}>
          By continuing you agree to our{" "}
          <a href="#" style={styles.link}>Terms</a> and{" "}
          <a href="#" style={styles.link}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "radial-gradient(ellipse at 60% 0%, #1f2347 0%, var(--bg) 65%)",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  logo: { marginBottom: "8px" },
  title: { fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px" },
  sub:   { fontSize: "14px", color: "var(--muted)", textAlign: "center" },
  error: {
    fontSize: "13px",
    color: "#f87171",
    background: "#2a1a1a",
    border: "1px solid #7f1d1d",
    borderRadius: "8px",
    padding: "10px 14px",
    width: "100%",
    textAlign: "center",
  },
  googleBtn: { marginTop: "8px" },
  divider: { color: "var(--muted)", fontSize: "13px" },
  auth0Btn: {
    width: "320px",
    maxWidth: "100%",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  fine: { fontSize: "12px", color: "var(--muted)", textAlign: "center", marginTop: "8px" },
  link: { color: "var(--accent)", textDecoration: "none" },
};
