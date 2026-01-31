# 開発ワークフロー - メール・パスワード認証システム

## 🚀 開発環境セットアップ

### 初回セットアップ

```bash
# 1. リポジトリのクローン（既に完了している場合はスキップ）
cd /home/deguchi/projects/002_UpCenterSystem/MarkdownEditor/MarkdownEditor

# 2. バックエンドセットアップ
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# 3. フロントエンドセットアップ
cd ../frontend
npm install

# 4. 環境変数の設定
# backend/.env を確認・編集
# frontend/.env.local を確認・編集
```

### 日常的な開発フロー

#### ターミナル1: バックエンド起動
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# または、ログを監視しながら
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | tee backend.log
```

#### ターミナル2: フロントエンド起動
```bash
cd frontend
npm run dev
```

#### ターミナル3: 開発用ツール（オプション）
```bash
# データベースの監視
cd backend
source venv/bin/activate
python3

>>> from app.core.database import SessionLocal
>>> from app.models.user import User
>>> db = SessionLocal()
>>> users = db.query(User).all()
>>> for u in users: print(f"{u.email} - {u.auth_provider}")
```

---

## 🔄 開発サイクル

### 機能追加の典型的なフロー

#### 1. バックエンドに新機能を追加

**例: ユーザープロフィール更新機能**

```python
# backend/app/schemas/auth.py に追加
class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    # 他のフィールド

# backend/app/api/v1/auth.py に追加
@router.put("/profile")
def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.name:
        current_user.name = request.name
    db.commit()
    return UserResponse.model_validate(current_user)
```

**開発時のチェックポイント:**
- [ ] スキーマ定義を追加
- [ ] エンドポイント実装
- [ ] バリデーション追加
- [ ] エラーハンドリング
- [ ] API ドキュメント確認（http://localhost:8000/docs）

#### 2. フロントエンドに対応UIを追加

```typescript
// frontend/src/stores/authStore.ts に追加
updateProfile: async (name: string) => {
  const { accessToken } = get();
  try {
    const response = await apiClient.put<User>(
      '/api/v1/auth/profile',
      { name },
      accessToken || undefined
    );
    set({ user: response });
    return true;
  } catch (error) {
    console.error('Profile update failed:', error);
    return false;
  }
},

// frontend/src/pages/ProfilePage/index.tsx を作成
// フォームUIを実装
```

**開発時のチェックポイント:**
- [ ] Store にメソッド追加
- [ ] 型定義更新
- [ ] UI コンポーネント作成
- [ ] エラーハンドリング
- [ ] ユーザーフィードバック（成功/エラーメッセージ）

#### 3. テスト

```bash
# 手動テスト
1. ブラウザで機能を確認
2. ネットワークタブでAPIコール確認
3. エラーケースをテスト

# APIテスト（cURL）
curl -X PUT http://localhost:8000/api/v1/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Updated Name"}'
```

---

## 🗃️ データベース管理

### マイグレーション作成

```bash
cd backend
source venv/bin/activate

# 新しいマイグレーションを自動生成
alembic revision --autogenerate -m "description_of_changes"

# 生成されたマイグレーションファイルを確認・編集
# alembic/versions/xxx_description_of_changes.py

# マイグレーションを適用
alembic upgrade head

# ロールバック（1つ前に戻る）
alembic downgrade -1

# 現在のバージョン確認
alembic current
```

### データベースのリセット

```bash
# 開発環境でデータベースをクリーンな状態にする
cd backend
rm markdown_editor.db  # SQLiteの場合
alembic upgrade head

# 初期データを投入
python3 scripts/seed_data.py  # スクリプトを作成する場合
```

### データベースのバックアップ

```bash
# SQLiteの場合
cd backend
cp markdown_editor.db markdown_editor_backup_$(date +%Y%m%d_%H%M%S).db

