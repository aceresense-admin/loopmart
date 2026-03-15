// pages/ProductDetails.jsx (Ultra Simple Version)
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
  AlertCircle
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

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

// WhatsApp Modal
const WhatsAppModal = ({ isOpen, onClose, sellerName, sellerPhone, productName, location }) => {
  if (!isOpen) return null;

  const handleWhatsAppClick = () => {
    if (!sellerPhone) {
      alert('Seller phone number not available');
      return;
    }
    const message = `Hello! I'm interested in your product "${productName}" on LoopMart.`;
    const whatsappUrl = `https://wa.me/${sellerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-lg" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoIosContact size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">Contact Seller</h2>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p><span className="font-medium">Seller:</span> {sellerName}</p>
          <p><span className="font-medium">Phone:</span> {sellerPhone || 'N/A'}</p>
          <p><span className="font-medium">Location:</span> {location}</p>
        </div>

        {sellerPhone ? (
          <button onClick={handleWhatsAppClick} className="w-full bg-green-500 text-white py-3 rounded-xl font-bold">
            Open WhatsApp
          </button>
        ) : (
          <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl text-center">
            Phone Not Available
          </div>
        )}
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
  const [sellerProducts, setSellerProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Single fetch effect
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // Get token
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
        
        if (!response.ok) throw new Error('Failed to fetch');
        
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
          productImages = ['https://via.placeholder.com/600x400'];
        }
        
        // Set product
        setProduct({
          id: p.id || p.product_id,
          name: p.title || p.name || 'Product',
          price: p.ask_for_price ? 'Contact Seller' : `₦${parseFloat(p.actual_price || 0).toLocaleString()}`,
          actual_price: p.actual_price ? `₦${parseFloat(p.actual_price).toLocaleString()}` : '',
          promo_price: p.promo_price ? `₦${parseFloat(p.promo_price).toLocaleString()}` : '',
          condition: p.condition || 'Unknown',
          category: p.category || 'Other',
          location: p.location || 'Unknown',
          description: p.description || 'No description',
          seller_id: p.seller_id || p.user_id,
          seller_name: p.seller_name || p.name || 'Seller',
          seller_phone: p.seller_phone || p.phone_number || '',
          created_at: p.created_at,
          seller_verified: p.badge_status === '1'
        });
        
        setImages(productImages);
        
        // Fetch seller's other products
        if (p.seller_id || p.user_id) {
          const sellerId = p.seller_id || p.user_id;
          const allResponse = await fetch(`${API_URL}/allproduct`);
          const allData = await allResponse.json();
          
          const products = (allData.data || allData)
            .filter(item => (item.seller_id || item.user_id) === sellerId && (item.id || item.product_id) != id)
            .slice(0, 4)
            .map(item => ({
              id: item.id || item.product_id,
              name: item.title || item.name,
              price: `₦${parseFloat(item.actual_price || 0).toLocaleString()}`,
              image: getImageUrl(item.image_url || item.image),
              condition: item.condition,
              location: item.location
            }));
          
          setSellerProducts(products);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
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
      toast?.warning('Please login');
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userStr);
    
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
        toast?.success('Interest sent!');
        setShowModal(true);
      }
    } catch (error) {
      toast?.error('Failed to connect');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
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
          <button onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
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
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full">
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
                <div className="flex gap-2 mt-4 overflow-x-auto">
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

          {/* Info */}
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
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                {hasPromo && (
                  <span className="text-gray-400 line-through">{product.actual_price}</span>
                )}
                <span className="text-3xl font-bold text-red-600">{product.price}</span>
              </div>

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
              <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleConnect}
                  className="bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600"
                >
                  <MessageCircle size={18} />
                  Connect
                </button>
                <button
                  onClick={() => navigate(`/shop/${product.seller_id}`)}
                  className="bg-black text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-800"
                >
                  <Store size={18} />
                  View Shop
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* More from seller */}
        {sellerProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">More from this seller</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sellerProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/products/${item.id}`)}
                  className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-lg"
                >
                  <div className="h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-semibold mb-2 line-clamp-2">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-600">{item.price}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getConditionBadgeColor(item.condition)}`}>
                      {item.condition}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <MapPin size={10} />
                    {item.location}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        sellerName={product.seller_name}
        sellerPhone={product.seller_phone}
        productName={product.name}
        location={product.location}
      />
    </div>
  );
}