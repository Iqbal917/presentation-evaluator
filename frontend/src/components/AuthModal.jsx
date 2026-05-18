import React, { useState, useRef, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import { X } from "lucide-react";

const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState("login");
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      import('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js').then(() => {
        if (window.gsap && overlayRef.current) {
          window.gsap.fromTo(overlayRef.current, 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.3, ease: "power2.out" }
          );
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-bold hover:scale-110 transition-transform duration-200 shadow-2xl border border-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
        
        {mode === "login" ? (
          <Login
            onSwitchToRegister={() => setMode("register")}
            onClose={onClose}
          />
        ) : (
          <Register
            onSwitchToLogin={() => setMode("login")}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;