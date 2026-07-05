import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Point to the Express backend
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('business_nexus_user');
    if (storedUser) {
      const { token } = JSON.parse(storedUser);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
