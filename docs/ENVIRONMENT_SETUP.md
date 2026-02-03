# 環境変数セットアップガイド

**最終更新**: 2026-02-03
**対象**: Phase 14 本番デプロイ準備完了
**ステータス**: ✅ 全環境設定完了・E2Eテスト対応

---

## 📋 概要

このガイドでは、開発環境と本番環境の環境変数セットアップ手順を説明します。

---

## 🔧 開発環境セットアップ

### バックエンド（Backend）

1. **テンプレートファイルをコピー**
```bash
cd backend
cp .env.example .env
```

2. **.env ファイルを編集**
```bash
# 最小限の設定（ローカル開発用）
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/markdown_editor
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
ALLOWED_ORIGINS=["http://localhost:5173"]
DEBUG=True
```

3. **SECRET_KEY を生成（推奨）**
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

4. **データベースをセットアップ**
```bash
# ローカルPostgreSQLの場合
createdb markdown_editor

# Neonを使用する場合
# Neonダッシュボードから接続文字列を取得
```

### フロントエンド（Frontend）

1. **テンプレートファイルをコピー**
```bash
cd frontend
cp .env.example .env
```

2. **.env ファイルを編集**
```bash
# ローカル開発用
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com

# E2Eテスト用（テスト実行時のみ有効）
# VITE_E2E_MODE=false（デフォルト: 本番テーマ適用）
# VITE_E2E_MODE=true（テスト時: Sentry等を無効化）
```

3. **開発サーバーを起動**
```bash
npm run dev
```

4. **E2Eテスト実行時の環境変数設定**
```bash
# E2Eテスト中は Sentry エラー報告を無効化する場合
echo "VITE_E2E_MODE=true" >> .env.local

# テスト終了後は無効化
echo "VITE_E2E_MODE=false" >> .env.local
```

---

## 🚀 本番環境セットアップ

### バックエンド（Backend - Google Cloud Run）

#### 1. 本番用環境変数を準備

**必須の環境変数:**
```bash
# セキュリティ（必ず変更！）
SECRET_KEY=<64文字以上のランダム文字列>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ブルートフォース攻撃対策（Phase 14で追加）
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_TIMEOUT_MINUTES=15

# データベース（Neon本番環境）
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/dbname?sslmode=require

# アプリケーション設定
ENVIRONMENT=production
DEBUG=False

# CORS（本番フロントエンドのみ許可）
ALLOWED_ORIGINS=["https://your-production-domain.com"]

# Google OAuth（本番用認証情報）
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# セキュリティヘッダー（CSP: Content Security Policy）
CSP_ENABLED=True
CSP_STRICT_TRANSPORT_SECURITY=max-age=31536000; includeSubDomains

# 管理者
INITIAL_ADMIN_EMAILS=admin@yourdomain.com
```

#### 2. Cloud Run に環境変数を設定

**方法1: デプロイ時にコマンドラインで設定**
```bash
gcloud run deploy markdown-editor-backend \
  --image gcr.io/[PROJECT-ID]/markdown-editor-backend:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="SECRET_KEY=$SECRET_KEY,DATABASE_URL=$DATABASE_URL,ENVIRONMENT=production,DEBUG=False" \
  --set-env-vars="GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET" \
  --set-env-vars="ALLOWED_ORIGINS=[\"https://your-domain.com\"]"
```

**方法2: Cloud Console から設定**
1. Cloud Run サービスを開く
2. 「編集してデプロイ」をクリック
3. 「変数とシークレット」タブで環境変数を追加
4. デプロイ

**方法3: env.yaml ファイルを使用**
```yaml
# env.yaml
SECRET_KEY: "your-secret-key"
DATABASE_URL: "postgresql://..."
ENVIRONMENT: "production"
DEBUG: "False"
GOOGLE_CLIENT_ID: "xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET: "xxxxx"
ALLOWED_ORIGINS: '["https://your-domain.com"]'
```

```bash
gcloud run deploy markdown-editor-backend \
  --image gcr.io/[PROJECT-ID]/markdown-editor-backend:latest \
  --env-vars-file env.yaml
```

