import React from "react";

import { fetchCurrentUser, loginRequest, setAuthToken } from "../services/api";

const AuthContext = React.createContext(null);

function toTier(role) {
  if (role === "admin") return "Governance Level (Tier 1)";
  if (role === "sub_admin") return "Management Level (Tier 2)";
  if (role === "taluka_admin") return "Implementation Level (Tier 3)";
  return "Execution Level (Tier 4)";
}

function nameFromEmail(email) {
  if (!email) return "User";
  const atIndex = String(email).indexOf("@");
  const localPart = atIndex >= 0 ? String(email).slice(0, atIndex) : String(email);
  const normalized = localPart.trim();
  return normalized || "User";
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = React.useState(true);
  const [session, setSession] = React.useState(() => {
    const raw = localStorage.getItem("geosentinel_session");
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    let isMounted = true;
    const rawToken = localStorage.getItem("geosentinel_token");
    if (!rawToken) {
      if (isMounted) {
        setAuthToken(null);
        setLoading(false);
      }
      return;
    }

    if (isMounted) {
      setLoading(true);
      setAuthToken(rawToken);
    }
    fetchCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        setSession((prev) => ({
          ...(prev || {}),
          id: user.user_id,
          name: nameFromEmail(user.email),
          email: user.email,
          role: user.role,
          tier: toTier(user.role),
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthToken(null);
        setSession(null);
        localStorage.removeItem("geosentinel_session");
        localStorage.removeItem("geosentinel_token");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = React.useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    const token = data?.access_token;
    const role = data?.role;

    if (!token || !role) {
      throw new Error("Invalid login response from server.");
    }

    setAuthToken(token);

    let currentUser = null;
    if (!data?.user_id || !data?.email) {
      try {
        currentUser = await fetchCurrentUser();
      } catch {
        currentUser = null;
      }
    }

    const nextSession = {
      id: data?.user_id ?? currentUser?.user_id ?? null,
      email: data?.email || currentUser?.email || email,
      name: nameFromEmail(data?.email || currentUser?.email || email),
      role,
      tier: toTier(role),
      loggedAt: new Date().toISOString(),
    };
    setSession(nextSession);
    localStorage.setItem("geosentinel_session", JSON.stringify(nextSession));
    localStorage.setItem("geosentinel_token", token);
    return nextSession;
  }, []);

  const logout = React.useCallback(() => {
    setSession(null);
    localStorage.removeItem("geosentinel_session");
    localStorage.removeItem("geosentinel_token");
    setAuthToken(null);
  }, []);

  const value = React.useMemo(
    () => ({
      session,
      loading,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [session, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
