# エディタページ E2Eテスト仕様書

生成日: 2026-01-31
対象ページ: `/editor`
権限レベル: ユーザー（認証必須）

---

## テスト環境

```yaml
URL: http://localhost:5174/editor
認証: 必須（Google OAuth 2.0）
テストアカウント:
  email: test@example.com
  password: (Google OAuth経由)
ブラウザ: Chrome/Edge（File System Access API対応）
```

---

## 統合テストでカバー済み（E2Eから除外）

エディタページはフロントエンド主体のため、バックエンド統合テストは最小限。
以下の項目はコンポーネントテスト（Jest/RTL）でカバー予定:

- ✅ Monaco Editorのマウント/アンマウント
- ✅ テーマ切り替え（ライト/ダーク）
- ✅ モーダルの開閉
- ✅ ローディング状態表示

---

## E2Eテスト項目一覧（UIフローのみ: 12項目）

| ID | テスト項目 | 期待結果 |
|----|----------|---------|
| E2E-EDIT-001 | ページアクセス・初期表示 | ログイン後、エディタページが正常に表示される |
| E2E-EDIT-002 | フォルダ選択→ファイルツリー表示フロー | フォルダ選択ダイアログ → フォルダ選択 → ツリー表示 |
| E2E-EDIT-003 | ファイル開く→編集→保存フロー | ファイルクリック → Monaco Editor表示 → 編集 → 保存 → 未保存マーク消える |
| E2E-EDIT-004 | タブ管理フロー | 複数ファイル開く → タブ切り替え → タブ閉じる |
| E2E-EDIT-005 | リアルタイムプレビューフロー | エディタで編集 → プレビュー即時反映（500ms以内） |
| E2E-EDIT-006 | 検索・置換フロー | 検索ダイアログ → 検索実行 → ハイライト → 置換実行 |
| E2E-EDIT-007 | 差分比較フロー | 2つのタブ選択 → 差分比較モード → Monaco Diff Editor表示 → 通常モードに戻る |
| E2E-EDIT-008 | マインドマップ表示フロー | マインドマップモード → 見出し階層ツリー表示 → ズーム/パン → 通常モードに戻る |
| E2E-EDIT-009 | エクスポートフロー（PDF/HTML/Word） | エクスポートダイアログ → 形式選択 → ダウンロード実行 |
| E2E-EDIT-010 | インポートフロー（.docx → Markdown） | インポートボタン → ファイル選択 → Markdown変換 → エディタ表示 |
| E2E-EDIT-011 | お気に入り機能フロー | お気に入り追加 → 一覧表示 → お気に入りから開く → 削除 |
| E2E-EDIT-012 | キーボードショートカット動作 | Alt+N（新規）、Alt+O（開く）、Alt+S（保存）、Alt+L（プレビュー）、Alt+M（マインドマップ） |

---

## 各テスト詳細

### E2E-EDIT-001: ページアクセス・初期表示

**目的**: エディタページが正しく表示される

**前提条件**:
- ユーザーがログイン済み
- 利用規約同意済み

**テスト手順**:
1. `/editor` にアクセス
2. ページが正常にロードされる
3. メニューバーが表示される
4. 左サイドバー（ファイルツリーエリア）が表示される
5. エディタエリアが表示される

**期待結果**:
- エディタページが表示される
- 「フォルダを開く」ボタンが表示される
- Monaco Editorの初期状態（空白）が表示される

**実装メモ**:
```typescript
await page.goto('http://localhost:5174/editor');
await expect(page.locator('text=フォルダを開く')).toBeVisible();
await expect(page.locator('.monaco-editor')).toBeVisible();
```

---

### E2E-EDIT-002: フォルダ選択→ファイルツリー表示フロー

**目的**: File System Access APIによるフォルダ選択が正常に動作する

**前提条件**:
- エディタページ表示済み
- テスト用マークダウンフォルダを準備（`test-folder/`）

**テスト手順**:
1. 「フォルダを開く」ボタンをクリック
2. ブラウザのフォルダ選択ダイアログが表示される（※Playwrightのモック使用）
3. テストフォルダを選択
4. ファイルツリーが表示される
5. `.md` ファイルのみがツリーに表示される

**期待結果**:
- ファイルツリーに `.md` ファイルが表示される
- フォルダの展開/折りたたみアイコンが表示される
- ファイル名が正しく表示される

