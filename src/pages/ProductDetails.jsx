// pages/ProductDetails.jsx (Fixed modal order - WhatsApp first, then Review)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoIosContact } from "react-icons/io";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Shield, 
  MessageCircle, 
  Phone, 
  ChevronLeft,
  ChevronRight,
  Store,
  X,
  AlertCircle,
  Star
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import ReviewPromptModal from '../components/ReviewPromptModal';

const API_URL = 'https://loopmart.ng/api';

// Helper functions
const getConditionBadgeColor = (condition) => {
  switch (condition?.toLowerCase()) {
    case "new": return "bg-green-100 text-green-800";
    case "fairly used": return "bg-blue-100 text-blue-800";
    case "used": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Unknown date';
  }
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/600x400?text=No+Image";
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads')) return `https://loopmart.ng${imagePath}`;
  return `https://loopmart.ng/uploads/products/${imagePath}`;
};

// WhatsApp Modal Component
const WhatsAppModal = ({ isOpen, onClose, sellerName, sellerPhone, productName, location, onContinue }) => {
  if (!isOpen) return null;

  const handleWhatsAppClick = () => {
    if (!sellerPhone) {
      alert('Seller phone number not available');
      return;
    }
    
    // Remove any non-numeric characters from phone
    const cleanPhone = sellerPhone.replace(/[^0-9]/g, '');
    const message = `Hello! I'm interested in your product "${productName}" on LoopMart.`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleContinue = () => {
    onClose();
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-lg" onClick={handleContinue} />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <button 
          onClick={handleContinue} 
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-full"
        >
          <X size={24} />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <IoIosContact size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Contact Seller</h2>
            <p className="text-gray-600">Connect with the seller via WhatsApp</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Seller Name:</span>
                <span className="font-semibold text-gray-800">{sellerName || "Anonymous Seller"}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Phone:</span>
                <span className="font-semibold text-green-600">
                  {sellerPhone || "Not available"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Location:</span>
                <span className="font-semibold text-gray-800">{location || "Unknown"}</span>
              </div>
            </div>
          </div>

          {sellerPhone ? (
            <button 
              onClick={handleWhatsAppClick} 
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg"
            >
              <MessageCircle size={20} />
              <span>Open WhatsApp</span>
            </button>
          ) : (
            <div className="w-full bg-gray-100 text-gray-500 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2">
              <Phone size={20} />
              <span>Phone Number Not Available</span>
            </div>
          )}

          <button 
            onClick={handleContinue} 
            className="w-full mt-3 text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-xl border border-gray-300 hover:border-gray-400 transition-all"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
};

// Related Product Card Component
const RelatedProductCard = ({ product, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border p-3 cursor-pointer hover:shadow-lg transition-all group"
    >
      <div className="relative h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
          }}
        />
        {product.condition && (
          <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${getConditionBadgeColor(product.condition)}`}>
            {product.condition}
          </span>
        )}
      </div>
      
      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 text-sm">
        {product.name}
      </h3>
      
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-red-600 text-lg">
          {product.price}
        </span>
      </div>
      
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <MapPin size={12} />
        <span className="truncate">{product.location}</span>
      </div>
    </div>
  );
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sellerPhone, setSellerPhone] = useState('');

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('loopmart_token');
        if (!token) {
          navigate('/login');
          return;
        }

        console.log('Fetching product:', id);
        
        // Fetch product
        const response = await fetch(`${API_URL}/v1/product/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch product');
        
        const data = await response.json();
        console.log('Product data:', data);
        
        if (!data.data) throw new Error('No product data');
        
        const p = data.data;
        
        // Process images
        let productImages = [];
        if (p.image_url) {
          if (typeof p.image_url === 'string' && p.image_url.startsWith('[')) {
            try {
              productImages = JSON.parse(p.image_url).map(img => getImageUrl(img));
            } catch {
              productImages = [getImageUrl(p.image_url)];
            }
          } else {
            productImages = [getImageUrl(p.image_url)];
          }
        }
        if (productImages.length === 0) {
          productImages = ['https://via.placeholder.com/600x400?text=No+Image'];
        }
        
        // Calculate price
        const actualPrice = parseFloat(p.actual_price || 0);
        const promoPrice = p.promo_price ? parseFloat(p.promo_price) : null;
        const hasPromo = promoPrice && promoPrice < actualPrice;
        
        // Get seller ID
        const sellerId = p.seller_id || p.user_id;
        
        // Set product
        const newProduct = {
          id: p.id || p.product_id,
          name: p.title || p.name || 'Product',
          price: p.ask_for_price ? 'Contact Seller' : 
                 (hasPromo ? `₦${promoPrice?.toLocaleString()}` : `₦${actualPrice.toLocaleString()}`),
          actual_price: actualPrice > 0 ? `₦${actualPrice.toLocaleString()}` : '',
          promo_price: promoPrice ? `₦${promoPrice.toLocaleString()}` : '',
          condition: p.condition || 'Unknown',
          category: p.category || 'Other',
          location: p.location || 'Unknown',
          description: p.description || 'No description available',
          seller_id: sellerId,
          seller_name: p.seller_name || p.name || 'Seller',
          created_at: p.created_at,
          seller_verified: p.badge_status === '1' || p.verify_status === '1'
        };
        
        setProduct(newProduct);
        setImages(productImages);
        setError(null);
        
        // Fetch seller phone number from all products
        if (sellerId) {
          await fetchSellerPhone(sellerId);
        }
        
        // Fetch related products (from same category)
        await fetchRelatedProducts(p.category, p.id || p.product_id);
        
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchSellerPhone = async (sellerId) => {
      try {
        console.log('Fetching seller phone for ID:', sellerId);
        
        const response = await fetch(`${API_URL}/allproduct`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Handle response format
        let allProducts = [];
        if (data.data && Array.isArray(data.data)) {
          allProducts = data.data;
        } else if (Array.isArray(data)) {
          allProducts = data;
        }
        
        // Find a product by this seller that has phone number
        const sellerProduct = allProducts.find(item => {
          const itemSellerId = item.seller_id || item.user_id;
          return itemSellerId?.toString() === sellerId?.toString() && 
                 (item.phone_number || item.phone || item.seller_phone);
        });
        
        if (sellerProduct) {
          const phone = sellerProduct.phone_number || sellerProduct.phone || sellerProduct.seller_phone || '';
          console.log('Found seller phone:', phone);
          setSellerPhone(phone);
        } else {
          console.log('No phone found for seller');
        }
        
      } catch (error) {
        console.error('Error fetching seller phone:', error);
      }
    };

    const fetchRelatedProducts = async (category, currentProductId) => {
      try {
        setLoadingRelated(true);
        
        const response = await fetch(`${API_URL}/allproduct`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Handle response format
        let allProducts = [];
        if (data.data && Array.isArray(data.data)) {
          allProducts = data.data;
        } else if (Array.isArray(data)) {
          allProducts = data;
        }
        
        // Filter products by same category, excluding current product
        const related = allProducts
          .filter(item => {
            const itemCategory = item.category || item.product_category;
            const itemId = item.id || item.product_id;
            return itemCategory === category && itemId.toString() !== currentProductId.toString();
          })
          .slice(0, 4)
          .map(item => {
            // Process image
            let itemImage = '';
            if (item.image_url) {
              if (typeof item.image_url === 'string' && item.image_url.startsWith('[')) {
                try {
                  const parsed = JSON.parse(item.image_url);
                  itemImage = getImageUrl(parsed[0] || item.image_url);
                } catch {
                  itemImage = getImageUrl(item.image_url);
                }
              } else {
                itemImage = getImageUrl(item.image_url);
              }
            }
            
            const itemPrice = parseFloat(item.actual_price || 0);
            
            return {
              id: item.id || item.product_id,
              name: item.title || item.name || 'Product',
              price: item.ask_for_price ? 'Contact Seller' : `₦${itemPrice.toLocaleString()}`,
              image: itemImage || 'https://via.placeholder.com/200x150?text=No+Image',
              condition: item.condition || 'Unknown',
              location: item.location || 'Unknown'
            };
          });
        
        setRelatedProducts(related);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleConnect = async () => {
    const token = localStorage.getItem('loopmart_token');
    const userStr = localStorage.getItem('loopmart_user');
    
    if (!token || !userStr) {
      toast?.warning('Please login to connect with seller');
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userStr);
    
    setIsConnecting(true);
    
    try {
      const response = await fetch(`${API_URL}/v1/product/engagement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.id,
          user_id: user.id
        })
      });
      
      const data = await response.json();
      
      if (data.status) {
        toast?.success('Interest sent! Seller will contact you.');
        
        // Show WhatsApp modal first
        setShowWhatsAppModal(true);
        
      } else {
        toast?.error(data.message || 'Failed to send interest');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast?.error('Network error. Please check your connection.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWhatsAppModalClose = () => {
    setShowWhatsAppModal(false);
    // After WhatsApp modal closes, show review modal
    setShowReviewModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasPromo = product.promo_price && product.promo_price !== product.actual_price;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images Section */}
          <div>
            <div className="bg-white rounded-xl border p-4">
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
                
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={nextImage} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImage + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                        selectedImage === idx ? 'border-yellow-500' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            {/* Title & Price */}
            <div className="bg-white rounded-xl border p-6">
              <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
              
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm ${getConditionBadgeColor(product.condition)}`}>
                  {product.condition}
                </span>
                {product.seller_verified && (
                  <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <Shield size={14} />
                    Verified Seller
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                {hasPromo && (
                  <span className="text-gray-400 line-through">{product.actual_price}</span>
                )}
                <span className="text-3xl font-bold text-red-600">{product.price}</span>
              </div>
              
              {hasPromo && (
                <p className="text-sm text-green-600 mb-2">Special Offer!</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {product.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Posted {formatDate(product.created_at)}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Product Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Condition</p>
                  <p className="font-medium">{product.condition}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Location</p>
                  <p className="font-medium">{product.location}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Seller</p>
                  <p className="font-medium">{product.seller_name}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl border p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <MessageCircle size={18} />
                  {isConnecting ? 'Sending...' : 'Connect'}
                </button>
                <button
                  onClick={() => navigate(`/shop/${product.seller_id}`)}
                  className="bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Store size={18} />
                  View Shop
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            
            {loadingRelated ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((item) => (
                  <RelatedProductCard
                    key={item.id}
                    product={item}
                    onClick={() => navigate(`/products/${item.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* No related products message */}
        {!loadingRelated && relatedProducts.length === 0 && (
          <div className="mt-12 text-center py-8 bg-white rounded-xl border">
            <p className="text-gray-500">No related products found</p>
          </div>
        )}
      </div>

      {/* WhatsApp Modal - Shows first */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={handleWhatsAppModalClose}
        sellerName={product?.seller_name}
        sellerPhone={sellerPhone}
        productName={product?.name}
        location={product?.location}
        onContinue={handleWhatsAppModalClose}
      />

      {/* Review Prompt Modal - Shows after WhatsApp modal closes */}
      <ReviewPromptModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        product={product}
      />
    </div>
  );
}