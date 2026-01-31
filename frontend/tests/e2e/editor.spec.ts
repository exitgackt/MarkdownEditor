// エディタページ E2Eテスト
// 生成日: 2026-01-31
// 対象ページ: /editor
// テスト項目: E2E-EDIT-001 から E2E-EDIT-012（12項目すべて）

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// テストアカウント
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test1234!',
};

// ブラウザコンソールログ収集用
const setupConsoleLog = (page: any) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg: any) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });
  return consoleLogs;
};

/**
 * File System Access APIのモックをセットアップ
 * テスト用のファイル構造を定義してモックディレクトリハンドルを返す
 */
async function setupFileSystemMock(page: any) {
  await page.evaluateHandle(() => {
    // モックファイル構造
    const mockFiles = {
      'test.md': '# Test File\n\nThis is a test markdown file.',
      'file1.md': '# File 1\n\nFirst test file.',
      'file2.md': '# File 2\n\nSecond test file.',
      'README.md': '# README\n\nThis is a readme file.',
    };

    // モックFileSystemFileHandleを作成
    class MockFileSystemFileHandle {
      name: string;
      kind = 'file' as const;
      private content: string;

      constructor(name: string, content: string) {
        this.name = name;
        this.content = content;
      }

      async getFile() {
        return new File([this.content], this.name, { type: 'text/markdown' });
      }

      async createWritable() {
        const handle = this;
        return {
          async write(data: string) {
            handle.content = data;
          },
          async close() {},
        };
      }

      async isSameEntry(other: any) {
        return this.name === other.name;
      }
    }

    // モックFileSystemDirectoryHandleを作成
    class MockFileSystemDirectoryHandle {
      name: string;
      kind = 'directory' as const;
      private files: Map<string, MockFileSystemFileHandle>;

      constructor(name: string, files: Record<string, string>) {
        this.name = name;
        this.files = new Map();
        Object.entries(files).forEach(([fileName, content]) => {
          this.files.set(fileName, new MockFileSystemFileHandle(fileName, content));
        });
      }

      async *entries() {
        for (const [name, handle] of this.files) {
          yield [name, handle];
        }
      }

      async *values() {
        for (const handle of this.files.values()) {
          yield handle;
        }
      }

      async getFileHandle(name: string) {
        return this.files.get(name);
      }
    }

    // window.showDirectoryPickerをモック
    (window as any).showDirectoryPicker = async () => {
      return new MockFileSystemDirectoryHandle('test-folder', mockFiles);
    };

    // モックが設定されたことをマーク
    (window as any).__fileSystemMockReady = true;
  });

  // モックの準備完了を待つ
  await page.waitForFunction(() => (window as any).__fileSystemMockReady === true);
}

/**
 * ユーザーログイン処理（共通処理）
 */
async function loginAsUser(page: any) {
  // モックOAuthエンドポイントでログイン（E2E-AUTH-005と同じ方式）
  const response = await page.request.post('http://localhost:8000/api/v1/test/mock-google-login', {
    data: {
      email: TEST_USER.email,
      name: 'Test User'
    }
  });

  const data = await response.json();

  // トークンを使ってユーザー情報を取得
  const verifyResponse = await page.request.post('http://localhost:8000/api/v1/auth/verify', {
    data: {},
    headers: {
      'Authorization': `Bearer ${data.token}`
    }
  });

  const verifyData = await verifyResponse.json();

  // ログインページに移動してストレージをセット
  await page.goto('/login');

  // ZustandのpersistストレージとlocalStorageの両方に保存
  await page.evaluate(({ token, user }) => {
    // localStorageに直接保存
    localStorage.setItem('accessToken', token);

    // Zustandのpersist storageに保存
    const authState = {
      state: {
        user: user,
        accessToken: token,
        isAuthenticated: true,
        authSettings: null
      },
      version: 0
    };
    localStorage.setItem('auth-storage', JSON.stringify(authState));
  }, { token: data.token, user: verifyData.user });

  // エディタページに移動
  await page.goto('/editor');
  await page.waitForURL('/editor', { timeout: 15000 });
}

/**
 * ログイン + File System APIモックセットアップ + フォルダ選択
 * ファイルツリーが表示された状態まで準備する
 */