# PostgreSQLの場合
pg_dump -U username -d database_name > backup.sql
```

---

## 🐛 デバッグ Tips

### バックエンドデバッグ

#### 1. ログレベルの調整

```python
# backend/app/main.py
import logging

logging.basicConfig(
    level=logging.DEBUG,  # DEBUG, INFO, WARNING, ERROR
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

#### 2. デバッガーの使用

```python
# コード内にブレークポイント
import pdb; pdb.set_trace()

# または
import ipdb; ipdb.set_trace()  # pip install ipdb
```

#### 3. リクエスト/レスポンスのロギング

```python
# ミドルウェアを追加してすべてのリクエストをログ
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response: {response.status_code}")
    return response
```

### フロントエンドデバッグ

#### 1. React Developer Tools

ブラウザ拡張機能をインストール:
- Chrome: React Developer Tools
- State の確認
- Component ツリーの確認

#### 2. Redux DevTools / Zustand DevTools

```typescript
// frontend/src/stores/authStore.ts
import { devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // ... store implementation
      }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' }  // DevTools での表示名
  )
);
```

#### 3. ネットワークリクエストの監視

```typescript
// frontend/src/utils/api.ts にロギング追加
async post<T, D = unknown>(
  endpoint: string,
  data?: D,
  token?: string
): Promise<T> {
  console.log('API POST:', endpoint, data);  // デバッグログ
  const response = await fetch(/* ... */);
  console.log('API Response:', response.status);  // デバッグログ
  return this.handleResponse<T>(response);
}
```

---

## 🧹 コード品質管理

### Linting & Formatting

#### バックエンド (Python)

```bash
cd backend
source venv/bin/activate

# Black (フォーマッター)
pip install black
black app/

# Flake8 (リンター)
pip install flake8
flake8 app/

# MyPy (型チェック)
pip install mypy
mypy app/
```

#### フロントエンド (TypeScript)

```bash
cd frontend

# ESLint
npm run lint

# Prettier
npm run format

# 型チェック
npm run type-check
```

### pre-commit フック設定

```bash
# backend/.git/hooks/pre-commit
#!/bin/bash
cd backend
source venv/bin/activate
black app/ --check
flake8 app/

cd ../frontend
npm run lint
npm run type-check
```

---

## 📝 コーディング規約

### バックエンド (Python)

```python
# ✅ Good
def register_user(
    email: str,
    password: str,
    name: str
) -> User:
    """
    新規ユーザーを登録する

    Args:
        email: ユーザーのメールアドレス
        password: プレーンテキストパスワード
        name: ユーザー名

    Returns:
        作成されたUserオブジェクト

    Raises:
        HTTPException: メールが既に登録されている場合
    """
    # 実装
    pass

# ❌ Bad
def reg_usr(e, p, n):
    # 実装
    pass
```

### フロントエンド (TypeScript)

```typescript
// ✅ Good
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

const handleSubmit = async (data: RegisterFormData): Promise<boolean> => {
  // 実装
};

// ❌ Bad
const handleSubmit = async (data: any) => {
  // 実装
};
```

---

## 🔒 セキュリティチェックリスト

開発中に常に確認:

- [ ] パスワードは平文で保存していない
- [ ] APIエンドポイントに適切な認証が設定されている
- [ ] ユーザー入力はバリデーションされている
- [ ] SQLインジェクション対策（ORMを使用）
- [ ] XSS対策（入力のサニタイズ）
- [ ] CSRF対策（CORSミドルウェア設定）
- [ ] センシティブ情報がログに出力されていない
- [ ] 環境変数が `.gitignore` に含まれている

---

## 🚢 デプロイ準備

### 本番環境チェックリスト

#### バックエンド

- [ ] `DEBUG=False` に設定
- [ ] PostgreSQLに移行
- [ ] SMTP設定を本番サービスに変更
- [ ] `SECRET_KEY` を強力なものに変更
- [ ] `ALLOWED_ORIGINS` を本番URLに設定
- [ ] HTTPSを有効化
- [ ] ログローテーション設定
- [ ] エラー監視（Sentry等）

#### フロントエンド

- [ ] `VITE_API_BASE_URL` を本番APIに設定
- [ ] ビルド最適化（`npm run build`）
- [ ] 静的ファイルのキャッシュ設定
- [ ] CDN設定
- [ ] HTTPS強制

### 環境変数の管理

```bash
# 開発環境
backend/.env
frontend/.env.local

# ステージング環境
backend/.env.staging
frontend/.env.staging

# 本番環境
backend/.env.production
frontend/.env.production
```

---

## 📊 モニタリング & ログ

### ログの確認方法

```bash
# バックエンドログ
tail -f backend.log

# 特定のエラーを監視
tail -f backend.log | grep ERROR

# ログイン試行を監視
tail -f backend.log | grep "login"

# メール送信を監視
tail -f backend.log | grep "DEV MODE"
```

### 重要なメトリクス

開発中に監視すべき項目:
- レスポンスタイム（API）
- エラー率
- ログイン成功/失敗率
- 登録完了率
- メール検証率

---

## 🎯 開発の優先順位

### Phase 1: 基本機能の安定化（現在）
- [x] メール・パスワード認証
- [x] Google OAuth
- [x] 管理者機能
- [ ] E2Eテスト
- [ ] エラーハンドリング改善

### Phase 2: ユーザー体験向上
- [ ] パスワード強度インジケーター
- [ ] ソーシャルログイン追加（GitHub, Twitter等）
- [ ] 2要素認証（2FA）
- [ ] セッション管理改善

### Phase 3: 管理者機能拡張
- [ ] ユーザー検索・フィルタ
- [ ] ユーザーアクティビティログ
- [ ] メール通知テンプレート管理
- [ ] システムヘルスダッシュボード

### Phase 4: スケーラビリティ
- [ ] Redis でのセッション管理
- [ ] キャッシング戦略
- [ ] データベースインデックス最適化
- [ ] API レート制限の改善

---

## 💡 よくある開発タスク

### 新しいAPIエンドポイントの追加

```bash
# 1. スキーマ定義
# backend/app/schemas/your_module.py

# 2. エンドポイント実装
# backend/app/api/v1/your_module.py

# 3. ルーター登録
# backend/app/api/v1/router.py

# 4. テスト
curl http://localhost:8000/docs  # Swagger UI で確認
```

### 新しいページの追加

```bash
# 1. ページコンポーネント作成
# frontend/src/pages/YourPage/index.tsx

# 2. ルート追加
# frontend/src/App.tsx

# 3. ナビゲーション追加（必要に応じて）
# frontend/src/components/Layout/Navigation.tsx
```

### データベーススキーマの変更

```bash
# 1. モデル変更
# backend/app/models/your_model.py

# 2. マイグレーション生成
alembic revision --autogenerate -m "your_change_description"

# 3. マイグレーション確認・編集
# backend/alembic/versions/xxx_your_change_description.py

# 4. 適用
alembic upgrade head

# 5. フロントエンドの型更新
# frontend/src/types/index.ts
```

---

## 🎓 学習リソース

### 推奨ドキュメント

**バックエンド:**
- FastAPI: https://fastapi.tiangolo.com/
- SQLAlchemy: https://docs.sqlalchemy.org/
- Alembic: https://alembic.sqlalchemy.org/
- Pydantic: https://docs.pydantic.dev/

**フロントエンド:**
- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/docs/
- Zustand: https://zustand-demo.pmnd.rs/
- MUI: https://mui.com/

**認証:**
- OAuth 2.0: https://oauth.net/2/
- bcrypt: https://github.com/pyca/bcrypt/

---

**このワークフローガイドを参考に、効率的な開発を進めてください！質問や問題が発生したら、TESTING_GUIDE.md のトラブルシューティングセクションも確認してください。**
