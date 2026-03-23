// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { NotificationProvider } from './contexts/NotificationContext'
import RootLayout from './layouts/RootLayout'
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import { ToastProvider } from './contexts/ToastContext'
import NotificationsPage from './pages/NotificationsPage'
import ProductDetails from './pages/ProductDetails'
import SellingSuccessPage from './pages/SellingSuccessPage'
import StartSelling from './pages/StartSelling'
import ShopPage from './pages/ShopPage';
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyOtpPage from './pages/VerifyOtpPage'

const API_URL = import.meta.env.VITE_API_URL || 'https://loopmart.ng/api';

function App() {
  console.log('📱 App rendering');

  // Token handler - runs ONCE when app loads
  useEffect(() => {
    console.log('🔍 useEffect running - checking for token');
    
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    console.log('Current URL:', window.location.href);
    console.log('Token found:', token ? 'YES - ' + token.substring(0, 20) + '...' : 'NO');
    
    if (token && !localStorage.getItem('loopmart_token')) {
      console.log('✅ Storing token in localStorage');
      localStorage.setItem('loopmart_token', token);
      
      // Clear the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('🧹 Token removed from URL');
      
      // Reload to let the app pick up the token
      setTimeout(() => {
        console.log('🔄 Reloading app...');
        window.location.reload();
      }, 500);
    }
  }, []);

  return (
    <SubscriptionProvider>
      <NotificationProvider>
        <ToastProvider>
          <Router>
            <RootLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/shop/:slug" element={<ShopPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-otp" element={<VerifyOtpPage />} />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                } />
                <Route path="/start-selling" element={
                  <ProtectedRoute>
                    <StartSelling />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/selling-success" element={
                  <ProtectedRoute>
                    <SellingSuccessPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </RootLayout>
          </Router>
        </ToastProvider>
      </NotificationProvider>
    </SubscriptionProvider>
  )
}

export default App
