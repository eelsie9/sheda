import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, getToken, setToken, setUnauthorizedHandler } from "../api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const apply = (d) => {
    setUser(d.user);
    setExpired(false);
    return d;
  };

  // If the server says our login is invalid, log out cleanly
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      setExpired(true);
    });
  }, []);

  // Check the saved login. Only a real "invalid login" answer logs you out.
  // A slow server or a restart just means we try again.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 4 && !cancelled; i++) {
        try {
          apply(await api("/auth/me"));
          break;
        } catch (e) {
          if (e.status === 401) break;
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const d = await api("/auth/login", { method: "POST", body: { email, password } });
    setToken(d.token);
    return apply(d);
  };
  const register = async (body) => {
    const d = await api("/auth/register", { method: "POST", body });
    setToken(d.token);
    return apply(d);
  };
  const logout = () => {
    setToken(null);
    setUser(null);
  };
  const switchRole = async (role) =>
    apply(await api("/users/me/switch-role", { method: "POST", body: { role } }));
  const updateProfile = async (body) => apply(await api("/users/me", { method: "PATCH", body }));

  // Wrap any action that needs an account. Visitors get sent to create one.
  const gate = (action) =>
    user ? action() : navigate("/register", { state: { from: location.pathname } });

  return (
    <AuthContext.Provider
      value={{ user, loading, expired, isSeller: user?.activeRole === "SELLER", login, register, logout, switchRole, updateProfile, gate }}
    >
      {children}
    </AuthContext.Provider>
  );
}