# クイックスタート: 管理者ユーザーセットアップ

バックエンドサーバーを起動する前に、管理者ユーザーをセットアップしてください。

## 5分でできるセットアップ

### ステップ1: 仮想環境を有効化

```bash
cd backend
source venv/bin/activate
```

### ステップ2: テスト用管理者ユーザーを作成

```bash
python -m app.scripts.create_admin --create-test
```

出力：
```
Test admin user created successfully!
  Email: test-admin@example.com
  ID: e204188b-c625-468e-95b3-e64967b99ef8
  Name: Test Admin

You can use this account to log in and manage other admins.
```

### ステップ3: 確認

```bash
python -m app.scripts.create_admin --check
```

出力：
```
Found 1 admin user(s):

  Email: test-admin@example.com
  ID: e204188b-c625-468e-95b3-e64967b99ef8
  Name: Test Admin
  Google ID: test-google-id-817dfaf1-fa84-4c82-b0b4-41637755ab1a
  Added at: 2026-01-29 03:30:03
```

### ステップ4: サーバーを起動

```bash
uvicorn app.main:app --reload
```

## 次のステップ

### Googleログインでテスト

1. フロントエンドサーバーを起動
2. ブラウザで `http://localhost:5173` にアクセス
3. Googleログインボタンをクリック
4. テスト管理者アカウント情報を使用してログイン

### 管理画面にアクセス

ログイン後、以下のURLで管理画面にアクセス可能：
- `http://localhost:5173/admin/dashboard`
- `http://localhost:5173/admin/users`
- `http://localhost:5173/admin/settings`

## よくある質問

**Q: テスト用メールアドレスではなく、自分のメールで管理者を作成したい**

```bash
# 1. Google認証で一度ログインしてユーザーを作成
# 2. その後、以下のコマンドで昇格
python -m app.scripts.create_admin --add-email your-email@gmail.com
```

**Q: 管理者ユーザーを削除したい**

API経由で削除：
```bash
# 1. 管理者一覧を取得
curl -X GET "http://localhost:8000/api/v1/admin/admins" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. 管理者を削除
curl -X DELETE "http://localhost:8000/api/v1/admin/admins/{admin_user_id}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Q: 複数の管理者を追加したい**

```bash
# 各ユーザーについて実行
python -m app.scripts.create_admin --add-email user1@example.com
python -m app.scripts.create_admin --add-email user2@example.com

# 確認
python -m app.scripts.create_admin --check
```

**Q: パスワードはどこで設定する?**

Google OAuth認証を使用しているため、パスワード管理は不要です。Googleアカウントで認証します。

## トラブルシューティング

### エラー: "User with email not found"

**原因：** ユーザーがGoogle認証でまだログインしていない

**解決方法：**
1. フロントエンドからGoogle認証でログイン
2. ユーザーがデータベースに作成される
3. その後、スクリプトで昇格

### エラー: "User is already an admin"

**原因：** 既に管理者権限を持っている

**解決方法：**
```bash
# 確認して他の管理者メールを指定
python -m app.scripts.create_admin --check
```

## 関連ドキュメント

詳細な設定方法は `ADMIN_SETUP.md` を参照してください。
