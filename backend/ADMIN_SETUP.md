# 管理者ユーザーセットアップガイド

このドキュメントでは、Markdown Editorバックエンドの管理者ユーザーをセットアップする方法を説明します。

## 概要

管理画面にアクセスするには、ユーザーが管理者権限を持つ必要があります。管理者権限は以下の2つのテーブルで管理されます：

- **users テーブル**: `is_admin` フラグで管理者かどうかを判定
- **admin_users テーブル**: 管理者として追加された履歴と、誰が追加したかを記録

## 管理者ユーザー作成スクリプト

`app/scripts/create_admin.py` スクリプトを使用して、管理者ユーザーを管理します。

### スクリプトの実行方法

仮想環境を有効化してから実行：

```bash
cd backend
source venv/bin/activate
python -m app.scripts.create_admin [COMMAND]
```

### 利用可能なコマンド

#### 1. 管理者ユーザーを確認（デフォルト）

```bash
python -m app.scripts.create_admin
# または
python -m app.scripts.create_admin --check
```

**出力例：**
```
============================================================
ADMIN USERS CHECK
============================================================

Found 1 admin user(s):

  Email: test-admin@example.com
  ID: e204188b-c625-468e-95b3-e64967b99ef8
  Name: Test Admin
  Google ID: test-google-id-817dfaf1-fa84-4c82-b0b4-41637755ab1a
  Added at: 2026-01-29 03:30:03
```

#### 2. テスト用管理者ユーザーを作成

```bash
python -m app.scripts.create_admin --create-test
```

**機能：**
- メール: `test-admin@example.com`
- 名前: `Test Admin`
- 自動生成Google ID付き
- 既に存在する場合は、そのユーザーを管理者に昇格

**出力例：**
```
Test admin user created successfully!
  Email: test-admin@example.com
  ID: e204188b-c625-468e-95b3-e64967b99ef8
  Name: Test Admin

You can use this account to log in and manage other admins.
```

#### 3. 既存ユーザーを管理者に昇格

```bash
python -m app.scripts.create_admin --add-email user@example.com
```

**用途：**
- Google OAuth で一度ログインしたユーザーを管理者に昇格
- メールアドレスを指定してプロモート

**注意：**
- ユーザーが少なくとも1回はログインしている必要があります
- ユーザーが見つからない場合はエラーが表示されます

#### 4. ヘルプを表示

```bash
python -m app.scripts.create_admin --help
```

## セットアップシナリオ

### シナリオ1: 開発環境での初期セットアップ

```bash
# 1. テスト用管理者ユーザーを作成
python -m app.scripts.create_admin --create-test

# 2. 確認
python -m app.scripts.create_admin --check
```

### シナリオ2: Google OAuth後に管理者を昇格

```bash
# 1. ユーザーがGoogle認証でログイン

# 2. そのユーザーのメールアドレスで管理者昇格
python -m app.scripts.create_admin --add-email your-email@gmail.com

# 3. 確認
python -m app.scripts.create_admin --check
```

### シナリオ3: 本番環境での初期セットアップ

```bash
# 1. DATABASE_URL が PostgreSQL を指す .env を設定

# 2. テスト用管理者作成（一時的）
python -m app.scripts.create_admin --create-test

# 3. 実際のユーザーがGoogle認証でログイン

# 4. そのユーザーを管理者昇格
python -m app.scripts.create_admin --add-email company-admin@example.com

# 5. テスト用管理者を削除（必要に応じて）
# API または直接DB削除
```

## API経由での管理者管理

### 管理者一覧を取得

```bash
curl -X GET "http://localhost:8000/api/v1/admin/admins" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 新しい管理者を追加

```bash
curl -X POST "http://localhost:8000/api/v1/admin/admins" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "newadmin@example.com"}'
```

**要件：**
- 現在のユーザーが管理者である必要があります
- 昇格対象のユーザーが既にデータベースに存在する必要があります

### 管理者権限を削除

```bash
curl -X DELETE "http://localhost:8000/api/v1/admin/admins/{admin_user_id}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## トラブルシューティング

### 問題: 「管理者ユーザーが見つかりません」

**原因：** データベースにユーザーが存在しない
**解決方法：**
```bash
# テスト用管理者を作成
python -m app.scripts.create_admin --create-test
```

### 問題: 「User with email not found」

**原因：** 指定メールアドレスのユーザーがデータベースに存在しない
**解決方法：**
1. ユーザーがGoogle認証で一度ログインしたことを確認
2. 正しいメールアドレスを指定しているか確認
3. 確認コマンドで既存ユーザーをリスト表示

### 問題: 「User is already an admin」

**原因：** 指定されたユーザーが既に管理者
**解決方法：**
```bash
# 確認コマンドで現在の管理者を確認
python -m app.scripts.create_admin --check
```

## データベーススキーマ

### users テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | ユーザーID（主キー） |
| email | String | メールアドレス（ユニーク） |
| name | String | ユーザー名 |
| google_id | String | Google OAuth ID（ユニーク） |
| is_admin | Boolean | 管理者フラグ |
| last_login_at | DateTime | 最後ログイン日時 |
| created_at | DateTime | 作成日時 |

### admin_users テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 管理者レコードID（主キー） |
| user_id | UUID | ユーザーID（外部キー） |
| added_by_user_id | UUID | 追加したユーザーID（外部キー、NULL可） |
| added_at | DateTime | 管理者として追加された日時 |

## 環境変数

`.env` ファイルで以下の設定が可能です：

```env
# 初期管理者メール（カンマ区切り）
INITIAL_ADMIN_EMAILS=admin@example.com,admin2@example.com
```

**注意：** このスクリプトでは現在この設定は使用されません。スクリプトを通じて明示的に管理者を設定してください。

## セキュリティ考慮事項

1. **本番環境では慎重に：** テスト用管理者は開発環境のみで使用してください
2. **パスワード管理：** GoogleOAuth認証を使用しているため、パスワード管理不要
3. **監査ログ：** 管理者追加/削除は `admin_users` テーブルの `added_by_user_id` で誰が行ったかを追跡可能
4. **権限確認：** `require_admin` デペンデンシーで管理画面へのアクセスを制限

## 関連ファイル

- `/backend/app/scripts/create_admin.py` - 管理者管理スクリプト
- `/backend/app/api/v1/admin_users.py` - 管理者管理API
- `/backend/app/services/admin_service.py` - 管理者ビジネスロジック
- `/backend/app/api/deps.py` - require_admin デペンデンシー
- `/backend/app/models/user.py` - Userモデル
- `/backend/app/models/admin_user.py` - AdminUserモデル