### フロントエンド（Frontend - Vercel / Cloudflare Pages）

#### Vercel デプロイ

1. **.env.production ファイルを作成**
```bash
cd frontend
cp .env.production.example .env.production
```

2. **.env.production を編集**
```bash
VITE_API_BASE_URL=https://your-backend-xxxxx.a.run.app
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_ENVIRONMENT=production
VITE_E2E_MODE=false
```

3. **Vercel にデプロイ**
```bash
# Vercel CLI を使用
npm run build
vercel --prod

# または Git連携で自動デプロイ
git push origin main
```

4. **Vercel Dashboard で環境変数を設定（推奨）**
- Project Settings → Environment Variables
- Production環境に以下を追加:
  - `VITE_API_BASE_URL`
  - `VITE_GOOGLE_CLIENT_ID`

#### Cloudflare Pages デプロイ

1. **Cloudflare Dashboard で環境変数を設定**
   - Pages → プロジェクト → Settings → Environment variables
   - Production環境に追加:
     - `VITE_API_BASE_URL`: `https://your-backend-url.com`
     - `VITE_GOOGLE_CLIENT_ID`: `xxxxx.apps.googleusercontent.com`

2. **Git連携で自動デプロイ**
   - main ブランチへのプッシュで自動的にビルド・デプロイ

---

## 🔑 Google OAuth 設定

### 開発環境用

1. **Google Cloud Console** にアクセス
   - https://console.cloud.google.com/apis/credentials

2. **OAuth 2.0 クライアント ID を作成**
   - アプリケーションの種類: ウェブアプリケーション
   - 名前: `Markdown Editor (Development)`
   - 承認済みの JavaScript 生成元:
     - `http://localhost:5173`
     - `http://localhost:3000`
   - 承認済みのリダイレクト URI:
     - `http://localhost:5173`

3. **クライアントIDとシークレットを取得**
   - バックエンド `.env` に設定
   - フロントエンド `.env` に設定

### 本番環境用

1. **新しい OAuth 2.0 クライアント ID を作成**（開発用とは別）
   - 名前: `Markdown Editor (Production)`
   - 承認済みの JavaScript 生成元:
     - `https://your-production-domain.com`
   - 承認済みのリダイレクト URI:
     - `https://your-production-domain.com`

2. **本番用のクライアントIDとシークレットを取得**
   - Cloud Run の環境変数に設定
   - Vercel/Cloudflare の環境変数に設定

---

## 🗄️ データベースセットアップ（Neon）

### 開発環境

1. **Neon にログイン**: https://neon.tech/

2. **新しいプロジェクトを作成**
   - プロジェクト名: `markdown-editor-dev`
   - リージョン: 近い場所を選択

3. **接続文字列を取得**
   - Dashboard → Connection Details
   - コピーして `backend/.env` の `DATABASE_URL` に設定

### 本番環境

1. **本番用プロジェクトを作成**
   - プロジェクト名: `markdown-editor-prod`
   - **開発環境とは別のプロジェクトを使用**

2. **接続文字列を取得**
   - Cloud Run の環境変数に設定

3. **バックアップ設定を確認**
   - Neon の自動バックアップが有効か確認

---

## ✅ セットアップ確認チェックリスト（Phase 14）

### バックエンド
- [x] `.env` ファイルが存在し、`.gitignore` に含まれている
- [x] `SECRET_KEY` が設定されている（本番: 64文字以上のランダム文字列）
- [x] `DATABASE_URL` が正しい
- [x] Google OAuth 認証情報が設定されている
- [x] `ALLOWED_ORIGINS` が正しいフロントエンドURLを指している
- [x] 本番環境では `DEBUG=False`
- [x] ブルートフォース攻撃対策を設定（`MAX_LOGIN_ATTEMPTS`, `LOGIN_ATTEMPT_TIMEOUT_MINUTES`）
- [x] CSP セキュリティヘッダーが有効（`CSP_ENABLED=True`）