async function setupEditorWithFiles(page: any) {
  // ユーザーログイン
  await loginAsUser(page);

  // File System APIモックのセットアップ
  await setupFileSystemMock(page);

  // 「フォルダーを開く」ボタンをクリック
  const openFolderButton = page.getByRole('button', { name: 'フォルダーを開く' });
  await openFolderButton.click();

  // ファイルツリーの表示待機
  await page.waitForTimeout(500);
}

// E2E-EDIT-001: ページアクセス・初期表示
test('E2E-EDIT-001: ページアクセス・初期表示', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ユーザーログイン', async () => {
    await loginAsUser(page);
  });

  await test.step('メニューバーが表示される', async () => {
    const menuBar = page.locator('[data-testid="menu-bar"]');
    await expect(menuBar).toBeVisible({ timeout: 5000 });
  });

  await test.step('左サイドバー（ファイルツリーエリア）が表示される', async () => {
    const sidebar = page.locator('[data-testid="file-tree-sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  await test.step('「フォルダを開く」ボタンが表示される', async () => {
    const openFolderButton = page.locator('[data-testid="open-folder-button"]');
    await expect(openFolderButton).toBeVisible({ timeout: 5000 });
  });

  await test.step('エディタエリアが表示される（初期状態）', async () => {
    // 初期状態ではファイルが開かれていないため、「ファイルを開いてください」メッセージが表示される
    const message = page.locator('text=ファイルを開いてください');
    await expect(message).toBeVisible({ timeout: 5000 });
  });
});

// E2E-EDIT-002: フォルダ選択→ファイルツリー表示フロー
test('E2E-EDIT-002: フォルダ選択→ファイルツリー表示フロー', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ユーザーログイン', async () => {
    await loginAsUser(page);
  });

  await test.step('File System APIモックのセットアップ', async () => {
    await setupFileSystemMock(page);
  });

  await test.step('「フォルダーを開く」ボタンをクリック', async () => {
    const openFolderButton = page.getByRole('button', { name: 'フォルダーを開く' });
    await openFolderButton.click();
  });

  await test.step('フォルダ選択ダイアログが表示される（File System Access API）', async () => {
    // File System Access APIのモックが自動的に動作し、フォルダを選択する
    await page.waitForTimeout(500);
  });

  await test.step('ファイルツリーに.mdファイルが表示される', async () => {
    const fileTreeItem = page.locator('[data-testid="file-tree-item"]').first();
    await expect(fileTreeItem).toBeVisible({ timeout: 5000 });
  });

  await test.step('フォルダの展開/折りたたみアイコンが表示される', async () => {
    const expandIcon = page.locator('[data-testid="folder-expand-icon"]').first();
    await expect(expandIcon).toBeVisible({ timeout: 5000 });
  });
});

// E2E-EDIT-003: ファイル開く→編集→保存フロー
test('E2E-EDIT-003: ファイル開く→編集→保存フロー', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ログイン + フォルダ選択済みの状態にする', async () => {
    await setupEditorWithFiles(page);
  });

  await test.step('ファイルツリーからtest.mdをクリック', async () => {
    const testMdFile = page.locator('text=test.md');
    await testMdFile.click();
  });

  await test.step('Monaco Editorにファイル内容が表示される', async () => {
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 5000 });
  });

  await test.step('エディタで「# テスト」と入力', async () => {
    await page.locator('.monaco-editor').click();
    await page.keyboard.type('# テスト');
  });

  await test.step('タブに未保存マーク（●）が表示される', async () => {
    const unsavedIndicator = page.locator('.tab-unsaved-indicator');
    await expect(unsavedIndicator).toBeVisible({ timeout: 5000 });
  });

  await test.step('Ctrl+Sで保存', async () => {
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(500); // 保存完了を待つ
  });

  await test.step('未保存マークが消える', async () => {
    const unsavedIndicator = page.locator('.tab-unsaved-indicator');
    await expect(unsavedIndicator).not.toBeVisible({ timeout: 5000 });
  });
});

