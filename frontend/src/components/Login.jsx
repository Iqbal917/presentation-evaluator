import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { Sparkles, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

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
    <div ref={formRef} className={`${theme.bg.secondary} rounded-3xl p-8 w-full max-w-md mx-auto shadow-2xl border backdrop-blur-xl`}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20 text-white">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className={`text-2xl lg:text-3xl font-bold ${theme.text.primary} mb-2 tracking-tight`}>
          Welcome Back
        </h2>
        <p className={`${theme.text.secondary} text-sm`}>
          Sign in to access your presentation analytics
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-500 text-sm backdrop-blur-sm flex items-center gap-3 font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className={`block ${theme.text.primary} text-sm font-semibold mb-2`}>
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 transition-all duration-200`}
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={`block ${theme.text.primary} text-sm font-semibold mb-2`}>
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 transition-all duration-200`}
              placeholder="Enter your password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg hover:from-violet-500 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
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