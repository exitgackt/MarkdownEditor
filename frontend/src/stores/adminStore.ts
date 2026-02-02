import { create } from 'zustand';
import type {
  UsageSummary,
  UsageStats,
  User,
  SystemSettingsResponse,
  AdminUser,
  UserListResponse,
  AuthMethodSettings,
  UserDetail,
} from '../types';
import { apiClient, type ApiError } from '../utils/api';

interface AdminState {
  // 利用状況
  usageSummary: UsageSummary | null;
  usageStats: UsageStats[];
  userList: User[];
  userListTotal: number;
  userListPage: number;
  userListPages: number;

  // ユーザー詳細（Phase 11簡易版）
  userDetails: UserDetail[];
  userDetailsTotal: number;
  userDetailsPage: number;
  userDetailsPages: number;

  // システム設定
  browserGuide: string;
  terms: string;
  version: string;
  license: string;
  privacyPolicy: string;
  maintenanceMode: { isActive: boolean; message: string };
  adminUsers: AdminUser[];
  authSettings: AuthMethodSettings | null;

  // ローディング・エラー状態
  isLoading: boolean;
  error: string | null;

  // 利用状況アクション
  fetchUsageSummary: () => Promise<void>;
  fetchUsageStats: (days?: number) => Promise<void>;
  fetchUserList: (page?: number, limit?: number) => Promise<void>;

  // ユーザー詳細アクション（Phase 11簡易版）
  fetchUserDetails: (page?: number, limit?: number, filters?: { status?: string; plan?: string; search?: string }) => Promise<void>;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => Promise<boolean>;

  // システム設定アクション
  fetchBrowserGuide: () => Promise<void>;
  updateBrowserGuide: (content: string) => Promise<void>;
  fetchTerms: () => Promise<void>;
  updateTerms: (content: string) => Promise<void>;
  updateVersion: (content: string) => void;
  updateLicense: (content: string) => void;
  updatePrivacyPolicy: (content: string) => void;
  fetchMaintenanceMode: () => Promise<void>;
  toggleMaintenanceMode: (isActive: boolean, message?: string) => Promise<void>;

  // 管理者管理アクション
  fetchAdminUsers: () => Promise<void>;
  addAdminUser: (email: string) => Promise<{ success: boolean; error?: string }>;
  removeAdminUser: (id: string) => Promise<boolean>;

  // 認証設定アクション
  fetchAuthSettings: () => Promise<void>;
  updateAuthSettings: (settings: AuthMethodSettings) => Promise<boolean>;