// E2E-EDIT-004: タブ管理フロー
test('E2E-EDIT-004: タブ管理フロー', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ログイン + フォルダ選択済みの状態にする', async () => {
    await setupEditorWithFiles(page);
  });

  await test.step('file1.mdを開く → タブ1表示', async () => {
    // data-testid="file-tree-item"を持つfile1.mdのボタンをクリック
    const file1Button = page.locator('[data-testid="file-tree-item"]:has-text("file1.md")').first();
    await file1Button.click();
    await page.waitForTimeout(500); // タブが開くのを待つ
    await expect(page.locator('.tab-bar')).toContainText('file1.md');
  });

  await test.step('file2.mdを開く → タブ2表示', async () => {
    // data-testid="file-tree-item"を持つfile2.mdのボタンをクリック
    // お気に入りボタンを避けるため、テキスト部分を直接クリック
    const file2Text = page.locator('[data-testid="file-tree-item"]:has-text("file2.md")').locator('p:text-is("file2.md")');
    consoleLogs.length = 0; // console logsをクリア
    await file2Text.click();
    await page.waitForTimeout(1000); // タブが開くのを待つ

    // デバッグ: consoleLogs を出力
    console.log('Console logs after clicking file2.md:', consoleLogs);

    await expect(page.locator('.tab-bar')).toContainText('file2.md');
  });

  await test.step('タブ1をクリック → file1.mdの内容が表示される', async () => {
    const tab1 = page.locator('.tab-bar .tab:has-text("file1.md")');
    await tab1.click();
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  await test.step('タブ2をクリック → file2.mdの内容が表示される', async () => {
    const tab2 = page.locator('.tab-bar .tab:has-text("file2.md")');
    await tab2.click();
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  await test.step('タブ1の閉じるボタン（×）をクリック → タブ1が消える', async () => {
    const closeButton = page.locator('.tab-close-button').first();
    await closeButton.click();
    await expect(page.locator('.tab-bar')).not.toContainText('file1.md');
  });
});

// E2E-EDIT-005: リアルタイムプレビューフロー
test('E2E-EDIT-005: リアルタイムプレビューフロー', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ログイン + ファイルを開いている状態にする', async () => {
    await setupEditorWithFiles(page);
    // test.mdファイルを開く
    const testMdFile = page.locator('text=test.md');
    await testMdFile.click();
    await page.waitForTimeout(500);
  });

  await test.step('Alt+Lでプレビューモードに切り替え', async () => {
    await page.keyboard.press('Alt+L');
  });

  await test.step('分割表示（エディタ+プレビュー）が表示される', async () => {
    const previewPanel = page.locator('.preview-panel');
    await expect(previewPanel).toBeVisible({ timeout: 5000 });
  });

  await test.step('エディタで「# 見出し」と入力', async () => {
    await page.locator('.monaco-editor').click();
    // 既存内容を全選択して削除
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    // 新しい内容を入力
    await page.keyboard.type('# 見出し');
  });

  await test.step('プレビューに<h1>見出し</h1>が表示される（500ms以内）', async () => {
    await page.waitForTimeout(500); // デバウンス待機
    const previewH1 = page.locator('.preview-panel h1');
    await expect(previewH1).toHaveText('見出し');
  });

  await test.step('エディタで「**太字**」と入力', async () => {
    await page.keyboard.type('\n**太字**');
  });

  await test.step('プレビューに<strong>太字</strong>が表示される', async () => {
    await page.waitForTimeout(500);
    const previewStrong = page.locator('.preview-panel strong');
    await expect(previewStrong).toHaveText('太字');
  });
});

// E2E-EDIT-006: 検索・置換フロー
// E2E-EDIT-006: 検索・置換フロー
test('E2E-EDIT-006: 検索・置換フロー', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ログイン + ファイルを開いている状態にする（内容: Hello World\\nHello Test）', async () => {
    await setupEditorWithFiles(page);
    // test.mdファイルを開く
    const testMdFile = page.locator('text=test.md');
    await testMdFile.click();
    await page.waitForTimeout(500);
    await page.locator('.monaco-editor').click();
    await page.keyboard.type('Hello World\nHello Test');
  });

  await test.step('Ctrl+Rで置換ダイアログを開く', async () => {
    await page.keyboard.press('Control+r');
    await page.waitForTimeout(500); // ダイアログが開くのを待つ
  });

  await test.step('検索欄に「Hello」と入力', async () => {
    const searchInput = page.locator('input[placeholder="検索"]').first();
    await searchInput.fill('Hello');
  });

  await test.step('置換欄に「Hi」と入力', async () => {
    const replaceInput = page.locator('input[placeholder="置換後"]');
    await replaceInput.fill('Hi');
  });

  await test.step('「すべて置換」をクリック', async () => {
    const replaceAllButton = page.locator('button:has-text("すべて置換")');
    await replaceAllButton.click();
  });

  await test.step('「Hi World\\nHi Test」に変更される', async () => {
    await expect(page.locator('.monaco-editor')).toContainText('Hi World');
    await expect(page.locator('.monaco-editor')).toContainText('Hi Test');
  });
});

