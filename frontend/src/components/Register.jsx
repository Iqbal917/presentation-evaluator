import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { User, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

const Register = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const { theme } = useTheme();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
      full_name: formData.full_name || null,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div
      className={`${theme.bg.secondary} rounded-3xl p-8 w-full max-w-md mx-auto shadow-2xl border backdrop-blur-xl transition-all duration-300`}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20 text-white">
          <User className="w-8 h-8" />
        </div>
        <h2
          className={`text-2xl lg:text-3xl font-bold ${theme.text.primary} mb-2 tracking-tight`}
        >
          Create Account
        </h2>
        <p className={`${theme.text.secondary} text-sm`}>
          Join to access your presentation analytics
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
          <label
            className={`block ${theme.text.primary} text-sm font-semibold mb-2`}
          >
            Full Name (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 transition-all duration-200`}
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className={`block ${theme.text.primary} text-sm font-semibold mb-2`}
          >
            Email Address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 transition-all duration-200`}
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className={`block ${theme.text.primary} text-sm font-semibold mb-2`}
          >
            Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 transition-all duration-200`}
              placeholder="Create a password"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className={`block ${theme.text.primary} text-sm font-semibold mb-2`}
          >
            Confirm Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-4 ${theme.bg.input} border rounded-2xl ${theme.text.primary} placeholder-gray-400 transition-all duration-200`}
              placeholder="Confirm your password"
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
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
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
          By creating an account, you get full access to all premium features
        </p>
      </div>
    </div>
  );
};

export default Register;
