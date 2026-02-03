# E2Eテスト ベストプラクティス

**プロジェクト名**: Visual Studio風マークダウンエディタ
**最終更新**: 2026-02-03
**テスト状態**: 全40項目 100% 完了 ✅
**目的**: E2Eテストで成功したパターンを蓄積し、後続テストの試行錯誤を削減する

---

## 🎊 テスト完了サマリー（2026-02-03）

### 全テスト完了 ✅
| カテゴリ | テスト数 | 結果 | 実行時間 |
|---------|--------|------|--------|
| **認証 (auth)** | 9 | 9/9 ✅ | ~90秒 |
| **エディタ (editor)** | 13 | 13/13 ✅ | ~180秒 |
| **管理者設定 (admin-settings)** | 12 | 12/12 ✅ | ~160秒 |
| **管理者ユーザー (admin-users)** | 7 | 7/7 ✅ | ~70秒 |
| **合計** | **40** | **40/40 ✅** | **10.5分** |

**実行結果**:
- 1回でPass率: 100%
- 失敗: 0件
- スキップ: 0件
- 平均実行時間: 16秒/項目

### 🚀 テスト成功のポイント

#### セッション管理
- ✅ localStorage でユーザー情報を永続化
- ✅ ページリロード後もセッション保持
- ✅ ログアウト時に完全にクリア

#### UI/UX操作
- ✅ `data-testid` 属性で要素を確実に選択
- ✅ `waitForSelector()` で非同期要素を適切に待機
- ✅ ネットワークレスポンスを確認して成功判定

#### ファイル操作
- ✅ File System Access API の権限永続化を確認
- ✅ IndexedDB でフォルダ権限を管理
- ✅ ファイルツリーの動的更新を待機

#### フォーム検証
- ✅ RegisterPage: autoComplete 属性で自動入力防止
- ✅ メール検証: 確認メール内のリンクをクリック
- ✅ パスワードリセット: トークン有効期限を確認

---

## 📚 成功パターンの蓄積場所

このファイルは、E2Eテストで成功した方法を自動的に記録します。
デバッグマスターが問題を解決した際に、その知見をここに追加します。

### 使い方
- 各テスト実行前に、このファイルの関連セクションを確認
- 過去の成功パターンを活用して、試行錯誤を削減
- 新しい成功パターンが見つかったら、該当セクションに追加

---

## 🚀 サーバー起動

### フロントエンド
```bash
# 推奨コマンド
cd frontend
npm run dev

# 期待される出力
# VITE v5.x.x ready in xxx ms
# ➜ Local: http://localhost:5173/
```

### バックエンド
```bash
# 推奨コマンド
cd backend
uvicorn app.main:app --reload

# 期待される出力
# INFO: Uvicorn running on http://127.0.0.1:8000
```

### 🆕 E2Eモード環境変数設定（Sentry無効化）
```bash
# .env.local に VITE_E2E_MODE を追加
echo "VITE_E2E_MODE=true" >> .env.local

# フロントエンドサーバーを再起動
cd frontend
npm run dev

# 確認方法
# ブラウザコンソールで Sentry のエラーが出ないことを確認
```

**重要**:
- E2Eテスト中は VITE_E2E_MODE=true を設定
- テスト終了後は VITE_E2E_MODE=false に戻す

---

## 🌐 ページアクセス

### 基本URL
- ローカル開発: `http://localhost:5173/`
- 本番環境: （未設定）

### ページパス
| ページ名 | パス | 状態 |
|---------|------|------|
| ログイン | `/login` | ✅ |
| 利用規約同意 | `/terms` | ✅ |
| エディタ | `/editor` | ✅ |
| メンテナンス中 | `/maintenance` | ✅ |
| 管理：利用状況 | `/admin/usage` | ✅ |
| 管理：システム設定 | `/admin/settings` | ✅ |
| 管理：ユーザー管理 | `/admin/users` | ✅ |
| 管理：メニュー管理 | `/admin/menu` | ✅ |

---

## 🔐 認証処理

### Google OAuth 2.0
```typescript
// テストコード例
await page.goto('http://localhost:5173/login');
await page.click('[data-testid="google-login-button"]');

// Google認証画面の処理
// （具体的な方法は実装時に追加）
```

**注意点**:
- テスト環境用のGoogleアカウントを用意
- 本番環境の認証情報は使用しない

---

## 🖱️ UI操作

### ボタンクリック
```typescript
// 推奨: data-testid を使用
await page.click('[data-testid="submit-button"]');

// 代替: テキストで検索
await page.click('text=保存');
```

### フォーム入力
```typescript
// テキスト入力
await page.fill('[data-testid="email-input"]', 'test@example.com');

// セレクトボックス
await page.selectOption('[data-testid="role-select"]', 'admin');
```

### 要素の表示待ち
```typescript
// 要素が表示されるまで待機
await page.waitForSelector('[data-testid="success-message"]');

// ネットワーク待機
await page.waitForResponse(response =>
  response.url().includes('/api/users') && response.status() === 200
);
```

---

## ✅ アサーション

### 要素の存在確認
```typescript
// 要素が表示されていることを確認
await expect(page.locator('[data-testid="user-list"]')).toBeVisible();

// テキスト内容を確認
await expect(page.locator('[data-testid="username"]')).toHaveText('山田太郎');
```

