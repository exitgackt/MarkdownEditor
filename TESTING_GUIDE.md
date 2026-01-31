# メール・パスワード認証システム - テストガイド

## 📋 テスト環境の確認

### 前提条件チェックリスト

```bash
# 1. バックエンドサーバーの起動確認
curl http://localhost:8000/health
# 期待結果: {"status":"healthy"}

# 2. フロントエンドサーバーの起動確認
curl -I http://localhost:5173
# 期待結果: HTTP/1.1 200 OK

# 3. データベースマイグレーション確認
cd backend
source venv/bin/activate
alembic current
# 期待結果: add_email_auth_001 (head)

# 4. 認証設定の確認
curl http://localhost:8000/api/v1/auth/settings
# 期待結果: {"auth_mode":"email","google_enabled":false,"email_enabled":true}
```

---

## 🧪 テストシナリオ

### シナリオ 1: 新規ユーザー登録フロー（正常系）

#### 1.1 ユーザー登録

**手順:**
1. ブラウザで `http://localhost:5173` を開く
2. 「新規登録はこちら」リンクをクリック
3. 以下の情報を入力:
   - メールアドレス: `user1@test.com`
   - パスワード: `TestUser123`
   - パスワード（確認）: `TestUser123`
   - 名前: `Test User 1`
4. 「登録」ボタンをクリック

**期待結果:**
- ✅ 成功メッセージが表示される
- ✅ "登録が完了しました。メールに送信された確認リンクをクリックしてください。" と表示
- ✅ バックエンドログにメール内容が出力される

**検証コマンド:**
```bash
# バックエンドログで検証URLを確認
tail -100 /tmp/claude-1000/.../tasks/b86acab.output | grep -A 20 "DEV MODE"
```

#### 1.2 メール検証

**手順:**
1. バックエンドログから検証URLをコピー
   - 形式: `http://localhost:5173/verify-email?token=...`
2. ブラウザで検証URLを開く

**期待結果:**
- ✅ "メールアドレスが確認されました！" メッセージ表示
- ✅ 3秒後に自動的にログインページへリダイレクト

#### 1.3 ログイン

**手順:**
1. ログインページで入力:
   - メールアドレス: `user1@test.com`
   - パスワード: `TestUser123`
2. 「ログイン」ボタンをクリック

**期待結果:**
- ✅ エディタページ (`/editor`) にリダイレクト
- ✅ ユーザー情報が表示される
- ✅ 認証トークンがlocalStorageに保存される

**検証:**
```javascript
// ブラウザコンソールで確認
localStorage.getItem('accessToken')
// 結果: トークン文字列が返される
```

---

### シナリオ 2: パスワードリセットフロー

#### 2.1 パスワードリセット要求

**手順:**
1. ログインページで「パスワードを忘れた方」をクリック
2. メールアドレスを入力: `user1@test.com`
3. 「リセットメールを送信」ボタンをクリック

**期待結果:**
- ✅ "パスワードリセットメールを送信しました" メッセージ表示
- ✅ バックエンドログにリセットメールが出力される

**検証:**
```bash
tail -100 /tmp/claude-1000/.../tasks/b86acab.output | grep -A 20 "パスワードリセット"
```

#### 2.2 新しいパスワード設定

**手順:**
1. ログからリセットURLをコピー
   - 形式: `http://localhost:5173/reset-password/{token}`
2. ブラウザでリセットURLを開く
3. 新しいパスワードを入力:
   - 新しいパスワード: `NewPass456`
   - 新しいパスワード（確認）: `NewPass456`
4. 「パスワードをリセット」ボタンをクリック

**期待結果:**
- ✅ "パスワードがリセットされました" メッセージ表示
- ✅ 2秒後にログインページへリダイレクト

#### 2.3 新しいパスワードでログイン

**手順:**
1. 新しいパスワードでログイン試行:
   - メールアドレス: `user1@test.com`
   - パスワード: `NewPass456`

**期待結果:**
- ✅ ログイン成功
- ✅ エディタページへ遷移

---

### シナリオ 3: エラーケーステスト

#### 3.1 弱いパスワードでの登録

**テストケース:**
| パスワード | 期待されるエラー |
|-----------|----------------|
| `test` | パスワードは8文字以上である必要があります |
| `testtest` | パスワードには大文字を含める必要があります |
| `TESTTEST` | パスワードには小文字を含める必要があります |
| `TestTest` | パスワードには数字を含める必要があります |

