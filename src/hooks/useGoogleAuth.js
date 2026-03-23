// src/hooks/useGoogleAuth.js
import { useEffect } from 'react';
import { AuthService } from '../services/auth';
import { userService } from '../services/userService';

const API_URL = import.meta.env.VITE_API_URL || 'https://loopmart.ng/api';

export const useGoogleAuth = () => {
  useEffect(() => {
    console.log('🔍 useGoogleAuth hook running');
    
    const handleGoogleCallback = async () => {
      // Check if there's a token in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      console.log('📦 URL params:', window.location.search);
      console.log('🔑 Token found:', token ? 'YES' : 'NO');
      console.log('🔑 Token value:', token);
      
      if (token) {
        console.log('✅ Google login successful! Token received');
        
        try {
          // Store the token
          localStorage.setItem('loopmart_token', token);
          AuthService.setToken(token, true);
          console.log('💾 Token stored in localStorage');
          
          // Fetch user data with this token
          console.log('📡 Fetching user data from:', `${API_URL}/user`);
          
          const response = await fetch(`${API_URL}/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          console.log('📨 Response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('👤 User data fetched:', data);
            
            // Extract user data from response
            let userData = data.data || data.user || data;
            
            // Store user data
            localStorage.setItem('loopmart_user', JSON.stringify(userData));
            userService.setUser(userData, token);
            console.log('💾 User data stored in localStorage');
            
            // Clear the URL to remove the token from the address bar
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('🧹 Token removed from URL');
            
            // Dispatch custom event for toast notification
            window.dispatchEvent(new CustomEvent('show-toast', {
              detail: {
                type: 'success',
                message: 'Google login successful! Welcome back!',
                title: 'Success!',
                duration: 3000
              }
            }));
            
            console.log('🔄 Reloading page to update header...');
            // Reload to update header
            setTimeout(() => {
              window.location.reload();
            }, 500);
            
          } else {
            const errorText = await response.text();
            console.error('❌ Failed to fetch user data:', response.status, errorText);
            localStorage.removeItem('loopmart_token');
            
            window.dispatchEvent(new CustomEvent('show-toast', {
              detail: {
                type: 'error',
                message: `Failed to fetch user data: ${response.status}`,
                title: 'Error',
                duration: 5000
              }
            }));
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          localStorage.removeItem('loopmart_token');
        }
      } else {
        console.log('⚠️ No token found in URL');
      }
    };
    
    handleGoogleCallback();
  }, []);
};
