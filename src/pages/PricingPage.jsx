// src/pages/PricingPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaCheck, FaStore, FaCalendarAlt, FaCrown, 
  FaShieldAlt, FaHeadset, FaGlobe, FaCreditCard,
  FaUsers, FaStar, FaRocket, FaShoppingCart,
  FaMoneyBillWave, FaHandshake, FaChartLine,
  FaTimesCircle, FaBuilding, FaEye, FaMedal,
  FaLock, FaTrophy, FaArrowRight, FaPercent,
  FaBolt, FaArrowLeft, FaSpinner, FaTimes
} from 'react-icons/fa';
import { MdAttachMoney, MdTrendingUp } from 'react-icons/md';
import { IoIosBusiness } from 'react-icons/io';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useToast } from '../contexts/ToastContext';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'https://loopmart.ng/api';

const vendorPlans = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: '₦1,000',
    period: 'month',
    interval: 'monthly',
    description: 'Flexible monthly subscription for growing businesses',
    features: [
      { text: 'Dedicated online shop on LoopMart', icon: IoIosBusiness },
      { text: 'Unlimited product & service listings', icon: FaShoppingCart },
      { text: 'Professional product gallery', icon: FaGlobe },
      { text: 'Direct buyer communication channel', icon: FaHandshake },
      { text: 'Marketplace visibility', icon: FaEye },
      { text: 'Standard customer support', icon: FaHeadset },
    ],
    cta: 'Start Monthly Plan',
    popular: false,
    highlight: 'Flexible monthly billing. Cancel anytime.',
    durationDays: 30,
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: '₦10,000',
    period: 'year',
    interval: 'yearly',
    description: 'Annual plan with maximum savings & benefits',
    features: [
      { text: 'All Monthly Plan features', icon: FaCheck },
      { text: 'Save ₦2,000 (2 months free)', icon: FaPercent },
      { text: 'Priority search visibility', icon: MdTrendingUp },
      { text: 'Verified seller badge', icon: FaMedal },
      { text: 'Enhanced shop customization', icon: FaBuilding },
      { text: 'Priority customer support', icon: FaBolt },
    ],
    cta: 'Choose Yearly Plan',
    popular: true,
    highlight: 'Best Value - Save 17% + premium features',
    durationDays: 365,
  },
];

const faqs = [
  {
    question: 'How does LoopMart differ from traditional marketplaces?',
    answer: 'LoopMart focuses on direct vendor-buyer connections without handling payments. You maintain full control over transactions while we provide the platform and visibility.',
  },
  {
    question: 'Can I list both products and services?',
    answer: 'Absolutely. Our platform supports listing physical products, digital goods, and professional services with customizable categories and pricing models.',
  },
  {
    question: 'What payment methods are available for vendors?',
    answer: 'You handle payments directly with buyers using your preferred methods (bank transfer, mobile money, cash). LoopMart doesn\'t process payments, so you receive funds immediately.',
  },
  {
    question: 'How quickly can I upgrade or downgrade my plan?',
    answer: 'Plan changes are instant. Downgrades take effect at your next billing cycle, while upgrades are applied immediately with prorated billing.',
  },
  {
    question: 'Do you offer bulk listing capabilities?',
    answer: 'Yes, all plans include bulk CSV upload functionality for efficient product management, with enhanced capabilities for annual subscribers.',
  },
  {
    question: 'Is there a setup fee or hidden charges?',
    answer: 'No hidden fees. Your subscription covers all platform features. We\'re transparent about pricing to help you budget effectively.',
  },
];

const features = [
  {
    title: 'Direct Commerce Platform',
    description: 'Connect directly with buyers while maintaining full control over pricing and transactions.',
    icon: FaHandshake,
  },
  {
    title: 'Brand Building Tools',
    description: 'Customizable shop profiles that help establish and grow your brand identity.',
    icon: FaBuilding,
  },
  {
    title: 'Secure & Verified',
    description: 'Enterprise-grade security with verified seller profiles for increased buyer trust.',
    icon: FaShieldAlt,
  },
  {
    title: 'Advanced Analytics',
    description: 'Insightful dashboard showing visitor trends, engagement metrics, and performance data.',
    icon: FaChartLine,
  },
  {
    title: 'Growth Optimization',
    description: 'Tools and features designed to help scale your business efficiently.',
    icon: MdTrendingUp,
  },
  {
    title: 'Premium Support',
    description: 'Dedicated support channels with faster response times for business-critical issues.',
    icon: FaHeadset,
  },
];