**実装メモ**:
```typescript
// File System Access APIのモック
const folderHandle = await context.evaluateHandle(() => {
  // モックディレクトリハンドルを返す
});
```

---

### E2E-EDIT-003: ファイル開く→編集→保存フロー

**目的**: ファイルの編集・保存が正常に動作する

**前提条件**:
- フォルダ選択済み
- ファイルツリーに `.md` ファイルが表示されている

**テスト手順**:
1. ファイルツリーから `test.md` をクリック
2. Monaco Editorにファイル内容が表示される
3. エディタで「# テスト」と入力
4. タブに未保存マーク（●）が表示される
5. `Alt+S` または保存ボタンをクリック
6. 未保存マークが消える

**期待結果**:
- ファイル内容がエディタに表示される
- 編集後に未保存マークが表示される
- 保存後に未保存マークが消える

**実装メモ**:
```typescript
await page.locator('text=test.md').click();
await page.locator('.monaco-editor').click();
await page.keyboard.type('# テスト');
await expect(page.locator('.tab-unsaved-indicator')).toBeVisible(); // ●
await page.keyboard.press('Alt+S');
await expect(page.locator('.tab-unsaved-indicator')).not.toBeVisible();
```

---

### E2E-EDIT-004: タブ管理フロー

**目的**: 複数ファイルのタブ管理が正常に動作する

**前提条件**:
- フォルダ選択済み
- 複数の `.md` ファイルが存在

**テスト手順**:
1. `file1.md` を開く → タブ1表示
2. `file2.md` を開く → タブ2表示
3. タブ1をクリック → `file1.md` の内容が表示される
4. タブ2をクリック → `file2.md` の内容が表示される
5. タブ1の閉じるボタン（×）をクリック → タブ1が消える

**期待結果**:
- 複数タブが表示される
- タブ切り替えで内容が正しく表示される
- タブを閉じると消える

**実装メモ**:
```typescript
await page.locator('text=file1.md').click();
await page.locator('text=file2.md').click();
await expect(page.locator('.tab-bar')).toContainText('file1.md');
await expect(page.locator('.tab-bar')).toContainText('file2.md');
await page.locator('.tab-close-button').first().click(); // 最初のタブを閉じる
```

---

### E2E-EDIT-005: リアルタイムプレビューフロー

**目的**: プレビューがリアルタイムで更新される

**前提条件**:
- ファイルを開いている

**テスト手順**:
1. `Alt+L` でプレビューモードに切り替え
2. 分割表示（エディタ+プレビュー）が表示される
3. エディタで「# 見出し」と入力
4. プレビューに `<h1>見出し</h1>` が表示される（500ms以内）
5. エディタで「**太字**」と入力
6. プレビューに `<strong>太字</strong>` が表示される

**期待結果**:
- エディタの変更がプレビューに即座に反映される
- マークダウンが正しくHTMLレンダリングされる

**実装メモ**:
```typescript
await page.keyboard.press('Alt+L');
await expect(page.locator('.preview-panel')).toBeVisible();
await page.locator('.monaco-editor').click();
await page.keyboard.type('# 見出し');
await page.waitForTimeout(500); // デバウンス待機
await expect(page.locator('.preview-panel h1')).toHaveText('見出し');
```

---

### E2E-EDIT-006: 検索・置換フロー

**目的**: 検索・置換機能が正常に動作する

**前提条件**:
- ファイルを開いている
- ファイル内容: 「Hello World\nHello Test」

**テスト手順**:
1. `Alt+F` で検索ダイアログを開く
2. 「Hello」と入力
3. 2箇所がハイライトされる
4. `Ctrl+R` で置換ダイアログを開く
5. 置換後: 「Hi」と入力
6. 「すべて置換」をクリック
7. 「Hi World\nHi Test」に変更される

**期待結果**:
- 検索キーワードがハイライトされる
- 置換が正しく実行される

**実装メモ**:
```typescript
await page.keyboard.press('Alt+F');
await page.locator('input[placeholder="検索"]').fill('Hello');
await expect(page.locator('.monaco-editor .highlight')).toHaveCount(2);
await page.keyboard.press('Control+R');
await page.locator('input[placeholder="置換後"]').fill('Hi');
await page.locator('button:has-text("すべて置換")').click();
await expect(page.locator('.monaco-editor')).toContainText('Hi World');
```

