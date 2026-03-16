// src/components/VerificationModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheck, FaShieldAlt, FaArrowRight, FaArrowLeft, FaTimes, 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard,
  FaVenusMars, FaGlobe, FaCrown, FaStar,
  FaFileAlt, FaCamera, FaCreditCard, FaSpinner
} from 'react-icons/fa';
import { VscPass } from "react-icons/vsc";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { userService } from '../services/userService';

// API Service
const ApiService = {
  baseURL: 'https://loopmart.ng',

  async request(endpoint, method = 'GET', data = null) {
    const token = userService.getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const isFormData = data instanceof FormData;
    let body = null;

    if (method !== 'GET' && method !== 'HEAD') {
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
        body = data ? JSON.stringify(data) : null;
      } else {
        body = data;
      }
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers,
        credentials: 'include',
        body,
      });
      
      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        let errorMessage = `Request failed: ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage += ` - ${errorJson.message || 'Unknown error'}`;
          if (errorJson.errors) {
            const errorMessages = Object.entries(errorJson.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage += ` - ${errorMessages}`;
          }
        } catch {
          errorMessage += ` - ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      try {
        return JSON.parse(responseText);
      } catch {
        throw new Error('Server returned invalid JSON response');
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};

export default function VerificationModal({ isOpen, onClose, user }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || user?.username || '',
    email: user?.email || '',
    gender: '',
    nationality: '',
    phone: '',
    address: '',
    ninFile: null,
    faceImage: null,
    isCameraActive: false,
    capturedImage: null,
    isCameraReady: false,
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // API request function
  const apiRequest = async (endpoint, data, method = 'POST') => {
    return await ApiService.request(endpoint, method, data);
  };

  // Step 2: Submit bio data
  const submitBioData = async () => {
    const bioData = {
      name: formData.name,
      email: formData.email,
      gender: formData.gender,
      nationality: formData.nationality,
      phone_number: formData.phone,
      address: formData.address
    };

    console.log('Sending bio data:', bioData);
    return await apiRequest('/v1/verify/bio', bioData);
  };

  // Step 3: Submit National ID Card document
  const submitDocumentData = async () => {
    if (!formData.ninFile) {
      throw new Error('Please upload a photo of your National ID Card');
    }

    const formDataToSend = new FormData();
    formDataToSend.append('nin_file', formData.ninFile);

    console.log('Sending National ID Card:', {
      fileName: formData.ninFile.name,
      fileSize: formData.ninFile.size,
      fileType: formData.ninFile.type
    });

    return await apiRequest('/v1/verify/nin', formDataToSend);
  };

  // Step 4: Submit face image
  const submitFaceImage = async () => {
    if (!formData.capturedImage) {
      throw new Error('No face image captured');
    }

    const requestData = {
      canvasImage: formData.capturedImage
    };

    console.log('Sending face image:', {
      dataType: 'data_url',
      length: formData.capturedImage.length,
      isBase64: true
    });

    return await apiRequest('/v1/verify/image', requestData);
  };

  // Step 5: Submit badge type
  const submitBadgeType = async () => {
    if (!selectedPlan) {
      throw new Error('No plan selected');
    }

    const badgeFormData = new FormData();
    badgeFormData.append('badge_type', selectedPlan);

    console.log('Sending badge type:', { badge_type: selectedPlan });
    
    return await apiRequest('/v1/verify/badge', badgeFormData);
  };

  // Step 6: Initialize payment
  const initializePayment = async () => {
    if (!selectedPlan) {
      throw new Error('No plan selected');
    }

    console.log('Initializing payment for plan:', selectedPlan);
    
    return await apiRequest(`/v1/payment/init?badge_type=${selectedPlan}`, null, 'GET');
  };

  // Handle next step
  const handleNextStep = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      console.log(`Processing step ${currentStep}`);
      
      switch (currentStep) {
        case 1:
          nextStep();
          break;
        
        case 2:
          const requiredFields = ['name', 'email', 'phone', 'gender', 'nationality', 'address'];
          const missingFields = requiredFields.filter(field => !formData[field]);
          
          if (missingFields.length > 0) {
            throw new Error(`Please fill in: ${missingFields.join(', ')}`);
          }
          
          const bioResponse = await submitBioData();
          console.log('Bio data submitted:', bioResponse);
          
          if (bioResponse.status) {
            setSuccessMessage('Personal information submitted successfully!');
            setTimeout(() => nextStep(), 1500);
          } else {
            throw new Error(bioResponse.message || 'Failed to submit bio data');
          }
          break;
        
        case 3:
          if (!formData.ninFile) {
            throw new Error('Please upload a photo of your National ID Card');
          }

          const docResponse = await submitDocumentData();
          console.log('National ID Card submitted:', docResponse);
          
          if (docResponse.status) {
            setSuccessMessage('ID Card uploaded successfully!');
            setTimeout(() => nextStep(), 1500);
          } else {
            throw new Error(docResponse.message || 'Failed to submit National ID Card');
          }
          break;
        
        case 4:
          if (!formData.capturedImage) {
            throw new Error('Please complete face verification');
          }
          
          const imageResponse = await submitFaceImage();
          console.log('Face image submitted:', imageResponse);
          
          if (imageResponse.status) {
            setSuccessMessage('Face verification completed successfully!');
            setTimeout(() => nextStep(), 1500);
          } else {
            throw new Error(imageResponse.message || 'Failed to submit face image');
          }
          break;
        
        case 5:
          if (!selectedPlan) {
            throw new Error('Please select a verification plan');
          }
          
          const badgeResponse = await submitBadgeType();
          console.log('Badge type submitted:', badgeResponse);
          
          if (badgeResponse.status) {
            setSuccessMessage('Plan selected successfully!');
            setTimeout(() => nextStep(), 1500);
          } else {
            throw new Error(badgeResponse.message || 'Failed to save badge type');
          }
          break;
        
        case 6:
          const paymentResponse = await initializePayment();
          console.log('Payment initialized:', paymentResponse);
          
          const paystackUrl = paymentResponse.paystack_url || paymentResponse.data?.authorization_url;
          
          if (paymentResponse.status && paystackUrl) {
            const paymentData = {
              authorization_url: paystackUrl,
              reference: paymentResponse.data?.reference || new Date().getTime().toString()
            };
            
            setPaymentData(paymentData);
            setSuccessMessage('Payment link generated! Click "Pay Now" to complete.');
            
            console.log('Paystack URL:', paystackUrl);
            
            nextStep();
          } else {
            console.error('Payment initialization failed:', paymentResponse);
            throw new Error(paymentResponse.message || 'Failed to generate payment link. Please try again.');
          }
          break;

        case 7:
          // Payment step - handled by button click
          break;
      }
    } catch (error) {
      console.error('Error in step', currentStep, ':', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 7));
    setError(null);
    setSuccessMessage(null);
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Handle Paystack payment
  const handlePaystackPayment = () => {
    if (paymentData?.authorization_url) {
      window.open(paymentData.authorization_url, '_blank', 'noopener,noreferrer');
      setSuccessMessage('Opening Paystack for secure payment...');
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedPlan(null);
      setIsProcessing(false);
      setError(null);
      setSuccessMessage(null);
      setPaymentData(null);
      setFormData({
        name: user?.name || user?.username || '',
        email: user?.email || '',
        gender: '',
        nationality: '',
        phone: '',
        address: '',
        ninFile: null,
        faceImage: null,
        isCameraActive: false,
        capturedImage: null,
        isCameraReady: false,
      });
      stopCamera();
    }
  }, [isOpen, user?.name, user?.username, user?.email]);

  // Clean up camera
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Camera functions
  const startCamera = async () => {
    try {
      stopCamera();
      setFormData(prev => ({ 
        ...prev, 
        isCameraActive: true, 
        isCameraReady: false,
        capturedImage: null 
      }));

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setFormData(prev => ({ ...prev, isCameraReady: true }));
          });
        };
      }
      
      streamRef.current = stream;
    } catch (err) {
      console.error('Camera error:', err);
      setFormData(prev => ({ ...prev, isCameraActive: false, isCameraReady: false }));
      setError('Unable to access camera. Please check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setFormData(prev => ({ 
      ...prev, 
      isCameraActive: false, 
      isCameraReady: false 
    }));
  };

  const captureImage = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        setFormData(prev => ({ 
          ...prev, 
          capturedImage: imageData,
          faceImage: 'captured',
          isCameraActive: false,
          isCameraReady: false
        }));
        
        stopCamera();
        setSuccessMessage('Face captured successfully!');
      }
    }
  };

  const retakePhoto = () => {
    setFormData(prev => ({ 
      ...prev, 
      capturedImage: null,
      faceImage: null 
    }));
    startCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, JPG, PNG)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, ninFile: file }));
      setSuccessMessage('Document uploaded successfully!');
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const benefits = [
    "Enhanced Trust and Credibility: A verified badge signals to potential buyers that the seller's identity and information have been verified by us.",
    "Increased Visibility: We prioritize verified sellers in search results and featured listings for more exposure and sales opportunities.",
    "Improved Conversion Rates: Buyers are more likely to purchase from sellers they trust, leading to higher conversion rates.",
    "Reduce Risk Of Fraud: Verification processes help weed out fraudulent or untrustworthy sellers.",
    "Access to Premium Features: Exclusive features and benefits including promotional opportunities and dedicated customer support.",
    "Competitive Advantage: Differentiate yourself from competitors and attract more customers.",
    "Long-term Reputation Building: Build a positive reputation leading to repeat business and referrals."
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
              <FaShieldAlt className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
              <p className="text-sm text-gray-600">Step {currentStep} of 7 • Complete your verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes className="text-gray-500 hover:text-gray-700 text-lg" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-black h-2 rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 7) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Error/Success Messages */}
        {(error || successMessage) && (
          <div className="px-6 pt-4 flex-shrink-0">
            <div className={`rounded-xl p-4 ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center">
                {error ? (
                  <>
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-red-600 text-sm font-bold">!</span>
                    </div>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <FaCheck className="text-green-600 text-sm" />
                    </div>
                    <p className="text-green-700 text-sm font-medium">{successMessage}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Benefits Overview */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Verify Your Identity
                  </h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Complete our secure verification process to unlock enhanced marketplace features and build trust with buyers
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-200 hover:border-yellow-400 transition-all duration-300"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FaCheck className="text-yellow-600 text-sm" />
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{benefit}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-5 text-center">
                  <p className="text-yellow-800 font-medium">
                    Join thousands of trusted sellers who have enhanced their marketplace presence with verification
                  </p>
                </div>

                {/* Continue Button */}
                <div className="flex justify-center pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextStep}
                    disabled={isProcessing}
                    className="px-12 py-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 text-black rounded-2xl transition-all duration-300 font-semibold text-lg shadow-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Begin Verification</span>
                        <FaArrowRight className="text-lg" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">Personal Information</h3>
                  <p className="text-gray-600">Provide your basic details for identity verification</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <FaUser className="text-yellow-500" />
                        Full Name *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <FaEnvelope className="text-yellow-500" />
                        Email Address *
                      </span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <FaPhone className="text-yellow-500" />
                        Phone Number *
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <FaVenusMars className="text-yellow-500" />
                        Gender *
                      </span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <FaGlobe className="text-yellow-500" />
                        Nationality *
                      </span>
                    </label>
                    <select
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                      required
                    >
                      <option value="">Select Nationality</option>
                      <option value="nigeria">Nigeria</option>
                      <option value="ghana">Ghana</option>
                      <option value="kenya">Kenya</option>
                      <option value="south-africa">South Africa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-yellow-500" />
                        Address *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                      placeholder="Enter your residential address"
                      required
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> All information provided will be kept confidential and used solely for verification purposes.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: National ID Card Upload */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">National ID Card</h3>
                  <p className="text-gray-600">Upload a clear photo of your National ID Card</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FaIdCard className="text-yellow-500 text-3xl" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-xl mb-2">Upload National ID Card</h4>
                    <p className="text-gray-600">
                      Take a clear photo of the front of your National ID Card
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Ensure all details are visible and the photo is well-lit
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                    <input
                      type="file"
                      id="id-upload"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".png,.jpeg,.jpg"
                      ref={fileInputRef}
                    />
                    <label htmlFor="id-upload" className="cursor-pointer block">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                          <FaFileAlt className="text-gray-600 text-2xl" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900 mb-2">Click to upload</p>
                          <p className="text-gray-500 text-sm">PNG, JPG, JPEG up to 10MB</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {formData.ninFile && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-6"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <FaCheck className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">Document uploaded</p>
                          <p className="text-green-600 text-sm">{formData.ninFile.name}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FaCamera className="text-yellow-500" />
                      <span>Next: Face Verification</span>
                    </h4>
                    <p className="text-gray-700 text-sm">
                      After uploading your ID, we'll verify your face matches the photo on the ID
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Face Capture */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center px-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Face Verification</h3>
                  <p className="text-gray-600 text-sm md:text-base">Verify that you match your ID document</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-200 mx-2 md:mx-0">
                  {!formData.isCameraActive && !formData.capturedImage ? (
                    <div className="text-center space-y-4 md:space-y-6">
                      <div className="w-40 h-40 md:w-48 md:h-48 mx-auto">
                        <div className="w-full h-full border-4 border-dashed border-yellow-500 rounded-full flex items-center justify-center bg-white shadow-lg">
                          <FaCamera className="text-gray-400 text-4xl md:text-5xl" />
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm md:text-base">Ready to capture your photo</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startCamera}
                        disabled={isProcessing}
                        className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 text-black rounded-2xl transition-all duration-300 font-semibold text-base md:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaCamera className="inline mr-2" />
                        Start Camera
                      </motion.button>
                    </div>
                  ) : formData.isCameraActive ? (
                    <div className="text-center space-y-4 md:space-y-6">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-48 h-48 md:w-56 md:h-56">
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover rounded-full border-4 border-yellow-500 bg-black shadow-lg"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                          {!formData.isCameraReady && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <div className="text-white text-center">
                                <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-white mx-auto mb-2 md:mb-3"></div>
                                <p className="text-sm md:text-base">Initializing camera...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={captureImage}
                          disabled={!formData.isCameraReady || isProcessing}
                          className={`px-6 py-3 md:px-8 md:py-4 rounded-2xl font-semibold text-base md:text-lg shadow-lg transition-all duration-300 ${
                            formData.isCameraReady 
                              ? 'bg-green-500 text-white hover:bg-green-600' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <FaCamera className="inline mr-2" />
                          Capture Photo
                        </motion.button>
                        <button
                          onClick={stopCamera}
                          disabled={isProcessing}
                          className="px-6 py-3 md:px-8 md:py-4 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition-all duration-300 font-semibold text-base md:text-lg disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : formData.capturedImage ? (
                    <div className="flex flex-col items-center space-y-4 md:space-y-6">
                      <div className="relative w-48 h-48 md:w-56 md:h-56">
                        <img
                          src={formData.capturedImage}
                          alt="Captured face"
                          className="w-full h-full object-cover rounded-full border-4 border-green-500 shadow-lg"
                        />
                      </div>
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 rounded-2xl p-4 max-w-md w-full"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FaCheck className="text-green-600 text-lg md:text-xl" />
                          </div>
                          <span className="font-semibold text-green-800 text-sm md:text-base">Face captured successfully!</span>
                        </div>
                      </motion.div>

                      <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 w-full max-w-xs">
                        <button
                          onClick={retakePhoto}
                          disabled={isProcessing}
                          className="px-6 py-3 md:px-8 md:py-4 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition-all duration-300 font-semibold text-base md:text-lg disabled:opacity-50"
                        >
                          Retake Photo
                        </button>
                        <button
                          onClick={handleNextStep}
                          disabled={isProcessing}
                          className="px-6 py-3 md:px-8 md:py-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all duration-300 font-semibold text-base md:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <>
                              <FaSpinner className="animate-spin inline mr-2" />
                              Processing...
                            </>
                          ) : (
                            'Continue'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}

            {/* Step 5: Plan Selection */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">Select Verification Plan</h3>
                  <p className="text-gray-600">Choose the plan that best suits your needs</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Plan */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`relative rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer ${
                      selectedPlan === 'monthly' 
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg' 
                        : 'border-gray-300 bg-white hover:border-yellow-400'
                    }`}
                    onClick={() => handlePlanSelect('monthly')}
                  >
                    {selectedPlan === 'monthly' && (
                      <div className="absolute -top-3 -right-3">
                        <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                          <IoMdCheckmarkCircleOutline />  
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FaStar className="text-gray-600 text-xl" />
                      </div>
                      <h4 className="font-bold text-xl mb-2">Monthly</h4>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">₦2,500</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-6">
                        <div className="flex items-center gap-2">
                          <FaCheck className="text-green-500" />
                          <span>Basic verification badge</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCheck className="text-green-500" />
                          <span>Standard visibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCheck className="text-green-500" />
                          <span>Email support</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Yearly Plan */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`relative rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer ${
                      selectedPlan === 'yearly' 
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg' 
                        : 'border-yellow-400 bg-white hover:border-yellow-500'
                    }`}
                    onClick={() => handlePlanSelect('yearly')}
                  >
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-yellow-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow">
                        RECOMMENDED
                      </div>
                    </div>
                    {selectedPlan === 'yearly' && (
                      <div className="absolute -top-3 -right-3">
                        <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                          <IoMdCheckmarkCircleOutline />  
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="w-14 h-14 bg-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FaCrown className="text-white text-xl" />
                      </div>
                      <h4 className="font-bold text-xl mb-2">Annual</h4>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">₦20,000</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      <div className="bg-green-100 text-green-700 text-xs font-semibold py-2 rounded-xl mb-4">
                        Save ₦10,000 annually
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-6">
                        <div className="flex items-center gap-2">
                          <FaCheck className="text-green-500" />
                          <span>Premium verification badge</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCheck className="text-green-500" />
                          <span>Enhanced visibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCheck className="text-green-500" />
                          <span>Priority support</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCheck className="text-green-500" />
                          <span>Featured placement</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Payment Link Generation */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center px-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Payment Link Generated</h3>
                  <p className="text-gray-600 text-sm md:text-base">Your secure payment link is ready</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 rounded-2xl p-4 md:p-6 mx-2 md:mx-0">
                  <div className="text-center mb-4 md:mb-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FaCreditCard className="text-yellow-500 text-2xl md:text-3xl" />
                    </div>
                    
                    <div className="mb-4 md:mb-6">
                      <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        ₦{selectedPlan === 'monthly' ? '2,500' : '20,000'}
                      </div>
                      <div className="text-gray-600 text-sm md:text-base">
                        {selectedPlan === 'monthly' ? 'Monthly Verification Plan' : 'Annual Verification Plan'}
                      </div>
                      {selectedPlan === 'yearly' && (
                        <div className="text-green-600 text-xs md:text-sm font-semibold mt-2">
                          Save ₦10,000 with annual plan!
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 mb-4">
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm md:text-base">Email:</span>
                          <span className="font-semibold text-sm md:text-base truncate ml-2">{formData.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm md:text-base">Name:</span>
                          <span className="font-semibold text-sm md:text-base truncate ml-2">{formData.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm md:text-base">Plan:</span>
                          <span className="font-semibold text-sm md:text-base capitalize">{selectedPlan}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs md:text-sm text-gray-500 px-2">
                    <p>Click "Continue to Payment" to proceed to Paystack for secure payment</p>
                    <p className="text-xs mt-1">Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 7: Paystack Payment */}
            {currentStep === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-28 h-28 bg-black rounded-3xl flex items-center justify-center mx-auto shadow-2xl"
                >
                  <FaCreditCard className="text-white text-5xl" />
                </motion.div>
                
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-gray-900">
                    Complete Payment
                  </h3>
                  
                  <p className="text-gray-600 max-w-md mx-auto">
                    Click the button below to complete your payment securely through Paystack
                  </p>

                  <div className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 max-w-md mx-auto">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        ₦{selectedPlan === 'monthly' ? '2,500' : '20,000'}
                      </div>
                      <div className="text-gray-600">
                        {selectedPlan === 'monthly' ? 'Monthly Plan' : 'Annual Plan'}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePaystackPayment}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold text-lg shadow-lg"
                    >
                      Pay with Paystack
                    </motion.button>

                    <p className="text-sm text-gray-500 mt-4">
                      Secure payment powered by Paystack
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-5 border border-yellow-200 max-w-md mx-auto">
                    <p className="text-yellow-800 text-sm">
                      After payment, your verification will be processed within 1-2 business days
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {currentStep !== 1 && currentStep !== 7 && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={prevStep}
              disabled={isProcessing || currentStep === 2}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaArrowLeft />
              Back
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNextStep}
              disabled={isProcessing || (currentStep === 5 && !selectedPlan)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 text-black hover:from-yellow-600 hover:to-black/90 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {isProcessing ? (
                  <>
                    <FaSpinner className="animate-spin inline mr-2" />
                    Processing...
                  </>
                ) : currentStep === 6 ? 'Continue to Payment' : 'Continue'}
              </span>
              {!isProcessing && <FaArrowRight />}
            </motion.button>
          </div>
        )}

        {currentStep === 7 && (
          <div className="flex justify-center p-6 border-t border-gray-200 bg-white flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-8 py-4 bg-black text-white rounded-2xl hover:from-yellow-600 hover:to-black/90 transition-all duration-300 font-semibold text-lg shadow-lg"
            >
              Return to Dashboard
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