**手順:**
1. 登録ページで上記の各パスワードを試す
2. エラーメッセージを確認

**期待結果:**
- ✅ 各パスワードに対応する適切なエラーメッセージが表示される

#### 3.2 メール検証なしでログイン試行

**手順:**
1. 新しいユーザーを登録（例: `user2@test.com`）
2. メール検証をスキップ
3. 直接ログインを試行

**期待結果:**
- ✅ エラーメッセージ: "メールアドレスが未確認です。確認メールを確認してください。"
- ✅ ログイン失敗

#### 3.3 レート制限テスト

**登録レート制限（3回/60分）:**
```bash
# 同じIPから4回連続で登録を試行
for i in {1..4}; do
  curl -X POST http://localhost:8000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@test.com\",\"password\":\"Test123\",\"name\":\"Test $i\"}"
  echo ""
done
```

**期待結果:**
- ✅ 4回目: "登録試行回数が上限に達しました。しばらく待ってから再試行してください。"

**ログインレート制限（5回/15分）:**
```bash
# 誤ったパスワードで6回ログイン試行
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user1@test.com","password":"wrongpass"}'
  echo ""
done
```

**期待結果:**
- ✅ 6回目: "ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。"

---

### シナリオ 4: 管理者機能テスト

#### 4.1 管理者として認証設定変更

**前提条件:**
- `.env` の `INITIAL_ADMIN_EMAILS` に設定したメールで登録済み

**手順:**
1. 管理者権限でログイン
2. `http://localhost:5173/admin/settings` にアクセス
3. 「認証方式設定」セクションを確認

**期待結果:**
- ✅ 認証方式設定UIが表示される
- ✅ 3つのオプションが選択可能:
  - メール・パスワードのみ
  - Google認証のみ
  - 両方

#### 4.2 パスワードポリシー変更

**手順:**
1. 管理者設定ページで以下を変更:
   - 最小文字数: `10`
   - 特殊文字必須: チェックON
2. 「保存」ボタンをクリック

**期待結果:**
- ✅ "認証設定を更新しました" メッセージ表示
- ✅ 設定が保存される

**検証:**
```bash
# 新しいポリシーが反映されているか確認
curl http://localhost:8000/api/v1/admin/settings/auth \
  -H "Authorization: Bearer <管理者のトークン>"
```

#### 4.3 新しいポリシーで登録テスト

**手順:**
1. 新しいユーザー登録を試行
2. パスワード: `Test1234` (10文字未満、特殊文字なし)

**期待結果:**
- ✅ エラー: "パスワードは10文字以上である必要があります"

**修正後:**
- パスワード: `Test1234!@` (10文字以上、特殊文字あり)
- ✅ 登録成功

---

### シナリオ 5: 認証方式切り替えテスト

#### 5.1 認証方式を「両方」に変更

**手順:**
1. 管理者設定で認証方式を「両方」に変更
2. ログアウト
3. ログインページを確認

**期待結果:**
- ✅ メール・パスワードフォームが表示される
- ✅ 「または」区切り線が表示される
- ✅ Googleログインボタンが表示される

#### 5.2 認証方式を「Google認証のみ」に変更

**手順:**
1. 管理者設定で認証方式を「Google認証のみ」に変更
2. ログインページを確認

**期待結果:**
- ✅ メール・パスワードフォームが非表示
- ✅ Googleログインボタンのみ表示
- ✅ 「新規登録」「パスワードを忘れた方」リンクが非表示

---

## 🔍 API テスト

### cURLコマンドでのテスト

#### 1. ユーザー登録
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@test.com",
    "password": "ApiTest123",
    "name": "API Test User"
  }'
```

#### 2. ログイン
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "TestUser123"
  }'
# レスポンスからaccess_tokenを保存
```

#### 3. トークン検証
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify \
  -H "Authorization: Bearer <your_token>"
```

#### 4. パスワード変更
```bash
curl -X POST http://localhost:8000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "current_password": "TestUser123",
    "new_password": "NewPass789"
  }'
```

---

## 📊 データベース検証

### ユーザーデータの確認

```bash
cd backend
source venv/bin/activate
python3 << EOF
from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()

