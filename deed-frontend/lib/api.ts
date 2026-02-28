import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('deed_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set Content-Type for FormData so the multipart boundary is included
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('deed_token');
        Cookies.remove('deed_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