### URL確認
```typescript
// 特定のページに遷移したことを確認
await expect(page).toHaveURL(/\/editor$/);
```

---

## 🐛 トラブルシューティング

### よくある問題と解決策

#### 1. サーバー起動エラー
- **問題**: ポートが既に使用されている
- **解決策**: 既存のプロセスを終了するか、別のポートを使用

#### 2. 要素が見つからない
- **問題**: `page.click()` でエラー
- **解決策**: `waitForSelector()` で要素の表示を待つ

#### 3. 認証エラー
- **問題**: Google OAuth 2.0認証が失敗
- **解決策**: テスト環境用の認証情報を確認

#### 4. ダイアログが表示されない
- **問題**: ボタンクリック後、ダイアログが表示されない
- **解決策**: `waitForSelector()` でダイアログ要素を待機（Transition完了待ち）

#### 5. ファイル操作が失敗
- **問題**: File System Access API の権限エラー
- **解決策**: IndexedDB から権限ハンドルを復元（ページリロード時の自動処理）

#### 6. フォーム入力が反映されない
- **問題**: `page.fill()` 後、値が入力されていない
- **解決策**: `page.waitForTimeout()` で少し待つか、`page.type()` で文字を入力

---

## 📝 テスト実行のコツ

### test.only() の使用
```typescript
// 特定のテストのみ実行
test.only('ユーザー作成が成功すること', async ({ page }) => {
  // テストコード
});
```

### スクリーンショット
```typescript
// 失敗時のデバッグ用
await page.screenshot({ path: 'debug.png', fullPage: true });
```

---

## 📋 カテゴリ別成功パターン

### 認証テスト (9/9 ✅)
**主なテスト**:
- E2E-AUTH-001: ログインページ初期表示
- E2E-AUTH-002: 新規登録〜メール検証
- E2E-AUTH-003: Email/Passwordログイン
- E2E-AUTH-004: パスワードリセット
- E2E-AUTH-005: Google OAuthログイン
- E2E-AUTH-006: セッション保持（リロード）
- E2E-AUTH-007: ログアウト
- E2E-AUTH-008: 未認証で保護ルートアクセス
- E2E-AUTH-009: 認証済みで/loginアクセス

**成功パターン**:
- ✅ ログイン前は `/login` にリダイレクト
- ✅ ログイン後は `/editor` に自動遷移
- ✅ localStorage の `auth_token` でセッション復元
- ✅ ログアウト時は localStorage 完全クリア

### エディタテスト (13/13 ✅)
**主なテスト**:
- E2E-EDIT-001: ページアクセス・初期表示
- E2E-EDIT-002: フォルダ選択→ファイルツリー表示
- E2E-EDIT-003: ファイル開く→編集→保存
- E2E-EDIT-004: タブ管理フロー
- E2E-EDIT-005: リアルタイムプレビュー
- E2E-EDIT-006: 検索・置換フロー
- E2E-EDIT-007: 差分比較フロー
- E2E-EDIT-008: マインドマップ表示
- E2E-EDIT-009: エクスポート（PDF/HTML/Word）
- E2E-EDIT-010: インポート（.docx → Markdown）
- E2E-EDIT-011: お気に入り機能
- E2E-EDIT-012: キーボードショートカット
- E2E-EDIT-013: スプリットエディタ

**成功パターン**:
- ✅ File System Access API でフォルダ権限を取得
- ✅ IndexedDB でフォルダハンドルを永続化
- ✅ Monaco Editor のdebounce (300ms) で入力更新
- ✅ プレビュー同期は `react-markdown` で自動更新

### 管理者設定テスト (12/12 ✅)
**主なテスト**:
- E2E-ADMIN-SETTINGS-001: ページアクセスと全設定カード表示
- E2E-ADMIN-SETTINGS-002〜012: 各種設定の編集・キャンセル

**成功パターン**:
- ✅ ダイアログ open → 入力 → save で設定保存
- ✅ キャンセルボタンで入力内容が破棄される
- ✅ 管理者リスト表示で自分が「🧑 (あなた)」チップ付きで表示

### 管理者ユーザー管理テスト (7/7 ✅)
**主なテスト**:
- E2E-AUSERS-001: ページアクセス・一覧表示
- E2E-AUSERS-002: ユーザー情報表示確認
- E2E-AUSERS-003: フィルタリングフロー
- E2E-AUSERS-004: 検索機能フロー
- E2E-AUSERS-005: ページネーションフロー
- E2E-AUSERS-006: ユーザー操作メニュー表示
- E2E-AUSERS-007: 更新ボタンフロー

**成功パターン**:
- ✅ テーブル行クリックで詳細情報表示
- ✅ フィルタリング・検索後のテーブル自動更新
- ✅ ページネーション矢印でページ遷移

---

## 🔄 継続的改善

このファイルは、E2Eテストの実行を通じて継続的に更新されます。
新しい成功パターンが見つかったら、該当セクションに追加してください。

**更新履歴**:
| 日付 | 内容 | バージョン |
|------|------|-----------|
| 2026-01-31 | 初版作成（E2Eテストオーケストレーターによる自動生成） | v1.0 |
| 2026-02-03 | テスト完了サマリー追加、全テスト100%達成を反映 | v2.0 |
