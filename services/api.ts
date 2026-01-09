import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { LoginCredentials, SignupCredentials } from '../types';

interface ApiResponse<T = any> {
  message?: string;
  data: T;
  success?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const REQUEST_TIMEOUT = 10000;

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const message = 
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.message || 
      'An unexpected error occurred';


    if (error.response?.status === 401) {
       console.warn('Session expired. Redirecting to login...');
       // localStorage.removeItem('token');
       // window.location.href = '/login';
    }

    return Promise.reject(new Error(message));
  }
);


// --- Authentication ---
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse>('/auth/login', credentials);
    return data;
  },

  signup: async (credentials: SignupCredentials) => {
    const { data } = await api.post<ApiResponse>('/auth/signup', credentials);
    return data;
  },

  googleLogin: async (idToken: string) => {
    const { data } = await api.post<ApiResponse>('/auth/google', { idToken });
    return data;
  },

  verifyEmail: async (payload: { email: string; token: string }) => {
    const { data } = await api.post<ApiResponse>('/auth/verify-email', payload);
    return data;
  },

  resendVerification: async (payload: { email: string }) => {
    const { data } = await api.post<ApiResponse>('/auth/resend-verification', payload);
    return data;
  },

  forgotPassword: async (payload: { email: string }) => {
    const { data } = await api.post<ApiResponse>('/auth/forgot-password', payload);
    return data;
  },

  resetPassword: async (payload: { email: string; otp: string; password: string }) => {
    const { data } = await api.post<ApiResponse>('/auth/reset-password', payload);
    return data;
  },
  
  getMe: async () => {
      const { data } = await api.get<ApiResponse>('/auth/me');
      return data;
  }
};

// --- User Profile ---
export const userApi = {
  getProfile: async () => {
    const { data } = await api.get<ApiResponse>('/auth/profile');
    return data;
  },

  updateProfile: async (userData: { name?: string; avatar?: string }) => {
    const { data } = await api.put<ApiResponse>('/auth/profile', userData);
    return data;
  },
};

// --- Pairing System ---
export const pairingApi = {
  generateCode: async () => {
    const { data } = await api.post<ApiResponse>('/pairing/generate-code');
    return data;
  },

  linkPartner: async (inviteCode: string) => {
    const { data } = await api.post<ApiResponse>('/pairing/link-partner', { 
      inviteCode: inviteCode.trim() 
    });
    return data;
  },
};

// --- Posts System ---
export const postsApi = {
  getAll: async () => {
    const { data } = await api.get('/posts');
    return data;
  },
  create: async (postData: { content: string; type?: string; image?: string }) => {
    const { data } = await api.post('/posts', postData);
    return data;
  },
  like: async (postId: string) => {
    const { data } = await api.put(`/posts/${postId}/like`);
    return data;
  },
  comment: async (postId: string, text: string) => {
    const { data } = await api.post(`/posts/${postId}/comment`, { text });
    return data;
  }
};

export default api;