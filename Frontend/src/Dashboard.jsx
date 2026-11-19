import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useAuth0 } from "@auth0/auth0-react";

const AUTH0_API = import.meta.env.VITE_AUTH0_API_URL ?? "https://third-party-oauth.vercel.app";

export default function Dashboard() {
  const {
    user: googleUser,
    logout: logoutGoogle,
    fetchGoogleApiData,
  } = useAuth();
  const {
    isAuthenticated,
    user: auth0User,
    logout: logoutAuth0,
    getAccessTokenSilently,
  } = useAuth0();
  const [apiResult, setApiResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const user = isAuthenticated ? (auth0User && {
    id: auth0User.sub ?? "",
    email: auth0User.email ?? "",
    name: auth0User.name ?? "",
    picture: auth0User.picture ?? "",
  }) : googleUser;

  const fetchAuth0ApiData = async () => {
    const accessToken = await getAccessTokenSilently();
    const response = await fetch(`${AUTH0_API}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail ?? "Auth0 API request failed");
    return data;
  };

  const handleFetchApiData = async (fetchData) => {
    setApiLoading(true);
    setApiError(null);
    setApiResult(null);
    try {
      setApiResult(await fetchData());
    } catch (error) {
      setApiError(error.message);
    } finally {
      setApiLoading(false);
    }
  };

  const logout = () => isAuthenticated
    ? logoutAuth0({ logoutParams: { returnTo: window.location.origin } })
    : logoutGoogle();

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="var(--accent)" />
            <path d="M12 20h16M20 12v16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span style={styles.brandName}>MyApp</span>
        </div>

        <button onClick={logout} style={styles.logoutBtn}>Sign out</button>
      </header>

      {/* Main content */}
      <main style={styles.main}>
        {/* Profile card */}
        <div style={styles.profileCard}>
          <img src={user.picture} alt={user.name} style={styles.avatar} referrerPolicy="no-referrer" />
          <div>
            <p style={styles.name}>{user.name}</p>
            <p style={styles.email}>{user.email}</p>
          </div>
          <span style={styles.badge}>Verified</span>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {[
            { label: "Account type", value: isAuthenticated ? "Auth0" : "Google SSO" },
            { label: "User ID",      value: user.id.slice(0, 12) + "…" },
            { label: "Session",      value: "Active" },
          ].map(({ label, value }) => (
            <div key={label} style={styles.statBox}>
              <p style={styles.statLabel}>{label}</p>
              <p style={styles.statValue}>{value}</p>
            </div>
          ))}
        </div>

        {/* Info section */}
        <div style={styles.infoBox}>
          <h2 style={styles.infoTitle}>You're signed in!</h2>
          {isAuthenticated ? (
            <p style={styles.infoText}>
              You're signed in with Auth0. Use the button below to request data from the Auth0 API.
            </p>
          ) : (
            <p style={styles.infoText}>
              Google verified your identity and the Google API issued your JWT. Use the button
              below to request data with that token.
            </p>
          )}
        </div>

        <div style={styles.infoBox}>
          <h2 style={styles.infoTitle}>Protected API data</h2>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => handleFetchApiData(fetchAuth0ApiData)}
              style={styles.apiButton}
              disabled={apiLoading}
            >
              {apiLoading ? "Fetching..." : "Fetch Auth0 API data"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFetchApiData(fetchGoogleApiData)}
              style={styles.apiButton}
              disabled={apiLoading}
            >
              {apiLoading ? "Fetching..." : "Fetch self-issued JWT API data"}
            </button>
          )}
          {apiError && <p style={styles.apiError}>{apiError}</p>}
          {apiResult && <pre style={styles.apiResult}>{JSON.stringify(apiResult, null, 2)}</pre>}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    borderBottom: "1px solid var(--border)",
    background: "var(--surface)",
  },
  brand:     { display: "flex", alignItems: "center", gap: "10px" },
  brandName: { fontWeight: 700, fontSize: "16px", letterSpacing: "-0.3px" },
  logoutBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--muted)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "color .15s, border-color .15s",
  },
  main: {
    flex: 1,
    maxWidth: "720px",
    margin: "0 auto",
    padding: "48px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
  },
  profileCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: "2px solid var(--accent)",
  },
  name:  { fontWeight: 600, fontSize: "16px", marginBottom: "2px" },
  email: { fontSize: "13px", color: "var(--muted)" },
  badge: {
    marginLeft: "auto",
    background: "#1a2e1a",
    color: "#4ade80",
    border: "1px solid #166534",
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: 500,
  },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" },
  statBox: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "20px",
  },
  statLabel: { fontSize: "12px", color: "var(--muted)", marginBottom: "6px" },
  statValue: { fontSize: "15px", fontWeight: 600 },
  infoBox: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "28px",
  },
  infoTitle: { fontSize: "17px", fontWeight: 600, marginBottom: "10px" },
  infoText:  { fontSize: "14px", color: "var(--muted)", lineHeight: 1.7 },
  apiButton: {
    background: "var(--accent)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  apiError: { color: "#f87171", fontSize: "13px", marginTop: "12px" },
  apiResult: {
    background: "#151722",
    borderRadius: "8px",
    color: "var(--text)",
    fontSize: "13px",
    marginTop: "16px",
    overflowX: "auto",
    padding: "16px",
  },
  code: {
    background: "#2a2d3a",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "12px",
  },
};
