# Markdown Editor API - Backend

FastAPIベースのバックエンドAPI。Google OAuth 2.0認証、JWT管理、PostgreSQL（またはSQLite）を使用。

## 必要な環境

- Python 3.12+
- PostgreSQL (Neon) または SQLite（開発用）

## セットアップ

### 1. 仮想環境の作成とアクティベート

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. 環境変数の設定

`.env.example`を`.env`にコピーして編集:

```bash
cp .env.example .env
```

`.env`ファイルを編集:

```env
# Security
SECRET_KEY=<openssl rand -hex 32で生成>

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=sqlite:///./markdown_editor.db  # 開発用
# DATABASE_URL=postgresql://user:password@host/database?sslmode=require  # 本番用
```

### 4. データベースマイグレーション

```bash
alembic upgrade head
```

### 5. 開発サーバーの起動

```bash
uvicorn app.main:app --reload
```

## APIドキュメント

サーバー起動後、以下のURLでAPIドキュメントにアクセス可能:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## エンドポイント一覧

### 認証

- `POST /api/v1/auth/google/login` - Googleログイン
- `GET /api/v1/auth/me` - 現在のユーザー情報取得
- `POST /api/v1/auth/verify` - JWTトークン検証

### 管理者 - 利用状況（要管理者権限）

- `GET /api/v1/admin/usage/summary` - 利用状況サマリー
- `GET /api/v1/admin/usage/stats?days=30` - 統計データ取得
- `GET /api/v1/admin/usage/users?page=1&limit=20` - ユーザー一覧（ページネーション）

### 管理者 - システム設定（要管理者権限）

- `GET /api/v1/admin/settings/browser-guide` - ブラウザガイド取得
- `PUT /api/v1/admin/settings/browser-guide` - ブラウザガイド更新
- `GET /api/v1/admin/settings/terms` - 利用規約取得
- `PUT /api/v1/admin/settings/terms` - 利用規約更新
- `GET /api/v1/admin/settings/maintenance` - メンテナンスモード取得
- `PUT /api/v1/admin/settings/maintenance` - メンテナンスモード更新

### 管理者 - ユーザー管理（要管理者権限）

- `GET /api/v1/admin/admins` - 管理者一覧
- `POST /api/v1/admin/admins` - 管理者追加
- `DELETE /api/v1/admin/admins/{id}` - 管理者削除

### ヘルスチェック

- `GET /` - ルート
- `GET /health` - ヘルスチェック

## テスト

```bash
# APIサーバーを起動
uvicorn app.main:app --reload

# 別ターミナルでテスト
curl http://localhost:8000/health
```

## 統計集計

日次で統計データを集計するスクリプト:

```bash
# 昨日の統計を集計（デフォルト）
python app/scripts/aggregate_stats.py

# 特定の日付の統計を集計
python app/scripts/aggregate_stats.py --date 2026-01-28

# 過去7日間の統計を集計
python app/scripts/aggregate_stats.py --last-n-days 7
```

### Cron設定例

毎日午前1時に実行:

```cron
0 1 * * * cd /path/to/backend && source venv/bin/activate && python app/scripts/aggregate_stats.py
```

## 本番環境デプロイ

### Google Cloud Run

```bash
# Dockerイメージのビルドとデプロイ
gcloud run deploy markdown-editor-api \
  --source . \
  --region asia-northeast1 \
  --set-env-vars DATABASE_URL=$DATABASE_URL,SECRET_KEY=$SECRET_KEY
```

### Neon PostgreSQL

1. Neon.techでプロジェクト作成
2. データベース接続文字列を取得
3. `.env`の`DATABASE_URL`を更新
4. マイグレーション実行: `alembic upgrade head`

## ディレクトリ構造

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPIアプリケーション
│   ├── core/
│   │   ├── config.py            # 環境変数・設定
│   │   ├── security.py          # JWT管理
│   │   └── database.py          # DB接続
│   ├── models/
│   │   ├── user.py             # Userモデル
│   │   └── admin_user.py       # AdminUserモデル
│   ├── schemas/
│   │   └── auth.py             # Pydanticスキーマ
│   ├── api/
│   │   ├── deps.py             # 認証依存性
│   │   └── v1/
│   │       ├── router.py
│   │       └── auth.py         # 認証エンドポイント
│   └── services/
│       └── auth_service.py     # Google OAuth検証
├── alembic/                     # マイグレーション
├── requirements.txt
├── .env.example
└── .gitignore
```

## 完了フェーズ

### Phase 1 完了 ✅

- ✅ プロジェクト構造作成
- ✅ データベーススキーマ（users, admin_users）
- ✅ 認証エンドポイント（Google OAuth）
- ✅ JWT管理
- ✅ CORS設定

### Phase 2 完了 ✅

- ✅ 追加データベースモデル（system_settings, usage_stats, login_history）
- ✅ 管理者機能APIエンドポイント
  - ✅ 利用状況統計API
  - ✅ システム設定管理API
  - ✅ 管理者ユーザー管理API
- ✅ サービス層実装（admin_service）
- ✅ ログイン履歴記録
- ✅ 統計集計バッチ処理

## 次のステップ (Phase 3)

- フロントエンド統合
- E2Eテスト
- 本番環境デプロイ準備
