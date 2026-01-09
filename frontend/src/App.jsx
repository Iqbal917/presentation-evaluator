import React, { useState, useEffect, useRef } from "react";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import AuthModal from "./components/AuthModal";
import TrialBanner from "./components/TrialBanner";
import { api } from "./utils/api";

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { loading } = useAuth();
  const { theme } = useTheme();
  const mainRef = useRef(null);

  useEffect(() => {
    // Import GSAP dynamically
    import(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
    ).then(() => {
      if (window.gsap && mainRef.current) {
        window.gsap.fromTo(
          mainRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
        );
      }
    });
  }, [currentPage]);

  if (loading) {
    return (
      <div
        className={`min-h-screen ${theme.bg.primary} flex items-center justify-center`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin"></div>
          <div className={`${theme.text.primary} text-lg font-medium`}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            setCurrentPage={setCurrentPage}
            onShowAuth={() => setShowAuthModal(true)}
          />
        );
      case "real-time":
        return (
          <RealTimePage
            setCurrentPage={setCurrentPage}
            onShowAuth={() => setShowAuthModal(true)}
          />
        );
      case "report":
        return (
          <ReportPage
            setCurrentPage={setCurrentPage}
            onShowAuth={() => setShowAuthModal(true)}
          />
        );
      default:
        return (
          <HomePage
            setCurrentPage={setCurrentPage}
            onShowAuth={() => setShowAuthModal(true)}
          />
        );
    }
  };

  return (
    <div
      ref={mainRef}
      className={`min-h-screen ${theme.bg.primary} transition-colors duration-300`}
    >
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onShowAuth={() => setShowAuthModal(true)}
      />
      <div className="transition-all duration-300">{renderPage()}</div>
      <Footer />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

// Professional Header Component
const Header = ({ currentPage, setCurrentPage, onShowAuth }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const headerRef = useRef(null);

  useEffect(() => {
    import(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
    ).then(() => {
      if (window.gsap && headerRef.current) {
        window.gsap.fromTo(
          headerRef.current,
          { y: -100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        );
      }
    });
  }, []);

  const navItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "real-time", label: "Live Analysis", icon: "📹" },
    { id: "report", label: "Reports", icon: "📊" },
  ];

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 ${theme.nav.bg} transition-all duration-300`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setCurrentPage("home")}
            className={`flex items-center gap-3 font-bold ${theme.text.primary} hover:scale-105 transition-all duration-200 group`}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-violet-500/25 transition-all duration-300">
                <span className="text-xl">🎯</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-700 bg-clip-text text-transparent">
                PresentAI
              </div>
              <div className={`text-xs ${theme.text.muted} font-normal`}>
                Professional Presentation Analytics
              </div>
            </div>
          </button>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  currentPage === item.id
                    ? theme.nav.buttonActive
                    : theme.nav.button
                } hover:scale-105`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-xl ${theme.bg.card} ${theme.text.secondary} hover:scale-110 transition-all duration-200 hover:rotate-180`}
              aria-label="Toggle theme"
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <MobileMenuButton
                navItems={navItems}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>

            {/* Auth section */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className={`${theme.bg.card} px-4 py-2 rounded-xl`}>
                    <div
                      className={`${theme.text.primary} text-sm font-medium`}
                    >
                      {user?.full_name || user?.email?.split("@")[0]}
                    </div>
                    <div className={`${theme.text.muted} text-xs`}>
                      {user?.is_premium ? "Premium" : "Free Trial"}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className={`px-4 py-2 ${theme.bg.button} ${theme.text.secondary} rounded-xl font-medium transition-all duration-200 hover:scale-105`}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={onShowAuth}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl font-semibold hover:from-violet-500 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-violet-500/25"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

// Mobile Menu Component
const MobileMenuButton = ({ navItems, currentPage, setCurrentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, isDark } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-xl ${theme.bg.card} ${theme.text.primary} transition-all duration-200`}
      >
        <div className="w-5 h-5 flex flex-col justify-center space-y-1">
          <div
            className={`w-full h-0.5 ${
              isDark ? "bg-white" : "bg-gray-900"
            } transition-all duration-200 ${
              isOpen ? "rotate-45 translate-y-1" : ""
            }`}
          ></div>
          <div
            className={`w-full h-0.5 ${
              isDark ? "bg-white" : "bg-gray-900"
            } transition-all duration-200 ${isOpen ? "opacity-0" : ""}`}
          ></div>
          <div
            className={`w-full h-0.5 ${
              isDark ? "bg-white" : "bg-gray-900"
            } transition-all duration-200 ${
              isOpen ? "-rotate-45 -translate-y-1" : ""
            }`}
          ></div>
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full right-0 mt-2 w-48 ${theme.bg.secondary} rounded-2xl shadow-xl border backdrop-blur-lg z-50`}
        >
          <div className="p-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-all duration-200 ${
                  currentPage === item.id
                    ? theme.nav.buttonActive
                    : `${theme.text.secondary} ${theme.bg.cardHover}`
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Professional Home Page
const HomePage = ({ setCurrentPage, onShowAuth }) => {
  const { hasActiveAccess } = useAuth();
  const { theme } = useTheme();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    import(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
    ).then(() => {
      if (window.gsap) {
        const tl = window.gsap.timeline();

        tl.fromTo(
          heroRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        ).fromTo(
          featuresRef.current?.children,
          { opacity: 0, y: 30, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.2,
            ease: "power2.out",
          },
          "-=0.3"
        );
      }
    });
  }, []);

  const features = [
    {
      icon: "🎭",
      title: "Advanced Emotion Analysis",
      description:
        "Real-time facial expression detection using state-of-the-art AI models",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: "🎵",
      title: "Vocal Confidence Tracking",
      description:
        "Analyze pitch, tone, and speech patterns to measure confidence levels",
      color: "from-violet-500 to-purple-600",
    },
    {
      icon: "📈",
      title: "Performance Insights",
      description:
        "Comprehensive reports with actionable feedback and improvement suggestions",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <TrialBanner onShowAuth={onShowAuth} />

      {/* Hero Section */}
      <section ref={heroRef} className="text-center py-16 lg:py-24">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold ${theme.text.primary} leading-tight`}
          >
            Master Your
            <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Presentation Skills
            </span>
          </h1>

          <p
            className={`text-lg sm:text-xl lg:text-2xl ${theme.text.secondary} max-w-3xl mx-auto leading-relaxed`}
          >
            Transform your public speaking with AI-powered analysis. Get
            real-time feedback on your emotions, voice, and overall confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            {hasActiveAccess ? (
              <button
                onClick={() => setCurrentPage("real-time")}
                className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-3">
                  📹 Start Live Analysis
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            ) : (
              <button
                onClick={onShowAuth}
                className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-3">
                  🚀 Start Free Trial
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            )}

            <button
              onClick={() => setCurrentPage("report")}
              className={`px-8 py-4 ${theme.bg.button} ${theme.text.primary} rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 border`}
            >
              📊 View Demo Report
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="text-center mb-16">
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${theme.text.primary} mb-6`}
          >
            Powerful Analytics Suite
          </h2>
          <p className={`text-lg ${theme.text.secondary} max-w-2xl mx-auto`}>
            Our AI-powered platform provides comprehensive insights into your
            presentation performance
          </p>
        </div>

        <div
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 lg:py-24">
        <div className={`${theme.bg.secondary} rounded-3xl p-8 lg:p-16`}>
          <div className="text-center mb-12">
            <h2
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${theme.text.primary} mb-4`}
            >
              Trusted by Professionals
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "50K+", label: "Presentations Analyzed" },
              { number: "95%", label: "Accuracy Rate" },
              { number: "2.5x", label: "Confidence Improvement" },
              { number: "24/7", label: "Available Support" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-700 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300`}
                >
                  {stat.number}
                </div>
                <div
                  className={`text-sm lg:text-base ${theme.text.secondary} font-medium`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

// Enhanced Feature Card Component
const FeatureCard = ({ feature, index }) => {
  const { theme } = useTheme();
  const cardRef = useRef(null);

  useEffect(() => {
    import(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
    ).then(() => {
      if (window.gsap && cardRef.current) {
        window.gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 50, scale: 0.8 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            delay: index * 0.2,
            ease: "power3.out",
          }
        );
      }
    });
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`group relative ${theme.bg.secondary} rounded-3xl p-8 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden`}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      ></div>

      {/* Icon */}
      <div className="relative mb-6">
        <div
          className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 mx-auto`}
        >
          {feature.icon}
        </div>
      </div>

      {/* Content */}
      <div className="relative text-center">
        <h3
          className={`text-xl lg:text-2xl font-bold ${theme.text.primary} mb-4`}
        >
          {feature.title}
        </h3>
        <p className={`${theme.text.secondary} leading-relaxed`}>
          {feature.description}
        </p>
      </div>

      {/* Hover effect border */}
      <div
        className={`absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 -m-px`}
      ></div>
    </div>
  );
};

