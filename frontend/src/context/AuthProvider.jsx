import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { authService } from "../utils/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState(null);

  const checkTrialStatus = useCallback(async () => {
    const status = await authService.checkTrialStatus();
    setTrialStatus(status);
    return status;
  }, []);

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    if (result.success) {
      setUser(result.user);
      await checkTrialStatus();
    }
    return result;
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    if (result.success) {
      setUser(result.user);
      await checkTrialStatus();
    }
    return result;
  };

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setTrialStatus(null);
  }, []);

  const checkAuth = useCallback(async () => {
    const userData = await authService.checkAuth();
    if (userData) {
      setUser(userData);
    }
    await checkTrialStatus();
    setLoading(false);
  }, [checkTrialStatus]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    loading,
    trialStatus,
    login,
    register,
    logout,
    checkTrialStatus,
    isAuthenticated: !!user,
    hasActiveAccess: user?.is_premium || (trialStatus?.is_trial_active && !trialStatus?.trial_expired)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};