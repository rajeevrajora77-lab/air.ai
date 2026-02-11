import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import type { User, AuthResponse, ApiResponse } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string }) => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
            email,
            password,
          });

          if (response.data.success && response.data.data) {
            const { user, tokens } = response.data.data;
            set({
              user,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            toast.success('Logged in successfully');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);

          if (response.data.success && response.data.data) {
            const { user, tokens } = response.data.data;
            set({
              user,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            toast.success('Account created successfully');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          toast.success('Logged out successfully');
        }
      },

      updateProfile: async (data) => {
        try {
          const response = await api.patch<ApiResponse<{ user: User }>>(
            '/users/profile',
            data
          );

          if (response.data.success && response.data.data) {
            set({ user: response.data.data.user });
            toast.success('Profile updated successfully');
          }
        } catch (error: any) {
          throw error;
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);