---

### E2E-EDIT-007: 差分比較フロー

**目的**: Monaco Diff Editorによる差分比較が正常に動作する

**前提条件**:
- 2つの異なる `.md` ファイルを開いている

**テスト手順**:
1. `Alt+Y` で差分比較モードに切り替え
2. 差分比較用のファイル選択ダイアログが表示される
3. 比較元ファイル: `file1.md`、比較先ファイル: `file2.md` を選択
4. Monaco Diff Editorが表示される
5. 差分箇所が色分けされている（追加: 緑、削除: 赤）
6. 「通常モードに戻る」ボタンをクリック
7. 通常エディタに戻る

**期待結果**:
- 差分比較モードで2つのファイルが並んで表示される
- 差分箇所が色分けされる
- 通常モードに戻れる

**実装メモ**:
```typescript
await page.keyboard.press('Alt+Y');
await page.locator('select[name="originalFile"]').selectOption('file1.md');
await page.locator('select[name="modifiedFile"]').selectOption('file2.md');
await page.locator('button:has-text("比較")').click();
await expect(page.locator('.monaco-diff-editor')).toBeVisible();
await page.locator('button:has-text("通常モードに戻る")').click();
await expect(page.locator('.monaco-editor')).toBeVisible();
```

---

### E2E-EDIT-008: マインドマップ表示フロー

**目的**: マインドマップが正常に表示される

**前提条件**:
- 見出しを含むマークダウンファイルを開いている
- ファイル内容: 「# 見出し1\n## 見出し1.1\n# 見出し2」

**テスト手順**:
1. `Alt+M` でマインドマップモードに切り替え
2. マインドマップが表示される
3. 見出し階層がツリー構造で表示される
4. ズームイン/ズームアウトボタンをクリック
5. マップが拡大/縮小される
6. 「通常モードに戻る」ボタンをクリック
7. 通常エディタに戻る

**期待結果**:
- マインドマップが表示される
- 見出し階層がツリー構造になっている
- ズーム/パンが機能する

**実装メモ**:
```typescript
await page.keyboard.press('Alt+M');
await expect(page.locator('.mindmap-container svg')).toBeVisible();
await expect(page.locator('text=見出し1')).toBeVisible();
await expect(page.locator('text=見出し1.1')).toBeVisible();
await page.locator('button[aria-label="ズームイン"]').click();
await page.locator('button:has-text("通常モードに戻る")').click();
await expect(page.locator('.monaco-editor')).toBeVisible();
```

---

### E2E-EDIT-009: エクスポートフロー（PDF/HTML/Word）

**目的**: エクスポート機能が正常に動作する

**前提条件**:
- ファイルを開いている

**テスト手順**:
1. メニューバー「ファイル」→「エクスポート」をクリック
2. エクスポートダイアログが表示される
3. 「PDF」を選択 → 「エクスポート」ボタンをクリック
4. ダウンロードが開始される（`test.pdf`）
5. 同様に「HTML」「Word」形式でエクスポート

**期待結果**:
- エクスポートダイアログが表示される
- PDF/HTML/Word形式でダウンロードされる

**実装メモ**:
```typescript
await page.locator('text=ファイル').click();
await page.locator('text=エクスポート').click();
await expect(page.locator('.export-dialog')).toBeVisible();
await page.locator('select[name="format"]').selectOption('PDF');
await page.locator('button:has-text("エクスポート")').click();
// ダウンロード確認
const download = await page.waitForEvent('download');
expect(download.suggestedFilename()).toContain('.pdf');
```

---

### E2E-EDIT-010: インポートフロー（.docx → Markdown）

**目的**: Word文書をMarkdownに変換できる

**前提条件**:
- テスト用 `.docx` ファイルを準備

**テスト手順**:
1. メニューバー「ファイル」→「インポート」をクリック
2. ファイル選択ダイアログが表示される
3. `test.docx` を選択
4. Markdownに変換される
5. エディタに変換後の内容が表示される

**期待結果**:
- `.docx` ファイルがMarkdownに変換される
- 基本的な書式（見出し、太字、リスト）が保持される

