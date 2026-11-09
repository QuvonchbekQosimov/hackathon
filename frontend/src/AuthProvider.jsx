import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import { getMe, logoutUser } from "./api";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUser((await getMe()).data);
    } catch (e) {
      setUser(null);
      if (e.response?.status !== 401) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const clear = () => setUser(null);
    window.addEventListener("bais:unauthorized", clear);
    return () => window.removeEventListener("bais:unauthorized", clear);
  }, [refresh]);
  const logout = async () => {
    await logoutUser();
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, error, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
