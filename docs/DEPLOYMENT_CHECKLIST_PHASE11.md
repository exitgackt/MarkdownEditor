# Phase 11 本番デプロイチェックリスト

**作成日**: 2026-01-31
**対象**: Phase 11 管理機能（認証設定、ユーザー管理、システム設定）
**デプロイ先**: 本番環境（Production）

---

## 📋 デプロイ前チェックリスト

### 1. コード品質確認

- [ ] すべてのテストが合格している（Phase 11テスト仕様書参照）
- [ ] Lintエラーがない
- [ ] TypeScriptのコンパイルエラーがない
- [ ] console.log等のデバッグコードを削除
- [ ] 不要なコメントやTODOを削除または対応

**確認コマンド:**
```bash
# フロントエンド
cd frontend
npm run lint
npm run type-check
npm run build

# バックエンド
cd backend
source venv/bin/activate
# 型チェック（pyright または mypy）
# Lintチェック（flake8 または ruff）
```

---

### 2. 環境変数設定

#### バックエンド環境変数

**本番環境 `.env` ファイル:**
```bash
# データベース
DATABASE_URL=postgresql://user:password@host:5432/dbname  # Neon本番URL

# セキュリティ
SECRET_KEY=<本番用の強力なシークレットキー>  # 64文字以上のランダム文字列
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=https://your-production-domain.com
ALLOWED_ORIGINS=https://your-production-domain.com

# Google OAuth（本番用）
GOOGLE_CLIENT_ID=<本番用Google Client ID>
GOOGLE_CLIENT_SECRET=<本番用Google Client Secret>

# 環境
ENVIRONMENT=production
DEBUG=False
```

**チェック項目:**
- [ ] DATABASE_URL が本番データベースを指している
- [ ] SECRET_KEY が開発環境と異なる
- [ ] FRONTEND_URL が本番ドメインを指している
- [ ] Google OAuth認証情報が本番用である
- [ ] DEBUG=False に設定されている

#### フロントエンド環境変数

**本番環境 `.env.production` ファイル:**
```bash
VITE_API_BASE_URL=https://api.your-production-domain.com
VITE_GOOGLE_CLIENT_ID=<本番用Google Client ID>
```

**チェック項目:**
- [ ] VITE_API_BASE_URL が本番APIエンドポイントを指している
- [ ] VITE_GOOGLE_CLIENT_ID が本番用である

---

### 3. データベース準備

#### 本番データベースセットアップ（Neon）

**チェック項目:**
- [ ] 本番データベースが作成されている
- [ ] データベース接続情報を確認
- [ ] データベースユーザーの権限が適切
- [ ] SSL接続が有効

#### マイグレーション実行

**重要:** 本番環境では必ずバックアップを取ってからマイグレーションを実行

```bash
cd backend
source venv/bin/activate

# データベースバックアップ（Neonの場合はコンソールから）
# または pg_dump コマンド

# マイグレーション実行
# Alembicを使用している場合:
alembic upgrade head

# または手動でテーブル作成スクリプトを実行
```

**チェック項目:**
- [ ] バックアップを取得済み
- [ ] マイグレーションスクリプトをテスト環境で検証済み
- [ ] ロールバック手順を準備済み

#### 初期データ投入

**管理者ユーザーの作成:**
```bash
cd backend/scripts
python create_admin_user.py
```

**チェック項目:**
- [ ] 初期管理者ユーザーが作成されている
- [ ] users.is_admin = true
- [ ] admin_users テーブルにレコードが存在
- [ ] デフォルトのシステム設定が投入されている

---

### 4. セキュリティチェック

#### 認証・認可
- [ ] JWT SECRET_KEY が強力（64文字以上のランダム文字列）
- [ ] トークン有効期限が適切（30分推奨）
- [ ] CORS設定が本番ドメインのみ許可
- [ ] 管理者権限チェックが全エンドポイントで実装

#### HTTPSとセキュリティヘッダー
- [ ] HTTPS強制（HTTPからHTTPSへリダイレクト）
- [ ] HSTS（Strict-Transport-Security）ヘッダー設定
- [ ] CSP（Content-Security-Policy）ヘッダー設定
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff

#### 環境変数とシークレット
- [ ] .env ファイルが .gitignore に含まれている
- [ ] シークレット情報がコードに直接記述されていない
- [ ] 開発環境と本番環境で異なるシークレットを使用

#### SQL インジェクション対策
- [ ] SQLAlchemy ORMを使用（生SQLは最小限）
- [ ] ユーザー入力の適切なバリデーション

#### XSS対策
- [ ] Reactのデフォルトエスケープを利用
- [ ] dangerouslySetInnerHTMLを使用していない（または適切にサニタイズ）
- [ ] マークダウンレンダリング時のサニタイズ

---

### 5. パフォーマンス最適化

#### フロントエンド
- [ ] 本番ビルドの最適化（npm run build）
- [ ] コード分割（React.lazy）が適用されている
- [ ] 画像の最適化
- [ ] 不要な依存パッケージの削除

**ビルド確認:**
```bash
cd frontend
npm run build
# dist フォルダのサイズを確認
du -sh dist
```

#### バックエンド
- [ ] データベースクエリの最適化
- [ ] インデックスが適切に設定されている
- [ ] N+1問題がない
- [ ] ページネーションが実装されている（Phase 11で実装済み）

**推奨インデックス:**
```sql
-- users テーブル
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- admin_users テーブル
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_added_by ON admin_users(added_by);
```

---

### 6. デプロイ設定