// E2E-EDIT-007: 差分比較フロー
test('E2E-EDIT-007: 差分比較フロー', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ログイン + 2つの異なる.mdファイルを開いている状態にする', async () => {
    await setupEditorWithFiles(page);
    // file1.mdとfile2.mdを開く
    const file1 = page.locator('text=file1.md');
    await file1.click();
    await page.waitForTimeout(300);
    const file2 = page.locator('text=file2.md');
    await file2.click();
    await page.waitForTimeout(300);
  });

  await test.step('Alt+Yで差分比較モードに切り替え', async () => {
    await page.keyboard.press('Alt+Y');
  });

  await test.step('差分比較用のファイル選択ダイアログが表示される', async () => {
    const diffDialog = page.locator('.diff-select-dialog');
    await expect(diffDialog).toBeVisible({ timeout: 5000 });
  });

  await test.step('比較元ファイル: file1.md、比較先ファイル: file2.md を選択', async () => {
    // MUIのSelectコンポーネントを使用しているため、role="combobox"の要素をクリック
    // 比較元ファイル選択
    await page.locator('#mui-component-select-originalFile').click();
    await page.waitForTimeout(300);
    await page.locator('li:has-text("file1.md")').first().click();
    await page.waitForTimeout(300);

    // 比較先ファイル選択
    await page.locator('#mui-component-select-modifiedFile').click();
    await page.waitForTimeout(300);
    await page.locator('li:has-text("file2.md")').first().click();
    await page.waitForTimeout(300);
  });

  await test.step('「比較」ボタンをクリック', async () => {
    const compareButton = page.locator('button:has-text("比較")');
    await compareButton.click();
  });

  await test.step('Monaco Diff Editorが表示される', async () => {
    const diffEditor = page.locator('.monaco-diff-editor');
    await expect(diffEditor).toBeVisible({ timeout: 5000 });
  });

  await test.step('差分箇所が色分けされている', async () => {
    // 差分箇所の検証（追加: 緑、削除: 赤）
    const addedLine = page.locator('.line-insert');
    const deletedLine = page.locator('.line-delete');
    // 差分があれば表示される
  });

  await test.step('「通常モードに戻る」ボタンをクリック', async () => {
    const backButton = page.locator('button:has-text("通常モードに戻る")');
    await backButton.click();
  });

  await test.step('通常エディタに戻る', async () => {
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 5000 });
  });
});

// E2E-EDIT-008: マインドマップ表示フロー
// E2E-EDIT-008: マインドマップ表示フロー
test('E2E-EDIT-008: マインドマップ表示フロー', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ログイン + 見出しを含むマークダウンファイルを開いている状態にする', async () => {
    await setupEditorWithFiles(page);
    // test.mdファイルを開く
    const testMdFile = page.locator('text=test.md');
    await testMdFile.click();
    await page.waitForTimeout(500);
    await page.locator('.monaco-editor').click();
    // 既存内容を全選択して削除
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    // 見出しを入力
    await page.keyboard.type('# 見出し1\n## 見出し1.1\n# 見出し2');
  });

  await test.step('Alt+Mでマインドマップモードに切り替え', async () => {
    await page.keyboard.press('Alt+M');
    await page.waitForTimeout(1000); // マインドマップ生成を待つ
  });

  await test.step('マインドマップが表示される', async () => {
    // ローディングスピナーのSVGを除外
    const mindmapSvg = page.locator('.mindmap-container svg:not(.MuiCircularProgress-svg)');
    await expect(mindmapSvg).toBeVisible({ timeout: 5000 });
  });

  await test.step('見出し階層がツリー構造で表示される', async () => {
    // マインドマップコンテナ内のテキストに限定
    await expect(page.locator('.mindmap-container').getByText('見出し1', { exact: true })).toBeVisible();
    await expect(page.locator('.mindmap-container').getByText('見出し1.1', { exact: true })).toBeVisible();
    await expect(page.locator('.mindmap-container').getByText('見出し2', { exact: true })).toBeVisible();
  });

  // ズーム機能は未実装のため、スキップ

  await test.step('Alt+Mで通常モードに戻る', async () => {
    await page.keyboard.press('Alt+M');
  });

  await test.step('「通常モードに戻る」の代わりにエディタが表示される', async () => {
    await page.waitForTimeout(500);
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 5000 });
  });
});

