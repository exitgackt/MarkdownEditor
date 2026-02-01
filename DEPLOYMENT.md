# 本番環境デプロイガイド

## 概要

このドキュメントは、Visual Studio風マークダウンエディタを**完全無料環境**で本番デプロイする手順を説明します。

### デプロイ構成

| コンポーネント | サービス | 無料枠 | 予想コスト |
|-------------|---------|--------|----------|
| フロントエンド | Vercel | 100GB/月 | $0 |
| バックエンド | Google Cloud Run | 2M req/月 | $0 |
| データベース | Neon PostgreSQL | 512MB | $0 |
| エラー監視 | Sentry | 5,000 events/月 | $0 |
| **合計** | - | - | **$0/月** |

---

## 事前準備

### 1. Google Cloud Platform設定

#### 1.1 プロジェクト作成
```bash
# Google Cloud SDK インストール確認
gcloud --version

# 認証
gcloud auth login

# プロジェクト作成
gcloud projects create markdown-editor-prod --name="Markdown Editor Production"

# プロジェクトを設定
gcloud config set project markdown-editor-prod

# 課金アカウント確認（無料枠で使用可能）
gcloud billing accounts list
gcloud billing projects link markdown-editor-prod --billing-account=BILLING_ACCOUNT_ID
```

#### 1.2 必要なAPI有効化
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com
```

### 2. Google OAuth 2.0設定（本番用）

1. [Google Cloud Console](https://console.cloud.google.com/) → 認証情報
2. 「OAuth 2.0 クライアントID」作成
   - アプリケーションの種類: ウェブアプリケーション
   - 名前: Markdown Editor Production
   - 承認済みJavaScript生成元:
     - `https://your-app.vercel.app`（後で更新）
   - 承認済みリダイレクトURI:
     - `https://your-app.vercel.app`
     - `https://your-app.vercel.app/login`
3. クライアントID・シークレットをメモ

### 3. Neon PostgreSQL設定

