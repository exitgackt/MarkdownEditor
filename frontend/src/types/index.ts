// ファイル関連の型定義
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  handle?: FileSystemHandle;
  isExpanded?: boolean;
}

// タブ関連の型定義
export interface Tab {
  id: string;
  fileId: string;
  fileName: string;
  filePath: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  handle?: FileSystemFileHandle;
}

// ユーザー関連の型定義
export interface User {
  id: string;
  email: string;
  name: string;
  google_id: string | null;  // Now nullable for email auth users
  auth_provider: 'email' | 'google' | 'both';
  email_verified: boolean;
  is_admin: boolean;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

// API用の型変換ヘルパー
export interface UserDisplay {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// 認証レスポンスの型定義
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// 認証設定の型定義
export interface AuthSettings {
  auth_mode: 'email' | 'google' | 'both';
  google_enabled: boolean;
  email_enabled: boolean;
}

// メール・パスワード登録リクエスト
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// メール・パスワードログインリクエスト
export interface LoginRequest {
  email: string;
  password: string;
}

// 登録レスポンス
export interface RegisterResponse {
  message: string;
  email: string;
}

// パスワードリセットリクエスト
export interface ForgotPasswordRequest {
  email: string;
}

// パスワードリセット実行リクエスト
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// パスワード変更リクエスト
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// エディタ設定の型定義
export interface EditorSettings {
  fontSize: number;
  theme: 'vs-dark' | 'vs-light' | 'auto';
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  tabSize: number;
}

// プレビュー設定の型定義
export type ViewMode = 'preview' | 'mindmap';
export type SplitMode = 'horizontal' | 'vertical' | 'editor-only' | 'preview-only';

// お気に入りの型定義
export interface Favorite {
  id: string;
  filePath: string;
  fileName: string;
  addedAt: string;
}

// メンテナンス情報の型定義
export interface MaintenanceInfo {
  isActive: boolean;
  message: string;
  scheduledEnd: string | null;
}

// 利用規約の型定義
export interface Terms {
  content: string;
  version: string;
  updatedAt: string;
}

// アプリケーションバージョン情報の型定義
export interface AppVersion {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  createdAt: string;
}

// バージョン履歴の型定義
export interface VersionHistory {
  id: string;
  version: string;
  releaseDate: string;
  releaseNotes: string;
  createdAt: string;
}

// 管理者用：ユーザー一覧の型定義
export interface UserListItem {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
  role: 'user' | 'admin';
}

// 管理者用：利用統計の型定義
export interface UsageSummary {
  total_users: number;
  active_users_today: number;
  new_users_today: number;
  total_logins_today: number;
}

export interface UsageStats {
  date: string;
  total_users: number;
  active_users: number;
  new_users: number;
  total_logins: number;
}

// 管理者用：対応ブラウザ案内の型定義
export interface BrowserGuide {
  content: string;
  updatedAt: string;
}

// 管理者用：メンテナンスモードの型定義
export interface MaintenanceMode {
  isActive: boolean;
  message: string;
  updatedAt: string;
}

// 管理者用：管理者ユーザーの型定義
export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  name: string;
  added_at: string;
  added_by_email: string | null;
  isSelf?: boolean; // クライアントサイドで現在のユーザーかどうかを判定
}

// システム設定のレスポンス型
export interface SystemSettingsResponse {
  key: string;
  value: string;
  updated_at: string;
  version: string | null;
}

// ユーザー一覧のレスポンス型
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// 管理者用：価格設定の型定義
export interface PricingPlan {
  id: string;
  name: string; // 'monthly' | 'yearly'
  price: number;
  currency: string; // 'JPY'
  interval: 'month' | 'year';
  discount?: number; // 年額の割引率（%）
  features: string[];
  isActive: boolean;
  updatedAt: string;
}

// 管理者用：ユーザー招待の型定義
export interface UserInvitation {
  id: string;
  email: string;
  invitedBy: string; // 管理者のメールアドレス
  status: 'pending' | 'accepted' | 'expired';
  invitedAt: string;
  expiresAt: string;
  invitationToken: string;
}

// 管理者用：ユーザー詳細の型定義
export interface UserDetail extends UserListItem {
  plan: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'suspended';
  invitedBy?: string;
}

// 管理者用：売上サマリーの型定義
export interface SalesSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  growthRate: number; // 前月比成長率（%）
  activeSubscriptions: number;
  currency: string;
}

// 管理者用：売上推移データの型定義
export interface SalesData {
  date: string; // YYYY-MM
  revenue: number;
  subscriptions: number;
}

// 管理者用：取引履歴の型定義
export interface Transaction {
  id: string;
  date: string;
  userEmail: string;
  userName: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
}

// 管理者用：認証設定の型定義
export interface AuthMethodSettings {
  mode: 'email' | 'google' | 'both';
  email_verification_required: boolean;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_number: boolean;
  password_require_special: boolean;
}
