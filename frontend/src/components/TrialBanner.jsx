import React, { useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";

const TrialBanner = ({ onShowAuth }) => {
  const { trialStatus, isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const bannerRef = useRef(null);

  useEffect(() => {
    import('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js').then(() => {
      if (window.gsap && bannerRef.current) {
        window.gsap.fromTo(bannerRef.current, 
          { opacity: 0, y: -20 }, 
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        );
      }
    });
  }, [trialStatus]);

  if (isAuthenticated && user?.is_premium) {
    return null;
  }

  if (!trialStatus) {
    return null;
  }

  if (trialStatus.trial_expired) {
    return (
      <div ref={bannerRef} className="mb-8">
        <div className={`bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm ${theme.bg.secondary}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl animate-pulse">⚠️</div>
              <div className="text-center sm:text-left">
                <h3 className={`${theme.text.primary} font-bold text-lg`}>Trial Expired</h3>
                <p className={`${theme.status.error} text-sm`}>
                  Your free trial has ended. Upgrade to continue using all features.
                </p>
              </div>
            </div>
            <button
              onClick={onShowAuth}
              className="bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg whitespace-nowrap"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (trialStatus.is_trial_active) {
    return (
      <div ref={bannerRef} className="mb-8">
        <div className={`bg-gradient-to-r from-violet-500/20 to-purple-600/20 border border-violet-500/30 rounded-2xl p-6 backdrop-blur-sm ${theme.bg.secondary}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🎁</div>
              <div className="text-center sm:text-left">
                <h3 className={`${theme.text.primary} font-bold text-lg`}>Free Trial Active</h3>
                <div className={`flex flex-col sm:flex-row gap-2 ${theme.text.secondary} text-sm`}>
                  {trialStatus.days_remaining !== null && (
                    <span className="flex items-center gap-1">
                      📅 {trialStatus.days_remaining} days left
                    </span>
                  )}
                  {trialStatus.evaluations_remaining !== null && (
                    <span className="flex items-center gap-1">
                      🎯 {trialStatus.evaluations_remaining} evaluations remaining
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onShowAuth}
              className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg whitespace-nowrap"
            >
              Get Full Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TrialBanner;