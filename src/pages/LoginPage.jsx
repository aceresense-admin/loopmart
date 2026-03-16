// pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGoogle, FaEye, FaEyeSlash, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { AuthService } from '../services/auth';
import { userService } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'https://loopmart.ng/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Get redirect URL from query params
  const getRedirectPath = () => {
    const params = new URLSearchParams(location.search);
    let redirect = params.get('redirect') || '/';
    
    // Ensure redirect starts with a slash
    if (redirect && !redirect.startsWith('/')) {
      redirect = '/' + redirect;
    }
    
    // Remove any duplicate 'login' from the path
    redirect = redirect.replace('/login', '');
    
    // If redirect is empty after cleaning, go to home
    if (!redirect || redirect === '') {
      redirect = '/';
    }
    
    return redirect;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message.text) setMessage({ text: '', type: '' });
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const apiFetch = async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      return await fetch(fullUrl, finalOptions);
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!formData.email.trim() || !formData.password.trim()) {
      showMessage('Please fill in all fields', 'error');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', formData.email);
      
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (data.status === true || data.success === true) {
        let token, userData;
        
        if (data.data && data.data.token) {
          token = data.data.token;
          userData = data.data.user;
        } else if (data.token) {
          token = data.token;
          userData = data.user;
        } else {
          throw new Error('Invalid response structure');
        }
        
        if (!token || !userData) {
          throw new Error('Missing token or user data');
        }
        
        console.log('Login successful, setting token and user');
        
        // Store in localStorage directly
        localStorage.setItem('loopmart_token', token);
        localStorage.setItem('loopmart_user', JSON.stringify(userData));
        
        // Also set via services
        AuthService.setToken(token, rememberMe);
        userService.setUser(userData, token);
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Get the redirect path
        const redirectPath = getRedirectPath();
        console.log('Redirecting to:', redirectPath);
        
        // Show success toast with redirect info
        toast?.success('Login successful!', 3000);
        
        setTimeout(() => {
          navigate(redirectPath);
        }, 1500);
        
      } else {
        const errorMessage = data.message || data.error || 'Invalid email or password';
        showMessage(errorMessage, 'error');
        toast?.error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Login failed. Please check your credentials.', 'error');
      toast?.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const baseUrl = API_URL.replace('/api', '');
    const redirectUrl = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `${baseUrl}/auth/google/redirect?redirect=${redirectUrl}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <img 
            src={logo} 
            alt="LoopMart" 
            className="h-12 w-auto mx-auto cursor-pointer"
            onClick={() => navigate('/')}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome Back</h1>
          <p className="text-gray-600 text-sm mt-1">Sign in to continue to LoopMart</p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <FaGoogle className="text-red-500" size={18} />
          <span className="font-medium">Continue with Google</span>
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or sign in with email</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none pr-10"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                disabled={loading}
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-red-600 hover:text-red-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {message.text && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <FaCheckCircle className="flex-shrink-0" size={16} />
              ) : (
                <FaTimesCircle className="flex-shrink-0" size={16} />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" size={16} />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-yellow-600 hover:text-yellow-700 font-semibold hover:underline">
            Create an account
          </Link>
        </p>

        {/* Back to Home */}
        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4"
        >
          ← Back to Home
        </button>
      </motion.div>
    </div>
  );
}
