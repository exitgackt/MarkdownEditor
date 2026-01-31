# E2Eテスト ベストプラクティス

**プロジェクト名**: Visual Studio風マークダウンエディタ
**作成日時**: 2026-01-31
**目的**: E2Eテストで成功したパターンを蓄積し、後続テストの試行錯誤を削減する

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
| ページ名 | パス |
|---------|------|
| ログイン | `/login` |
| 利用規約同意 | `/terms` |
| エディタ | `/editor` |
| メンテナンス中 | `/maintenance` |
| 管理：利用状況 | `/admin/usage` |
| 管理：システム設定 | `/admin/settings` |

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

## 🔄 継続的改善

このファイルは、E2Eテストの実行を通じて継続的に更新されます。
新しい成功パターンが見つかったら、該当セクションに追加してください。

**更新履歴**:
| 日付 | 内容 |
|------|------|
| 2026-01-31 | 初版作成（E2Eテストオーケストレーターによる自動生成） |
