// src/components/Header.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaGoogle, FaBars, FaCheckCircle, FaTimesCircle, FaArrowLeft,
  FaSearch, FaBell, FaEye, FaEyeSlash, FaUser,
  FaSignOutAlt, FaChevronDown, FaTimes,
  FaExclamationCircle, FaShoppingCart, FaSpinner,
  FaUserPlus, FaStar, FaComment, FaThumbsUp
} from 'react-icons/fa';
import { RxAvatar } from "react-icons/rx";
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { Dialog } from '@headlessui/react';
import { userService } from '../services/userService';
import { AuthService } from '../services/auth';
import logo from '../assets/logo.png';

// Helper functions
const getRandomColor = () => {
  const colors = ['#FFD700', '#FF6347', '#4CAF50', '#1E90FF', '#FF69B4', '#FF8C00', '#9C27B0'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getInitials = (email, name, username) => {
  if (username) return username.slice(0, 2).toUpperCase();
  if (name) return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  if (!email) return 'U';
  const prefix = email.split('@')[0];
  const chars = prefix.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
  return chars || 'U';
};

// Helper to get profile image URL
const getProfileImageUrl = (photoFilename) => {
  if (!photoFilename) return null;
  if (photoFilename.startsWith('http')) return photoFilename;
  return `https://loopmart.ng/uploads/users/${photoFilename}`;
};

export default function Header({ onModalStateChange }) {
  const navigate = useNavigate();
  
  // ========== STATE MANAGEMENT ==========
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState('email');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [loginFormData, setLoginFormData] = useState({ 
    email: '', 
    password: '', 
    otp: '' 
  });
  const [signupFormData, setSignupFormData] = useState({ 
    email: '', 
    password: '', 
    password_confirmation: '',
    name: '',
    username: ''
  });
  
  const [avatarColor, setAvatarColor] = useState('#FFD700');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const notificationRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://loopmart.ng/api';

  // ========== UTILITY FUNCTIONS ==========
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const showMessage = (text, type) => {
    console.log(`Showing message: ${text} (${type})`);
    
    const icon = type === 'success' 
      ? <FaCheckCircle className="mr-2" size={16} />
      : <FaTimesCircle className="mr-2" size={16} />;
    
    setMessage({ text, type, icon });
    
    setTimeout(() => {
      setMessage(prev => prev.text === text ? { text: '', type: 'success' } : prev);
    }, type === 'success' ? 5000 : 7000);
  };

  // ========== NOTIFICATION SYSTEM ==========
  const loadNotificationsFromStorage = () => {
    try {
      const stored = localStorage.getItem('loopmart_notifications');
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  };

  const saveNotificationsToStorage = (notifications) => {
    try {
      const limited = notifications.slice(0, 100);
      localStorage.setItem('loopmart_notifications', JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const loadNotifications = useCallback(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError(null);
    
    try {
      const storedNotifications = loadNotificationsFromStorage();
      const userNotifications = storedNotifications.filter(n => 
        n.userId === user.id
      );
      
      const sortedNotifications = userNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(sortedNotifications);
      const unread = sortedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotificationsError(error.message);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  const markAsRead = (notificationId) => {
    const updated = notifications.map(notif => 
      notif.id.toString() === notificationId.toString() ? { ...notif, read: true } : notif
    );
    setNotifications(updated);
    setUnreadCount(prev => Math.max(0, prev - 1));
    saveNotificationsToStorage(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(notif => ({ ...notif, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    saveNotificationsToStorage(updated);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('loopmart_notifications');
  };

  const triggerBellAnimation = () => {
    const bell = document.querySelector('[data-bell-icon]');
    if (bell) {
      bell.classList.add('animate-ring');
      setTimeout(() => bell.classList.remove('animate-ring'), 1000);
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    setUnreadCount(prev => prev + 1);
    saveNotificationsToStorage(updated);
    triggerBellAnimation();
  };

  useEffect(() => {
    const handleAddNotification = (event) => {
      addNotification(event.detail);
    };

    window.addEventListener('add-notification', handleAddNotification);
    
    return () => {
      window.removeEventListener('add-notification', handleAddNotification);
    };
  }, [notifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.reviewId) {
      navigate(`/reviews/${notification.reviewId}`);
    } else if (notification.productId) {
      navigate(`/products/${notification.productId}`);
    } else if (notification.action === 'welcome') {
      navigate('/dashboard');
    } else if (notification.action === 'profile') {
      navigate('/profile');
    }
    
    setShowNotifications(false);
  };

  // ========== API FUNCTIONS ==========
  const apiFetch = async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const token = AuthService.getToken();
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      return await fetch(fullUrl, finalOptions);
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  };

  // ========== AUTH FUNCTIONS ==========
const handleGoogleLogin = () => {
  const googleAuthUrl = import.meta.env.VITE_GOOGLE_AUTH_URL || 'https://loopmart.ng/auth/google/redirect';
  const redirectUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${googleAuthUrl}?redirect=${redirectUrl}`;
};

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: 'success' });

    if (!loginFormData.email.trim() || !loginFormData.password.trim()) {
      showMessage('Please fill in all fields', 'error');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', loginFormData.email);
      
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginFormData.email.trim(),
          password: loginFormData.password
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
        
        showMessage('Login successful!', 'success');
        
        setTimeout(() => {
          setShowLogin(false);
          setLoginFormData({ email: '', password: '', otp: '' });
          setMessage({ text: '', type: 'success' });
          loadNotifications();
        }, 1500);
        
      } else {
        const errorMessage = data.message || data.error || 'Invalid email or password';
        showMessage(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage({ text: '', type: 'success' });

  if (!signupFormData.email.trim() || !signupFormData.password.trim() || !signupFormData.password_confirmation.trim()) {
    showMessage('Please fill in all fields', 'error');
    setLoading(false);
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(signupFormData.email.trim())) {
    showMessage('Please enter a valid email address', 'error');
    setLoading(false);
    return;
  }

  if (signupFormData.password.length < 8) {
    showMessage('Password must be at least 8 characters', 'error');
    setLoading(false);
    return;
  }

  if (signupFormData.password !== signupFormData.password_confirmation) {
    showMessage('Passwords do not match', 'error');
    setLoading(false);
    return;
  }

  try {
    console.log('Attempting signup with:', signupFormData.email);
    
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: signupFormData.email.trim(),
        password: signupFormData.password,
        password_confirmation: signupFormData.password_confirmation,
        name: signupFormData.name || signupFormData.email.split('@')[0],
        username: signupFormData.username || signupFormData.email.split('@')[0]
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
          setShowSignup(false);
          setShowLogin(true);
        }, 1500);
        setLoading(false);
        return;
      }
      
      if (!token || !userData) {
        showMessage('Registration successful! Please login.', 'success');
        setTimeout(() => {
          setShowSignup(false);
          setShowLogin(true);
        }, 1500);
        setLoading(false);
        return;
      }
      
      console.log('Signup successful, setting token and user');
      
      AuthService.setToken(token, rememberMe);
      userService.setUser(userData, token);
      
      showMessage('Registration successful!', 'success');
      
      setTimeout(() => {
        setShowSignup(false);
        setSignupFormData({ 
          email: '', 
          password: '', 
          password_confirmation: '',
          name: '',
          username: ''
        });
        setMessage({ text: '', type: 'success' });
        loadNotifications();
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

  const handleLogout = () => {
    userService.clearUser();
    AuthService.clearToken();
    setNotifications([]);
    setUnreadCount(0);
    navigate('/');
    window.location.reload();
  };

  // ========== PASSWORD RESET FUNCTIONS ==========
  const sendResetOTP = async (email) => {
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return { status: false, message: 'Server returned invalid response' };
      }
      
      const isSuccess = data.status === true || 
                       data.success === true || 
                       data.message?.toLowerCase().includes('sent') ||
                       data.message?.toLowerCase().includes('otp');
      
      if (isSuccess) {
        if (data.data?.otp) setResetOtp(data.data.otp);
        else if (data.otp) setResetOtp(data.otp);
      }
      
      return {
        status: isSuccess,
        message: data.message || (isSuccess ? 'OTP sent successfully' : 'Failed to send OTP'),
        data: data.data,
        errors: data.errors
      };
    } catch (error) {
      return { status: false, message: error.message || 'Network error' };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', email);
      formDataToSend.append('otp', otp);

      const response = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        body: formDataToSend,
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return { status: false, message: 'Server returned invalid response' };
      }
      
      const isSuccess = data.status === true || 
                       data.success === true || 
                       data.message?.toLowerCase().includes('verified');
      
      if (isSuccess && (data.data?.otp || data.otp)) {
        setResetOtp(data.data?.otp || data.otp);
      }
      
      return {
        status: isSuccess,
        message: data.message || (isSuccess ? 'OTP verified successfully' : 'Invalid OTP'),
        data: data.data,
        errors: data.errors
      };
    } catch (error) {
      return { status: false, message: error.message || 'Network error' };
    }
  };

  const resetPassword = async (otp, password, passwordConfirmation) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('otp', otp);
      formDataToSend.append('password', password);
      formDataToSend.append('password_confirmation', passwordConfirmation);

      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        body: formDataToSend,
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return { status: false, message: 'Server returned invalid response' };
      }
      
      const isSuccess = data.status === true || data.success === true;
      
      return {
        status: isSuccess,
        message: data.message || (isSuccess ? 'Password reset successful' : 'Failed to reset password'),
        data: data.data,
        errors: data.errors
      };
    } catch (error) {
      return { status: false, message: error.message || 'Network error' };
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: 'success' });

    try {
      if (resetStep === 'email') {
        if (!loginFormData.email.trim()) {
          showMessage('Please enter your email address', 'error');
          setLoading(false);
          return;
        }

        const sendResult = await sendResetOTP(loginFormData.email.trim());
        
        if (sendResult.status) {
          showMessage('Verification code sent to your email!', 'success');
          setResetStep('otp');
        } else {
          showMessage(sendResult.message || 'Failed to send verification code.', 'error');
        }

      } else if (resetStep === 'otp') {
        if (!loginFormData.email.trim()) {
          showMessage('Email is required', 'error');
          setLoading(false);
          return;
        }

        if (!loginFormData.otp.trim() || loginFormData.otp.length !== 6) {
          showMessage('Please enter a valid 6-digit verification code', 'error');
          setLoading(false);
          return;
        }

        const verifyResult = await verifyOTP(loginFormData.email, loginFormData.otp);
        
        if (verifyResult.status || verifyResult.message?.toLowerCase().includes('verified')) {
          showMessage('Verification code verified successfully!', 'success');
          setResetStep('reset');
        } else {
          showMessage(verifyResult.message || 'Invalid verification code.', 'error');
        }

      } else if (resetStep === 'reset') {
        if (!loginFormData.password.trim()) {
          showMessage('Please enter a new password', 'error');
          setLoading(false);
          return;
        }

        if (loginFormData.password !== passwordConfirmation) {
          showMessage('Passwords do not match', 'error');
          setLoading(false);
          return;
        }

        if (loginFormData.password.length < 8) {
          showMessage('Password must be at least 8 characters', 'error');
          setLoading(false);
          return;
        }

        const otpToUse = resetOtp || loginFormData.otp;
        
        if (!otpToUse.trim()) {
          showMessage('Verification code is required', 'error');
          setLoading(false);
          return;
        }

        const resetResult = await resetPassword(otpToUse, loginFormData.password, passwordConfirmation);
        
        if (resetResult.status) {
          showMessage('Password reset successful!', 'success');
          setTimeout(() => {
            setShowForgotPassword(false);
            setShowLogin(true);
          }, 2000);
        } else {
          showMessage(resetResult.message || 'Failed to reset password.', 'error');
        }
      }
    } catch (error) {
      showMessage('An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========== SEARCH FUNCTIONS ==========
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await apiFetch(
        `/v1/search/products?searchParams=${encodeURIComponent(query)}`
      );

      if (!response.ok) throw new Error(`Search failed: ${response.status}`);

      const data = await response.json();
      let results = [];
      
      if (data.status && data.data && Array.isArray(data.data)) {
        results = data.data.map((item) => ({
          id: item.id || item.product_id || 0,
          title: item.title || item.name || 'Product',
          price: item.actual_price || item.price || '₦0',
          image: item.image || item.product_image,
          category: item.category || item.product_category,
          condition: item.condition || 'Unknown'
        }));
      }
      
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(true);
      searchProducts(searchQuery);
    }
  };

  const handleSearchResultClick = (productId) => {
    navigate(`/products/${productId}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // ========== FORM HANDLERS ==========
  const handleLoginChange = (e) => 
    setLoginFormData({ ...loginFormData, [e.target.name]: e.target.value });

  const handleSignupChange = (e) => 
    setSignupFormData({ ...signupFormData, [e.target.name]: e.target.value });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setResetStep('email');
    setLoginFormData({ email: '', password: '', otp: '' });
    setPasswordConfirmation('');
    setResetOtp('');
    setMessage({ text: '', type: 'success' });
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleOpenForgotPassword = () => {
    setShowLogin(false);
    setShowSignup(false);
    setShowForgotPassword(true);
    setResetStep('email');
    setMessage({ text: '', type: 'success' });
  };

  const handleCloseModal = () => {
    setShowLogin(false);
    setShowSignup(false);
    setShowForgotPassword(false);
    setResetStep('email');
    setLoginFormData({ email: '', password: '', otp: '' });
    setSignupFormData({ 
      email: '', 
      password: '', 
      password_confirmation: '',
      name: '',
      username: ''
    });
    setPasswordConfirmation('');
    setResetOtp('');
    setMessage({ text: '', type: 'success' });
  };

  // ========== COMPONENTS ==========
  const SearchResultsDropdown = () => (
    <div className="relative w-full" ref={searchRef}>
      <AnimatePresence>
        {showSearchResults && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Search Results</h3>
                <span className="text-sm text-gray-500">{searchResults.length} found</span>
              </div>
            </div>

            {searchLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-3"></div>
                <p className="text-gray-500">Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <FaSearch className="text-gray-300 text-3xl mx-auto mb-3" />
                <p className="text-gray-500">No products found</p>
                <p className="text-gray-400 text-sm mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSearchResultClick(product.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FaShoppingCart size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {product.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-600 font-bold">
                            {product.price.includes('₦') ? product.price : `₦${product.price}`}
                          </span>
                          {product.category && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {product.category}
                            </span>
                          )}
                        </div>
                        {product.condition && (
                          <span className="text-xs text-gray-500 mt-1">
                            {product.condition}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <button
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all search results
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const NotificationDropdown = () => (
    <div className="relative" ref={notificationRef}>
      <button 
        className="relative bg-white/30 backdrop-blur-md p-2 rounded-lg text-black border border-white/40 shadow hover:bg-white/40 transition"
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications) loadNotifications();
        }}
        disabled={!user}
        title={user ? 'Notifications' : 'Login to see notifications'}
        data-bell-icon
      >
        <FaBell size={18} />
        {user && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full border-2 border-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showNotifications && user && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadNotifications}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg font-medium flex items-center gap-1"
                    title="Refresh"
                    disabled={notificationsLoading}
                  >
                    <FaSpinner className={notificationsLoading ? 'animate-spin' : ''} size={10} />
                    <span>Refresh</span>
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {unreadCount} unread • {notifications.length} total
                {notificationsError && <span className="text-red-500 ml-2">Error: {notificationsError}</span>}
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notificationsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FaBell className="text-gray-300 text-4xl mx-auto mb-3" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Your notifications will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'success' ? 'bg-green-100 text-green-600' :
                          notification.type === 'error' ? 'bg-red-100 text-red-600' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {notification.source === 'review' ? <FaStar /> :
                           notification.type === 'success' ? <FaCheckCircle /> :
                           notification.type === 'error' ? <FaExclamationCircle /> :
                           notification.type === 'warning' ? <FaExclamationCircle /> :
                           <FaBell />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1 animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1 whitespace-pre-line">
                            {notification.message}
                          </p>
                          
                          {notification.review && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-purple-50 rounded-lg p-2">
                              <FaStar className="text-purple-500" />
                              <span className="font-medium">Rating: {notification.review.rating}/5</span>
                              {notification.review.comment && (
                                <span className="truncate">"{notification.review.comment}"</span>
                              )}
                            </div>
                          )}
                          
                          {notification.product && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-lg p-2">
                              <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded overflow-hidden">
                                {notification.product.image ? (
                                  <img 
                                    src={notification.product.image} 
                                    alt={notification.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <FaShoppingCart size={12} />
                                  </div>
                                )}
                              </div>
                              <span className="truncate font-medium flex-1">{notification.product.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDate(notification.createdAt)}
                            </span>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Mark read
                                </button>
                              )}
                              {notification.reviewId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/reviews/${notification.reviewId}`);
                                    setShowNotifications(false);
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-800"
                                >
                                  View Review
                                </button>
                              )}
                              {notification.productId && !notification.reviewId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/products/${notification.productId}`);
                                    setShowNotifications(false);
                                  }}
                                  className="text-xs text-green-600 hover:text-green-800"
                                >
                                  View Product
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ========== EFFECTS ==========
  useEffect(() => {
    // Get user from localStorage on mount
    const currentUser = userService.getUser();
    if (currentUser) {
      console.log('Header - User from storage:', currentUser);
      setUser(currentUser);
      setAvatarColor(getRandomColor());
      loadNotifications();
    }
  }, []);

  // Subscribe to user changes
  useEffect(() => {
    const unsubscribe = userService.subscribe((currentUser) => {
      console.log('Header - User state updated:', currentUser);
      setUser(currentUser);
      if (currentUser) {
        setAvatarColor(getRandomColor());
        loadNotifications();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });
    
    return unsubscribe;
  }, [loadNotifications]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    const handleClickOutsideNotification = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideSearch);
    document.addEventListener('mousedown', handleClickOutsideNotification);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideSearch);
      document.removeEventListener('mousedown', handleClickOutsideNotification);
    };
  }, []);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Modal state change callback
  useEffect(() => {
    if (onModalStateChange) {
      const isModalActive = showLogin || showSignup || showForgotPassword || mobileMenuOpen;
      onModalStateChange(isModalActive);
    }
  }, [showLogin, showSignup, showForgotPassword, mobileMenuOpen, onModalStateChange]);

  // Animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ring {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(15deg); }
        50% { transform: rotate(-15deg); }
        75% { transform: rotate(10deg); }
        100% { transform: rotate(0deg); }
      }
      .animate-ring {
        animation: ring 0.5s ease-in-out 3;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Get profile picture URL
  const profilePictureUrl = user?.photo_url ? getProfileImageUrl(user.photo_url) : user?.profilePicture;

  // ========== RENDER ==========
  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white/20 backdrop-blur-lg border-b border-white/30 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={logo} 
              alt="LoopMart Logo" 
              className="h-8 w-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 mx-2 lg:mx-6 max-w-2xl">
            <div className="relative w-full" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) setShowSearchResults(true);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white/30 text-black border border-white/40 placeholder-black/70 focus:ring-2 focus:ring-yellow-400 outline-none shadow-inner backdrop-blur-md"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-yellow-400/90 text-black px-3 py-2 hover:bg-yellow-500 transition font-semibold shadow"
                >
                  <FaSearch size={14} />
                </button>
              </form>
              <SearchResultsDropdown />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-6 mr-4">
              <button
                onClick={() => navigate('/pricing')}
                className="text-sm font-medium text-gray-700 hover:text-yellow-500 transition-colors"
              >
                Pricing
              </button>
            </div>
            <NotificationDropdown />

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-3">
              {!user ? (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center justify-center w-10 h-10 bg-black/60 text-white rounded-lg hover:bg-yellow-400 hover:text-black transition border border-white/20 backdrop-blur-sm"
                  title="Login / Register"
                >
                  <RxAvatar size={20} />
                </button>
              ) : (
                <>
                  <span className="hidden lg:inline text-sm text-black font-medium">
                    Hi, {user.username || user.name || user.email?.split('@')[0]}
                  </span>
                  
                  <Menu as="div" className="relative">
                    <MenuButton className="flex items-center space-x-2 focus:outline-none">
                      {profilePictureUrl ? (
                        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md backdrop-blur-sm">
                          <img 
                            src={profilePictureUrl} 
                            alt="Profile" 
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border border-white/40 shadow-md backdrop-blur-sm"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {getInitials(user.email, user.name, user.username)}
                        </div>
                      )}
                      <FaChevronDown size={12} className="text-gray-600" />
                    </MenuButton>

                    <Transition
                      enter="transition duration-100 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-75 ease-in"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      <MenuItems className="absolute right-0 mt-2 w-48 bg-white backdrop-blur-md rounded-xl shadow-xl border border-white/30 py-2 text-sm text-black z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="font-medium text-gray-900 truncate">
                            {user.username || user.name || user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => navigate('/dashboard')}
                              className={`flex items-center w-full text-left px-4 py-2 ${active ? 'bg-yellow-400/40' : ''}`}
                            >
                              <FaUser className="mr-3" size={14} />
                              Dashboard
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => navigate('/profile')}
                              className={`flex items-center w-full text-left px-4 py-2 ${active ? 'bg-yellow-400/40' : ''}`}
                            >
                              <FaUser className="mr-3" size={14} />
                              My Profile
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => navigate('/reviews')}
                              className={`flex items-center w-full text-left px-4 py-2 ${active ? 'bg-yellow-400/40' : ''}`}
                            >
                              <FaStar className="mr-3" size={14} />
                              My Reviews
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => navigate('/notifications')}
                              className={`flex items-center w-full text-left px-4 py-2 ${active ? 'bg-yellow-400/40' : ''}`}
                            >
                              <FaBell className="mr-3" size={14} />
                              Notifications ({unreadCount})
                            </button>
                          )}
                        </MenuItem>
                        <div className="border-t border-white/30 my-1"></div>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`flex items-center w-full text-left px-4 py-2 text-red-600 ${active ? 'bg-yellow-400/40' : ''}`}
                            >
                              <FaSignOutAlt className="mr-3" size={14} />
                              Logout
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Transition>
                  </Menu>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden bg-yellow-400/80 backdrop-blur-md p-2 rounded-md text-black border border-white/40 shadow"
              onClick={() => setMobileMenuOpen(true)}
            >
              <FaBars />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {!(showLogin || showSignup || showForgotPassword || mobileMenuOpen) && (
          <div className="md:hidden px-4 pb-3">
            <div className="relative w-full" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) setShowSearchResults(true);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white/30 text-black border border-white/40 placeholder-black/70 focus:ring-2 focus:ring-yellow-400 outline-none backdrop-blur-md"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-yellow-400/90 text-black px-3 py-1 rounded-lg hover:bg-yellow-500 transition shadow"
                >
                  <FaSearch size={14} />
                </button>
              </form>
              <SearchResultsDropdown />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      <Dialog open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60" />
        <Dialog.Panel className="fixed top-0 right-0 w-3/4 h-full bg-white/20 backdrop-blur-lg p-6 shadow-xl border-l border-white/30">
          <div className="flex justify-between items-center mb-6">
            <img src={logo} alt="Logo" className="h-7 w-auto cursor-pointer" onClick={() => { navigate('/'); setMobileMenuOpen(false); }} />
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              className="p-2 hover:bg-white/30 rounded-lg text-black backdrop-blur-sm"
            >
              ×
            </button>
          </div>
          
          <nav className="flex flex-col space-y-4">
            <button 
              onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}
              className="flex items-center px-4 py-2 hover:bg-yellow-400/40 rounded-lg transition text-black backdrop-blur-sm text-left"
            >
              Pricing
            </button>
            
            {user ? (
              <>
                <div className="border-t border-white/30 pt-4 mt-2">
                  <div className="flex items-center space-x-3 mb-4">
                    {profilePictureUrl ? (
                      <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-md">
                        <img 
                          src={profilePictureUrl} 
                          alt="Profile" 
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border border-white/40 shadow-md" 
                        style={{ backgroundColor: avatarColor }}
                      >
                        {getInitials(user.email, user.name, user.username)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-black">
                        {user.username || user.name || user.email?.split('@')[0]}
                      </div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { navigate('/notifications'); setMobileMenuOpen(false); }}
                    className="flex items-center justify-between w-full px-4 py-3 hover:bg-yellow-400/40 rounded-lg transition text-black backdrop-blur-sm mb-4 text-left"
                  >
                    <div className="flex items-center">
                      <FaBell className="mr-3" />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className="flex items-center px-4 py-2 hover:bg-yellow-400/40 rounded-lg transition text-black backdrop-blur-sm text-left">
                  <FaUser className="mr-3" /> Dashboard
                </button>
                <button onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }} className="flex items-center px-4 py-2 hover:bg-yellow-400/40 rounded-lg transition text-black backdrop-blur-sm text-left">
                  <FaUser className="mr-3" /> My Profile
                </button>
                <button onClick={() => { navigate('/reviews'); setMobileMenuOpen(false); }} className="flex items-center px-4 py-2 hover:bg-yellow-400/40 rounded-lg transition text-black backdrop-blur-sm text-left">
                  <FaStar className="mr-3" /> My Reviews
                </button>
                <button onClick={handleLogout} className="flex items-center px-4 py-2 text-red-600 hover:bg-red-400/40 rounded-lg transition text-left backdrop-blur-sm">
                  <FaSignOutAlt className="mr-3" /> Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }} 
                  className="flex items-center bg-black/60 text-white px-4 py-2 rounded-lg hover:bg-yellow-400 hover:text-black transition text-left backdrop-blur-sm"
                >
                  <RxAvatar className="mr-2" /> Login
                </button>
                <button 
                  onClick={() => { setShowSignup(true); setMobileMenuOpen(false); }} 
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-left backdrop-blur-sm"
                >
                  <FaUserPlus className="mr-2" /> Sign Up
                </button>
              </div>
            )}
          </nav>
        </Dialog.Panel>
      </Dialog>

      {/* Login Modal */}
      <AuthModal
        type="login"
        isOpen={showLogin}
        onClose={handleCloseModal}
        formData={loginFormData}
        onFormChange={handleLoginChange}
        onSubmit={handleLogin}
        loading={loading}
        message={message}
        showPassword={showPassword}
        onTogglePassword={togglePasswordVisibility}
        rememberMe={rememberMe}
        onRememberMeChange={setRememberMe}
        onGoogleLogin={handleGoogleLogin}
        onForgotPassword={handleOpenForgotPassword}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
          setMessage({ text: '', type: 'success' });
        }}
      />

      {/* Signup Modal */}
      <AuthModal
        type="signup"
        isOpen={showSignup}
        onClose={handleCloseModal}
        formData={signupFormData}
        onFormChange={handleSignupChange}
        onSubmit={handleSignup}
        loading={loading}
        message={message}
        showPassword={showPassword}
        onTogglePassword={togglePasswordVisibility}
        rememberMe={rememberMe}
        onRememberMeChange={setRememberMe}
        onGoogleLogin={handleGoogleLogin}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
          setMessage({ text: '', type: 'success' });
        }}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={handleCloseForgotPassword}
        step={resetStep}
        formData={loginFormData}
        onFormChange={handleLoginChange}
        passwordConfirmation={passwordConfirmation}
        onPasswordConfirmationChange={setPasswordConfirmation}
        onSubmit={handleForgotPassword}
        loading={loading}
        message={message}
        showNewPassword={showNewPassword}
        showConfirmPassword={showConfirmPassword}
        onToggleNewPassword={toggleNewPasswordVisibility}
        onToggleConfirmPassword={toggleConfirmPasswordVisibility}
        onBackToEmail={handleCloseForgotPassword}
        onSwitchToLogin={() => {
          handleCloseForgotPassword();
          setShowLogin(true);
        }}
      />
    </>
  );
}

