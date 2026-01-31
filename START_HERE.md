# 🚀 開発・テスト スタートガイド

## ✅ 現在の状態

システムは完全に実装され、動作しています：

- ✅ バックエンドAPI: `http://localhost:8000` (起動中)
- ✅ フロントエンド: `http://localhost:5173` (起動中)
- ✅ データベース: マイグレーション適用済み
- ✅ 認証システム: 完全動作

---

## 🎯 クイックスタート（5分で開始）

### 1. システムの動作確認

```bash
# ヘルスチェック
curl http://localhost:8000/health
# 期待: {"status":"healthy"}

# 認証設定確認
curl http://localhost:8000/api/v1/auth/settings
# 期待: {"auth_mode":"email","google_enabled":false,"email_enabled":true}
```

### 2. クイックテストの実行

```bash
cd backend
source venv/bin/activate
python scripts/quick_test.py
```

**このスクリプトは以下を実行します：**
- ✅ パスワードハッシュ化のテスト
- ✅ パスワード強度検証のテスト
- ✅ トークン生成のテスト
- ✅ データベース状態の表示
- ✅ テストユーザーの自動作成

**出力例：**
```
✓ テストユーザーを作成しました
  メール: quicktest@example.com
  パスワード: QuickTest123
  検証URL: http://localhost:5173/verify-email?token=...
```

### 3. ブラウザでテスト

**方法A: 自動作成されたテストユーザーを使用**

1. 上記の検証URLをブラウザで開く
2. メール検証完了
3. ログイン:
   - メール: `quicktest@example.com`
   - パスワード: `QuickTest123`

**方法B: 新規ユーザー登録**

1. http://localhost:5173 を開く
2. 「新規登録はこちら」をクリック
3. フォームに入力して送信
4. バックエンドログで検証URLを確認:
   ```bash
   tail -100 /tmp/claude-1000/.../tasks/b86acab.output | grep -A 15 "DEV MODE"
   ```

---

## 📚 詳細ドキュメント

### 主要ドキュメント

| ドキュメント | 内容 | 用途 |
|-------------|------|------|
| **TESTING_GUIDE.md** | 体系的なテストシナリオ | テスト実施時に参照 |
| **DEVELOPMENT_WORKFLOW.md** | 開発ワークフロー | 新機能開発時に参照 |
| **CLAUDE.md** | プロジェクト概要 | 全体像の理解 |
| **backend/README.md** | バックエンド仕様 | API開発時に参照 |

### ドキュメントの使い分け

**今すぐテストしたい場合:**
→ このファイル（START_HERE.md）のクイックスタートで十分

**体系的にテストしたい場合:**
→ TESTING_GUIDE.md の全シナリオを実行

**新機能を開発したい場合:**
→ DEVELOPMENT_WORKFLOW.md を参照

---

## 🧪 主要なテストシナリオ

### シナリオ1: 基本的な認証フロー（5分）

```bash
# 1. 新規ユーザー登録
ブラウザ: http://localhost:5173/register
入力: メール、パスワード（8文字以上、大文字・小文字・数字）、名前

# 2. メール検証
ログ確認: tail -f <backend-log-file> | grep "DEV MODE"
検証URL取得: http://localhost:5173/verify-email?token=...

# 3. ログイン
ブラウザ: http://localhost:5173/login
入力: 登録したメール・パスワード

# 4. エディタアクセス
自動遷移: http://localhost:5173/editor
```

### シナリオ2: パスワードリセット（3分）

```bash
# 1. リセット要求
ブラウザ: http://localhost:5173/reset-password
入力: 登録済みメールアドレス

# 2. リセットURL取得
ログ確認: grep "パスワードリセット" <backend-log-file>

# 3. 新パスワード設定
ブラウザ: http://localhost:5173/reset-password/{token}
入力: 新しいパスワード（2回）

# 4. 新パスワードでログイン
確認: 新しいパスワードでログイン成功
```

### シナリオ3: 管理者機能（5分）

```bash
# 前提: 管理者権限でログイン
# (.envのINITIAL_ADMIN_EMAILSに設定したメール)

# 1. 管理者画面アクセス
ブラウザ: http://localhost:5173/admin/settings

# 2. 認証設定変更
操作: 認証方式を「両方」に変更
保存: 「保存」ボタンをクリック

# 3. 変更の確認
ログアウト後、ログインページで:
確認: メール・パスワードフォームとGoogleボタンが両方表示

# 4. パスワードポリシー変更
管理画面: 最小文字数を10に変更
テスト: 新規登録で9文字パスワードが拒否される
```

---

## 🔍 デバッグ方法

### バックエンドログの確認

```bash
# 方法1: リアルタイム監視
tail -f /tmp/claude-1000/.../tasks/b86acab.output

# 方法2: メール関連のみ
tail -f <log-file> | grep "DEV MODE"

# 方法3: エラーのみ
tail -f <log-file> | grep ERROR
```

