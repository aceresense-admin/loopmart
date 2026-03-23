// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

// Import new auth pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyOtpPage from './pages/VerifyOtpPage'

// Import Google Auth Hook
import { useGoogleAuth } from './hooks/useGoogleAuth';

// Component to handle Google OAuth callback
function GoogleAuthHandler() {
  useGoogleAuth();
  return null;
}

function App() {
  return (
    <SubscriptionProvider>
      <NotificationProvider>
        <ToastProvider>
          <Router>
            {/* Google Auth Handler - runs once to check for OAuth tokens */}
            <GoogleAuthHandler />
            <RootLayout>
              <Routes>
                {/* Public routes - accessible to everyone */}
                <Route path="/" element={<HomePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/shop/:slug" element={<ShopPage />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-otp" element={<VerifyOtpPage />} />
                
                {/* Protected routes - require login */}
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
