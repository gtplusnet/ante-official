import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getStoredTokens, clearStoredTokens, storeTokens } from '@/lib/utils/storage';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    // Use Public API endpoint for all Guardian operations
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://100.109.133.12:3000';

    this.instance = axios.create({
      baseURL: backendUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const tokens = await getStoredTokens();
        
        if (tokens?.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Skip refresh token logic for auth endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                              originalRequest.url?.includes('/auth/register') ||
                              originalRequest.url?.includes('/auth/forgot-password') ||
                              originalRequest.url?.includes('/auth/reset-password');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.instance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokens = await getStoredTokens();
            if (!tokens?.refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.instance.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
              '/api/public/school-guardian/auth/refresh-token',
              { refreshToken: tokens.refreshToken }
            );

            if (response.data.success && response.data.data) {
              const newTokens = response.data.data;
              await storeTokens({
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                expiresIn: 900, // 15 minutes
              });

              this.isRefreshing = false;
              this.refreshSubscribers.forEach((callback) => callback(newTokens.accessToken));
              this.refreshSubscribers = [];

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              }
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            await clearStoredTokens();
            
            // Redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          }
        }

        // Transform error response
        if (error.response?.data) {
          const responseData = error.response.data as any;
          
          // Handle API Gateway or backend error format (non-ApiResponse format)
          if (responseData.message || responseData.error) {
            throw {
              code: responseData.statusCode || responseData.code || 'API_ERROR',
              message: responseData.message || responseData.error || 'An error occurred',
              details: responseData,
              response: error.response
            };
          }
          
          // Handle ApiResponse format
          const apiError = responseData as ApiResponse;
          if (!apiError.success && apiError.error) {
            throw apiError.error;
          }
        }

        throw {
          code: 'NETWORK_ERROR',
          message: error.message || 'An unexpected error occurred',
          details: error.response?.data,
        };
      }
    );
  }

  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();