print(f"総ユーザー数: {len(users)}\n")
for user in users:
    print(f"Email: {user.email}")
    print(f"Name: {user.name}")
    print(f"Auth Provider: {user.auth_provider}")
    print(f"Email Verified: {user.email_verified}")
    print(f"Is Admin: {user.is_admin}")
    print(f"Has Password: {bool(user.hashed_password)}")
    print("-" * 50)

db.close()
EOF
```

### ログイン履歴の確認

```bash
python3 << EOF
from app.core.database import SessionLocal
from app.models.login_history import LoginHistory
from app.models.user import User

db = SessionLocal()
history = db.query(LoginHistory).join(User).limit(10).all()

print("最新のログイン履歴（10件）:\n")
for record in history:
    user = db.query(User).filter(User.id == record.user_id).first()
    print(f"User: {user.email}")
    print(f"IP: {record.ip_address}")
    print(f"Time: {record.logged_in_at}")
    print("-" * 50)

db.close()
EOF
```

---

## 🐛 トラブルシューティング

### 一般的な問題と解決策

#### 問題 1: "Failed to fetch"エラー

**原因:** バックエンドが起動していない

**解決:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 問題 2: メール検証リンクが見つからない

**原因:** ログファイルの場所がわからない

**解決:**
```bash
# バックエンドログを確認
ps aux | grep uvicorn | grep -v grep
# PIDを確認後、そのプロセスの出力を確認

# または新しいターミナルでログを監視
cd backend
source venv/bin/activate
uvicorn app.main:app --reload 2>&1 | grep -A 20 "DEV MODE"
```

#### 問題 3: パスワードが保存されない

**原因:** bcryptの問題

**検証:**
```bash
cd backend
source venv/bin/activate
python3 -c "
import bcrypt
pwd = b'test'
hashed = bcrypt.hashpw(pwd, bcrypt.gensalt())
print('Hash:', hashed)
print('Verify:', bcrypt.checkpw(pwd, hashed))
"
```

#### 問題 4: 管理者権限がない

**原因:** メールアドレスが `INITIAL_ADMIN_EMAILS` に含まれていない

**解決:**
```bash
# .envファイルを確認
cat backend/.env | grep INITIAL_ADMIN_EMAILS

# 必要に応じて追加
# INITIAL_ADMIN_EMAILS=admin@example.com,youremail@example.com
```

---

## ✅ テスト完了チェックリスト

### 基本機能
- [ ] ユーザー登録が正常に完了する
- [ ] メール検証リンクが生成される
- [ ] メール検証後、ログインできる
- [ ] ログイン後、エディタページに遷移する
- [ ] パスワードリセットフローが動作する

### セキュリティ
- [ ] 弱いパスワードが拒否される
- [ ] メール未確認ユーザーがログインできない
- [ ] レート制限が機能する
- [ ] パスワードが暗号化されて保存される
- [ ] トークンの有効期限が機能する

### 管理者機能
- [ ] 認証方式を変更できる
- [ ] パスワードポリシーを変更できる
- [ ] 変更したポリシーが新規登録に反映される
- [ ] 管理者ユーザーの追加・削除ができる

### エラーハンドリング
- [ ] 重複メールアドレスでエラーが出る
- [ ] 無効なトークンでエラーが出る
- [ ] 期限切れトークンでエラーが出る
- [ ] 誤ったパスワードでエラーが出る

---

## 📈 パフォーマンステスト

### 負荷テスト（オプション）

```bash
# Apache Benchを使用した簡易負荷テスト
# 100リクエスト、10並行
ab -n 100 -c 10 http://localhost:8000/api/v1/auth/settings

# 期待値:
# - 全リクエストが成功（200 OK）
# - 平均レスポンス時間 < 100ms
```

---

## 🎯 次のステップ

テストが完了したら:

1. **E2Eテスト自動化**: Playwright/Cypressの導入
2. **ユニットテスト**: Jest/Pytestの追加
3. **CI/CD**: GitHub Actionsでの自動テスト
4. **本番環境準備**: PostgreSQL、SMTP設定
5. **モニタリング**: ログ集約、エラートラッキング

---

**このガイドを使用して体系的にテストを実施してください。すべてのチェックリストが完了したら、本番環境へのデプロイ準備が整います！**