// Payment Modal Component
const PaymentModal = ({ isOpen, onClose, plan, onConfirm, processing }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-black">Confirm Subscription</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className={`p-4 rounded-lg ${plan?.popular ? 'bg-yellow-50' : 'bg-gray-50'} mb-4`}>
            <div className="flex items-center gap-3 mb-2">
              {plan?.popular ? <FaCrown className="text-yellow-600" /> : <FaStore className="text-black" />}
              <h4 className="text-xl font-bold">{plan?.name}</h4>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black">{plan?.price}</span>
              <span className="text-gray-500">/{plan?.period}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-gray-700">You'll get:</h5>
            {plan?.features.slice(0, 3).map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                <span className="text-gray-600">{feature.text}</span>
              </div>
            ))}
            <p className="text-sm text-gray-500 mt-2">...and {plan?.features.length - 3} more features</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You'll be redirected to Paystack to complete your payment securely.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={processing}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${
              plan?.popular
                ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                : 'bg-black text-white hover:bg-gray-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              `Proceed to Payment`
            )}
          </button>
          <button
            onClick={onClose}
            disabled={processing}
            className="w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Login Modal Component
const LoginPromptModal = ({ isOpen, onClose, onLogin, onSignup }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-black">Login Required</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={24} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          You need to be logged in to subscribe to a plan. Please login or create an account to continue.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onLogin();
              // Optional: Add toast when they click
              toast?.info('Redirecting to login page...');
            }}
            className="w-full py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition"
          >
            Login to Your Account
          </button>
          <button
            onClick={() => {
              onSignup();
              // Optional: Add toast when they click
              toast?.info('Redirecting to signup page...');
            }}
            className="w-full py-3 border-2 border-black text-black font-bold rounded-lg hover:bg-gray-50 transition"
          >
            Create New Account
          </button>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 mt-2"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export default function PricingPage() {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  
  // Use the subscription context
  const { hasSubscription, setSubscription, checkSubscription } = useSubscription();

  // Check subscription status on page load
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Helper to get auth token
  const getToken = () => {
    return localStorage.getItem('loopmart_token') || localStorage.getItem('auth_token');
  };

  // Helper to get user data
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('loopmart_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const scrollToPlans = () => {
    document.getElementById('pricing-plans')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  // Check if user is logged in
  const isUserLoggedIn = () => {
    const token = getToken();
    const user = getUserData();
    return !!token && !!user;
  };

  const handlePlanSelection = (plan) => {
  setSelectedPlan(plan);
  
  // Check if user is logged in
  if (!isUserLoggedIn()) {
    setShowLoginModal(true);
    // Add toast with navigation
    toast?.warning('Please login to subscribe to a plan', 5000, { 
      path: '/login',
      label: 'Login now'
    });
  } else {
    setShowPaymentModal(true);
  }
};

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    
    setProcessingPlan(selectedPlan.id);
    
    try {
      const token = getToken();
      
     if (!token) {
  toast?.error('Authentication failed. Please login again.', 5000, { 
    path: '/login',
    label: 'Login now'
  });
  setShowPaymentModal(false);
  setShowLoginModal(true);
  return;
}

      console.log('🔍 Selected Plan:', selectedPlan);
      console.log('📦 Interval value:', selectedPlan.interval);
      console.log('📦 Plan name:', selectedPlan.name);
      console.log('📦 Plan ID:', selectedPlan.id);

      // Make sure interval exists
      if (!selectedPlan.interval) {
        toast?.error('Invalid plan selected. Missing interval.');
        setProcessingPlan(null);
        return;
      }

      // Prepare request body
      const requestBody = {
        interval: selectedPlan.interval // This should be 'monthly' or 'yearly'
      };
      
      console.log('📤 Sending request to:', `${API_URL}/v1/subscription`);
      console.log('📤 Request body:', requestBody);
      console.log('🔑 Token exists:', !!token);

      // Call the subscription API with 'interval' field
      const response = await fetch(`${API_URL}/v1/subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📥 Full API Response:', data);

      if (data.status && data.data?.authorization_url) {
        // Success - subscription initialized, redirect to Paystack
        toast?.success('Transaction initialized! Redirecting to payment...');
        
        // Close modal
        setShowPaymentModal(false);
        
        // Redirect to Paystack checkout
        window.location.href = data.data.authorization_url;
        
      } else {
        // Handle API error
        const errorMessage = data.message || data.error || 'Failed to initialize subscription. Please try again.';
        console.error('❌ API Error:', errorMessage, data);
        toast?.error(errorMessage);
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error('❌ Network/Subscription error:', error);
      toast?.error('Network error. Please check your connection and try again.');
      setShowPaymentModal(false);
    } finally {
      setProcessingPlan(null);
      setSelectedPlan(null);
    }
  };

 const handleStartSelling = () => {
  // First check if user is subscribed
  const isSubscribed = hasSubscription || checkSubscription();
  
  if (isSubscribed) {
    // If subscribed, go to start selling page
    navigate('/start-selling');
  } else {
    // If not subscribed, stay on pricing page and scroll to plans
    scrollToPlans();
    toast?.info('Please subscribe to a plan to start selling!', 5000, { 
      path: '/pricing#pricing-plans',
      label: 'View plans'
    });
  }
};

  // Fetch subscription status on mount
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      const token = getToken();
      if (!token) return;
      
      try {
        const response = await fetch(`${API_URL}/v1/subscription`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('📥 Subscription status response:', data);
        
        if (data.status && data.data) {
          // Update subscription context with data from API
          if (data.data.active) {
            const expiryDate = new Date(data.data.expires_at);
            setSubscription(true, expiryDate);
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };
    
    fetchSubscriptionStatus();
  }, [setSubscription]);

  // Subscription Status Banner (if already subscribed)
  const SubscriptionStatusBanner = () => {
    if (!hasSubscription) return null;
    
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaCheck className="text-green-500 text-xl" />
            <div>
              <h3 className="font-bold text-green-800">You have an active subscription!</h3>
              <p className="text-sm text-green-600">You can start selling right away.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/start-selling')}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
          >
            Go to Start Selling
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Login Modal */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setSelectedPlan(null);
        }}
        onLogin={() => {
          setShowLoginModal(false);
          navigate('/login?redirect=pricing');
        }}
        onSignup={() => {
          setShowLoginModal(false);
          navigate('/signup?redirect=pricing');
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onConfirm={handleConfirmPayment}
        processing={processingPlan === selectedPlan?.id}
      />

      {/* Header with Logo */}
      <div className="py-4 border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={logo} 
                alt="LoopMart Logo" 
                className="h-10 w-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
            </div>
            
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full mb-6">
              <span className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                <FaRocket className="text-yellow-600" />
                GROW YOUR BUSINESS ONLINE
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight">
              Professional E-Commerce
              <span className="block text-yellow-600 mt-2">
                Without the Complexity
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              LoopMart provides enterprise-grade online selling infrastructure. 
              Focus on your business while we handle the platform, visibility, and connections.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={scrollToPlans}
                className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                View Pricing Plans
                <FaArrowRight />
              </button>
              
              <button
                onClick={handleStartSelling}
                className="px-8 py-3 border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-300"
              >
                {hasSubscription ? 'Start Selling Now' : 'Get Started'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pricing Plans Section */}
      <div id="pricing-plans" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Choose the plan that aligns with your business goals. Both include 
              our core platform features with varying levels of premium benefits.
            </p>
          </motion.div>
        </div>

        {/* Show subscription status if active */}
        <SubscriptionStatusBanner />

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {vendorPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`relative rounded-2xl overflow-hidden border transition-transform duration-300 hover:scale-[1.02] ${
                plan.popular 
                  ? 'shadow-xl border-yellow-400' 
                  : 'shadow-md border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="px-6 py-2 bg-yellow-500 text-black text-sm font-bold rounded-full shadow-lg flex items-center gap-2">
                    <FaCrown />
                    RECOMMENDED
                  </div>
                </div>
              )}
              
              <div className="p-8 bg-white">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-black">{plan.name}</h3>
                      <p className="text-gray-600 mt-1 text-sm">{plan.description}</p>
                    </div>
                    <div className={`p-3 rounded-full ${
                      plan.popular ? 'bg-yellow-500 text-black' : 'bg-black text-white'
                    } shadow-sm`}>
                      {plan.popular ? (
                        <FaTrophy className="text-xl" />
                      ) : (
                        <FaStore className="text-xl" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-black">{plan.price}</span>
                      <span className="ml-2 text-gray-500">/{plan.period}</span>
                    </div>
                    {plan.highlight && (
                      <p className={`mt-2 text-sm font-medium ${
                        plan.popular ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        {plan.highlight}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handlePlanSelection(plan)}
                    disabled={hasSubscription}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${
                      hasSubscription
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : plan.popular
                          ? 'bg-yellow-500 text-black hover:bg-yellow-600 shadow-md hover:shadow-lg'
                          : 'bg-black text-white hover:bg-gray-900 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {hasSubscription ? 'Already Subscribed' : plan.cta}
                  </button>
                </div>
                
                <div className="border-t border-gray-100 pt-8">
                  <h4 className="text-lg font-semibold text-black mb-6 flex items-center gap-2">
                    <FaCheck className="text-green-500" />
                    Included Features
                  </h4>
                  <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <div className="flex-shrink-0 mt-1 text-yellow-500">
                          <feature.icon className="text-lg" />
                        </div>
                        <span className="ml-3 text-gray-700">
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Value Proposition Section */}
      <div className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Professional Vendors Choose LoopMart
            </h2>
            <p className="text-gray-300 max-w-3xl mx-auto text-lg">
              Our platform is designed for serious businesses looking to establish 
              and grow their online presence with minimal friction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-yellow-500/30 transition-colors duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
                  <FaCheck className="text-green-400 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-white">Our Value Proposition</h3>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <FaStore className="text-yellow-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Complete E-Commerce Platform</h4>
                    <p className="text-gray-300">Full-featured online shop without technical complexity</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FaHandshake className="text-yellow-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Direct Business Relationships</h4>
                    <p className="text-gray-300">Build lasting customer connections with full transaction control</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <MdTrendingUp className="text-yellow-400 mt-1 mr-3 flex-shrink-0 text-xl" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Growth Infrastructure</h4>
                    <p className="text-gray-300">Scalable tools designed for business expansion</p>
                  </div>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-red-500/30 transition-colors duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
                  <FaTimesCircle className="text-red-400 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-white">What We're Not</h3>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <FaCreditCard className="text-red-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Not a Payment Processor</h4>
                    <p className="text-gray-300">We don't handle transactions or collect fees on your sales</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <MdAttachMoney className="text-red-400 mt-1 mr-3 flex-shrink-0 text-xl" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Not a Middleman</h4>
                    <p className="text-gray-300">No commission fees or hidden charges on your revenue</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FaLock className="text-yellow-400 mt-1 mr-3 flex-shrink-0" />
                  <div className="bg-gray-800 rounded-xl p-4 mt-2 border border-gray-700">
                    <p className="text-white font-medium">
                      💡 You maintain complete financial control. Buyers pay you directly, 
                      and you receive 100% of your sales revenue.
                    </p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enterprise Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
            Professional-Grade Features
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Tools and capabilities designed for serious business growth
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-white p-8 rounded-2xl border border-gray-200 hover:border-yellow-300 hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl ${
                index % 2 === 0 ? 'bg-yellow-50' : 'bg-gray-50'
              } flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border ${
                index % 2 === 0 ? 'border-yellow-100' : 'border-gray-100'
              }`}>
                <feature.icon className={`text-2xl ${
                  index % 2 === 0 ? 'text-yellow-600' : 'text-black'
                }`} />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-white rounded-full mb-6 shadow-sm border border-gray-200">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FaHeadset className="text-yellow-600" />
                SUPPORT & GUIDANCE
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Clear answers to help you make informed decisions about your business
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200 hover:border-yellow-200"
              >
                <button
                  onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  aria-expanded={activeFAQ === index}
                >
                  <span className="text-lg font-semibold text-black pr-8">{faq.question}</span>
                  <span className={`text-gray-500 text-xl transition-transform duration-300 ${activeFAQ === index ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {activeFAQ === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-black py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center px-4 py-2 bg-yellow-500/20 rounded-full mb-8 border border-yellow-500/30">
              <span className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
                <FaBolt />
                READY TO ELEVATE YOUR BUSINESS
              </span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {hasSubscription ? 'Continue Your Professional Journey' : 'Start Your Professional Online Journey Today'}
            </h2>
            
            <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
              {hasSubscription 
                ? 'Your subscription is active. Start listing products and growing your business right now!'
                : 'Join thousands of successful vendors who trust LoopMart for their online business infrastructure. No technical skills required.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleStartSelling}
                className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition-all duration-300 text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3 border border-yellow-600"
              >
                <FaStore />
                {hasSubscription ? 'Go to Start Selling' : 'Create Your Professional Shop'}
                <FaArrowRight />
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-transparent border-2 border-yellow-500 text-yellow-500 font-bold rounded-lg hover:bg-yellow-500/10 transition-all duration-300 text-lg"
              >
                Schedule Business Consultation
              </button>
            </div>
            
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">No Setup Fee</div>
                <div className="text-sm text-gray-400">Start instantly</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">30-Day Trial</div>
                <div className="text-sm text-gray-400">Risk-free start</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7 Support</div>
                <div className="text-sm text-gray-400">Always available</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
