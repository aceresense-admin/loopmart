// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BannerCarousel from "../components/BannerCarousel";
import CategoriesSection from "../components/CategoriesSection";
import Footer from "../components/Footer";
import logo from "../assets/logo.png";

export default function HomePage() {
  const navigate = useNavigate();
  const [isAnyModalActive, setIsAnyModalActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ 
    type: 'success', 
    message: '', 
    title: '' 
  });

  // Listen for toast events
  useEffect(() => {
    const handleToastEvent = (event) => {
      const { type, message, title } = event.detail;
      setToastMessage({ type, message, title });
      setShowToast(true);
      
      // Auto hide after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    };

    window.addEventListener('show-toast', handleToastEvent);

    return () => {
      window.removeEventListener('show-toast', handleToastEvent);
    };
  }, []);

  // Simple Toast Component
  const Toast = () => {
    if (!showToast) return null;

    const bgColor = toastMessage.type === 'success' ? 'bg-green-100 border-green-300' :
                   toastMessage.type === 'error' ? 'bg-red-100 border-red-300' :
                   toastMessage.type === 'warning' ? 'bg-yellow-100 border-yellow-300' :
                   'bg-blue-100 border-blue-300';
    
    const textColor = toastMessage.type === 'success' ? 'text-green-800' :
                     toastMessage.type === 'error' ? 'text-red-800' :
                     toastMessage.type === 'warning' ? 'text-yellow-800' :
                     'text-blue-800';

    return (
      <div className={`fixed top-4 right-4 z-[9999] min-w-[300px] max-w-md border rounded-lg shadow-lg ${bgColor} animate-slide-in`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {toastMessage.type === 'success' && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
              {toastMessage.type === 'error' && (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-sm">!</span>
                </div>
              )}
              {toastMessage.type === 'warning' && (
                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-white text-sm">!</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              {toastMessage.title && <h3 className={`font-semibold ${textColor}`}>{toastMessage.title}</h3>}
              <p className={`text-sm mt-1 ${textColor}`}>{toastMessage.message}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onModalStateChange={setIsAnyModalActive} />
      
      {/* Main content with proper spacing */}
      <main className="flex-1 bg-gray-50 pt-16">
        <BannerCarousel />
        <CategoriesSection />
      </main>
      
      <Footer />
      <Toast />
      
      {/* Add CSS animation */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
