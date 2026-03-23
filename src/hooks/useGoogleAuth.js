// src/hooks/useGoogleAuth.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { userService } from '../services/userService';

const API_URL = import.meta.env.VITE_API_URL || 'https://loopmart.ng/api';

export const useGoogleAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      // Check if there's a token in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        console.log('🔑 Google login successful! Token received:', token.substring(0, 20) + '...');
        
        try {
          // Store the token
          localStorage.setItem('loopmart_token', token);
          AuthService.setToken(token, true);
          
          // Fetch user data with this token
          const response = await fetch(`${API_URL}/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('👤 User data fetched:', data);
            
            // Extract user data from response
            let userData = data.data || data.user || data;
            
            // Store user data
            localStorage.setItem('loopmart_user', JSON.stringify(userData));
            userService.setUser(userData, token);
            
            // Clear the URL to remove the token from the address bar
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Dispatch custom event for toast notification
            window.dispatchEvent(new CustomEvent('show-toast', {
              detail: {
                type: 'success',
                message: 'Google login successful! Welcome back!',
                title: 'Success!',
                duration: 3000
              }
            }));
            
            // Reload to update header
            setTimeout(() => {
              window.location.reload();
            }, 500);
            
          } else {
            console.error('Failed to fetch user data:', response.status);
            localStorage.removeItem('loopmart_token');
            
            window.dispatchEvent(new CustomEvent('show-toast', {
              detail: {
                type: 'error',
                message: 'Failed to fetch user data. Please try again.',
                title: 'Error',
                duration: 5000
              }
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('loopmart_token');
        }
      }
    };
    
    handleGoogleCallback();
  }, []);
};
