import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

interface TokenRefreshResponse {
  success: boolean;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  // In-memory token storage (more secure than localStorage for access tokens)
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      withCredentials: true, // Enable cookies for httpOnly refresh tokens
    });

    // Initialize from localStorage on startup (migration path)
    this.accessToken = localStorage.getItem('accessToken');

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue requests while refreshing
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = localStorage.getItem('refreshToken');

          if (!refreshToken) {
            this.handleAuthError();
            return Promise.reject(error);
          }

          try {
            const response = await axios.post<TokenRefreshResponse>(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken },
              { withCredentials: true }
            );

            const { accessToken, refreshToken: newRefreshToken } =
              response.data.data.tokens;

            this.setAccessToken(accessToken);
            // TODO: Backend should set refreshToken as httpOnly cookie
            // For now, keep in localStorage for backward compatibility
            localStorage.setItem('refreshToken', newRefreshToken);

            // Retry all queued requests
            this.failedQueue.forEach((promise) => promise.resolve(accessToken));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((promise) => promise.reject(refreshError));
            this.failedQueue = [];
            this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  public setAccessToken(token: string | null) {
    this.accessToken = token;
    // Keep in localStorage for persistence across page refreshes
    // TODO: Move to sessionStorage for better security
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private handleAuthError() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    toast.error('Session expired. Please login again.');
  }

  private handleError(error: AxiosError<any>) {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected error occurred';

    if (error.response?.status !== 401) {
      toast.error(message);
    }

    console.error('API Error:', {
      status: error.response?.status,
      message,
      url: error.config?.url,
    });
  }

  getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient.getClient();

// Export setAccessToken for use in auth flows
export const setAccessToken = (token: string | null) => apiClient.setAccessToken(token);