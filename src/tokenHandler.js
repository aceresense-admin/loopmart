// src/tokenHandler.js
export function initTokenHandler() {
  console.log('🔍 Token handler initializing');
  
  // Check for token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  console.log('Current URL:', window.location.href);
  console.log('Token found:', token ? 'YES' : 'NO');
  
  if (token) {
    console.log('✅ Token detected! Storing in localStorage');
    localStorage.setItem('loopmart_token', token);
    
    // Clear the URL
    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    console.log('🧹 Token removed from URL');
    
    // Optional: Show a message
    console.log('🔄 Token stored. User should be logged in on next page load.');
  }
}

// Call this immediately when the script loads
if (typeof window !== 'undefined') {
  initTokenHandler();
}
