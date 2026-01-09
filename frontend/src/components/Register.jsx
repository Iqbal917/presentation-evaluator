
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";

const Register = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name || null
    });
    
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
          👤
        </div>
        <h2 className={`text-2xl lg:text-3xl font-bold ${theme.text.primary} mb-2`}>
          Create Account
        </h2>
        <p className={`${theme.text.secondary}`}>
          Join to access your presentation analytics
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
            Full Name (Optional)
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={`w-full px-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200`}
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <label className={`block ${theme.text.primary} text-sm font-semibold mb-2`}>
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200`}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="space-y-2">
          <label className={`block ${theme.text.primary} text-sm font-semibold mb-2`}>
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200`}
            placeholder="Create a password"
            required
          />
        </div>

        <div className="space-y-2">
          <label className={`block ${theme.text.primary} text-sm font-semibold mb-2`}>
            Confirm Password *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200`}
            placeholder="Confirm your password"
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
              Creating Account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className={`${theme.text.secondary} text-sm`}>
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className={`${theme.text.accent} hover:underline font-semibold transition-colors duration-200`}
          >
            Sign in
          </button>
        </p>
      </div>

      <div className="mt-4 text-center">
        <p className={`${theme.text.secondary} text-xs`}>
          By creating an account, you get full access to all features
        </p>
      </div>
    </div>
  );
};

export default Register;