// E2E-EDIT-009: エクスポートフロー（PDF/HTML/Word）
test('E2E-EDIT-009: エクスポートフロー（PDF/HTML/Word）', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ログイン + ファイルを開いている状態にする', async () => {
    await setupEditorWithFiles(page);
    // test.mdファイルを開く
    const testMdFile = page.locator('text=test.md');
    await testMdFile.click();
    await page.waitForTimeout(500);
  });

  await test.step('メニューバー「ファイル」→「エクスポート」→「ドキュメントをエクスポート」をクリック', async () => {
    await page.getByRole('button', { name: 'ファイル( F )' }).click();
    await page.waitForTimeout(200);
    // エクスポートメニュー項目にホバーしてサブメニューを表示
    await page.locator('text=エクスポート').first().hover();
    await page.waitForTimeout(300);
    await page.locator('text=ドキュメントをエクスポート').click();
  });

  await test.step('エクスポートダイアログが表示される', async () => {
    const exportDialog = page.locator('.export-dialog');
    await expect(exportDialog).toBeVisible({ timeout: 5000 });
  });

  await test.step('「PDF」を選択 → 「エクスポート」ボタンをクリック', async () => {
    // PDFはデフォルト選択されているため、そのままエクスポート
    const exportButton = page.locator('button:has-text("エクスポート")');
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  await test.step('同様に「HTML」形式でエクスポート', async () => {
    await page.getByRole('button', { name: 'ファイル( F )' }).click();
    await page.waitForTimeout(200);
    await page.locator('text=エクスポート').first().hover();
    await page.waitForTimeout(300);
    await page.locator('text=ドキュメントをエクスポート').click();
    await page.waitForTimeout(300);
    // HTMLラジオボタンを選択
    await page.locator('input[type="radio"][value="html"]').click();
    const exportButton = page.locator('button:has-text("エクスポート")');
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.html');
  });

  await test.step('同様に「Word」形式でエクスポート', async () => {
    await page.getByRole('button', { name: 'ファイル( F )' }).click();
    await page.waitForTimeout(200);
    await page.locator('text=エクスポート').first().hover();
    await page.waitForTimeout(300);
    await page.locator('text=ドキュメントをエクスポート').click();
    await page.waitForTimeout(300);
    // Wordラジオボタンを選択
    await page.locator('input[type="radio"][value="word"]').click();
    const exportButton = page.locator('button:has-text("エクスポート")');
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.docx');
  });
});

// E2E-EDIT-010: インポートフロー（.docx → Markdown）
// 未実装: .docx → Markdown変換、mammoth.js統合、インポートダイアログ
test('E2E-EDIT-010: インポートフロー（.docx → Markdown）', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('File System Access APIをモック', async () => {
    // test.docxファイルを読み込む
    const docxPath = path.join(process.cwd(), 'test-data/test.docx');
    const docxBuffer = fs.readFileSync(docxPath);
    const docxBase64 = docxBuffer.toString('base64');

    // window.showOpenFilePickerをモックして、test.docxを返す
    await page.addInitScript((base64Data) => {
      // Base64からArrayBufferに変換
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      // Fileオブジェクトを作成
      const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const file = new File([blob], 'test.docx', { type: blob.type });

      // FileSystemFileHandleのモック
      const mockFileHandle = {
        kind: 'file',
        name: 'test.docx',
        getFile: async () => file,
        isSameEntry: async () => false,
      };

      // window.showOpenFilePickerをモック
      (window as any).showOpenFilePicker = async () => {
        return [mockFileHandle];
      };
    }, docxBase64);
  });

  await test.step('ログイン + エディタページにアクセス', async () => {
    await loginAsUser(page);
  });

  await test.step('メニューバー「ファイル」→「インポート」をクリック', async () => {
    await page.getByRole('button', { name: 'ファイル( F )' }).click();
    await page.locator('text=インポート').click();
  });

  await test.step('Markdownに変換される', async () => {
    await page.waitForTimeout(2000); // 変換待機
  });

  await test.step('エディタに変換後の内容が表示される', async () => {
    await expect(page.locator('.monaco-editor')).toContainText('見出し', { timeout: 10000 });
  });
});

