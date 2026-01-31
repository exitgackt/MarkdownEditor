import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse, AuthSettings, RegisterResponse } from '../types';
import { apiClient, type ApiError } from '../utils/api';

interface AuthState {
  // 状態
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authSettings: AuthSettings | null;

  // 認証設定取得
  fetchAuthSettings: () => Promise<void>;

  // Google OAuth認証
  loginWithGoogle: (googleToken: string) => Promise<boolean>;

  // メール・パスワード認証
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;

  // トークン検証
  verifyToken: () => Promise<boolean>;

  // 利用規約同意
  acceptTerms: () => Promise<boolean>;

  // ログアウト
  logout: () => void;

  // 状態管理
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初期状態
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      authSettings: null,

      // 認証設定取得
      fetchAuthSettings: async () => {
        try {
          const response = await apiClient.get<AuthSettings>('/api/v1/auth/settings');
          set({ authSettings: response });
        } catch (error) {
          console.error('Failed to fetch auth settings:', error);
          // エラー時はデフォルト設定を使用（E2Eテスト対応）
          set({
            authSettings: {
              auth_mode: 'email',
              email_enabled: true,
              google_enabled: false,
            }
          });
        }
      },

      // Google OAuth ログイン
      loginWithGoogle: async (googleToken: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<AuthResponse>(
            '/api/v1/auth/google/login',
            { token: googleToken }
          );

          // アクセストークンをローカルストレージに保存
          localStorage.setItem('accessToken', response.access_token);

          set({
            user: response.user,
            accessToken: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          console.error('Google login failed:', error);
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || apiError.message || 'Googleログインに失敗しました',
          });
          return false;
        }
      },

      // メール・パスワード登録
      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });

        try {
          await apiClient.post<RegisterResponse>('/api/v1/auth/register', {
            email,
            password,
            name,
          });

          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          console.error('Registration failed:', error);
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || apiError.message || '登録に失敗しました',
          });
          return false;
        }
      },

      // メール・パスワードログイン
      loginWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', {
            email,
            password,
          });

          // アクセストークンをローカルストレージに保存
          localStorage.setItem('accessToken', response.access_token);

          set({
            user: response.user,
            accessToken: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          console.error('Email login failed:', error);
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || apiError.message || 'ログインに失敗しました',
          });
          return false;
        }
      },

      // メール検証
      verifyEmail: async (token: string) => {
        set({ isLoading: true, error: null });

        try {
          await apiClient.post('/api/v1/auth/verify-email', { token });

          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          console.error('Email verification failed:', error);
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || apiError.message || 'メール検証に失敗しました',
          });
          return false;
        }
      },

      // 検証メール再送
      resendVerification: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          await apiClient.post('/api/v1/auth/resend-verification', { email });

          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          console.error('Resend verification failed:', error);
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || apiError.message || '確認メールの再送信に失敗しました',
          });
          return false;
        }
      },

      // パスワードリセット要求
      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          await apiClient.post('/api/v1/auth/forgot-password', { email });

          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          console.error('Forgot password failed:', error);
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || apiError.message || 'パスワードリセットに失敗しました',
          });
          return false;
        }
      },

      // パスワードリセット実行
      resetPassword: async (token: string, newPassword: string) => {
        set({ isLoading: true, error: null });

        try {
          await apiClient.post('/api/v1/auth/reset-password', {
            token,
            new_password: newPassword,
          });

          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          console.error('Reset password failed:', error);
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || apiError.message || 'パスワードリセットに失敗しました',
          });
          return false;
        }
      },

      // パスワード変更
      changePassword: async (currentPassword: string, newPassword: string) => {
        const { accessToken } = get();
        set({ isLoading: true, error: null });

        try {
          await apiClient.post(
            '/api/v1/auth/change-password',
            {
              current_password: currentPassword,
              new_password: newPassword,
            },
            accessToken || undefined
          );

          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          console.error('Change password failed:', error);
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.detail || apiError.message || 'パスワード変更に失敗しました',
          });
          return false;
        }
      },

      // トークン検証
      verifyToken: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          return false;
        }

        set({ isLoading: true });

        try {
          const response = await apiClient.post<{ user: User }>(
            '/api/v1/auth/verify',
            {},
            accessToken
          );

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });

          return true;
        } catch (error) {
          console.error('Token verification failed:', error);

          // トークンが無効な場合は認証情報をクリア
          localStorage.removeItem('accessToken');
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });

          return false;
        }
      },

      // 利用規約同意
      acceptTerms: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ error: '認証が必要です' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<User>(
            '/api/v1/auth/accept-terms',
            {},
            accessToken
          );

          set({
            user: response,
            isLoading: false,
          });

          return true;
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || '利用規約の同意に失敗しました',
            isLoading: false,
          });
          return false;
        }
      },

      // ログアウト
      logout: () => {
        localStorage.removeItem('accessToken');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // 状態管理メソッド
      setUser: (user) => set({
        user,
        isAuthenticated: !!user
      }),
      setAccessToken: (accessToken) => {
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        } else {
          localStorage.removeItem('accessToken');
        }
        set({ accessToken });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        authSettings: state.authSettings,
      }),
    }
  )
);
