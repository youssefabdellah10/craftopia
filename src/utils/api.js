// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  'https://craftopia-backend-youssefabdellah10-dev.apps.rm3.7wse.p1.openshiftapps.com';

// Debug: Log the API URL being used (remove this after debugging)
console.log('🔗 API_BASE_URL:', API_BASE_URL);
console.log('🔗 Environment Mode:', import.meta.env.MODE);
console.log('🔗 All Env Variables:', import.meta.env);

export { API_BASE_URL };
