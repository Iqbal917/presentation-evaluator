import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";

const LoginComponent = ({ onSwitchToRegister, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { theme } = useTheme();
  const formRef = useRef(null);

  useEffect(() => {
    import('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js').then(() => {
      if (window.gsap && formRef.current) {
        window.gsap.fromTo(formRef.current, 
          { opacity: 0, scale: 0.9, y: 20 }, 
          { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" }
        );
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login({ email, password });
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div ref={formRef} className={`${theme.bg.secondary} rounded-3xl p-8 w-full max-w-md mx-auto shadow-2xl border backdrop-blur-lg`}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
          🎯
        </div>
        <h2 className={`text-2xl lg:text-3xl font-bold ${theme.text.primary} mb-2`}>
          Welcome Back
        </h2>
        <p className={`${theme.text.secondary}`}>
          Sign in to access your presentation analytics
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className={`block ${theme.text.primary} text-sm font-semibold mb-2`}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200`}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="space-y-2">
          <label className={`block ${theme.text.primary} text-sm font-semibold mb-2`}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200`}
            placeholder="Enter your password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg hover:from-violet-500 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className={`${theme.text.secondary} text-sm`}>
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className={`${theme.text.accent} hover:underline font-semibold transition-colors duration-200`}
          >
            Create one free
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginComponent;