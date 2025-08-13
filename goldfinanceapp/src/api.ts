import axios from 'axios';

let globalAlert: (alertInfo: { show: boolean; type: 'alert' | 'error' | 'success'; message: string; }) => void;

export const setGlobalAlert = (alertSetter: typeof globalAlert) => {
  globalAlert = alertSetter;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      if (globalAlert) {
        globalAlert({
          show: true,
          type: 'alert',
          message: 'Your session has expired. Please log in again.'
        });
      }
      setTimeout(() => {
        window.location.href = '/login';
      }, 2500);
    }
    return Promise.reject(error);
  }
);

export default api;