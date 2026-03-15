// pages/CategoriesSection.jsx - Frontend Randomization
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, MapPin, X, ChevronDown,
  ArrowRight, Store, Info, Filter, CheckCircle
} from "lucide-react";
import { FaFilter } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useSubscription } from '../contexts/SubscriptionContext';
import logo from '../assets/logo.png';
import ReviewPromptModal from './ReviewPromptModal';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://loopmart.ng/api';

// Categories data
const categories = [
  { name: "Gadgets", img: "/images/category 1.png" },
  { name: "Vehicles", img: "/images/category 2.png" },
  { name: "Houses", img: "/images/category 3.png" },
  { name: "Fashion", img: "/images/category 4.png" },
  { name: "Jobs", img: "/images/category 5.png" },
  { name: "Cosmetics", img: "/images/category 6.png" },
  { name: "Fruits", img: "/images/category 7.png" },
  { name: "Kitchen Utensils", img: "/images/category 8.png" },
  { name: "Others", color: "bg-yellow-400" },
];

// Nigerian states
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara"
];

// Helper functions
const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/300x200?text=No+Image";
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_URL.replace('/api', '')}/uploads/products/${imagePath}`;
};

const getConditionBadgeColor = (condition) => {
  const conditionLower = (condition || '').toLowerCase();
  switch (conditionLower) {
    case "new": return "bg-green-100 text-green-800";
    case "fairly used": return "bg-blue-100 text-blue-800";
    case "used": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

// Toast notification helper
const showToast = (type, message, title, action = null) => {
  window.dispatchEvent(new CustomEvent('show-toast', {
    detail: {
      type,
      message,
      title,
      duration: 5000,
      action
    }
  }));
};

// Get user data from storage
const getUserData = () => {
  try {
    const userData = localStorage.getItem('loopmart_user');
    const token = localStorage.getItem('loopmart_token');
    
    if (!userData || !token) return null;
    
    return {
      ...JSON.parse(userData),
      token
    };
  } catch (e) {
    console.error('Error getting user data:', e);
    return null;
  }
};

// Fisher-Yates shuffle algorithm for randomizing array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Product Card Component
const ProductCard = ({ product, onProductClick, onConnectClick, isConnecting = false }) => {
  const hasPromo = product.actual_price && product.promo_price;
  const [isHovered, setIsHovered] = useState(false);
  const isSold = product.sold && product.sold !== "0";

  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 hover:scale-105 bg-white cursor-pointer relative"
      onClick={() => onProductClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-700 hover:scale-110"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
          }}
          loading="lazy"
        />

        <span className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getConditionBadgeColor(product.condition)}`}>
          {product.condition}
        </span>

        {hasPromo && (
          <span className="absolute bottom-2 left-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
            Sale
          </span>
        )}

        {isSold && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg transform rotate-12">
              SOLD
            </div>
          </div>
        )}

        {!isSold && (
          <div className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-all duration-500 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <button
              onClick={(e) => onConnectClick(e, product)}
              disabled={isConnecting}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                'Connect'
              )}
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-red-600 transition-colors duration-300">
          {product.name}
        </h4>

        {product.seller_verified && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105">
              <MdVerified size={10} />
              <span>Verified Seller</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {hasPromo && <span className="text-gray-400 text-sm line-through">{product.actual_price}</span>}
            <span className="text-lg font-bold text-red-600">{isSold ? "SOLD" : product.price}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin size={12} />
              {product.location}
            </span>
            {product.seller_verified && (
              <MdVerified size={14} className="text-green-500" title="Verified Seller" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Product Card Component
const MobileProductCard = ({ product, onProductClick, onConnectClick, isConnecting = false }) => {
  const hasPromo = product.actual_price && product.promo_price;
  const isSold = product.sold && product.sold !== "0";

  return (
    <div
      className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-500 active:scale-95 cursor-pointer"
      onClick={() => onProductClick(product)}
    >
      <div className="relative w-full h-48 overflow-hidden">
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="w-full h-full object-cover rounded-t-lg transition-transform duration-700 hover:scale-110"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
          }}
          loading="lazy"
        />

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionBadgeColor(product.condition)}`}>
            {product.condition}
          </span>
        </div>

        {hasPromo && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
            Sale
          </span>
        )}

        {isSold && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg transform rotate-12">
              SOLD
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-red-600 transition-colors duration-300 text-base">
          {product.name}
        </h4>

        {product.seller_verified && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105">
              <MdVerified size={10} />
              <span>Verified Seller</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center gap-2">
            {hasPromo && <span className="text-gray-400 text-sm line-through">{product.actual_price}</span>}
            <span className="text-lg font-bold text-red-600">{isSold ? "SOLD" : product.price}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin size={12} />
              {product.location}
            </span>
            {product.seller_verified && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <MdVerified size={12} />
                <span>Verified</span>
              </div>
            )}
          </div>
        </div>

        {!isSold && (
          <button
            onClick={(e) => onConnectClick(e, product)}
            disabled={isConnecting}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Info size={16} />
                Connect with Seller
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Subscription Status Banner Component
const SubscriptionStatusBanner = ({ hasSubscription, onSubscribe }) => {
  if (hasSubscription) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-500" size={20} />
          <div className="flex-1">
            <p className="text-green-800 font-medium">
              You have an active subscription! You can list products for sale.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Info className="text-yellow-500" size={20} />
          <div>
            <p className="text-yellow-800 font-medium">
              Subscription required to list products for sale
            </p>
            <p className="text-sm text-yellow-600">
              You can still browse and connect with sellers for free!
            </p>
          </div>
        </div>
        <button
          onClick={onSubscribe}
          className="px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition-all duration-300 whitespace-nowrap"
        >
          Become a Seller
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function CategoriesSection() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  // Subscription context
  const { hasSubscription, checkSubscription, loading: subscriptionLoading } = useSubscription();

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState("Location");
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState([]); // Store ALL products
  const [displayedProducts, setDisplayedProducts] = useState([]); // Store randomized 48 products
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filters, setFilters] = useState({
    condition: "All",
    verifiedSeller: false,
  });
  const [loading, setLoading] = useState(true);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isConnecting, setIsConnecting] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [connectedProduct, setConnectedProduct] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Add ref to track if initial fetch is done
  const initialFetchDone = useRef(false);

  // Check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Function to get random products from all products
  const getRandomProducts = useCallback((products, count = 48) => {
    if (!products || products.length === 0) return [];
    
    // Shuffle the array and take first 'count' items
    const shuffled = shuffleArray(products);
    return shuffled.slice(0, Math.min(count, products.length));
  }, []);

  // Fetch ALL products
  const fetchAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching all products...');
      
      const response = await fetch(`${API_URL}/allproduct`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different response formats based on your updated backend
      let productsArray = [];
      if (data.data && Array.isArray(data.data)) {
        productsArray = data.data;
        setTotalProducts(data.total || productsArray.length);
      } else if (Array.isArray(data)) {
        productsArray = data;
        setTotalProducts(productsArray.length);
      } else if (data.products && Array.isArray(data.products)) {
        productsArray = data.products;
        setTotalProducts(data.total || productsArray.length);
      }
      
      console.log(`Total products fetched: ${productsArray.length}`);
      
      // Transform the products
      const transformedProducts = productsArray.map((item) => {
        // Parse image URL
        let imageUrl = "";
        try {
          if (item.image_url) {
            if (typeof item.image_url === 'string' && item.image_url.startsWith('[')) {
              const parsed = JSON.parse(item.image_url);
              if (Array.isArray(parsed) && parsed.length > 0) {
                imageUrl = parsed[0];
              }
            } else {
              imageUrl = item.image_url;
            }
          } else if (item.image) {
            imageUrl = item.image;
          } else if (item.photo) {
            imageUrl = item.photo;
          }
        } catch (error) {
          imageUrl = item.image_url || item.image || item.photo || "";
        }

        // Map category
        let category = "Others";
        if (item.category_id) {
          const categoryMap = {
            "1": "Gadgets", "2": "Vehicles", "3": "Houses", "4": "Fashion",
            "5": "Jobs", "6": "Cosmetics", "7": "Fruits", "8": "Kitchen Utensils"
          };
          category = categoryMap[item.category_id] || "Others";
        } else {
          category = item.category || item.product_category || "Others";
        }

        const actualPrice = item.actual_price ? parseFloat(item.actual_price) : 0;
        const promoPrice = item.promo_price ? parseFloat(item.promo_price) : null;
        const hasPromo = promoPrice && promoPrice < actualPrice;
        const productId = item.product_id || item.id;

        return {
          id: productId,
          name: item.title || item.name || item.product_name || "Unnamed Product",
          price: item.ask_for_price ? "Contact Seller" : (hasPromo ? `₦${promoPrice?.toLocaleString()}` : `₦${actualPrice.toLocaleString()}`),
          actual_price: actualPrice > 0 ? `₦${actualPrice.toLocaleString()}` : "",
          promo_price: promoPrice ? `₦${promoPrice?.toLocaleString()}` : "",
          condition: item.condition || "Others",
          category,
          image: imageUrl,
          seller_verified: item.badge_status === "1" || item.verify_status === "1" || false,
          location: item.location || item.product_location || "Unknown",
          ask_for_price: item.ask_for_price || false,
          description: item.description || item.product_description || "",
          seller_id: item.seller_id || item.user_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          sold: item.sold || "0"
        };
      });

      setAllProducts(transformedProducts);
      
      // Get random 48 products for display
      const randomProducts = getRandomProducts(transformedProducts, 48);
      setDisplayedProducts(randomProducts);
      setFilteredProducts(randomProducts);
      
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast('error', 'Failed to load products. Please refresh the page.', 'Error');
    } finally {
      setLoading(false);
    }
  }, [getRandomProducts]);

  // Initial fetch - only once
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchAllProducts();
      initialFetchDone.current = true;
    }
  }, [fetchAllProducts]);

  // Function to refresh/randomize products
  const refreshProducts = useCallback(() => {
    if (allProducts.length > 0) {
      const newRandomProducts = getRandomProducts(allProducts, 48);
      setDisplayedProducts(newRandomProducts);
      
      // Apply current filters to the new random set
      const filtered = applyFilters(newRandomProducts, selectedCategory, filters, selectedState);
      setFilteredProducts(filtered);
      
      showToast('info', 'Products refreshed! Showing new random selection.', 'Refreshed');
    }
  }, [allProducts, getRandomProducts, selectedCategory, filters, selectedState]);

  // Apply filters to products
  const applyFilters = useCallback((productsToFilter, category, filterState, location) => {
    let filtered = [...productsToFilter];

    if (category !== "All") {
      filtered = filtered.filter(product =>
        product.category.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(product.category.toLowerCase())
      );
    }

    if (filterState.condition !== "All") {
      filtered = filtered.filter(product => {
        if (filterState.condition === "Others") {
          return !["new", "fairly used", "used"].includes(product.condition.toLowerCase());
        }
        return product.condition.toLowerCase() === filterState.condition.toLowerCase();
      });
    }

    if (filterState.verifiedSeller) {
      filtered = filtered.filter(product => product.seller_verified);
    }

    if (location !== "Location") {
      filtered = filtered.filter(product =>
        product.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    return filtered;
  }, []);

  // Filter products when filters change
  useEffect(() => {
    const filtered = applyFilters(displayedProducts, selectedCategory, filters, selectedState);
    setFilteredProducts(filtered);
  }, [displayedProducts, selectedCategory, filters, selectedState, applyFilters]);

  // Scroll categories
  const scroll = useCallback((direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  }, []);

  // Handle category select
  const handleCategorySelect = useCallback((categoryName) => {
    setSelectedCategory(categoryName);
    setIsCategoryDropdownOpen(false);
    setShowCategories(false);
    setShowMobileFilters(false);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSelectedCategory("All");
    setFilters({ condition: "All", verifiedSeller: false });
    setSelectedState("Location");
    setIsCategoryDropdownOpen(false);
    setShowCategories(false);
    setShowMobileFilters(false);
  }, []);

  // Handle product click
  const handleProductClick = useCallback((product) => {
    navigate(`/products/${product.id}`);
  }, [navigate]);

  // Handle subscribe click
  const handleSubscribeClick = useCallback(() => {
    navigate('/pricing');
  }, [navigate]);

  // Handle start selling click
  const handleStartSellingClick = useCallback(async () => {
    const userData = getUserData();
    
    if (!userData) {
      showToast('warning', 'Please login to start selling', 'Login Required', {
        label: 'Login',
        onClick: () => navigate('/login')
      });
      return;
    }

    const isSubscribed = await checkSubscription();
    
    if (!isSubscribed) {
      showToast('warning', 'You need an active subscription to start selling', 'Subscription Required', {
        label: 'View Plans',
        onClick: () => navigate('/pricing')
      });
      navigate('/pricing');
      return;
    }
    
    navigate('/start-selling');
  }, [navigate, checkSubscription]);

  // Handle connect click
  const handleConnectClick = useCallback(async (e, product) => {
    e.stopPropagation();
    e.preventDefault();

    const userData = getUserData();
    
    if (!userData) {
      showToast('warning', 'Please login to connect with seller', 'Login Required', {
        label: 'Login',
        onClick: () => navigate('/login')
      });
      return;
    }

    setIsConnecting(product.id);

    try {
      const response = await fetch(`${API_URL}/v1/product/engagement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.id,
          user_id: userData.id
        })
      });

      const data = await response.json();

      if (data.status === true || data.success === true) {
        showToast('success', `Interest sent! Seller will contact you.`, 'Success! 🎯');
        
        setConnectedProduct(product);
        setShowReviewModal(true);
        
        setTimeout(() => {
          navigate(`/products/${product.id}`);
        }, 1500);
      } else {
        showToast('error', data.message || 'Failed to send interest', 'Error');
        setIsConnecting(null);
      }
    } catch (error) {
      console.error('Connection error:', error);
      showToast('error', 'Network error. Please check your connection.', 'Error');
      setIsConnecting(null);
    }
  }, [navigate]);

  const filteredStates = useMemo(() =>
    NIGERIAN_STATES.filter((state) =>
      state.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]
  );

  return (
    <section className="pt-0 pb-8 md:py-8 bg-gray-50">
      {/* Heading */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="text-left">
            <h2 className="text-3xl font-bold text-black">Select product category</h2>
            <p className="text-gray-600 mt-2">(choose a category to filter your search)</p>
            <p className="text-xs text-gray-400 mt-1">
              Showing {filteredProducts.length} of {totalProducts} products
            </p>
          </div>
          <div className="text-right flex items-center gap-2">
            {/* Refresh/Randomize Button */}
            <button
              onClick={refreshProducts}
              className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 transition-all duration-300 shadow-sm hover:scale-105"
              title="Show different products"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 16h5v5"/>
              </svg>
              <span className="hidden sm:inline">Shuffle Products</span>
            </button>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-yellow-100 transition-all duration-300 bg-white shadow-sm hover:scale-105"
            >
              <span>{selectedState}</span>
              <MapPin size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Status Banner */}
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <SubscriptionStatusBanner 
          hasSubscription={hasSubscription} 
          onSubscribe={handleSubscribeClick}
        />
      </div>

      {/* Mobile Only - Fixed Start Selling Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-40 animate-fade-in">
        <div className="relative group">
          <button
            onClick={handleStartSellingClick}
            disabled={subscriptionLoading}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-full p-4 shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-3xl active:scale-95 flex items-center justify-center animate-bounce-slow disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              boxShadow: '0 10px 25px rgba(251, 191, 36, 0.5)',
              width: '60px',
              height: '60px'
            }}
          >
            <Store size={24} className="text-black" />
          </button>

          <div className="absolute bottom-full right-0 mb-2 w-48 bg-black text-white text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center gap-2">
              <Store size={14} />
              <span className="font-medium">Start Selling Today!</span>
            </div>
            <div className="mt-1 text-gray-300">
              {subscriptionLoading ? 'Checking...' : (hasSubscription ? 'Tap to start' : 'Subscription required')}
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black"></div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex gap-6 px-4">
        {/* Filter Sidebar */}
        <aside className="w-1/4 bg-white rounded-xl shadow p-5 sticky top-4 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FaFilter className="text-gray-700" /> Filter
            </h3>
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 transition-colors duration-300">
              Clear All
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 font-medium mb-2">Category</p>
            <div className="relative">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-all duration-300 hover:scale-105"
              >
                <span>{selectedCategory === "All" ? "All Categories" : selectedCategory}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleCategorySelect("All")}
                    className={`w-full text-left px-3 py-2 text-sm transition-all duration-200 ${selectedCategory === "All" ? "bg-yellow-100 text-yellow-800 font-medium" : "hover:bg-gray-100 text-gray-700"}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat, i) => (
                    <button
                      key={i}
                      onClick={() => handleCategorySelect(cat.name)}
                      className={`w-full text-left px-3 py-2 text-sm transition-all duration-200 ${selectedCategory === cat.name ? "bg-yellow-100 text-yellow-800 font-medium" : "hover:bg-gray-100 text-gray-700"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-700 font-medium mb-2">Product Condition</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {["All", "New", "Others"].map((condition) => (
              <button
                key={condition}
                onClick={() => handleFilterChange("condition", condition)}
                className={`border rounded-lg px-3 py-1 text-sm transition-all duration-300 hover:scale-105 ${filters.condition === condition
                  ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                  : "border-gray-300 hover:bg-yellow-100"
                }`}
              >
                {condition}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MdVerified size={20} className="text-blue-500" />
              <p className="text-gray-700 text-sm">Verified seller</p>
            </div>

            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={filters.verifiedSeller}
                onChange={(e) => handleFilterChange("verifiedSeller", e.target.checked)}
              />
              <div className="relative w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer transition-all duration-500 ease-in-out peer-checked:bg-gradient-to-r peer-checked:from-green-400 peer-checked:to-green-600 shadow-inner">
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transform transition-all duration-500 ease-in-out ${filters.verifiedSeller
                  ? 'translate-x-7 scale-110 bg-white'
                  : 'translate-x-1 scale-100 bg-gray-50'
                }`}>
                  <div className={`absolute inset-0 rounded-full transition-all duration-300 ${filters.verifiedSeller
                    ? 'bg-green-400 opacity-20 animate-pulse'
                    : 'bg-gray-400 opacity-10'
                  }`}></div>
                </div>

                <div className={`absolute inset-0 rounded-full transition-all duration-500 ${filters.verifiedSeller
                  ? 'bg-green-400 opacity-30 blur-sm scale-110'
                  : 'bg-gray-400 opacity-0'
                }`}></div>
              </div>

              <span className={`ml-2 text-xs font-medium transition-all duration-300 ${filters.verifiedSeller ? 'text-green-600' : 'text-gray-500'}`}>
                {filters.verifiedSeller ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>

          <button
            onClick={clearFilters}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg shadow transition-all duration-300 mb-4 transform hover:scale-105 active:scale-95"
          >
            Reset Filters
          </button>

          {/* Start Selling Section */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-4 text-center border-2 border-yellow-300 shadow-lg transform hover:scale-105 transition-all duration-500 hover:shadow-2xl animate-pulse-slow">
            <Store className="w-8 h-8 mx-auto mb-2 text-black animate-bounce" />
            <h4 className="font-bold text-black text-lg mb-2">Start Selling Today!</h4>
            <p className="text-black text-sm mb-3">
              Join thousands of successful sellers on LoopMart
            </p>
            <button
              onClick={handleStartSellingClick}
              disabled={subscriptionLoading}
              className="bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 transition-all duration-300 w-full transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subscriptionLoading ? 'Checking...' : 'Get Started'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="w-3/4">
          {/* Categories Carousel */}
          <div className="relative flex items-center mb-6">
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 z-10 bg-white shadow-md rounded-full p-2 hover:bg-yellow-100 transition-all duration-300 transform hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={22} />
            </button>

            <div
              ref={scrollRef}
              className="flex overflow-x-auto gap-5 scroll-smooth px-10 py-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {categories.map((cat, i) => (
                <div
                  key={i}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`min-w-[180px] h-36 rounded-xl border cursor-pointer bg-white shadow-sm flex flex-col justify-center items-center text-center transition-all duration-500 hover:scale-105 hover:shadow-md ${selectedCategory === cat.name ? "border-yellow-400 border-2 bg-yellow-50" : "border-gray-100"} ${cat.color || ""}`}
                >
                  {cat.img && (
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-16 h-16 object-contain mb-3 transition-transform duration-700 hover:scale-110 hover:rotate-3"
                      loading="lazy"
                    />
                  )}
                  <h3 className="font-medium text-gray-700">{cat.name}</h3>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll("right")}
              className="absolute right-0 z-10 bg-white shadow-md rounded-full p-2 hover:bg-yellow-100 transition-all duration-300 transform hover:scale-110 active:scale-95"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Products Grid */}
          <div className="rounded-xl shadow p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                <button onClick={clearFilters} className="mt-4 text-red-500 hover:text-red-700 font-medium transition-colors duration-300 hover:scale-105">
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onProductClick={handleProductClick}
                      onConnectClick={handleConnectClick}
                      isConnecting={isConnecting === product.id}
                    />
                  ))}
                </div>

                {/* Promo Banner */}
                {showPromoBanner && filteredProducts.length > 0 && (
                  <div className="col-span-full mt-8">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-8 relative overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-all duration-700 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                        <div className="text-center md:text-left mb-6 md:mb-0">
                          <div className="flex items-center gap-3 mb-4">
                            <img
                              src={logo}
                              alt="Loopmart"
                              className="h-12 w-auto filter brightness-0 transition-transform duration-700 group-hover:scale-110"
                            />
                          </div>
                          <p className="text-black text-base md:text-lg mb-2 font-medium transition-all duration-500 group-hover:text-black/90">
                            Reach more audience by promoting your Product(s)
                          </p>
                          <p className="text-black text-base md:text-lg mb-2 font-medium transition-all duration-500 group-hover:text-black/90">
                            Get an active badge by becoming a verified seller
                          </p>
                          <p className="text-black text-base md:text-lg font-medium transition-all duration-500 group-hover:text-black/90">
                            and enjoy multiple benefits that comes with being a verified seller
                          </p>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <button
                              onClick={handleStartSellingClick}
                              disabled={subscriptionLoading}
                              className="bg-black text-white font-bold py-3 px-6 rounded-xl shadow-xl transform hover:scale-110 hover:shadow-2xl transition-all duration-500 flex items-center gap-2 text-base group-hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {subscriptionLoading ? 'Checking...' : 'Get Started'}
                              <ArrowRight className="animate-bounce group-hover:translate-x-2 transition-transform duration-300" size={18} />
                            </button>
                          </div>
                          <p className="text-black/70 text-sm mt-3 text-center font-medium transition-all duration-500 group-hover:text-black/90">
                            Join thousands of successful sellers today!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden px-4 mt-4">
        {/* Mobile Filter Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3 shadow-sm transition-all duration-300 hover:bg-yellow-50 hover:scale-105 flex-1"
          >
            <Filter size={18} />
            <span className="font-medium">Filters</span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ml-auto ${showMobileFilters ? 'rotate-180' : ''}`}
            />
          </button>

          <button
            onClick={clearFilters}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg shadow transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <X size={18} />
            <span className="hidden sm:inline">Reset</span>
          </button>
          
          {/* Mobile Refresh Button */}
          <button
            onClick={refreshProducts}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-3 px-4 rounded-lg shadow transition-all duration-300 transform hover:scale-105 active:scale-95"
            title="Shuffle products"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            </svg>
          </button>
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
            <div className="mb-4">
              <p className="text-gray-700 font-medium mb-2">Category</p>
              <div className="relative">
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-all duration-300"
                >
                  <span>{selectedCategory === "All" ? "All Categories" : selectedCategory}</span>
                  <ChevronDown size={16} className={`transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`} />
                </button>

                {showCategories && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <button
                      onClick={() => handleCategorySelect("All")}
                      className={`w-full text-left px-3 py-2 text-sm transition-all duration-200 ${selectedCategory === "All" ? "bg-yellow-100 text-yellow-800 font-medium" : "hover:bg-gray-100 text-gray-700"}`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => handleCategorySelect(cat.name)}
                        className={`w-full text-left px-3 py-2 text-sm transition-all duration-200 ${selectedCategory === cat.name ? "bg-yellow-100 text-yellow-800 font-medium" : "hover:bg-gray-100 text-gray-700"}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 font-medium mb-2">Product Condition</p>
              <div className="flex flex-wrap gap-2">
                {["All", "New", "Fairly Used", "Others"].map((condition) => (
                  <button
                    key={condition}
                    onClick={() => handleFilterChange("condition", condition)}
                    className={`border rounded-lg px-3 py-1 text-sm transition-all duration-300 hover:scale-105 ${filters.condition === condition
                      ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                      : "border-gray-300 hover:bg-yellow-100"
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MdVerified size={18} className="text-blue-500" />
                <p className="text-gray-700 text-sm">Verified seller</p>
              </div>

              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={filters.verifiedSeller}
                  onChange={(e) => handleFilterChange("verifiedSeller", e.target.checked)}
                />
                <div className="relative w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer transition-all duration-500 ease-in-out peer-checked:bg-gradient-to-r peer-checked:from-green-400 peer-checked:to-green-600 shadow-inner">
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transform transition-all duration-500 ease-in-out ${filters.verifiedSeller
                    ? 'translate-x-7 scale-110 bg-white'
                    : 'translate-x-1 scale-100 bg-gray-50'
                  }`}>
                    <div className={`absolute inset-0 rounded-full transition-all duration-300 ${filters.verifiedSeller
                      ? 'bg-green-400 opacity-20 animate-pulse'
                      : 'bg-gray-400 opacity-10'
                    }`}></div>
                  </div>

                  <div className={`absolute inset-0 rounded-full transition-all duration-500 ${filters.verifiedSeller
                    ? 'bg-green-400 opacity-30 blur-sm scale-110'
                    : 'bg-gray-400 opacity-0'
                  }`}></div>
                </div>

                <span className={`ml-2 text-xs font-medium transition-all duration-300 ${filters.verifiedSeller ? 'text-green-600' : 'text-gray-500'}`}>
                  {filters.verifiedSeller ? 'ON' : 'OFF'}
                </span>
              </label>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 font-medium mb-2">Location</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:bg-yellow-50 transition-all duration-300 hover:scale-105"
              >
                <span>{selectedState}</span>
                <MapPin size={16} className="text-gray-500" />
              </button>
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Mobile Products Grid */}
        <div className="rounded-xl shadow p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No products found.</p>
              <button onClick={clearFilters} className="mt-4 text-red-500 hover:text-red-700 font-medium transition-colors duration-300">
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick}
                  onConnectClick={handleConnectClick}
                  isConnecting={isConnecting === product.id}
                />
              ))}

              {/* Promo banner on mobile */}
              {showPromoBanner && filteredProducts.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-6 text-center relative overflow-hidden shadow-lg transform hover:scale-105 transition-all duration-500 my-6">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 justify-center mb-4">
                      <img
                        src={logo}
                        alt="Loopmart"
                        className="h-12 w-auto filter brightness-0 transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <p className="text-black font-medium mb-2 transition-all duration-500 hover:text-black/90">
                      Reach more audience by promoting your Product(s)
                    </p>
                    <p className="text-black font-medium mb-4 transition-all duration-500 hover:text-black/90">
                      Get an active badge by becoming a verified seller
                    </p>
                    <button
                      onClick={handleStartSellingClick}
                      disabled={subscriptionLoading}
                      className="bg-black text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-110 transition-all duration-500 hover:bg-gray-900 animate-pulse hover:animate-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {subscriptionLoading ? 'Checking...' : 'Get Started'}
                    </button>
                    <p className="text-black/70 text-xs mt-3 font-medium transition-all duration-500 hover:text-black/90">
                      Join thousands of successful sellers today!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-md p-5 transform">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="text-red-500 animate-bounce" /> Choose Location
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:scale-110 transition-transform duration-300">
                <X size={20} className="text-gray-600 hover:text-red-500 transition-colors duration-300" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search state..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-500 hover:scale-105"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedState("Location");
                  setIsModalOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-yellow-100 text-sm text-gray-700 transition-all duration-300 hover:scale-105"
              >
                All Locations
              </button>
              {filteredStates.map((state, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedState(state);
                    setIsModalOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-yellow-100 text-sm text-gray-700 transition-all duration-300 hover:scale-105"
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Prompt Modal */}
      <ReviewPromptModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setConnectedProduct(null);
        }}
        product={connectedProduct}
      />
    </section>
  );
}