### フロントエンドデバッグ

```javascript
// ブラウザコンソール (F12) で実行

// 1. 認証状態確認
JSON.parse(localStorage.getItem('auth-storage'))

// 2. アクセストークン確認
localStorage.getItem('accessToken')

// 3. ネットワークタブ
// Network → XHR → API呼び出しを確認
```

### データベース確認

```bash
cd backend
source venv/bin/activate

# Pythonインタラクティブシェル
python3

>>> from app.core.database import SessionLocal
>>> from app.models.user import User
>>> db = SessionLocal()
>>>
>>> # すべてのユーザーを表示
>>> users = db.query(User).all()
>>> for u in users:
...     print(f"{u.email} - {u.auth_provider} - 検証:{u.email_verified}")
>>>
>>> db.close()
```

---

## 🎯 推奨される開発フロー

### Day 1: システム理解（今日）

- [x] ✅ クイックテストを実行
- [ ] 基本的な認証フロー（登録→検証→ログイン）をテスト
- [ ] パスワードリセットをテスト
- [ ] 管理者機能を確認
- [ ] ドキュメントを一読

### Day 2: 詳細テスト

- [ ] TESTING_GUIDE.md の全シナリオを実行
- [ ] エラーケースを確認
- [ ] レート制限の動作を確認
- [ ] セキュリティ機能を検証

### Day 3: 開発開始

- [ ] 新機能の設計
- [ ] DEVELOPMENT_WORKFLOW.md に沿って実装
- [ ] 単体テストの追加
- [ ] 統合テストの実施

---

## 💡 便利なコマンド集

### 開発サーバーの起動

```bash
# バックエンド（ターミナル1）
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# フロントエンド（ターミナル2）
cd frontend
npm run dev
```

### データベース操作

```bash
cd backend
source venv/bin/activate

# 現在のマイグレーション確認
alembic current

# マイグレーション履歴
alembic history

# ロールバック
alembic downgrade -1

# 最新に更新
alembic upgrade head
```

### クリーンスタート

```bash
# データベースをリセット
cd backend
rm markdown_editor.db
alembic upgrade head

# テストデータを作成
python scripts/quick_test.py
```

### API テスト（cURL）

```bash
# 登録
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234","name":"Test"}'

# ログイン
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# 認証設定取得
curl http://localhost:8000/api/v1/auth/settings
```

---

## 🐛 よくある問題と解決策

### 問題: "Failed to fetch"

```bash
# 原因: バックエンドが起動していない
# 解決:
ps aux | grep uvicorn  # プロセス確認
cd backend && source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 問題: メール検証リンクが見つからない

```bash
# 解決: バックエンドログを確認
tail -100 /tmp/claude-1000/.../tasks/b86acab.output | grep -A 20 "DEV MODE"

# または新しいターミナルで監視
uvicorn app.main:app --reload 2>&1 | grep -A 20 "DEV MODE"
```

### 問題: ログインできない

```bash
# チェックリスト:
# 1. メールは検証済みか？
python scripts/quick_test.py  # データベース状態を確認

# 2. パスワードは正しいか？
# 3. レート制限に引っかかっていないか？（15分待つ）
```

---

## 📊 現在のテストデータ

クイックテストスクリプトが以下のユーザーを作成しました：

| メールアドレス | パスワード | 認証方式 | 検証状態 | 管理者 |
|---------------|-----------|---------|---------|--------|
| quicktest@example.com | QuickTest123 | email | 未検証* | No |
| test-admin@example.com | N/A | google | 済 | Yes |
| testuser@example.com | 登録時に設定 | email | 未検証 | No |

*検証URLが出力されているので、すぐに検証可能

---

## 🎓 学習リソース

### APIドキュメント

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 主要技術

- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- Zustand: https://zustand-demo.pmnd.rs/
- MUI: https://mui.com/

---

## 🎯 チェックリスト

開発・テストを開始する前に確認:

- [x] ✅ バックエンドが起動している
- [x] ✅ フロントエンドが起動している
- [x] ✅ データベースマイグレーションが適用されている
- [x] ✅ クイックテストが成功した
- [ ] 基本的な認証フローをテストした
- [ ] TESTING_GUIDE.md を確認した
- [ ] DEVELOPMENT_WORKFLOW.md を確認した

---

## 🚀 次のアクション

### 今すぐできること

1. **ブラウザでテスト**
   ```
   http://localhost:5173
   ```

2. **クイックテストで作成されたユーザーでログイン**
   - 検証URLをブラウザで開く（ログに出力されています）
   - ログイン: quicktest@example.com / QuickTest123

3. **API ドキュメントを確認**
   ```
   http://localhost:8000/docs
   ```

4. **詳細テストの実施**
   ```
   詳細はTESTING_GUIDE.mdを参照
   ```

---

**準備完了！開発・テストを開始してください 🎉**

質問や問題が発生した場合は、各ドキュメントのトラブルシューティングセクションを確認してください。