// Professional Real-time Page
const RealTimePage = ({ setCurrentPage, onShowAuth }) => {
  console.log("RealTimePage component rendered");
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState({
    expression: "Detecting...",
    pitch: "0.0",
    confidence: "0",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [evaluationStatus, setEvaluationStatus] = useState("idle");
  const metricsTimerRef = useRef(null);
  const statusTimerRef = useRef(null);
  const { hasActiveAccess, checkTrialStatus, user } = useAuth();
  const { theme } = useTheme();
  const pageRef = useRef(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    import(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
    ).then(() => {
      if (window.gsap && pageRef.current) {
        window.gsap.fromTo(
          pageRef.current?.children,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
        );
      }
    });
  }, []);

  useEffect(() => {
    checkCameraPermission();
    return () => {
      // Clean up camera stream when component unmounts
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);


  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: "camera" });
      console.log("Camera permission status:", result.state);
      setCameraPermission(result.state);

      if (result.state === "granted") {
        console.log("Permission already granted, requesting access...");
        await requestCameraAccess();
      } else if (result.state === "prompt") {
        console.log("Permission needs to be requested");
        await requestCameraAccess(); // This will trigger the browser prompt
      }
    } catch (error) {
      console.log("Permissions API not supported, trying direct access");
      await requestCameraAccess();
    }
  };


  const requestCameraAccess = async () => {
    console.log("=== requestCameraAccess called ===");
    try {
      console.log("About to call getUserMedia...");
      // Always try to request access if not "granted"
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("getUserMedia successful!", stream);
      setCameraStream(stream);
      setCameraPermission("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Video element updated with stream");
      } else {
        console.log("videoRef.current is null");
      }

      console.log("Camera access granted");
    } catch (error) {
      console.error("Camera access error details:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      setCameraPermission("denied");

      if (error.name === "NotAllowedError") {
        setError(
          "Camera access denied. Please allow camera permissions and refresh the page."
        );
      } else if (error.name === "NotFoundError") {
        setError("No camera found. Please connect a camera and try again.");
      } else {
        setError(`Camera error: ${error.message}`);
      }
    }
  };

  // Previous logic remains the same...
  const pollEvaluationStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const status = await api.getEvaluationStatus(token);
      setEvaluationStatus(status.status || "idle");

      if (status.status === "completed") {
        setIsRunning(false);
        if (metricsTimerRef.current) {
          clearTimeout(metricsTimerRef.current);
          metricsTimerRef.current = null;
        }
        setCurrentPage("report");
      } else if (status.status === "failed") {
        setIsRunning(false);
        setError("Evaluation failed. Please try again.");
        if (metricsTimerRef.current) {
          clearTimeout(metricsTimerRef.current);
          metricsTimerRef.current = null;
        }
      } else if (status.status === "running") {
        setIsRunning(true);
      }
    } catch (e) {
      console.log("Status check error:", e);
    }

    if (isRunning || evaluationStatus === "running") {
      statusTimerRef.current = setTimeout(pollEvaluationStatus, 2000);
    }
  };

  const pollMetrics = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await api.getMetrics(token);
      setMetrics((prev) => ({
        expression: data.expression ?? prev.expression,
        pitch:
          data.pitch !== undefined
            ? isFinite(Number(data.pitch))
              ? Number(data.pitch).toFixed(1)
              : "0.0"
            : prev.pitch,
        confidence:
          data.confidence !== undefined
            ? isFinite(Number(data.confidence))
              ? Number(data.confidence).toFixed(0)
              : "0"
            : prev.confidence,
      }));
    } catch (e) {
      console.log("Metrics error:", e);
    } finally {
      if (isRunning) {
        metricsTimerRef.current = setTimeout(pollMetrics, 1000);
      }
    }
  };

  const startEvaluation = async () => {
    if (isRunning) return;

    if (!hasActiveAccess) {
      onShowAuth();
      return;
    }

    try {
      setError("");
      const token = localStorage.getItem("token");
      const response = await api.startEvaluation(token);

      if (response.status === "already_running") {
        setIsRunning(true);
      } else {
        setIsRunning(true);
      }

      pollMetrics();
      pollEvaluationStatus();
      await checkTrialStatus();
    } catch (e) {
      console.error("Failed to start evaluation:", e);
      if (e.message.includes("trial_expired")) {
        setError(
          "Your free trial has expired. Please create an account to continue."
        );
        onShowAuth();
      } else {
        setError("Failed to start evaluation: " + e.message);
      }
    }
  };

  const stopEvaluation = async () => {
    if (!isRunning) return;
    try {
      const token = localStorage.getItem("token");
      await api.stopEvaluation(token);
      setIsRunning(false);
      setEvaluationStatus("stopped");

      if (metricsTimerRef.current) {
        clearTimeout(metricsTimerRef.current);
        metricsTimerRef.current = null;
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
    } catch (e) {
      console.error("Failed to stop evaluation:", e);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    if (!hasActiveAccess) {
      onShowAuth();
      return;
    }

    try {
      setError("");
      const token = localStorage.getItem("token");
      const response = await api.uploadVideo(selectedFile, token);

      if (response.task_id) {
        setEvaluationStatus("processing_video");
        pollEvaluationStatus();
      }

      await checkTrialStatus();
    } catch (error) {
      console.error("Failed to upload video:", error);
      if (
        error.message.includes("trial_expired") ||
        error.message.includes("Trial expired")
      ) {
        setError(
          "Your free trial has expired. Please create an account to continue."
        );
        onShowAuth();
      } else {
        setError("Failed to upload video: " + error.message);
      }
    }
  };

  const getUserIdentifier = () => {
    if (user) {
      return user.id;
    }
    return "device_" + Math.random().toString(36).substr(2, 9);
  };

  useEffect(() => {
    return () => {
      if (metricsTimerRef.current) {
        clearTimeout(metricsTimerRef.current);
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const getStatusDisplay = () => {
    const statusConfig = {
      running: {
        text: "Recording in progress...",
        icon: "🔴",
        color: "text-red-500",
      },
      processing_video: {
        text: "Processing uploaded video...",
        icon: "⏳",
        color: "text-yellow-500",
      },
      completed: {
        text: "Evaluation completed",
        icon: "✅",
        color: "text-green-500",
      },
      failed: { text: "Evaluation failed", icon: "❌", color: "text-red-500" },
      stopped: {
        text: "Evaluation stopped",
        icon: "⏸️",
        color: "text-gray-500",
      },
      idle: { text: "Ready to start", icon: "⚪", color: theme.text.secondary },
    };

    const status = statusConfig[evaluationStatus] || statusConfig.idle;
    return (
      <span className={`${status.color} flex items-center gap-2`}>
        {status.icon} {status.text}
      </span>
    );
  };

  return (
    <main
      ref={pageRef}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <TrialBanner onShowAuth={onShowAuth} />

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1
            className={`text-3xl lg:text-4xl xl:text-5xl font-bold ${theme.text.primary} mb-4`}
          >
            Live Analysis Dashboard
          </h1>
          <p
            className={`text-lg ${theme.text.secondary} max-w-3xl mx-auto mb-6`}
          >
            Real-time presentation analysis with AI-powered insights. Monitor
            your performance as you speak.
          </p>

          {/* Status indicator */}
          <div
            className={`inline-flex items-center gap-3 ${theme.bg.card} px-6 py-3 rounded-2xl`}
          >
            <span className={`${theme.text.secondary} font-medium`}>
              Status:
            </span>
            {getStatusDisplay()}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Camera Preview - Takes more space */}
          <div className="xl:col-span-8">
            <div
              className={`${theme.bg.secondary} rounded-3xl p-6 lg:p-8 h-full`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-xl lg:text-2xl font-bold ${theme.text.primary}`}
                >
                  Live Camera Feed
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={isRunning ? stopEvaluation : startEvaluation}
                    disabled={evaluationStatus === "processing_video"}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      isRunning
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500"
                        : "bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:from-violet-500 hover:to-purple-600"
                    }`}
                  >
                    {isRunning ? "⏹️ Stop" : "▶️ Start"}
                  </button>
                </div>
              </div>

              <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900/20 to-gray-800/20 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300/20">
                {cameraPermission === "denied" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div
                      className={`text-6xl lg:text-8xl ${theme.text.muted} opacity-50`}
                    >
                      🚫
                    </div>
                    <div
                      className={`${theme.text.secondary} text-lg font-medium text-center px-4`}
                    >
                      Camera access denied
                    </div>
                    <button
                      onClick={requestCameraAccess}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                    >
                      Request Camera Access
                    </button>
                  </div>
                ) : cameraPermission === "granted" && isRunning ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* You can also show the backend feed if needed */}
                    <img
                      className="absolute top-2 right-2 w-32 h-24 object-cover rounded border-2 border-white"
                      src={`/video_feed/${getUserIdentifier()}?ts=${Date.now()}`}
                      alt="Backend processed feed"
                      style={{ display: "none" }} // Hide this for now
                    />
                  </>
                ) : cameraPermission === "granted" && !isRunning ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-black/20">
                      <div
                        className={`text-6xl lg:text-8xl ${theme.text.muted} opacity-50`}
                      >
                        📹
                      </div>
                      <div
                        className={`${theme.text.secondary} text-lg font-medium`}
                      >
                        Click Start to begin analysis
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div
                      className={`text-6xl lg:text-8xl ${theme.text.muted} opacity-50`}
                    >
                      📹
                    </div>
                    <div
                      className={`${theme.text.secondary} text-lg font-medium`}
                    >
                      Requesting camera access...
                    </div>
                    <div className="w-8 h-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Live indicator */}
                {isRunning && cameraPermission === "granted" && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 text-white px-3 py-2 rounded-lg font-medium">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Controls and Metrics */}
          <div className="xl:col-span-4 space-y-6">
            {/* Live Metrics */}
            <MetricsPanel metrics={metrics} theme={theme} />

            {/* Quick Actions */}
            <QuickActionsPanel setCurrentPage={setCurrentPage} theme={theme} />

            {/* File Upload */}
            <FileUploadPanel
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              handleFileUpload={handleFileUpload}
              evaluationStatus={evaluationStatus}
              isRunning={isRunning}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

// Metrics Panel Component
const MetricsPanel = ({ metrics, theme }) => {
  const metricsData = [
    {
      label: "Expression",
      value: metrics.expression,
      icon: "😊",
      color: "from-blue-500 to-cyan-600",
    },
    {
      label: "Pitch (Hz)",
      value: metrics.pitch,
      icon: "🎵",
      color: "from-purple-500 to-pink-600",
    },
    {
      label: "Confidence",
      value: `${metrics.confidence}%`,
      icon: "📊",
      color: "from-emerald-500 to-teal-600",
      highlight: true,
    },
  ];

  return (
    <div className={`${theme.bg.secondary} rounded-3xl p-6`}>
      <h3
        className={`text-xl font-bold ${theme.text.primary} mb-6 flex items-center gap-2`}
      >
        📈 Live Metrics
      </h3>
      <div className="space-y-4">
        {metricsData.map((metric, index) => (
          <div
            key={index}
            className={`${theme.bg.card} rounded-2xl p-4 ${
              metric.highlight ? "border-2 border-emerald-500/20" : ""
            } hover:scale-105 transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 bg-gradient-to-br ${metric.color} rounded-lg flex items-center justify-center text-sm`}
                >
                  {metric.icon}
                </div>
                <span className={`${theme.text.secondary} text-sm font-medium`}>
                  {metric.label}
                </span>
              </div>
            </div>
            <div
              className={`text-2xl font-bold ${
                metric.highlight ? theme.status.success : theme.text.primary
              }`}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick Actions Panel
const QuickActionsPanel = ({ setCurrentPage, theme }) => {
  return (
    <div className={`${theme.bg.secondary} rounded-3xl p-6`}>
      <h3 className={`text-xl font-bold ${theme.text.primary} mb-6`}>
        Quick Actions
      </h3>
      <div className="space-y-3">
        <button
          onClick={() => setCurrentPage("report")}
          className={`w-full flex items-center gap-3 px-4 py-3 ${theme.bg.button} ${theme.text.primary} rounded-xl font-medium transition-all duration-200 hover:scale-105`}
        >
          📄 View Latest Report
        </button>
        <button
          onClick={() => setCurrentPage("home")}
          className={`w-full flex items-center gap-3 px-4 py-3 ${theme.bg.button} ${theme.text.primary} rounded-xl font-medium transition-all duration-200 hover:scale-105`}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
};

// File Upload Panel
const FileUploadPanel = ({
  selectedFile,
  setSelectedFile,
  handleFileUpload,
  evaluationStatus,
  isRunning,
  theme,
}) => {
  return (
    <div className={`${theme.bg.secondary} rounded-3xl p-6`}>
      <h3 className={`text-xl font-bold ${theme.text.primary} mb-4`}>
        📤 Upload Analysis
      </h3>
      <div className="space-y-4">
        <div className="relative">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            disabled={evaluationStatus === "processing_video" || isRunning}
            className={`w-full ${theme.bg.input} ${theme.text.primary} border rounded-xl p-3 transition-all duration-200 disabled:opacity-50 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:font-medium hover:file:bg-violet-700`}
          />
        </div>

        <button
          onClick={handleFileUpload}
          disabled={
            !selectedFile ||
            evaluationStatus === "processing_video" ||
            isRunning
          }
          className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl font-semibold hover:from-violet-500 hover:to-purple-600 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {evaluationStatus === "processing_video" ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </span>
          ) : (
            "🎬 Analyze Video"
          )}
        </button>

        <p className={`${theme.text.muted} text-sm text-center`}>
          Upload a recorded presentation for offline analysis
        </p>
      </div>
    </div>
  );
};

// Professional Report Page
const ReportPage = ({ setCurrentPage, onShowAuth }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const { hasActiveAccess } = useAuth();
  const { theme } = useTheme();
  const reportRef = useRef(null);

  useEffect(() => {
    import(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
    ).then(() => {
      if (window.gsap && reportRef.current) {
        window.gsap.fromTo(
          reportRef.current?.children,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
        );
      }
    });
  }, [reportData]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await api.getReport(token);
        if (
          data.confidence_score > 0 ||
          Object.keys(data.video_analysis || {}).length > 0 ||
          (data.transcribed_text &&
            data.transcribed_text !== "No transcript available")
        ) {
          setReportData(data);
        } else {
          setReportData(null);
        }
      } catch (error) {
        console.error("Failed to fetch report data:", error);
        if (
          error.message.includes("trial_expired") ||
          error.message.includes("Trial expired")
        ) {
          setError(
            "Your free trial has expired. Please create an account to view reports."
          );
        } else {
          setReportData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const downloadReport = async () => {
    if (!hasActiveAccess) {
      onShowAuth();
      return;
    }

    try {
      window.open("/download-report", "_blank");
    } catch (error) {
      if (error.message.includes("trial_expired")) {
        onShowAuth();
      }
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen ${theme.bg.primary} flex items-center justify-center`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin"></div>
          <div className={`${theme.text.primary} text-lg font-medium`}>
            Loading report...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <TrialBanner onShowAuth={onShowAuth} />
        <div className="text-center space-y-6">
          <div className="text-6xl">🔒</div>
          <h1
            className={`text-2xl lg:text-3xl font-bold ${theme.text.primary}`}
          >
            {error}
          </h1>
          <button
            onClick={onShowAuth}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl font-semibold hover:from-violet-500 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Create Account
          </button>
        </div>
      </main>
    );
  }

  if (!reportData) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <TrialBanner onShowAuth={onShowAuth} />
        <div className="text-center space-y-6">
          <div className="text-6xl">📊</div>
          <h1
            className={`text-2xl lg:text-3xl font-bold ${theme.text.primary}`}
          >
            No Report Available
          </h1>
          <p className={`${theme.text.secondary} text-lg`}>
            Run an evaluation to generate your presentation analysis report.
          </p>
          <button
            onClick={() => setCurrentPage("real-time")}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl font-semibold hover:from-violet-500 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Start New Evaluation
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main
        ref={reportRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
      >
        <TrialBanner onShowAuth={onShowAuth} />

        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className={`text-3xl lg:text-4xl xl:text-5xl font-bold ${theme.text.primary} mb-4`}
          >
            Performance Report
          </h1>
          <p className={`text-lg ${theme.text.secondary}`}>
            Comprehensive analysis of your presentation performance
          </p>
        </div>

        {/* Report Content */}
        <ReportContent
          reportData={reportData}
          theme={theme}
          setShowModal={setShowModal}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
          <button
            onClick={() => setCurrentPage("real-time")}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl font-semibold hover:from-violet-500 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            🔄 New Analysis
          </button>
          <button
            onClick={downloadReport}
            className={`px-8 py-4 ${theme.bg.button} ${theme.text.primary} rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border`}
          >
            📥 Download Report
          </button>
        </div>
      </main>

      {/* Chart Modal */}
      {showModal && <ChartModal onClose={() => setShowModal(false)} />}
    </>
  );
};

// Report Content Component
const ReportContent = ({ reportData, theme, setShowModal }) => {
  const totalEmotions = Object.values(reportData.video_analysis || {}).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Key Metrics */}
      <div className="lg:col-span-5 space-y-6">
        {/* Confidence Score */}
        <div className={`${theme.bg.secondary} rounded-3xl p-8 text-center`}>
          <h2 className={`text-lg font-semibold ${theme.text.secondary} mb-4`}>
            Overall Confidence Score
          </h2>
          <div className="relative">
            <div className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent mb-2">
              {reportData.confidence_score}
            </div>
            <div className={`text-2xl ${theme.text.muted} font-light`}>
              / 100
            </div>
            <div className={`text-lg font-semibold ${theme.text.primary} mt-4`}>
              {reportData.confidence_level}
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className={`${theme.bg.secondary} rounded-3xl p-6`}>
          <h3
            className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}
          >
            🎙️ Speech Transcript
          </h3>
          <div
            className={`${theme.bg.card} rounded-2xl p-4 max-h-40 overflow-y-auto`}
          >
            <p className={`${theme.text.secondary} text-sm leading-relaxed`}>
              {reportData.transcribed_text || "No transcript available"}
            </p>
          </div>
        </div>

        {/* Emotion Breakdown */}
        <div className={`${theme.bg.secondary} rounded-3xl p-6`}>
          <h3
            className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}
          >
            🎭 Emotion Analysis
          </h3>
          {totalEmotions === 0 ? (
            <p className={`${theme.text.muted} text-center py-4`}>
              No facial expressions detected. Try with better lighting.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(reportData.video_analysis).map(
                ([emotion, count]) => {
                  const percentage = ((count / totalEmotions) * 100).toFixed(1);
                  return (
                    <div
                      key={emotion}
                      className="flex items-center justify-between"
                    >
                      <span
                        className={`${theme.text.primary} font-medium capitalize`}
                      >
                        {emotion}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-300/20 rounded-full h-2">
                          <div
                            className="h-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span
                          className={`${theme.text.secondary} text-sm font-medium w-12 text-right`}
                        >
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Chart and Analysis */}
      <div className="lg:col-span-7 space-y-6">
        {/* Performance Chart */}
        <div className={`${theme.bg.secondary} rounded-3xl p-6`}>
          <h3
            className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}
          >
            📈 Performance Timeline
          </h3>
          <div
            className="relative cursor-pointer rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300"
            onClick={() => setShowModal(true)}
          >
            <img
              className="w-full h-auto"
              src="/static/report_plot.png"
              alt="Performance Analysis Graph"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-medium">
                🔍 Click to enlarge
              </div>
            </div>
          </div>
        </div>

        {/* Audio Analysis */}
        <div className={`${theme.bg.secondary} rounded-3xl p-6`}>
          <h3
            className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}
          >
            🔊 Vocal Analysis
          </h3>
          <div className={`${theme.bg.card} rounded-2xl p-6 text-center`}>
            <div className={`${theme.text.muted} text-sm mb-2`}>
              Average Pitch
            </div>
            <div className={`text-3xl font-bold ${theme.text.primary}`}>
              {reportData.audio_features} Hz
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className={`${theme.bg.secondary} rounded-3xl p-6`}>
          <h3
            className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center gap-2`}
          >
            💡 Recommendations
          </h3>
          {reportData.suggestions && reportData.suggestions.length > 0 ? (
            <div className="space-y-4">
              {reportData.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`${theme.bg.card} rounded-2xl p-4 hover:scale-105 transition-all duration-200`}
                >
                  <h4 className={`font-semibold ${theme.text.primary} mb-2`}>
                    {suggestion.area}
                  </h4>
                  <p className={`${theme.text.secondary} text-sm mb-3`}>
                    {suggestion.desc}
                  </p>
                  <a
                    href={suggestion.resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 ${theme.text.accent} hover:underline text-sm font-medium`}
                  >
                    📚 Learn more →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${theme.text.muted} text-center py-6`}>
              No specific recommendations available. Your performance looks
              good!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Chart Modal Component
const ChartModal = ({ onClose }) => {
  const { theme } = useTheme();
  const modalRef = useRef(null);

  useEffect(() => {
    import(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
    ).then(() => {
      if (window.gsap && modalRef.current) {
        window.gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
        );
      }
    });
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div ref={modalRef} className="relative max-w-6xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-bold hover:scale-110 transition-transform duration-200 shadow-lg"
        >
          ✕
        </button>

        <img
          className="w-full h-auto rounded-2xl shadow-2xl"
          src={`/static/report_plot.png?t=${Date.now()}`}
          alt="Performance Chart - Enlarged View"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

// Professional Footer
const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer
      className={`${theme.bg.secondary} border-t ${
        theme.isDark ? "border-slate-700/20" : "border-gray-200/50"
      } mt-20`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className={`${theme.text.secondary} text-sm`}>
            © 2024 PresentAI. Professional presentation analytics powered by AI.
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className={`${theme.text.muted} hover:${theme.text.primary} transition-colors duration-200 text-sm`}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className={`${theme.text.muted} hover:${theme.text.primary} transition-colors duration-200 text-sm`}
            >
              Terms of Service
            </a>
            <a
              href="#"
              className={`${theme.text.muted} hover:${theme.text.primary} transition-colors duration-200 text-sm`}
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default App;
