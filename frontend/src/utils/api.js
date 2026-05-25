const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  // Set up headers
  const headers = {
    ...options.headers,
  };

  // If body is not FormData, set Content-Type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // If unauthorized, clear token and redirect to login if we are not already there
    localStorage.removeItem('token');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
      window.location.href = '/login';
    }
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  if (response.status === 240) {
    return null; // NO CONTENT
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return await response.json();
};

export default apiFetch;
