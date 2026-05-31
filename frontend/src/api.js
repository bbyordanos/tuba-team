import axios from 'axios';

// When hosted: frontend & backend are on the same domain → use /api
// When local: backend is on localhost:5000
const BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('tuba_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

API.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject({ ...err, userMessage: message });
  }
);

export default API;