  // 状態管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set, _get) => ({
  // 初期状態
  usageSummary: null,
  usageStats: [],
  userList: [],
  userListTotal: 0,
  userListPage: 1,
  userListPages: 0,
  userDetails: [],
  userDetailsTotal: 0,
  userDetailsPage: 1,
  userDetailsPages: 0,
  browserGuide: `【推奨ブラウザ】
Google Chrome（最新版）
Microsoft Edge（最新版）

【対応ブラウザ】
・Google Chrome 90以降
・Microsoft Edge 90以降
・Firefox 88以降
・Safari 14以降

【重要な注意事項】
※ローカルファイル操作機能を使用する場合は、Google ChromeまたはMicrosoft Edgeをご利用ください。
※FirefoxおよびSafariでは、ファイルシステムへの直接アクセス機能に制限があります。

【推奨環境】
・画面解像度: 1366×768以上
・安定したインターネット接続`,
  terms: `マークダウンエディタ 利用規約

第1条（適用）
本規約は、本サービスの提供条件及び本サービスの利用に関する当社とユーザーとの間の権利義務関係を定めることを目的とし、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。

第2条（定義）
本規約において使用する用語の定義は、次に定めるとおりとします。
(1) 「サービス」とは、当社が提供するマークダウンエディタサービスをいいます。
(2) 「ユーザー」とは、本サービスを利用する全ての方をいいます。
(3) 「コンテンツ」とは、ユーザーが本サービスを通じて作成、保存、編集するマークダウンファイル及びその他一切の情報をいいます。

第3条（登録）
1. 本サービスの利用を希望する者は、本規約を遵守することに同意し、当社が定める方法により利用登録を申請するものとします。
2. 当社は、登録申請者が次の各号のいずれかに該当する場合、登録を拒否することがあります。
   (1) 本規約に違反するおそれがあると当社が判断した場合
   (2) 登録事項に虚偽、誤記または記入漏れがあった場合
   (3) その他、当社が登録を適当でないと判断した場合

第4条（ユーザーの責任）
1. ユーザーは、自己の責任において本サービスを利用するものとし、本サービスにおいて行った一切の行為及びその結果について一切の責任を負うものとします。
2. ユーザーは、本サービスの利用に必要な機器、ソフトウェア、通信手段等を自己の責任と費用において適切に整備するものとします。

第5条（禁止事項）
ユーザーは、本サービスの利用にあたり、以下の行為を行ってはならないものとします。
(1) 法令または公序良俗に違反する行為
(2) 犯罪行為に関連する行為
(3) 当社または第三者の知的財産権を侵害する行為
(4) 当社または第三者の名誉、信用、プライバシーを侵害する行為
(5) サーバーやネットワークの機能を破壊したり、妨害したりする行為
(6) 不正アクセス、またはこれを試みる行為
(7) 他のユーザーのアカウントを利用する行為
(8) その他、当社が不適切と判断する行為

第6条（知的財産権）
1. 本サービスに関する知的財産権は全て当社または当社にライセンスを許諾している者に帰属します。
2. ユーザーが作成したコンテンツの知的財産権は、ユーザーに帰属します。

第7条（免責事項）
1. 当社は、本サービスの内容変更、中断、終了によって生じたいかなる損害についても、一切責任を負いません。
2. 当社は、ユーザーが作成したコンテンツの消失、破損等について、一切責任を負いません。
3. 当社は、本サービスに関してユーザーが被った損害について、一切の責任を負いません。

第8条（サービスの変更・終了）
当社は、ユーザーに事前に通知することなく、本サービスの内容を変更し、または本サービスの提供を中止もしくは終了することができるものとします。

第9条（利用規約の変更）
当社は、必要と判断した場合には、ユーザーに通知することなく、いつでも本規約を変更することができるものとします。変更後の本規約は、本サービス上に掲示された時点より効力を生じるものとします。

第10条（個人情報の取扱い）
当社は、本サービスの利用によって取得する個人情報については、当社のプライバシーポリシーに従い、適切に取り扱うものとします。

第11条（準拠法・裁判管轄）
1. 本規約の解釈にあたっては、日本法を準拠法とします。
2. 本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。

以上

制定日: 2024年1月1日
最終改定日: 2024年1月1日`,
  version: `バージョン: 1.0.0
リリース日: 2024年1月1日

【更新履歴】
- 2024年1月1日: 初版リリース`,
  license: `マークダウンエディタ ライセンス情報

本ソフトウェアは以下のオープンソースライブラリを使用しています：

【フロントエンド】
- React (MIT License)
- Monaco Editor (MIT License)
- MUI (MIT License)
- Zustand (MIT License)

【バックエンド】
- FastAPI (MIT License)
- PostgreSQL (PostgreSQL License)

詳細なライセンス情報は各ライブラリの公式ドキュメントをご参照ください。`,
  privacyPolicy: `プライバシーポリシー

当社は、本サービスにおいて取得する個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。

第1条（個人情報の定義）
個人情報とは、個人情報保護法に規定される個人情報を指し、特定の個人を識別できる情報をいいます。

第2条（個人情報の取得）
当社は、以下の個人情報を取得します：
- メールアドレス
- 氏名
- 利用履歴
- アクセスログ

第3条（個人情報の利用目的）
当社は、取得した個人情報を以下の目的で利用します：
(1) 本サービスの提供、運営、維持、改善のため
(2) ユーザーサポートのため
(3) 利用規約違反の対応のため
(4) サービスに関する重要なお知らせのため

第4条（個人情報の第三者提供）
当社は、以下の場合を除き、個人情報を第三者に提供しません：
(1) ユーザーの同意がある場合
(2) 法令に基づく場合
(3) 人の生命、身体または財産の保護のために必要がある場合

第5条（個人情報の開示・訂正・削除）
ユーザーは、当社に対して個人情報の開示、訂正、削除を請求することができます。

第6条（お問い合わせ）
個人情報の取扱いに関するお問い合わせは、お問い合わせフォームよりご連絡ください。

制定日: 2024年1月1日
最終改定日: 2024年1月1日`,
  maintenanceMode: { isActive: false, message: '' },
  adminUsers: [],
  authSettings: null,
  isLoading: false,
  error: null,

