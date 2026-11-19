import { AuthProvider, useAuth } from "./AuthContext";
import { useAuth0 } from "@auth0/auth0-react";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";

function Router() {
  const { user, loading } = useAuth();
  const { isAuthenticated, isLoading: auth0Loading } = useAuth0();

  if (loading || auth0Loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: "spin 1s linear infinite" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="16" cy="16" r="12" stroke="var(--border)" strokeWidth="3" />
          <path d="M16 4a12 12 0 0 1 12 12" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return user || isAuthenticated ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
