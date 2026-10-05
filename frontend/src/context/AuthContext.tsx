"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getStoredToken, setStoredToken, clearStoredToken } from "@/lib/api";

export interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: "admin" | "employee";
  biometric_pin?: string | null;
  hourly_rate: number;
  is_active: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => { throw new Error("Unimplemented"); },
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profile = await api.auth.getMe();
      setUser(profile);
    } catch (err) {
      console.warn("Session expired or invalid token:", err);
      clearStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = getStoredToken();
    if (savedToken) {
      setToken(savedToken);
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (identifier: string, pass: string): Promise<UserProfile> => {
    const res = await api.auth.login(identifier, pass);
    setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
