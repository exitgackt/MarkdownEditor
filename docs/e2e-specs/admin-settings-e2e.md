# admin-settings E2Eテスト仕様書

生成日: 2026-01-31
対象ページ: `/admin/settings`
権限レベル: admin

---

## テスト環境

```yaml
URL: http://localhost:3247/admin/settings
認証: 必須（ProtectedRoute、is_admin=1）
テストアカウント:
  email: fulltest@example.com
  password: FullTest123!
  is_admin: 1
```

---

## 統合テストでカバー済み（E2Eから除外）

⚠️ **注意**: 本プロジェクトではバックエンド統合テストが未実装のため、E2Eテストで主要な動作を確認します。

- ⚠️ 認証エラー（401）: 未実装（E2Eでカバーしない）
- ⚠️ 権限エラー（403）: 未実装（E2Eでカバーしない）
- ⚠️ バリデーション（400）: 未実装（E2Eでカバーしない）

**E2Eの範囲**: UIフローの正常系のみ（ログイン → 表示 → 操作 → 保存 → 反映確認）

---

## E2Eテスト項目一覧（UIフローのみ: 12項目）

### 1. ページアクセス・全体表示

| ID | テスト項目 | 期待結果 |
|----|----------|---------|
| E2E-ADMIN-SETTINGS-001 | ページアクセスと全設定カード表示 | ログイン → /admin/settings → 6つの設定カード（認証方式、ブラウザ案内、利用規約、メンテナンスモード、管理者管理、※ヘッダーメールアドレス）が表示される |

### 2. 認証方式設定フロー（2項目）

| ID | テスト項目 | 期待結果 |
|----|----------|---------|
| E2E-ADMIN-SETTINGS-002 | 認証方式設定の編集フロー | 「編集」クリック → ダイアログ表示 → パスワード最小文字数変更 → 「保存」 → 成功メッセージ表示 → 設定カードに反映 |
| E2E-ADMIN-SETTINGS-003 | 認証方式設定のキャンセル動作 | 「編集」クリック → ダイアログ表示 → 変更 → 「キャンセル」 → ダイアログ閉じる → 変更破棄 |

### 3. 対応ブラウザ案内フロー（2項目）

| ID | テスト項目 | 期待結果 |
|----|----------|---------|
| E2E-ADMIN-SETTINGS-004 | 対応ブラウザ案内の編集フロー | 「編集」クリック → ダイアログ表示 → テキスト変更（文字カウンター確認） → 「保存」 → 成功メッセージ表示 → 設定カードに反映 |
| E2E-ADMIN-SETTINGS-005 | 対応ブラウザ案内のキャンセル動作 | 「編集」クリック → ダイアログ表示 → 変更 → 「キャンセル」 → ダイアログ閉じる → 変更破棄 |

### 4. 利用規約フロー（1項目）

| ID | テスト項目 | 期待結果 |
|----|----------|---------|
| E2E-ADMIN-SETTINGS-006 | 利用規約の編集フロー | 「編集」クリック → ダイアログ表示 → テキスト変更 → 「保存」 → 成功メッセージ表示 → 設定カードに反映 |

### 5. メンテナンスモードフロー（2項目）

| ID | テスト項目 | 期待結果 |
|----|----------|---------|
| E2E-ADMIN-SETTINGS-007 | メンテナンスモード ON切替フロー | スイッチクリック（OFF→ON） → 確認ダイアログ表示 → メンテナンスメッセージ入力 → 「ONにする」 → 成功メッセージ → 「ON」チップ表示 → メンテナンスメッセージ表示 |
| E2E-ADMIN-SETTINGS-008 | メンテナンスモード OFF切替フロー | スイッチクリック（ON→OFF） → 確認ダイアログ表示 → 「OFFにする」 → 成功メッセージ → 「OFF」チップ表示 → メンテナンスメッセージ非表示 |

### 6. ヘッダーメールアドレス表示（1項目）

| ID | テスト項目 | 期待結果 |
|----|----------|---------|
| E2E-ADMIN-SETTINGS-009 | 管理画面ヘッダーのメールアドレス表示 | /admin/settings にアクセス → AppBar右側にログイン中のメールアドレス（fulltest@example.com）が表示される |

### 7. 管理者管理フロー（4項目）

| ID | テスト項目 | 期待結果 |
|----|----------|---------|
| E2E-ADMIN-SETTINGS-010 | 管理者一覧表示と自分識別チップ | 「管理者管理」セクション → 管理者一覧表示 → ログイン中のアカウントに青色「自分」チップ表示 → 「自分」チップのあるアカウントには削除ボタン非表示 |
| E2E-ADMIN-SETTINGS-011 | 管理者追加フロー（既存ユーザー） | 「管理者を追加」ボタンクリック → ダイアログ表示 → メールアドレス入力 → 「追加」 → 成功メッセージ → ダイアログ閉じる → 一覧に新規管理者が表示される |
| E2E-ADMIN-SETTINGS-012 | 管理者追加フロー（重複チェック） | 「管理者を追加」ボタンクリック → ダイアログ表示 → 既存管理者のメールアドレス入力 → 「追加」 → エラーメッセージ表示 → 一覧が変更されない |

