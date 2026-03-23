// pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGoogle, FaEye, FaEyeSlash, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { AuthService } from '../services/auth';
import { userService } from '../services/userService';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'https://loopmart.ng/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirmation: '',
    name: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [agreeTerms, setAgreeTerms] = useState(false);

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

    // Validation
    if (!formData.email.trim() || !formData.password.trim() || !formData.password_confirmation.trim()) {
      showMessage('Please fill in all required fields', 'error');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showMessage('Please enter a valid email address', 'error');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      showMessage('Password must be at least 8 characters', 'error');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      showMessage('Passwords do not match', 'error');
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      showMessage('You must agree to the Terms and Conditions', 'error');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting signup with:', formData.email);
      
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          name: formData.name || formData.email.split('@')[0],
          username: formData.username || formData.email.split('@')[0]
        }),
      });

      const data = await response.json();
      console.log('Signup response:', data);

      // Check if signup was successful
      if (data.status === true || data.success === true) {
        let token, userData;
        
        // Handle different response structures
        if (data.data && data.data.token) {
          token = data.data.token;
          userData = data.data.user;
        } else if (data.token) {
          token = data.token;
          userData = data.user;
        } else {
          // If we get here but status is true, it might be a simple success message
          showMessage('Registration successful! Please login.', 'success');
          setTimeout(() => {
            navigate('/login');
          }, 1500);
          setLoading(false);
          return;
        }
        
        if (!token || !userData) {
          showMessage('Registration successful! Please login.', 'success');
          setTimeout(() => {
            navigate('/login');
          }, 1500);
          setLoading(false);
          return;
        }
        
        console.log('Signup successful, setting token and user');
        
        AuthService.setToken(token, rememberMe);
        userService.setUser(userData, token);
        
        showMessage('Registration successful! Redirecting...', 'success');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
        
      } else {
        // Registration failed
        const errorMsg = data.message || 
                        (data.errors ? Object.values(data.errors).flat().join(' ') : 'Registration failed');
        showMessage(errorMsg, 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showMessage('Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

 const handleGoogleLogin = () => {
  const googleAuthUrl = import.meta.env.VITE_GOOGLE_AUTH_URL || 'https://loopmart.ng/auth/google/redirect';
  const redirectUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${googleAuthUrl}?redirect=${redirectUrl}`;
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
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create Account</h1>
          <p className="text-gray-600 text-sm mt-1">Join LoopMart today</p>
        </div>

        {/* Google Sign Up Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <FaGoogle className="text-red-500" size={18} />
          <span className="font-medium">Sign up with Google</span>
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or sign up with email</span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
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
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
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
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none pr-10"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          {formData.password && formData.password_confirmation && 
           formData.password !== formData.password_confirmation && (
            <div className="text-red-500 text-xs flex items-center gap-1 p-2 bg-red-50 rounded border border-red-200">
              <FaTimesCircle size={12} />
              <span>Passwords do not match</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              disabled={loading}
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-yellow-600 hover:text-yellow-700 hover:underline">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-yellow-600 hover:text-yellow-700 hover:underline">
                Privacy Policy
              </Link>
            </label>
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
            disabled={loading || !agreeTerms}
            className="w-full bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" size={16} />
                <span>Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-yellow-600 hover:text-yellow-700 font-semibold hover:underline">
            Sign in
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