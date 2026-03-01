import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🟢 Backend Base URL (change on deploy)
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  // 🟢 Initialize states
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // 🟢 Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Force-refresh image with cache-busting
      const updatedUser = {
        ...res.data,
        profilePic: res.data.profilePic
          ? `${res.data.profilePic}?t=${Date.now()}`
          : "/default-avatar.png",
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Profile fetch error:", err.response?.data || err.message);
    }
  }, [token]);

  // 🔁 Auto-fetch on token change
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 🔒 Save token
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // 💾 Save user
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  // 🚫 Redirect from auth pages if already logged in
  useEffect(() => {
    if (token && user && ["/login", "/signup"].includes(location.pathname)) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, user, location.pathname, navigate]);

  // 🚪 Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        user,
        setUser,
        logout,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