---

## 実行コマンド

```bash
# すべてのテストを実行
npx playwright test tests/e2e/admin-settings.spec.ts

# 単一テストを実行（開発時）
npx playwright test tests/e2e/admin-settings.spec.ts -g "E2E-ADMIN-SETTINGS-001"

# ヘッドレスモードオフで実行（デバッグ）
npx playwright test tests/e2e/admin-settings.spec.ts --headed

# UIモードで実行（対話的デバッグ）
npx playwright test tests/e2e/admin-settings.spec.ts --ui
```

---

## 実装時の注意事項

### 1. 共通設定

```typescript
// すべてのテストで beforeEach にログイン処理
beforeEach(async ({ page }) => {
  // ログイン
  await page.goto('http://localhost:3247/login');
  await page.fill('input[name="email"]', 'fulltest@example.com');
  await page.fill('input[name="password"]', 'FullTest123!');
  await page.click('button[type="submit"]');

  // ログイン成功を待つ
  await page.waitForURL('http://localhost:3247/');

  // admin/settings に移動
  await page.goto('http://localhost:3247/admin/settings');
  await page.waitForLoadState('networkidle');
});
```

### 2. ダイアログ操作の待機

```typescript
// ダイアログが開くのを待つ
await page.waitForSelector('role=dialog', { state: 'visible' });

// ダイアログが閉じるのを待つ
await page.waitForSelector('role=dialog', { state: 'hidden' });
```

### 3. 成功メッセージの確認

```typescript
// 成功メッセージダイアログの確認
await expect(page.locator('role=dialog >> text=保存完了')).toBeVisible();
await expect(page.locator('role=dialog >> text=認証方式を更新しました')).toBeVisible();
```

### 4. チップ（Chip）要素の確認

```typescript
// 「自分」チップの確認
await expect(page.locator('text=自分').first()).toBeVisible();
await expect(page.locator('text=自分').first()).toHaveCSS('background-color', /blue/); // primary color
```

### 5. 削除ボタンの非表示確認

```typescript
// 特定の行の削除ボタンが非表示であることを確認
const selfRow = page.locator('text=fulltest@example.com').locator('..');
await expect(selfRow.locator('button[aria-label="削除"]')).not.toBeVisible();
```

### 6. test.only() の使用

開発時は `test.only()` を使用して単一テストのみを実行:

```typescript
test.only('E2E-ADMIN-SETTINGS-001: ページアクセスと全設定カード表示', async ({ page }) => {
  // テストコード
});
```

---

## 品質チェックリスト

| 確認項目 | チェック |
|---------|---------|
| E2E項目数が10-15項目以内か？ | ☑ 12項目 |
| 統合テストカバレッジを確認したか？ | ☑ 未実装を確認 |
| 認証エラー（401）を除外したか？ | ☑ 除外 |
| バリデーションエラーを除外したか？ | ☑ 除外 |
| レスポンシブテストを除外したか？ | ☑ 除外 |
| 個別UI要素テストを除外したか？ | ☑ フロー単位で設計 |
| フロー単位で設計したか？ | ☑ 一連の操作フロー |

---

## 除外した項目（手動テストから）

以下の項目は **コンポーネントテスト** または **目視確認** が適切なため、E2Eから除外:

| 除外項目 | 理由 | カバー方法 |
|---------|------|-----------|
| ラジオボタンの読み取り専用表示 | UI詳細 | コンポーネントテスト |
| チェックボックスの横並び表示 | レイアウト | 目視/Storybook |
| ダイアログが横に伸びない | レイアウト | 目視/Storybook |
| 表示枠の高さ（210px） | UI詳細 | 目視/Storybook |
| スクロールバーの表示 | UI詳細 | 目視/Storybook |
| 文字カウンター（0 / 2000） | UI詳細 | コンポーネントテスト |
| テキストエリアの行数（15行） | UI詳細 | コンポーネントテスト |
| チップのサイズ・色 | UI詳細 | コンポーネントテスト |
| レスポンシブデザイン | 別テスト | Playwright responsive tests |

---

## テスト実装ファイル

- **実装先**: `frontend/tests/e2e/admin-settings.spec.ts`
- **実装担当**: @E2Eテスト実装エージェント
- **実装時期**: Phase 11 E2E自動テスト実装フェーズ

---

**生成日**: 2026-01-31
**生成者**: @E2Eテスト設計エージェント
**レビュー状態**: 未レビュー
