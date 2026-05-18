/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? JSON.parse(saved) : true;
  });

  const toggleTheme = () => {
    if (!document.startViewTransition) {
      setIsDark(!isDark);
      return;
    }
    document.startViewTransition(() => {
      setIsDark(!isDark);
    });
  };

  const theme = {
    // Background gradients & surfaces
    bg: {
      primary: isDark 
        ? "bg-black" 
        : "bg-gradient-to-br from-gray-50 via-white to-gray-100",
      secondary: isDark 
        ? "bg-[#121212]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black" 
        : "bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-xl shadow-gray-200/50",
      card: isDark 
        ? "bg-[#181818]/90 border border-white/10 shadow-lg shadow-black/50" 
        : "bg-white border border-gray-200 shadow-md",
      cardHover: isDark 
        ? "hover:bg-[#222222]/90 hover:border-violet-500/30 transition-all duration-300" 
        : "hover:bg-gray-50/80 hover:border-violet-500/30 transition-all duration-300",
      input: isDark 
        ? "bg-[#1e1e1e] border border-white/15 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white" 
        : "bg-white border border-gray-300 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 text-gray-900",
      button: isDark 
        ? "bg-[#222222] hover:bg-[#2a2a2a] border border-white/15 text-white shadow-md" 
        : "bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 shadow-sm"
    },
    
    // Text colors
    text: {
      primary: isDark ? "text-white" : "text-gray-900",
      secondary: isDark ? "text-gray-300" : "text-gray-600",
      muted: isDark ? "text-gray-500" : "text-gray-400",
      accent: isDark ? "text-violet-400" : "text-violet-600"
    },
    
    // Navigation
    nav: {
      bg: isDark 
        ? "bg-black/80 backdrop-blur-2xl border-b border-white/10" 
        : "bg-white/90 backdrop-blur-2xl border-b border-gray-200/60 shadow-sm",
      button: isDark 
        ? "text-gray-400 hover:text-white hover:bg-white/5" 
        : "text-gray-600 hover:text-gray-900 hover:bg-violet-50",
      buttonActive: isDark 
        ? "text-white bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 shadow-lg shadow-violet-500/10" 
        : "text-violet-700 bg-violet-100/80 border border-violet-200 font-semibold"
    },
    
    // Status indicators
    status: {
      success: isDark ? "text-emerald-400" : "text-emerald-600",
      error: isDark ? "text-rose-400" : "text-rose-600",
      warning: isDark ? "text-amber-400" : "text-amber-600"
    }
  };

  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(isDark));
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const value = {
    isDark,
    theme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};