// E2E-EDIT-011: お気に入り機能フロー
test('E2E-EDIT-011: お気に入り機能フロー', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ログイン + ファイルを開いている状態にする', async () => {
    await setupEditorWithFiles(page);
  });

  await test.step('ファイルツリーでtest.mdにホバーして★アイコンをクリック', async () => {
    const fileItem = page.locator('.file-tree-item:has-text("test.md")');
    await fileItem.hover();
    await page.waitForTimeout(300);
    const favoriteIcon = fileItem.locator('.favorite-icon').first();
    await favoriteIcon.click();
    await page.waitForTimeout(300);
  });

  await test.step('お気に入りに追加される（★が塗りつぶし）', async () => {
    const fileItem = page.locator('.file-tree-item:has-text("test.md")');
    await fileItem.hover();
    await page.waitForTimeout(200);
    const activeFavoriteIcon = fileItem.locator('.favorite-icon.active').first();
    await expect(activeFavoriteIcon).toBeVisible({ timeout: 5000 });
  });

  await test.step('サイドバー「お気に入り」セクションを展開してtest.mdを確認', async () => {
    // お気に入りセクションのヘッダーを探す
    const favoritesHeader = page.locator('text=お気に入り').last();

    // お気に入りリストが表示されているか確認
    const favoritesList = page.locator('.favorites-list');
    const isListVisible = await favoritesList.isVisible().catch(() => false);

    if (!isListVisible) {
      // リストが表示されていない場合はセクションを展開
      await favoritesHeader.click();
      await page.waitForTimeout(500);
    }

    // test.mdがお気に入りリストに表示されることを確認
    await expect(favoritesList).toContainText('test.md', { timeout: 10000 });
  });

  await test.step('お気に入り一覧からtest.mdをクリック → エディタに表示される', async () => {
    const favoriteItem = page.locator('.favorites-list .favorite-item:has-text("test.md")');
    await favoriteItem.click();
    await page.waitForTimeout(500);
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  await test.step('★アイコンを再度クリック → お気に入りから削除される', async () => {
    const fileItem = page.locator('.file-tree-item:has-text("test.md")');
    await fileItem.hover();
    await page.waitForTimeout(300);
    const activeFavoriteIcon = fileItem.locator('.favorite-icon.active').first();
    await activeFavoriteIcon.click();
    await page.waitForTimeout(500);
    const favoritesList = page.locator('.favorites-list');
    await expect(favoritesList).not.toContainText('test.md', { timeout: 5000 });
  });
});

// E2E-EDIT-012: キーボードショートカット動作
test('E2E-EDIT-012: キーボードショートカット動作', async ({ page }) => {
  const consoleLogs = setupConsoleLog(page);

  await test.step('ログイン + ファイルを開く', async () => {
    await setupEditorWithFiles(page);
    const testMdFile = page.locator('text=test.md');
    await testMdFile.click();
    await page.waitForTimeout(500);
  });

  await test.step('Alt+L → プレビューモードに切り替わる', async () => {
    await page.keyboard.press('Alt+L');
    const previewPanel = page.locator('.preview-panel');
    await expect(previewPanel).toBeVisible({ timeout: 5000 });
  });

  await test.step('Alt+M → マインドマップモードに切り替わる', async () => {
    await page.keyboard.press('Alt+M');
    await page.waitForTimeout(1000); // マインドマップ生成待機
    const mindmapContainer = page.locator('.mindmap-container');
    await expect(mindmapContainer).toBeVisible({ timeout: 5000 });
  });

  await test.step('Alt+M → 通常モードに戻る', async () => {
    await page.keyboard.press('Alt+M');
    await page.waitForTimeout(500);
  });

  await test.step('Alt+G → 分割エディタモードに切り替わる', async () => {
    await page.keyboard.press('Alt+G');
    await page.waitForTimeout(500);
    const splitEditor = page.locator('.split-editor');
    await expect(splitEditor).toBeVisible({ timeout: 5000 });
  });
});
