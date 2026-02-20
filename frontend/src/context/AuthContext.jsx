import { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  const persistSession = (sessionToken, sessionUser) => {
    localStorage.setItem("token", sessionToken);
    localStorage.setItem("user", JSON.stringify(sessionUser));
    setToken(sessionToken);
    setUser(sessionUser);
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      const response = await authAPI.register({ name, email, password });

      // Save registration details so login page can prefill and guide user.
      localStorage.setItem(
        "pendingRegistration",
        JSON.stringify({ name, email, password, registeredAt: Date.now() })
      );

      return response.data;
    } catch (err) {
      const message =
        err.code === "ERR_NETWORK"
          ? "Cannot connect to backend. Start backend on http://localhost:5000."
          : err.response?.data?.message || "Registration failed";
      setError(message);
      throw new Error(message);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const { token: sessionToken, user: sessionUser } = response.data;
      persistSession(sessionToken, sessionUser);
      localStorage.removeItem("pendingRegistration");
      return response.data;
    } catch (err) {
      const message =
        err.code === "ERR_NETWORK"
          ? "Cannot connect to backend. Start backend on http://localhost:5000."
          : err.response?.data?.message || "Login failed";
      setError(message);
      throw new Error(message);
    }
  };

  const verifyOtpLogin = async (email, otp) => {
    try {
      setError(null);
      const response = await authAPI.verifyOtp({ email, otp });
      const { token: sessionToken, user: sessionUser } = response.data;
      persistSession(sessionToken, sessionUser);
      localStorage.removeItem("pendingRegistration");
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || "OTP verification failed";
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setError(null);
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.user;
      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update profile";
      setError(message);
      throw new Error(message);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: Boolean(token && user),
    register,
    login,
    verifyOtpLogin,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
