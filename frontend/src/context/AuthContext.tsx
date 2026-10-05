"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getStoredToken, setStoredToken, clearStoredToken } from "@/lib/api";
import { 
  authenticateBiometric, 
  registerBiometric, 
  isBiometricEnrolled as checkBiometricEnrolled,
  disableBiometric as removeBiometric,
  getEnrolledUser
} from "@/lib/biometric";

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
  login: (identifier: string, pass: string, enableBiometrics?: boolean) => Promise<UserProfile>;
  loginWithBiometric: () => Promise<UserProfile>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => void;
  isBiometricActive: boolean;
  enrolledBiometricUser: any | null;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => { throw new Error("Unimplemented"); },
  loginWithBiometric: async () => { throw new Error("Unimplemented"); },
  enableBiometrics: async () => false,
  disableBiometrics: () => {},
  isBiometricActive: false,
  enrolledBiometricUser: null,
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricActive, setIsBiometricActive] = useState(false);
  const [enrolledBiometricUser, setEnrolledBiometricUser] = useState<any | null>(null);

  const checkBiometricState = () => {
    const enrolled = checkBiometricEnrolled();
    setIsBiometricActive(enrolled);
    setEnrolledBiometricUser(getEnrolledUser());
  };

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
    checkBiometricState();
    const savedToken = getStoredToken();
    if (savedToken) {
      setToken(savedToken);
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (identifier: string, pass: string, enableBiometrics: boolean = false): Promise<UserProfile> => {
    const res = await api.auth.login(identifier, pass);
    setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);

    if (enableBiometrics) {
      await registerBiometric(res.user, res.access_token);
      checkBiometricState();
    }

    return res.user;
  };

  const loginWithBiometric = async (): Promise<UserProfile> => {
    const result = await authenticateBiometric();
    setStoredToken(result.token);
    setToken(result.token);
    setUser(result.user);
    // Refresh latest data in background
    api.auth.getMe().then((freshProfile) => {
      setUser(freshProfile);
    }).catch(() => {});
    return result.user;
  };

  const enableBiometrics = async (): Promise<boolean> => {
    if (!user || !token) return false;
    const ok = await registerBiometric(user, token);
    if (ok) checkBiometricState();
    return ok;
  };

  const disableBiometrics = () => {
    removeBiometric();
    checkBiometricState();
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
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      loginWithBiometric,
      enableBiometrics,
      disableBiometrics,
      isBiometricActive,
      enrolledBiometricUser,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
