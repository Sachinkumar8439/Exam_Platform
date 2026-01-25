import React, {
  createContext,
  useState,
  useEffect,
  useCallback
} from "react";
import api from "../api/api";
import { Loader } from "lucide-react";

// Create context
export const AppStateContext = createContext(null);

export const AppStateProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔁 Fetch current logged-in user
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get("/users/me");
      console.log(res)
      setUser(res.data || res); // depending on backend structure
    } catch {
      // token invalid / expired
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  // 🔓 Logout helper
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Context value
  const contextValue = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    logout
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {isLoading ? <Loader/> : children}
    </AppStateContext.Provider>
  );
};