  // 利用状況サマリー取得
  fetchUsageSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await apiClient.get<UsageSummary>('/api/v1/admin/usage/summary');
      set({ usageSummary: summary, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || '利用状況サマリーの取得に失敗しました',
      });
    }
  },

  // 利用統計取得
  fetchUsageStats: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const stats = await apiClient.get<UsageStats[]>(
        `/api/v1/admin/usage/stats?days=${days}`
      );
      set({ usageStats: stats, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || '利用統計の取得に失敗しました',
      });
    }
  },

  // ユーザー一覧取得
  fetchUserList: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<UserListResponse>(
        `/api/v1/admin/usage/users?page=${page}&limit=${limit}`
      );
      set({
        userList: response.users,
        userListTotal: response.total,
        userListPage: response.page,
        userListPages: response.pages,
        isLoading: false,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || 'ユーザー一覧の取得に失敗しました',
      });
    }
  },

  // ユーザー詳細一覧取得（Phase 11簡易版）
  fetchUserDetails: async (page = 1, limit = 10, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.plan) params.append('plan', filters.plan);
      if (filters.search) params.append('search', filters.search);

      const response = await apiClient.get<{
        users: UserDetail[];
        total: number;
        page: number;
        limit: number;
        pages: number;
      }>(`/api/v1/admin/users/details?${params.toString()}`);
      set({
        userDetails: response.users,
        userDetailsTotal: response.total,
        userDetailsPage: response.page,
        userDetailsPages: response.pages,
        isLoading: false,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || 'ユーザー詳細の取得に失敗しました',
      });
    }
  },

  // ユーザーステータス更新（Phase 11簡易版）
  updateUserStatus: async (userId: string, status: 'active' | 'suspended') => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.put(`/api/v1/admin/users/${userId}/status`, { status });
      // ステータス更新後、ユーザー詳細を再取得
      const currentPage = _get().userDetailsPage;
      await _get().fetchUserDetails(currentPage);
      set({ isLoading: false });
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || 'ステータスの更新に失敗しました',
      });
      return false;
    }
  },

  // ブラウザガイド取得
  fetchBrowserGuide: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<SystemSettingsResponse>(
        '/api/v1/admin/settings/browser-guide'
      );
      set({ browserGuide: response.value, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      // 404の場合はデフォルト値を設定
      if (apiError.status === 404) {
        set({
          browserGuide: `【推奨ブラウザ】
Google Chrome（最新版）
Microsoft Edge（最新版）

【対応ブラウザ】
・Google Chrome 90以降
・Microsoft Edge 90以降
・Firefox 88以降
・Safari 14以降

【重要な注意事項】
※ローカルファイル操作機能を使用する場合は、Google ChromeまたはMicrosoft Edgeをご利用ください。
※FirefoxおよびSafariでは、ファイルシステムへの直接アクセス機能に制限があります。

【推奨環境】
・画面解像度: 1366×768以上
・安定したインターネット接続`,
          isLoading: false
        });
      } else {
        set({
          isLoading: false,
          error: apiError.detail || apiError.message || 'ブラウザガイドの取得に失敗しました',
        });
      }
    }
  },

  // ブラウザガイド更新
  updateBrowserGuide: async (content: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put<SystemSettingsResponse>(
        '/api/v1/admin/settings/browser-guide',
        { value: content }
      );
      set({ browserGuide: response.value, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || 'ブラウザガイドの更新に失敗しました',
      });
    }
  },

  // 利用規約取得
  fetchTerms: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<SystemSettingsResponse>(
        '/api/v1/admin/settings/terms'
      );
      set({ terms: response.value, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      // 404の場合はデフォルト値を設定
      if (apiError.status === 404) {
        set({
          terms: `マークダウンエディタ 利用規約

第1条（適用）
本規約は、本サービスの提供条件及び本サービスの利用に関する当社とユーザーとの間の権利義務関係を定めることを目的とし、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。

第2条（定義）
本規約において使用する用語の定義は、次に定めるとおりとします。
(1) 「サービス」とは、当社が提供するマークダウンエディタサービスをいいます。
(2) 「ユーザー」とは、本サービスを利用する全ての方をいいます。
(3) 「コンテンツ」とは、ユーザーが本サービスを通じて作成、保存、編集するマークダウンファイル及びその他一切の情報をいいます。

第3条（登録）
1. 本サービスの利用を希望する者は、本規約を遵守することに同意し、当社が定める方法により利用登録を申請するものとします。
2. 当社は、登録申請者が次の各号のいずれかに該当する場合、登録を拒否することがあります。
   (1) 本規約に違反するおそれがあると当社が判断した場合
   (2) 登録事項に虚偽、誤記または記入漏れがあった場合
   (3) その他、当社が登録を適当でないと判断した場合

第4条（ユーザーの責任）
1. ユーザーは、自己の責任において本サービスを利用するものとし、本サービスにおいて行った一切の行為及びその結果について一切の責任を負うものとします。
2. ユーザーは、本サービスの利用に必要な機器、ソフトウェア、通信手段等を自己の責任と費用において適切に整備するものとします。

第5条（禁止事項）
ユーザーは、本サービスの利用にあたり、以下の行為を行ってはならないものとします。
(1) 法令または公序良俗に違反する行為
(2) 犯罪行為に関連する行為
(3) 当社または第三者の知的財産権を侵害する行為
(4) 当社または第三者の名誉、信用、プライバシーを侵害する行為
(5) サーバーやネットワークの機能を破壊したり、妨害したりする行為
(6) 不正アクセス、またはこれを試みる行為
(7) 他のユーザーのアカウントを利用する行為
(8) その他、当社が不適切と判断する行為

第6条（知的財産権）
1. 本サービスに関する知的財産権は全て当社または当社にライセンスを許諾している者に帰属します。
2. ユーザーが作成したコンテンツの知的財産権は、ユーザーに帰属します。

第7条（免責事項）
1. 当社は、本サービスの内容変更、中断、終了によって生じたいかなる損害についても、一切責任を負いません。
2. 当社は、ユーザーが作成したコンテンツの消失、破損等について、一切責任を負いません。
3. 当社は、本サービスに関してユーザーが被った損害について、一切の責任を負いません。

第8条（サービスの変更・終了）
当社は、ユーザーに事前に通知することなく、本サービスの内容を変更し、または本サービスの提供を中止もしくは終了することができるものとします。

第9条（利用規約の変更）
当社は、必要と判断した場合には、ユーザーに通知することなく、いつでも本規約を変更することができるものとします。変更後の本規約は、本サービス上に掲示された時点より効力を生じるものとします。

第10条（個人情報の取扱い）
当社は、本サービスの利用によって取得する個人情報については、当社のプライバシーポリシーに従い、適切に取り扱うものとします。

第11条（準拠法・裁判管轄）
1. 本規約の解釈にあたっては、日本法を準拠法とします。
2. 本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。

以上

制定日: 2024年1月1日
最終改定日: 2024年1月1日`,
          isLoading: false
        });
      } else {
        set({
          isLoading: false,
          error: apiError.detail || apiError.message || '利用規約の取得に失敗しました',
        });
      }
    }
  },

  // 利用規約更新
  updateTerms: async (content: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put<SystemSettingsResponse>(
        '/api/v1/admin/settings/terms',
        { value: content }
      );
      set({ terms: response.value, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || '利用規約の更新に失敗しました',
      });
    }
  },

  // バージョン情報更新（フロントエンドのみ）
  updateVersion: (content: string) => {
    set({ version: content });
  },

  // ライセンス情報更新（フロントエンドのみ）
  updateLicense: (content: string) => {
    set({ license: content });
  },

  // プライバシーポリシー更新（フロントエンドのみ）
  updatePrivacyPolicy: (content: string) => {
    set({ privacyPolicy: content });
  },

  // メンテナンスモード取得
  fetchMaintenanceMode: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<SystemSettingsResponse>(
        '/api/v1/admin/settings/maintenance'
      );
      const maintenanceData = JSON.parse(response.value);
      set({
        maintenanceMode: {
          isActive: maintenanceData.isActive || false,
          message: maintenanceData.message || '',
        },
        isLoading: false,
      });
    } catch (error) {
      const apiError = error as ApiError;
      // 404の場合はデフォルト値を設定
      if (apiError.status === 404) {
        set({
          maintenanceMode: { isActive: false, message: '' },
          isLoading: false,
        });
      } else {
        set({
          isLoading: false,
          error:
            apiError.detail || apiError.message || 'メンテナンスモードの取得に失敗しました',
        });
      }
    }
  },

  // メンテナンスモード切り替え
  toggleMaintenanceMode: async (isActive: boolean, message = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put<SystemSettingsResponse>(
        '/api/v1/admin/settings/maintenance',
        {
          value: JSON.stringify({ isActive, message }),
        }
      );
      const maintenanceData = JSON.parse(response.value);
      set({
        maintenanceMode: {
          isActive: maintenanceData.isActive || false,
          message: maintenanceData.message || '',
        },
        isLoading: false,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error:
          apiError.detail || apiError.message || 'メンテナンスモードの更新に失敗しました',
      });
    }
  },

  // 管理者ユーザー一覧取得
  fetchAdminUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const admins = await apiClient.get<AdminUser[]>('/api/v1/admin/admins');
      set({ adminUsers: admins, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || '管理者一覧の取得に失敗しました',
      });
    }
  },

  // 管理者ユーザー追加
  addAdminUser: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const newAdmin = await apiClient.post<AdminUser>('/api/v1/admin/admins', { email });
      set((state) => ({
        adminUsers: [...state.adminUsers, newAdmin],
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.detail || apiError.message || '管理者の追加に失敗しました';
      set({
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // 管理者ユーザー削除
  removeAdminUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/api/v1/admin/admins/${id}`);
      set((state) => ({
        adminUsers: state.adminUsers.filter((admin) => admin.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || '管理者の削除に失敗しました',
      });
      return false;
    }
  },

  // 認証設定取得
  fetchAuthSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await apiClient.get<AuthMethodSettings>('/api/v1/admin/settings/auth');
      set({ authSettings: settings, isLoading: false });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || '認証設定の取得に失敗しました',
      });
    }
  },

  // 認証設定更新
  updateAuthSettings: async (settings: AuthMethodSettings) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiClient.put<AuthMethodSettings>(
        '/api/v1/admin/settings/auth',
        settings
      );
      set({ authSettings: updated, isLoading: false });
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.detail || apiError.message || '認証設定の更新に失敗しました',
      });
      return false;
    }
  },

  // 状態管理
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
