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
    setIsDark(!isDark);
  };

  const theme = {
    // Background gradients
    bg: {
      primary: isDark 
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" 
        : "bg-gradient-to-br from-gray-50 via-white to-gray-100",
      secondary: isDark 
        ? "bg-slate-800/40 backdrop-blur-sm border border-slate-700/50" 
        : "bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg",
      card: isDark 
        ? "bg-slate-800/60 border border-slate-700/30" 
        : "bg-white border border-gray-200 shadow-sm",
      cardHover: isDark 
        ? "hover:bg-slate-700/40" 
        : "hover:bg-gray-50",
      input: isDark 
        ? "bg-slate-700/50 border border-slate-600/50" 
        : "bg-white border border-gray-300",
      button: isDark 
        ? "bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/30" 
        : "bg-gray-100 hover:bg-gray-200 border border-gray-300"
    },
    
    // Text colors
    text: {
      primary: isDark ? "text-white" : "text-gray-900",
      secondary: isDark ? "text-slate-300" : "text-gray-600",
      muted: isDark ? "text-slate-400" : "text-gray-500",
      accent: isDark ? "text-violet-400" : "text-violet-600"
    },
    
    // Navigation
    nav: {
      bg: isDark 
        ? "bg-slate-900/60 backdrop-blur-lg border-b border-slate-700/20" 
        : "bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-sm",
      button: isDark 
        ? "text-slate-400 hover:text-slate-200 hover:bg-violet-600/10" 
        : "text-gray-600 hover:text-gray-900 hover:bg-violet-100",
      buttonActive: isDark 
        ? "text-white bg-violet-600/20" 
        : "text-violet-700 bg-violet-100"
    },
    
    // Status indicators
    status: {
      success: isDark ? "text-green-400" : "text-green-600",
      error: isDark ? "text-red-400" : "text-red-600",
      warning: isDark ? "text-yellow-400" : "text-yellow-600"
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