// ========== AUTH MODAL COMPONENT ==========
const AuthModal = ({
  type,
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSubmit,
  loading,
  message,
  showPassword,
  onTogglePassword,
  rememberMe,
  onRememberMeChange,
  onGoogleLogin,
  onForgotPassword,
  onSwitchToSignup,
  onSwitchToLogin,
}) => {
  const isLogin = type === 'login';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-[90%] max-w-md rounded-2xl p-6 sm:p-8 shadow-xl relative mx-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="text-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-yellow-500">
                {isLogin ? 'Login to LoopMart' : 'Create Account'}
              </h2>
              <div className="flex items-center justify-center mt-2">
                <img src={logo} alt="Logo" className="h-8 w-auto" />
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={loading}
                className="w-full max-w-xs mx-auto mt-4 flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <FaGoogle className="text-red-500" size={18} />
                <span className="font-medium">Continue with Google</span>
              </button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={onFormChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                disabled={loading}
              />
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={isLogin ? "Password" : "Password (min 8 characters)"}
                  value={formData.password}
                  onChange={onFormChange}
                  required
                  minLength={isLogin ? undefined : 8}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>

              {!isLogin && (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password_confirmation"
                    placeholder="Confirm Password"
                    value={formData.password_confirmation}
                    onChange={onFormChange}
                    required
                    minLength={8}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => onRememberMeChange(e.target.checked)}
                    disabled={loading} 
                  /> 
                  <span>Remember me</span>
                </label>
                {isLogin && onForgotPassword && (
                  <button
                    type="button"
                    className="text-red-600 hover:underline disabled:opacity-50"
                    disabled={loading}
                    onClick={onForgotPassword}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded-lg hover:bg-yellow-500 hover:text-black transition disabled:opacity-50 text-sm sm:text-base font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" size={16} />
                    {isLogin ? 'Please wait...' : 'Creating account...'}
                  </span>
                ) : (isLogin ? 'Login' : 'Sign Up')}
              </button>

              {message.text && (
                <div
                  className={`flex items-center justify-center mt-3 text-sm font-medium p-3 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {message.icon}
                  {message.text}
                </div>
              )}

              <p className="text-center text-xs sm:text-sm mt-4">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  className="text-red-600 hover:underline font-semibold disabled:opacity-50"
                  onClick={isLogin ? onSwitchToSignup : onSwitchToLogin}
                  disabled={loading}
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </form>

            <button
              onClick={onClose}
              className="absolute top-3 right-4 text-black text-xl hover:text-red-600 disabled:opacity-50"
              disabled={loading}
            >
              ×
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ========== FORGOT PASSWORD MODAL COMPONENT ==========
const ForgotPasswordModal = ({
  isOpen,
  onClose,
  step,
  formData,
  onFormChange,
  passwordConfirmation,
  onPasswordConfirmationChange,
  onSubmit,
  loading,
  message,
  showNewPassword,
  showConfirmPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onBackToEmail,
  onSwitchToLogin,
}) => {
  const stepIcons = {
    email: '1',
    otp: '2', 
    reset: '3'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-[90%] max-w-md rounded-2xl p-6 sm:p-8 shadow-xl relative mx-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="text-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-yellow-500">Reset Your Password</h2>
              <div className="flex items-center justify-center mt-2">
                <img src={logo} alt="Logo" className="h-8 w-auto" />
              </div>
              
              {/* Step Indicator */}
              <div className="flex justify-center mt-4 mb-2">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'email' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    {stepIcons.email}
                  </div>
                  <div className={`w-12 h-1 ${step === 'otp' || step === 'reset' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'otp' || step === 'reset' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    {stepIcons.otp}
                  </div>
                  <div className={`w-12 h-1 ${step === 'reset' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'reset' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    {stepIcons.reset}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {step === 'email' && 'Enter your email'}
                {step === 'otp' && 'Enter verification code'}
                {step === 'reset' && 'Set new password'}
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {step === 'email' && (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Enter your email address to receive a verification code.
                  </p>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={onFormChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                    disabled={loading}
                  />
                </>
              )}

              {step === 'otp' && (
                <>
                  <button
                    type="button"
                    onClick={onBackToEmail}
                    className="flex items-center text-sm text-gray-600 hover:text-yellow-500 mb-2"
                  >
                    <FaArrowLeft className="mr-1" size={12} />
                    Back to email
                  </button>
                  <p className="text-sm text-gray-600 text-center">
                    We sent a 6-digit code to <strong>{formData.email}</strong>
                  </p>
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit code"
                    value={formData.otp}
                    onChange={onFormChange}
                    required
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-400 outline-none text-sm text-center tracking-widest text-lg font-mono"
                    disabled={loading}
                  />
                </>
              )}

              {step === 'reset' && (
                <>
                  <button
                    type="button"
                    onClick={onBackToEmail}
                    className="flex items-center text-sm text-gray-600 hover:text-yellow-500 mb-2"
                  >
                    <FaArrowLeft className="mr-1" size={12} />
                    Back to verification
                  </button>
                  <p className="text-sm text-gray-600 text-center">Create your new password</p>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="password"
                      placeholder="New password (minimum 8 characters)"
                      value={formData.password}
                      onChange={onFormChange}
                      required
                      minLength={8}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={onToggleNewPassword}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      disabled={loading}
                    >
                      {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordConfirmation}
                      onChange={(e) => onPasswordConfirmationChange(e.target.value)}
                      required
                      minLength={8}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={onToggleConfirmPassword}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  
                  {formData.password && passwordConfirmation && formData.password !== passwordConfirmation && (
                    <div className="text-red-500 text-xs mt-1 flex items-center p-2 bg-red-50 rounded border border-red-200">
                      <FaTimesCircle className="inline mr-1" /> Passwords do not match
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition disabled:opacity-50 text-sm sm:text-base font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    {step === 'email' ? 'Send Code' :
                     step === 'otp' ? 'Verify Code' : 
                     'Reset Password'}
                  </>
                )}
              </button>

              {message.text && (
                <div
                  className={`flex items-center justify-center mt-3 text-sm font-medium p-3 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {message.icon}
                  {message.text}
                </div>
              )}

              <p className="text-center text-xs sm:text-sm mt-4">
                Remember your password?{' '}
                <button
                  type="button"
                  className="text-red-600 hover:underline font-semibold disabled:opacity-50"
                  onClick={onSwitchToLogin}
                  disabled={loading}
                >
                  Back to Login
                </button>
              </p>
            </form>

            <button
              onClick={onClose}
              className="absolute top-3 right-4 text-black text-xl hover:text-red-600 disabled:opacity-50"
              disabled={loading}
            >
              ×
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