**実装メモ**:
```typescript
await page.locator('text=ファイル').click();
await page.locator('text=インポート').click();
const fileInput = await page.locator('input[type="file"]');
await fileInput.setInputFiles('./test-data/test.docx');
await page.waitForTimeout(1000); // 変換待機
await expect(page.locator('.monaco-editor')).toContainText('# 見出し');
```

---

### E2E-EDIT-011: お気に入り機能フロー

**目的**: お気に入り機能が正常に動作する

**前提条件**:
- ファイルを開いている

**テスト手順**:
1. ファイルツリーで `test.md` の★アイコンをクリック
2. お気に入りに追加される（★が塗りつぶし）
3. サイドバー「お気に入り」タブをクリック
4. お気に入り一覧に `test.md` が表示される
5. お気に入り一覧から `test.md` をクリック → エディタに表示される
6. ★アイコンを再度クリック → お気に入りから削除される

**期待結果**:
- お気に入り追加/削除が正常に動作する
- お気に入り一覧に表示される
- お気に入りからファイルを開ける

**実装メモ**:
```typescript
await page.locator('.file-tree-item:has-text("test.md") .favorite-icon').click();
await expect(page.locator('.favorite-icon.active')).toBeVisible();
await page.locator('text=お気に入り').click();
await expect(page.locator('.favorites-list')).toContainText('test.md');
await page.locator('.favorites-list .favorite-item:has-text("test.md")').click();
await expect(page.locator('.monaco-editor')).toBeVisible();
await page.locator('.favorite-icon.active').click();
await expect(page.locator('.favorites-list')).not.toContainText('test.md');
```

---

### E2E-EDIT-012: キーボードショートカット動作

**目的**: 主要なキーボードショートカットが正常に動作する

**前提条件**:
- エディタページ表示済み

**テスト手順**:
1. `Alt+N` → 新規ファイルダイアログが表示される
2. `Alt+O` → ファイルを開くダイアログが表示される
3. `Alt+S` → 保存が実行される
4. `Alt+L` → プレビューモードに切り替わる
5. `Alt+M` → マインドマップモードに切り替わる
6. `Alt+G` → 分割エディタモードに切り替わる
7. `Alt+Y` → 差分比較モードに切り替わる

**期待結果**:
- すべてのショートカットが正常に動作する

**実装メモ**:
```typescript
await page.keyboard.press('Alt+N');
await expect(page.locator('.new-file-dialog')).toBeVisible();
await page.keyboard.press('Escape');

await page.keyboard.press('Alt+L');
await expect(page.locator('.preview-panel')).toBeVisible();

await page.keyboard.press('Alt+M');
await expect(page.locator('.mindmap-container')).toBeVisible();
```

---

## 実行コマンド

```bash
# 全テスト実行
npx playwright test tests/e2e/editor.spec.ts

# 単独テスト実行（test.only()使用）
npx playwright test tests/e2e/editor.spec.ts -g "E2E-EDIT-001"

# ヘッドフルモード（ブラウザ表示）
npx playwright test tests/e2e/editor.spec.ts --headed

# デバッグモード
npx playwright test tests/e2e/editor.spec.ts --debug
```

---

## 注意事項

### File System Access APIのモック

File System Access APIはブラウザのネイティブダイアログを使用するため、Playwrightでの自動化には制限があります。
以下のアプローチを推奨:

1. **モックディレクトリハンドルを使用**: `window.showDirectoryPicker()` をモック
2. **事前にフォルダを選択**: ブラウザの権限をテスト前に手動で許可
3. **代替手法**: IndexedDBに直接テストデータを挿入

### ダウンロードテスト

エクスポート機能のダウンロードテストは、Playwrightの `page.waitForEvent('download')` を使用します。

### テスト実行前の準備

```bash
# テストデータフォルダを作成
mkdir -p test-data
echo "# テストファイル" > test-data/test.md
echo "# ファイル1" > test-data/file1.md
echo "# ファイル2" > test-data/file2.md
```

---

## テスト成功基準

| 項目 | 基準 |
|------|------|
| 成功率 | 100%（12/12項目） |
| 実行時間 | 5分以内 |
| 再現性 | 3回連続成功 |
| ブラウザ互換性 | Chrome/Edge |

---

**作成日**: 2026-01-31
**作成者**: Claude Code (E2Eテスト設計エージェント)
**バージョン**: 1.0