1. [Neon](https://neon.tech/) でアカウント作成
2. 新規プロジェクト作成:
   - 名前: markdown-editor-prod
   - リージョン: Asia Pacific (Tokyo) 推奨
3. 接続文字列をコピー:
   ```
   postgresql://user:pass@ep-xxxxx.aws.neon.tech/dbname?sslmode=require
   ```
4. Connection Pooling 有効化（推奨）

### 4. Sentry設定（オプション）

1. [Sentry.io](https://sentry.io/) でアカウント作成
2. プロジェクト2つ作成:
   - **Frontend**: React
   - **Backend**: Python
3. 各DSNをコピー:
   ```
   https://xxxxx@o123456.ingest.sentry.io/xxxxx
   ```

---

## バックエンドデプロイ（Google Cloud Run）

### ステップ1: シークレット作成

```bash
# DATABASE_URL
echo -n "postgresql://user:pass@ep-xxxxx.aws.neon.tech/dbname?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-

# SECRET_KEY（ランダム生成）
python3 -c 'import secrets; print(secrets.token_urlsafe(64))' | \
  gcloud secrets create SECRET_KEY --data-file=-

# GOOGLE_CLIENT_ID
echo -n "xxxxx.apps.googleusercontent.com" | \
  gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

# GOOGLE_CLIENT_SECRET
echo -n "GOCSPX-xxxxx" | \
  gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

# Sentry DSN（オプション）
echo -n "https://xxxxx@sentry.io/xxxxx" | \
  gcloud secrets create SENTRY_DSN --data-file=-
```

### ステップ2: シークレットアクセス権限設定

```bash
# プロジェクト番号を取得
PROJECT_NUMBER=$(gcloud projects describe markdown-editor-prod --format='value(projectNumber)')

# Cloud Run サービスアカウントに権限付与
for SECRET in DATABASE_URL SECRET_KEY GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET SENTRY_DSN; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

### ステップ3: デプロイ

```bash
# プロジェクトルートから実行
cd /path/to/MarkdownEditor

# Cloud Build でビルド＆デプロイ
gcloud builds submit --config backend/cloudbuild.yaml

# デプロイ完了後、URLを取得
gcloud run services describe markdown-editor-api \
  --region=asia-northeast1 \
  --format='value(status.url)'
```

**出力例**:
```
https://markdown-editor-api-xxxxx-an.a.run.app
```

このURLをメモしてください（フロントエンド設定で使用）。

### ステップ4: 環境変数追加設定

```bash
# CORS、フロントエンドURL等を追加
gcloud run services update markdown-editor-api \
  --region=asia-northeast1 \
  --update-env-vars=ENVIRONMENT=production,DEBUG=False,ALLOWED_ORIGINS='["https://your-app.vercel.app"]',FRONTEND_URL=https://your-app.vercel.app,INITIAL_ADMIN_EMAILS=admin@example.com
```

### ステップ5: 動作確認

```bash
# ヘルスチェック
curl https://markdown-editor-api-xxxxx-an.a.run.app/health
# 期待される出力: {"status":"healthy"}

# API Docs確認
open https://markdown-editor-api-xxxxx-an.a.run.app/docs
```

---

## フロントエンドデプロイ（Vercel）

### ステップ1: Vercel CLI インストール

```bash
npm install -g vercel
```

### ステップ2: 環境変数ファイル作成

```bash
cd frontend

# .env.production作成（Gitコミット不可）
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://markdown-editor-api-xxxxx-an.a.run.app
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_ENVIRONMENT=production
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
EOF
```

### ステップ3: Vercelにデプロイ

```bash
# プロジェクトルートに戻る
cd ..

# Vercel認証
vercel login

# 初回デプロイ（プロダクション）
vercel --prod

# プロンプトに答える:
# - Set up and deploy? [Y/n] → Y
# - Which scope? → 自分のアカウント選択
# - Link to existing project? [y/N] → N
# - What's your project's name? → markdown-editor
# - In which directory is your code located? → ./frontend
```

デプロイ完了後、URLが表示されます:
```
https://markdown-editor-xxxxx.vercel.app
```

### ステップ4: Vercel環境変数設定

Vercelダッシュボードで設定するか、CLIで設定:

```bash
# API URL
vercel env add VITE_API_BASE_URL production
# 入力: https://markdown-editor-api-xxxxx-an.a.run.app

# Google Client ID
vercel env add VITE_GOOGLE_CLIENT_ID production
# 入力: xxxxx.apps.googleusercontent.com

# Environment
vercel env add VITE_ENVIRONMENT production
# 入力: production

# Sentry DSN（オプション）
vercel env add VITE_SENTRY_DSN production
# 入力: https://xxxxx@sentry.io/xxxxx
```

### ステップ5: 再デプロイ（環境変数反映）

```bash
vercel --prod
```

---

## Google OAuth更新

デプロイ後、Google Cloud Consoleで本番用OAuth認証情報を更新:

1. [Google Cloud Console](https://console.cloud.google.com/) → 認証情報
2. 本番用OAuth 2.0クライアントIDを編集
3. **承認済みJavaScript生成元**に追加:
   - `https://your-app.vercel.app`（Vercel URL）
   - `https://markdown-editor-api-xxxxx-an.a.run.app`（Cloud Run URL）
4. **承認済みリダイレクトURI**に追加:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/login`
5. 保存

---

## 動作確認チェックリスト

### フロントエンド
- [ ] `https://your-app.vercel.app` でアプリが開く
- [ ] Google OAuth ログインボタンが表示される
- [ ] ログインが成功する
- [ ] ファイルを開ける
- [ ] エディタでマークダウンを編集できる
- [ ] リアルタイムプレビューが表示される
- [ ] PDF/HTMLエクスポートが動作する
- [ ] マインドマップが表示される

### バックエンド
- [ ] `https://API_URL/health` → `{"status":"healthy"}`
- [ ] `https://API_URL/docs` → Swagger UIが表示される
- [ ] API呼び出しが成功する（ブラウザDevToolsで確認）

### セキュリティ
- [ ] HTTPS強制（http→httpsリダイレクト）
- [ ] セキュリティヘッダー: https://securityheaders.com でスキャン
- [ ] CORS設定確認（ブラウザDevToolsでエラーなし）
- [ ] レート制限動作（100+リクエストで429エラー）

### パフォーマンス
- [ ] Lighthouse スコア > 90（Chrome DevTools）
- [ ] First Contentful Paint < 2秒
- [ ] Time to Interactive < 3秒

---

## カスタムドメイン設定（オプション）

### Vercel
```bash
vercel domains add yourdomain.com
```

DNS設定:
```
CNAME  @  cname.vercel-dns.com
```

### Cloud Run
```bash
gcloud run domain-mappings create \
  --service markdown-editor-api \
  --domain api.yourdomain.com \
  --region asia-northeast1
```

DNS設定（Cloud Runが指示を表示）。

---

## 継続的デプロイ（CI/CD）

### GitHub Actions（推奨）

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: markdown-editor-prod

      - name: Deploy to Cloud Run
        run: gcloud builds submit --config backend/cloudbuild.yaml

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend
```

---

## モニタリング

### Sentry
- エラー発生時に自動通知
- ダッシュボード: https://sentry.io/

### Google Cloud Monitoring
```bash
# ログ確認
gcloud logs read --service=markdown-editor-api --limit=50

# メトリクス確認
gcloud monitoring dashboards list
```

### Vercel Analytics
- Vercelダッシュボード → Analytics
- リアルタイム訪問者、パフォーマンス確認

---

## トラブルシューティング

### Cloud Run デプロイ失敗
```bash
# ビルドログ確認
gcloud builds list --limit=5
gcloud builds log BUILD_ID

# サービスログ確認
gcloud logs read --service=markdown-editor-api --limit=50
```

### Vercel デプロイ失敗
```bash
# デプロイログ確認
vercel logs your-app.vercel.app

# ローカルでビルドテスト
cd frontend
npm run build
npm run preview
```

### CORS エラー
- Cloud RunのALLOWED_ORIGINS設定を確認
- Google OAuth承認済みオリジン設定を確認

### データベース接続エラー
- Neon接続文字列が正しいか確認
- `?sslmode=require` パラメータを確認
- Neonダッシュボードでコネクション確認

---

## ロールバック手順

### Vercel
```bash
# デプロイ一覧表示
vercel ls

# 前バージョンにロールバック
vercel rollback DEPLOYMENT_URL
```

### Cloud Run
```bash
# リビジョン一覧
gcloud run revisions list --service=markdown-editor-api --region=asia-northeast1

# トラフィックを前バージョンに切り替え
gcloud run services update-traffic markdown-editor-api \
  --to-revisions=REVISION_NAME=100 \
  --region=asia-northeast1
```

---

## コスト管理

### 無料枠監視

#### Vercel
- ダッシュボード → Settings → Usage
- 帯域幅 100GB/月を超えないよう監視

#### Google Cloud
```bash
# 現在の使用量確認
gcloud billing accounts list
gcloud billing projects describe markdown-editor-prod

# 予算アラート設定（オプション）
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Markdown Editor Budget" \
  --budget-amount=1USD
```

#### Neon
- ダッシュボード → Settings → Usage
- 512MBを超えないよう監視

---

## セキュリティベストプラクティス

1. **シークレット管理**
   - `.env.production` は絶対にGitコミットしない
   - Secret Managerを使用（Cloud Run）
   - Vercel環境変数で管理（Frontend）

2. **HTTPS強制**
   - Vercel、Cloud RunはデフォルトでHTTPS
   - カスタムドメイン使用時も自動SSL証明書

3. **レート制限**
   - バックエンドで100 req/min/IP制限実装済み
   - 必要に応じて調整

4. **セキュリティヘッダー**
   - CSP、HSTS、X-Frame-Optionsなど実装済み

5. **定期更新**
   ```bash
   # 依存関係更新
   cd frontend && npm update && npm audit fix
   cd backend && pip list --outdated
   ```

---

## サポート

問題が発生した場合:
1. このドキュメントのトラブルシューティングを確認
2. Sentry/Cloud Logsでエラー詳細を確認
3. プロジェクトREADME.mdを参照
4. GitHub Issuesで報告

---

## 更新履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-02-02 | 初版作成 |
