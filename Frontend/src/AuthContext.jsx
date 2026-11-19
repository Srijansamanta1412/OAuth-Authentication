import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "sso_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);  // checking stored token
  const [error, setError]     = useState(null);

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUser(data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  /** Called by the Google button with the raw credential string */
  const loginWithGoogle = useCallback(async (credential) => {
    setError(null);
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Login failed");
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setUser({ id: data.id, email: data.email, name: data.name, picture: data.picture });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchGoogleApiData = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error("Google API token is missing. Sign in again.");

    const response = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail ?? "Google API request failed");
    return data;
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API}/auth/logout`, { method: "POST" }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, fetchGoogleApiData, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
