import axios from 'axios';

// API instance for Auth (login, register)
export const authApi = axios.create({
  baseURL: 'http://localhost:5001'
});

// API instance for resources (CMS, gameplay)
export const resourceApi = axios.create({
  baseURL: 'http://localhost:5002'
});

// Interceptor to add JWT token to resource requests
resourceApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