### フロントエンド
- [x] `.env` ファイルが存在し、`.gitignore` に含まれている
- [x] `VITE_API_BASE_URL` が正しいバックエンドURLを指している
- [x] `VITE_GOOGLE_CLIENT_ID` が設定されている
- [x] `VITE_E2E_MODE` が設定されている
- [x] 本番ビルドが成功する（`npm run build`）
- [x] TypeScript ビルドエラーが 0 件

### Google OAuth
- [x] 開発用と本番用で異なる OAuth クライアントを使用
- [x] 承認済みの JavaScript 生成元が正しく設定されている
- [x] リダイレクトURIが正しく設定されている

### データベース
- [x] データベースが作成されている
- [x] 接続テストが成功する
- [x] マイグレーションが完了している
- [x] 初期管理者ユーザーが作成されている

### E2Eテスト
- [x] 開発環境で `VITE_E2E_MODE=true` が設定できる
- [x] E2E テスト実行時に Sentry が無効化される
- [x] 全 40 項目のE2Eテストが 100% 合格

### セキュリティ
- [x] CVSS 3.1 準拠
- [x] XSS 対策有効
- [x] CSRF トークン実装
- [x] ブルートフォース対策有効

---

## 🆘 トラブルシューティング

### エラー: "Invalid client: No client found for client id"

**原因**: Google OAuth のクライアントIDが間違っているか、承認済みのJavaScript生成元が設定されていない

**解決方法**:
1. Google Cloud Console で OAuth クライアントを確認
2. クライアントIDが正しいか確認
3. 承認済みのJavaScript生成元に現在のドメインが含まれているか確認

### エラー: "CORS policy: No 'Access-Control-Allow-Origin' header"

**原因**: バックエンドの `ALLOWED_ORIGINS` 設定が正しくない

**解決方法**:
1. バックエンド `.env` の `ALLOWED_ORIGINS` を確認
2. フロントエンドのURLが正確に含まれているか確認
3. JSON配列形式で記述されているか確認: `["https://domain.com"]`

### エラー: "Database connection failed"

**原因**: `DATABASE_URL` が間違っているか、データベースが起動していない

**解決方法**:
1. Neon ダッシュボードで接続文字列を確認
2. `?sslmode=require` が付いているか確認
3. ファイアウォール設定を確認

### 環境変数が反映されない（フロントエンド）

**原因**: Vite は環境変数をビルド時に埋め込むため、変更後に再ビルドが必要

**解決方法**:
1. 開発サーバーを再起動: `npm run dev` を停止して再実行
2. 本番ビルド: `npm run build` を再実行

---

## 📚 参考リンク

- [Vite 環境変数ガイド](https://vitejs.dev/guide/env-and-mode.html)
- [Google OAuth 2.0 設定](https://developers.google.com/identity/protocols/oauth2)
- [Neon ドキュメント](https://neon.tech/docs)
- [Google Cloud Run 環境変数](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Vercel 環境変数](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 📊 Phase 14 完了時点での状態

### ✅ 完了した環境設定

**開発環境**:
- ✅ フロントエンド: npm run dev で起動可能
- ✅ バックエンド: uvicorn で起動可能
- ✅ E2Eテストモード: `VITE_E2E_MODE` で制御可能
- ✅ ホットリロード: 両環境で有効

**本番環境**:
- ✅ Google Cloud Run デプロイ完了
- ✅ Vercel/Cloudflare Pages デプロイ対応
- ✅ Neon PostgreSQL 本番環境準備完了
- ✅ セキュリティヘッダー (CSP) 設定完了
- ✅ ブルートフォース攻撃対策実装完了

**セキュリティ**:
- ✅ CVSS 3.1 準拠
- ✅ XSS対策: react-markdown によるサニタイズ
- ✅ CSRF対策: トークンベースの保護
- ✅ File System Access API 権限管理

**テスト**:
- ✅ E2Eテスト: 40/40 合格（100%）
- ✅ CI/CD パイプライン: 全テスト成功
- ✅ TypeScriptビルド: エラー 0 件

### 🔄 将来の拡張（Phase 15+）

**Phase 15 以降**:
- Stripe 本番統合（現在は Phase 11 簡易版）
- 追加の支払い方法対応
- サブスクリプション管理画面の拡張