#### バックエンド（Google Cloud Run）

**Dockerfile チェック:**
- [ ] Dockerfileが最適化されている
- [ ] マルチステージビルドを使用
- [ ] 不要なファイルが含まれていない（.dockerignoreを使用）

**Cloud Run 設定:**
```bash
# イメージビルド
cd backend
docker build -t gcr.io/[PROJECT-ID]/markdown-editor-backend:phase11 .

# イメージプッシュ
docker push gcr.io/[PROJECT-ID]/markdown-editor-backend:phase11

# Cloud Run デプロイ
gcloud run deploy markdown-editor-backend \
  --image gcr.io/[PROJECT-ID]/markdown-editor-backend:phase11 \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=$DATABASE_URL,SECRET_KEY=$SECRET_KEY
```

**チェック項目:**
- [ ] 環境変数がCloud Runに設定されている
- [ ] メモリとCPUが適切に設定されている
- [ ] オートスケーリングが設定されている
- [ ] ヘルスチェックエンドポイント（/health）が動作

#### フロントエンド（Vercel / Cloudflare Pages）

**Vercel デプロイ:**
```bash
cd frontend
npm run build

# Vercel CLI または Git連携でデプロイ
vercel --prod
```

**Cloudflare Pages デプロイ:**
- Git連携でmainブランチへのプッシュで自動デプロイ

**チェック項目:**
- [ ] ビルドコマンドが正しい（npm run build）
- [ ] 出力ディレクトリが正しい（dist）
- [ ] 環境変数が設定されている
- [ ] カスタムドメインが設定されている
- [ ] HTTPS強制が有効

---

### 7. モニタリングとロギング

#### ログ設定
- [ ] Cloud RunまたはVercelのログが有効
- [ ] エラーログが記録されている
- [ ] 重要な操作（管理者追加・削除等）がログに記録

#### モニタリング
- [ ] Google Cloud MonitoringまたはVercel Analyticsが有効
- [ ] アラート設定（エラー率、レスポンス時間）
- [ ] アップタイムモニタリング

#### エラートラッキング（オプション）
- [ ] Sentry等のエラートラッキングツール導入を検討

---

### 8. バックアップと復旧

#### データベースバックアップ
- [ ] 自動バックアップが有効（Neonの自動バックアップ）
- [ ] バックアップの保持期間を確認
- [ ] 手動バックアップ手順を文書化

**手動バックアップ例:**
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### ロールバック計画
- [ ] 前バージョンへのロールバック手順を準備
- [ ] データベーススキーマのロールバック手順（Alembic downgrade）
- [ ] ロールバックテストを実施

---

### 9. ドキュメント準備

- [ ] README.md が最新
- [ ] API仕様書が最新
- [ ] デプロイ手順書が最新（このファイル）
- [ ] 障害対応手順書を作成
- [ ] 運用手順書を作成（管理者追加・削除等）

---

### 10. デプロイ後確認

#### 機能テスト
- [ ] ログイン・ログアウト
- [ ] 管理画面へのアクセス
- [ ] システム設定の編集
- [ ] 管理者管理機能
- [ ] ユーザー管理機能（フィルタ、検索、ページネーション）
- [ ] レスポンシブデザイン（モバイル・タブレット）

#### パフォーマンステスト
- [ ] ページ読み込み速度（3秒以内）
- [ ] API レスポンス時間（500ms以内）
- [ ] 大量データでの動作確認（150+ユーザー）

#### セキュリティテスト
- [ ] HTTPS接続確認
- [ ] セキュリティヘッダー確認
- [ ] 管理者権限が必要な画面への不正アクセス確認
- [ ] CSRF対策確認

---

## 🚀 デプロイ手順

### ステップ1: 事前準備（デプロイ前日）
1. 全チェックリストを確認
2. ステージング環境でフルテスト
3. データベースバックアップ
4. チーム全員にデプロイスケジュール通知

### ステップ2: デプロイ実施（メンテナンス時間帯推奨）
1. メンテナンスモードON
2. データベースバックアップ（再確認）
3. データベースマイグレーション実行
4. バックエンドデプロイ
5. フロントエンドデプロイ
6. 疎通確認
7. メンテナンスモードOFF

### ステップ3: デプロイ後確認（30分以内）
1. 機能テスト実施
2. エラーログ確認
3. パフォーマンス確認
4. ユーザー通知

### ステップ4: 監視（24時間）
1. エラー発生率の監視
2. パフォーマンスの監視
3. ユーザーフィードバックの収集

---

## 🆘 トラブルシューティング

### よくある問題

**問題1: データベース接続エラー**
- DATABASE_URL の確認
- データベースのIPホワイトリスト確認
- SSL証明書の確認

**問題2: CORS エラー**
- ALLOWED_ORIGINS の確認
- フロントエンドのドメインが正しいか確認

**問題3: 認証エラー**
- SECRET_KEY の確認
- Google OAuth認証情報の確認
- トークン有効期限の確認

**問題4: パフォーマンス低下**
- データベースインデックスの確認
- Cloud Runのリソース設定確認
- ログでスロークエリを確認

---

## 📞 緊急連絡先

- 開発チーム: [連絡先]
- インフラチーム: [連絡先]
- データベース管理者: [連絡先]

---

## 📝 変更履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|-----------|---------|--------|
| 2026-01-31 | 1.0 | 初版作成（Phase 11デプロイ用） | Claude + User |

---

**次回デプロイ:** Phase 12（課金機能）の際にこのチェックリストを更新
