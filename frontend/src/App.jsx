import React, { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import AuthModal from "./components/AuthModal";
import TrialBanner from "./components/TrialBanner";
import { api } from "./utils/api";
import { 
  Sparkles, Video, BarChart3, TrendingUp, Activity, CheckCircle2, 
  AlertCircle, Play, Square, UploadCloud, Lock, User as UserIcon, LogOut, 
  Sun, Moon, Menu, X, Mic, VideoOff, Loader2, PauseCircle, PlayCircle,
  Smile, FileText, Home, RefreshCw, Download, Volume2, Lightbulb, ExternalLink
} from "lucide-react";

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
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin" />
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
    { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "real-time", label: "Live Analysis", icon: <Video className="w-5 h-5" /> },
    { id: "report", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const handleThemeToggle = (e) => {
    e.preventDefault();

    if (!document.startViewTransition) {
      toggleTheme();
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.classList.add("theme-transitioning");

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        toggleTheme();
      });
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      const animation = document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );

      animation.onfinish = () => {
        document.documentElement.classList.remove("theme-transitioning");
      };
    });
  };

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
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-violet-500/25 transition-all duration-300 text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-700 bg-clip-text text-transparent">
                PresentAI
              </div>
              <div className={`text-xs ${theme.text.muted} font-normal`}>
                Professional Presentation Analytics
              </div>
            </div>
          </button>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  currentPage === item.id
                    ? theme.nav.buttonActive
                    : theme.nav.button
                } hover:scale-105`}
              >
                {item.icon}
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={handleThemeToggle}
              className={`p-3 rounded-xl ${theme.bg.card} ${theme.text.secondary} hover:bg-violet-500/10 hover:text-violet-500 transition-colors duration-200 border border-white/10 shadow-md active:scale-95`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <Moon className="w-5 h-5 text-violet-600 animate-pulse" />}
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
                  <div className={`${theme.bg.card} px-4 py-2 rounded-xl border flex items-center gap-3`}>
                    <UserIcon className="w-4 h-4 text-violet-500" />
                    <div className="text-left">
                      <div className={`${theme.text.primary} text-sm font-medium`}>
                        {user?.full_name || user?.email?.split("@")[0]}
                      </div>
                      <div className={`${theme.text.muted} text-xs`}>
                        {user?.is_premium ? "Pro Member" : "Free Member"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className={`flex items-center gap-2 px-4 py-2.5 ${theme.bg.button} ${theme.text.secondary} rounded-xl font-medium transition-all duration-200 hover:scale-105`}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={onShowAuth}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl font-semibold hover:from-violet-500 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-violet-500/25"
                >
                  <Sparkles className="w-5 h-5" />
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
  const { theme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-xl ${theme.bg.card} ${theme.text.primary} transition-all duration-200 border`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full right-0 mt-2 w-56 ${theme.bg.secondary} rounded-2xl shadow-2xl border z-50`}
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
                {item.icon}
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
      icon: <Activity className="w-8 h-8 text-white" />,
      title: "Advanced Emotion Analysis",
      description:
        "Real-time facial expression detection using state-of-the-art AI models",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: <Mic className="w-8 h-8 text-white" />,
      title: "Vocal Confidence Tracking",
      description:
        "Analyze pitch, tone, and speech patterns to measure confidence levels",
      color: "from-violet-500 to-purple-600",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-white" />,
      title: "Performance Insights",
      description:
        "Comprehensive reports with actionable feedback and improvement suggestions",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <TrialBanner onShowAuth={onShowAuth} />

      {/* Hero Section */}
      <section ref={heroRef} className="text-center py-16 lg:py-24">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold ${theme.text.primary} leading-tight`}
          >
            Master Your
            <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent pb-2">
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
                className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-3 justify-center"
              >
                <Video className="w-6 h-6" />
                <span className="relative z-10">Start Live Analysis</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            ) : (
              <button
                onClick={onShowAuth}
                className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-3 justify-center"
              >
                <Sparkles className="w-6 h-6" />
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            )}

            <button
              onClick={() => setCurrentPage("report")}
              className={`flex items-center gap-3 justify-center px-8 py-4 ${theme.bg.button} ${theme.text.primary} rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 border`}
            >
              <BarChart3 className="w-6 h-6 text-violet-500" />
              <span>View Demo Report</span>
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
        <div className={`${theme.bg.secondary} rounded-3xl p-8 lg:p-16 border`}>
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
      className={`group relative ${theme.bg.secondary} rounded-3xl p-8 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden border`}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      ></div>

      {/* Icon */}
      <div className="relative mb-6">
        <div
          className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto`}
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
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: "camera" });
      setCameraPermission(result.state);

      if (result.state === "granted") {
        await requestCameraAccess();
      } else if (result.state === "prompt") {
        await requestCameraAccess();
      }
    } catch {
      await requestCameraAccess();
    }
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setCameraStream(stream);
      setCameraPermission("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
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
      setError("Failed to start evaluation: " + e.message);
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
      setError("Failed to upload video: " + error.message);
    }
  };

  const getUserIdentifier = () => {
    if (user) {
      return user.id;
    }
    return "device_" + Math.random().toString(36).substr(2, 9);
  };

  const getStatusDisplay = () => {
    const statusConfig = {
      running: {
        text: "Recording in progress...",
        icon: <Activity className="w-4 h-4 text-red-500 animate-pulse" />,
        color: "text-red-500",
      },
      processing_video: {
        text: "Processing uploaded video...",
        icon: <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />,
        color: "text-yellow-500",
      },
      completed: {
        text: "Evaluation completed",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        color: "text-emerald-500",
      },
      failed: { 
        text: "Evaluation failed", 
        icon: <AlertCircle className="w-4 h-4 text-rose-500" />, 
        color: "text-rose-500" 
      },
      stopped: {
        text: "Evaluation stopped",
        icon: <PauseCircle className="w-4 h-4 text-gray-500" />,
        color: "text-gray-500",
      },
      idle: { 
        text: "Ready to start", 
        icon: <PlayCircle className="w-4 h-4 text-gray-400" />, 
        color: theme.text.secondary 
      },
    };

    const status = statusConfig[evaluationStatus] || statusConfig.idle;
    return (
      <span className={`${status.color} flex items-center gap-2 font-medium`}>
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
            className={`inline-flex items-center gap-3 ${theme.bg.card} px-6 py-3 rounded-2xl border`}
          >
            <span className={`${theme.text.secondary} font-medium`}>
              Status:
            </span>
            {getStatusDisplay()}
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-500 text-center backdrop-blur-sm flex items-center justify-center gap-2 font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Content Grid - Top Row (Live Session & Real-Time Metrics) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Camera Preview */}
          <div className="xl:col-span-8 flex flex-col">
            <div
              className={`${theme.bg.secondary} rounded-3xl p-6 lg:p-8 border relative group flex-1 flex flex-col justify-between shadow-xl`}
            >
              <div className="absolute -inset-px bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-cyan-600/10 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-xl lg:text-2xl font-bold ${theme.text.primary} flex items-center gap-3`}
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-inner">
                    <Video className="w-5 h-5 text-violet-400 animate-pulse" />
                  </div>
                  <span>Live Camera Feed</span>
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={isRunning ? stopEvaluation : startEvaluation}
                    disabled={evaluationStatus === "processing_video"}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      isRunning
                        ? "bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white hover:from-rose-400 hover:to-rose-500 shadow-rose-500/25"
                        : "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-violet-500/25"
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Square className="w-5 h-5 fill-current animate-pulse" />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>Start Recording</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative w-full aspect-video bg-gradient-to-b from-[#16161a] to-[#101012] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group/cam my-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                {cameraPermission === "denied" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 bg-black/40 backdrop-blur-md">
                    <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-2xl animate-bounce">
                      <VideoOff className="w-10 h-10 text-rose-400" />
                    </div>
                    <div className="text-center space-y-1 px-4">
                      <div className="text-white text-xl font-bold tracking-wide">
                        Camera Access Required
                      </div>
                      <div className={`${theme.text.muted} text-sm max-w-sm mx-auto`}>
                        Please allow camera permissions in your browser to enable real-time AI presentation analysis.
                      </div>
                    </div>
                    <button
                      onClick={requestCameraAccess}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-violet-500/25 hover:scale-105 active:scale-95"
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
                      className="w-full h-full object-cover shadow-inner"
                    />
                    <img
                      className="absolute top-4 right-4 w-36 h-28 object-cover rounded-xl border-2 border-white/80 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                      src={`/video_feed/${getUserIdentifier()}?ts=${Date.now()}`}
                      alt="Backend processed feed"
                      style={{ display: "none" }}
                    />
                  </>
                ) : cameraPermission === "granted" && !isRunning ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover opacity-30 filter blur-[2px]"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 bg-black/60 backdrop-blur-md">
                      <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-2xl group-hover/cam:scale-110 transition-transform duration-500">
                        <Video className="w-10 h-10 text-violet-400 animate-pulse" />
                      </div>
                      <div className="text-center space-y-2 px-4 max-w-md">
                        <div className="text-white text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                          Ready for Your Presentation
                        </div>
                        <div className={`${theme.text.secondary} text-sm leading-relaxed`}>
                          Click <span className="text-violet-400 font-semibold">Start Recording</span> above to begin real-time emotion detection, pitch tracking, and pacing analysis.
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-black/40 backdrop-blur-md">
                    <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
                    <div className="text-white text-lg font-medium tracking-wide animate-pulse">
                      Initializing AI Camera Engine...
                    </div>
                  </div>
                )}

                {/* Live indicator */}
                {isRunning && cameraPermission === "granted" && (
                  <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-rose-500/30 animate-pulse border border-white/20 backdrop-blur-md">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                    <span className="text-xs tracking-widest uppercase font-extrabold">LIVE SESSION</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Real-Time Metrics Panel */}
          <div className="xl:col-span-4 flex flex-col">
            <div className="flex-1">
              <MetricsPanel metrics={metrics} theme={theme} />
            </div>
          </div>
        </div>

        {/* Bottom Row - Quick Actions & Asynchronous Analysis Upload */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
          <div className="xl:col-span-5 flex flex-col">
            <div className="flex-1">
              <QuickActionsPanel setCurrentPage={setCurrentPage} theme={theme} />
            </div>
          </div>
          <div className="xl:col-span-7 flex flex-col">
            <div className="flex-1">
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
      </div>
    </main>
  );
};

// Metrics Panel Component
const MetricsPanel = ({ metrics, theme }) => {
  const metricsData = [
    {
      label: "Facial Expression",
      value: metrics.expression,
      icon: <Smile className="w-6 h-6 text-cyan-400" />,
      color: "from-blue-500/10 to-cyan-500/10",
      borderColor: "border-cyan-500/30",
    },
    {
      label: "Acoustic Pitch",
      value: `${metrics.pitch} Hz`,
      icon: <Mic className="w-6 h-6 text-purple-400" />,
      color: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-500/30",
    },
    {
      label: "Overall Confidence",
      value: `${metrics.confidence}%`,
      icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
      color: "from-emerald-500/10 to-teal-500/10",
      borderColor: "border-emerald-500/40",
      highlight: true,
    },
  ];

  return (
    <div className={`${theme.bg.secondary} rounded-3xl p-6 border relative group`}>
      <div className="absolute -inset-px bg-gradient-to-b from-violet-500/5 to-transparent rounded-3xl blur-lg opacity-50 pointer-events-none" />
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-extrabold ${theme.text.primary} flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-violet-400 animate-pulse" />
          </div>
          <span>Live Metrics</span>
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">AI Active</span>
        </div>
      </div>
      <div className="space-y-4">
        {metricsData.map((metric, index) => (
          <div
            key={index}
            className={`rounded-2xl p-5 border ${metric.borderColor} ${
              metric.highlight 
                ? "bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.02] shadow-lg shadow-emerald-500/5" 
                : "bg-gradient-to-br from-white/[0.06] to-white/[0.02]"
            } backdrop-blur-xl hover:scale-[1.02] transition-all duration-300 shadow-sm group/card`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${metric.color} border ${metric.borderColor} rounded-xl flex items-center justify-center shadow-inner group-hover/card:scale-110 transition-transform duration-300`}
                >
                  {metric.icon}
                </div>
                <span className={`${theme.text.secondary} text-sm font-semibold tracking-wide`}>
                  {metric.label}
                </span>
              </div>
            </div>
            <div
              className={`text-3xl font-black tracking-tight mt-1 ${
                metric.highlight ? "bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent" : theme.text.primary
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
    <div className={`${theme.bg.secondary} rounded-3xl p-6 border relative group h-full flex flex-col justify-between shadow-xl`}>
      <div>
        <h3 className={`text-xl font-extrabold ${theme.text.primary} mb-6 flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <span>Quick Actions</span>
        </h3>
        <div className="space-y-4">
          <button
            onClick={() => setCurrentPage("report")}
            className={`w-full flex items-center justify-between p-4 bg-gradient-to-r from-white/[0.07] to-white/[0.02] hover:from-white/[0.12] hover:to-white/[0.05] border border-white/10 hover:border-violet-500/40 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-violet-500/10 group/btn`}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover/btn:bg-violet-500 group-hover/btn:text-white transition-colors duration-300 shadow-inner">
                <FileText className="w-5 h-5" />
              </div>
              <span className={`${theme.text.primary} text-base`}>View Latest Report</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform duration-300">
              <span className="text-violet-400 font-bold">→</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentPage("home")}
            className={`w-full flex items-center justify-between p-4 bg-gradient-to-r from-white/[0.07] to-white/[0.02] hover:from-white/[0.12] hover:to-white/[0.05] border border-white/10 hover:border-violet-500/40 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-violet-500/10 group/btn`}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover/btn:bg-violet-500 group-hover/btn:text-white transition-colors duration-300 shadow-inner">
                <Home className="w-5 h-5" />
              </div>
              <span className={`${theme.text.primary} text-base`}>Back to Home</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform duration-300">
              <span className="text-violet-400 font-bold">→</span>
            </div>
          </button>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI Engine Ready</span>
        <span>v2.0 Modular</span>
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
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (evaluationStatus === "processing_video" || isRunning) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setSelectedFile(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className={`${theme.bg.secondary} rounded-3xl p-6 border relative group h-full flex flex-col justify-between shadow-xl`}>
      <div>
        <h3 className={`text-xl font-extrabold ${theme.text.primary} mb-5 flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-violet-400" />
          </div>
          <span>Upload Analysis</span>
        </h3>
        <div className="space-y-5">
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`relative border-2 border-dashed border-white/15 hover:border-violet-500/50 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:from-violet-500/[0.05] hover:to-transparent rounded-2xl p-7 transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer group/drop shadow-inner ${
                evaluationStatus === "processing_video" || isRunning ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                disabled={evaluationStatus === "processing_video" || isRunning}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300 shadow-md">
                <UploadCloud className="w-7 h-7 text-violet-400" />
              </div>
              <div className="text-center space-y-1">
                <div className="text-white font-bold text-base tracking-wide group-hover/drop:text-violet-300 transition-colors">
                  Click to upload or drag & drop
                </div>
                <div className={`${theme.text.muted} text-xs`}>
                  MP4, MOV, AVI, MKV up to 500MB
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-between backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Video className="w-6 h-6 text-violet-300" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-white font-bold text-sm truncate tracking-wide">
                    {selectedFile.name}
                  </div>
                  <div className={`${theme.text.accent} text-xs font-semibold mt-0.5`}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                disabled={evaluationStatus === "processing_video" || isRunning}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 flex items-center justify-center transition-colors duration-200 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <button
          onClick={handleFileUpload}
          disabled={
            !selectedFile ||
            evaluationStatus === "processing_video" ||
            isRunning
          }
          className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-violet-500 hover:to-purple-500 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-400 disabled:border disabled:border-white/10 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-violet-500/25 tracking-wide"
        >
          {evaluationStatus === "processing_video" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Video with AI...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-5 h-5 animate-bounce" />
              <span>Analyze Presentation Video</span>
            </>
          )}
        </button>

        <p className={`${theme.text.muted} text-xs text-center leading-relaxed px-2`}>
          Upload a recorded presentation video for comprehensive asynchronous AI analysis across facial expressions, pitch, and speech pacing.
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
          data &&
          (data.confidence_score > 0 ||
            Object.keys(data.video_analysis || {}).length > 0) &&
          (data.transcribed_text &&
            data.transcribed_text !== "No transcript available")
        ) {
          setReportData(data);
        } else {
          setReportData(null);
        }
      } catch (error) {
        console.error("Failed to fetch report data:", error);
        setReportData(null);
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
      console.error("Download error:", error);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen ${theme.bg.primary} flex items-center justify-center`}
      >
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin" />
          <div className={`${theme.text.primary} text-lg font-medium`}>
            Loading report...
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <TrialBanner onShowAuth={onShowAuth} />
        <div className="text-center space-y-6">
          <BarChart3 className="w-20 h-20 text-violet-500 mx-auto" />
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
            className="flex items-center gap-2 mx-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl font-semibold hover:from-violet-500 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Video className="w-5 h-5" />
            <span>Start New Evaluation</span>
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
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-2xl font-semibold hover:from-violet-500 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            <span>New Analysis</span>
          </button>
          <button
            onClick={downloadReport}
            className={`flex items-center justify-center gap-2 px-8 py-4 ${theme.bg.button} ${theme.text.primary} rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border`}
          >
            <Download className="w-5 h-5 text-violet-500" />
            <span>Download Report</span>
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
        <div className={`${theme.bg.secondary} rounded-3xl p-8 text-center border`}>
          <h2 className={`text-lg font-semibold ${theme.text.secondary} mb-4`}>
            Overall Confidence Score
          </h2>
          <div className="relative">
            <div className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">
              {reportData.confidence_score}
            </div>
            <div className={`text-2xl ${theme.text.muted} font-light`}>
              / 100
            </div>
            <div className={`text-xl font-bold ${theme.text.primary} mt-4`}>
              {reportData.confidence_level}
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className={`${theme.bg.secondary} rounded-3xl p-6 border`}>
          <h3
            className={`text-lg font-bold ${theme.text.primary} mb-4 flex items-center gap-3`}
          >
            <FileText className="w-5 h-5 text-violet-500" />
            <span>Speech Transcript</span>
          </h3>
          <div
            className={`${theme.bg.card} rounded-2xl p-5 max-h-48 overflow-y-auto border border-white/5`}
          >
            <p className={`${theme.text.secondary} text-sm leading-relaxed font-sans`}>
              {reportData.transcribed_text || "No transcript available"}
            </p>
          </div>
        </div>

        {/* Emotion Breakdown */}
        <div className={`${theme.bg.secondary} rounded-3xl p-6 border`}>
          <h3
            className={`text-lg font-bold ${theme.text.primary} mb-4 flex items-center gap-3`}
          >
            <Activity className="w-5 h-5 text-violet-500" />
            <span>Emotion Analysis</span>
          </h3>
          {totalEmotions === 0 ? (
            <p className={`${theme.text.muted} text-center py-4 text-sm`}>
              No facial expressions detected. Try with better lighting.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(reportData.video_analysis).map(
                ([emotion, count]) => {
                  const percentage = ((count / totalEmotions) * 100).toFixed(1);
                  return (
                    <div
                      key={emotion}
                      className="flex items-center justify-between"
                    >
                      <span
                        className={`${theme.text.primary} font-medium capitalize text-sm`}
                      >
                        {emotion}
                      </span>
                      <div className="flex items-center gap-3 w-2/3 justify-end">
                        <div className="w-full bg-gray-500/20 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span
                          className={`${theme.text.secondary} text-sm font-semibold w-12 text-right flex-shrink-0`}
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
        <div className={`${theme.bg.secondary} rounded-3xl p-6 border`}>
          <h3
            className={`text-lg font-bold ${theme.text.primary} mb-4 flex items-center gap-3`}
          >
            <TrendingUp className="w-5 h-5 text-violet-500" />
            <span>Performance Timeline</span>
          </h3>
          <div
            className="relative cursor-pointer rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 border border-white/5 shadow-lg"
            onClick={() => setShowModal(true)}
          >
            <img
              className="w-full h-auto"
              src="/static/report_plot.png"
              alt="Performance Analysis Graph"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white text-gray-900 px-5 py-2.5 rounded-xl font-semibold shadow-2xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Click to enlarge chart</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Analysis */}
        <div className={`${theme.bg.secondary} rounded-3xl p-6 border`}>
          <h3
            className={`text-lg font-bold ${theme.text.primary} mb-4 flex items-center gap-3`}
          >
            <Volume2 className="w-5 h-5 text-violet-500" />
            <span>Vocal Analysis</span>
          </h3>
          <div className={`${theme.bg.card} rounded-2xl p-6 text-center border border-white/5`}>
            <div className={`${theme.text.muted} text-sm mb-2 font-medium`}>
              Average Pitch Frequency
            </div>
            <div className={`text-4xl font-bold ${theme.text.primary} tracking-tight`}>
              {reportData.audio_features} Hz
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className={`${theme.bg.secondary} rounded-3xl p-6 border`}>
          <h3
            className={`text-lg font-bold ${theme.text.primary} mb-4 flex items-center gap-3`}
          >
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span>Recommendations</span>
          </h3>
          {reportData.suggestions && reportData.suggestions.length > 0 ? (
            <div className="space-y-4">
              {reportData.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`${theme.bg.card} rounded-2xl p-5 hover:scale-105 transition-all duration-200 border border-white/5 shadow-sm`}
                >
                  <h4 className={`font-bold ${theme.text.primary} mb-2 text-base`}>
                    {suggestion.area}
                  </h4>
                  <p className={`${theme.text.secondary} text-sm mb-4 leading-relaxed`}>
                    {suggestion.desc}
                  </p>
                  <a
                    href={suggestion.resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 ${theme.text.accent} hover:underline text-sm font-semibold`}
                  >
                    <span>Learn more from expert resources</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${theme.text.muted} text-center py-6 text-sm`}>
              No specific recommendations available. Your performance is well within optimal ranges!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Chart Modal Component
const ChartModal = ({ onClose }) => {
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div ref={modalRef} className="relative max-w-6xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-bold hover:scale-110 transition-transform duration-200 shadow-2xl border border-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <img
          className="w-full h-auto rounded-2xl shadow-2xl border border-white/10"
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
        theme.isDark ? "border-white/10" : "border-gray-200/60"
      } mt-20`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className={`${theme.text.secondary} text-sm font-medium`}>
            © 2026 PresentAI. Professional presentation analytics powered by AI.
          </div>
          <div className="flex items-center gap-6">
            <span className={`text-xs ${theme.text.muted} hover:${theme.text.primary} cursor-pointer transition-colors`}>Privacy Policy</span>
            <span className={`text-xs ${theme.text.muted} hover:${theme.text.primary} cursor-pointer transition-colors`}>Terms of Service</span>
            <span className={`text-xs ${theme.text.muted} hover:${theme.text.primary} cursor-pointer transition-colors`}>Enterprise Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default App;
