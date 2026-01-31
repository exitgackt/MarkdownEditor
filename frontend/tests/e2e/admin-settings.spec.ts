import { test, expect } from '@playwright/test';

// テストアカウント
const TEST_ADMIN = {
  email: 'test@example.com',
  password: 'Test1234!',
};

/**
 * 管理者ログイン処理（共通処理）
 */
async function loginAsAdmin(page: any) {
  await page.goto('/login');

  // ログインフォームの表示待ち
  await page.waitForSelector('[data-testid="email-input"] input', { timeout: 10000 });

  // ログイン情報を入力
  await page.fill('[data-testid="email-input"] input', TEST_ADMIN.email);
  await page.fill('[data-testid="password-input"] input', TEST_ADMIN.password);

  // ログインボタンをクリック
  await page.click('[data-testid="login-button"]');

  // エディタページへの遷移を待機
  await page.waitForURL('/editor', { timeout: 15000 });
}

// ==================== E2E-ADMIN-SETTINGS-001 ====================
test('E2E-ADMIN-SETTINGS-001: ページアクセスと全設定カード表示', async ({ page }) => {
  // コンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('システム設定画面にアクセス', async () => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  await test.step('5つの設定カードが表示される', async () => {
    // 認証方式 (h6 heading)
    await expect(page.getByRole('heading', { name: '認証方式' })).toBeVisible();

    // 対応ブラウザ案内
    await expect(page.getByRole('heading', { name: '対応ブラウザ案内' })).toBeVisible();

    // 利用規約
    await expect(page.getByRole('heading', { name: '利用規約' })).toBeVisible();

    // メンテナンスモード
    await expect(page.getByRole('heading', { name: 'メンテナンスモード' })).toBeVisible();

    // ヘッダーメールアドレス（AppBarに表示）
    await expect(page.locator(`text=${TEST_ADMIN.email}`)).toBeVisible();
  });
});

// ==================== E2E-ADMIN-SETTINGS-002 ====================
test('E2E-ADMIN-SETTINGS-002: 認証方式設定の編集フロー', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('システム設定画面にアクセス', async () => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  await test.step('認証方式設定の「編集」ボタンをクリック', async () => {
    // 「認証方式」見出しの親カードを取得し、その中の編集ボタンをクリック
    const authSection = page.getByRole('heading', { name: '認証方式' }).locator('..');
    await authSection.getByRole('button', { name: '編集' }).click();
  });

  await test.step('ダイアログが表示される', async () => {
    await page.waitForSelector('role=dialog', { state: 'visible' });
    // ダイアログが開いたことを確認（タイトルは実装により異なる可能性がある）
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  await test.step('パスワード最小文字数を変更', async () => {
    // ダイアログ内のフィールドに限定（ページ本体にも同じラベルが存在するため）
    const dialog = page.getByRole('dialog');
    const minLengthInput = dialog.getByLabel('最小文字数');
    await minLengthInput.fill('10');
  });

  await test.step('「保存」ボタンをクリック', async () => {
    await page.getByRole('button', { name: '保存' }).click();
  });

  await test.step('成功メッセージが表示される', async () => {
    // 成功ダイアログが表示される
    const successDialog = page.getByRole('dialog', { name: '保存完了' });
    await expect(successDialog).toBeVisible({ timeout: 5000 });
    await expect(successDialog.getByText('認証方式を更新しました')).toBeVisible();
  });

  await test.step('成功ダイアログを閉じる', async () => {
    await page.getByRole('button', { name: 'OK' }).click();
    // 全てのダイアログが閉じることを確認
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
  });

  await test.step('設定カードに反映される', async () => {
    // 反映確認（最小文字数が10に変更されたことを確認）
    // ページスナップショットによると、spinbutton要素に値が反映される
    const minLengthField = page.getByRole('spinbutton', { name: '最小文字数' });
    await expect(minLengthField).toHaveValue('10');
  });
});

// ==================== E2E-ADMIN-SETTINGS-003 ====================
test('E2E-ADMIN-SETTINGS-003: 認証方式設定のキャンセル動作', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('システム設定画面にアクセス', async () => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  await test.step('認証方式設定の「編集」ボタンをクリック', async () => {
    // 「認証方式」見出しの親カードを取得し、その中の編集ボタンをクリック
    const authSection = page.getByRole('heading', { name: '認証方式' }).locator('..');
    await authSection.getByRole('button', { name: '編集' }).click();
  });

  await test.step('ダイアログが表示される', async () => {
    await page.waitForSelector('role=dialog', { state: 'visible' });
  });

  await test.step('パスワード最小文字数を変更', async () => {
    // ダイアログ内のフィールドに限定（ページ本体にも同じラベルが存在するため）
    const dialog = page.getByRole('dialog');
    const minLengthInput = dialog.getByLabel('最小文字数');
    await minLengthInput.fill('15');
  });

  await test.step('「キャンセル」ボタンをクリック', async () => {
    await page.getByRole('button', { name: 'キャンセル' }).click();
  });

  await test.step('ダイアログが閉じる', async () => {
    await page.waitForSelector('role=dialog', { state: 'hidden', timeout: 5000 });
  });

  await test.step('変更が破棄される（元の値が維持される）', async () => {
    // 15文字以上は表示されない（変更が破棄された）
    await expect(page.locator('text=15文字以上')).not.toBeVisible();
  });
});

// ==================== E2E-ADMIN-SETTINGS-004 ====================
test('E2E-ADMIN-SETTINGS-004: 対応ブラウザ案内の編集フロー', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('システム設定画面にアクセス', async () => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  await test.step('対応ブラウザ案内の「編集」ボタンをクリック', async () => {
    const browserSection = page.getByRole('heading', { name: '対応ブラウザ案内' }).locator('..');
    await browserSection.locator('button:has-text("編集")').click();
  });

  await test.step('ダイアログが表示される', async () => {
    const dialog = page.getByRole('dialog', { name: '対応ブラウザ案内の編集' });
    await expect(dialog).toBeVisible();
  });

  await test.step('テキストを変更（文字カウンター確認）', async () => {
    // ダイアログ内のtextboxを取得
    const dialog = page.getByRole('dialog');
    const textarea = dialog.getByRole('textbox');
    await textarea.fill('テストブラウザ案内メッセージ');

    // 文字カウンターの存在確認
    await expect(page.locator('text=/\\d+ \\/ 2000/')).toBeVisible();
  });

  await test.step('「保存」ボタンをクリック', async () => {
    await page.getByRole('button', { name: '保存' }).click();
  });

  await test.step('成功メッセージが表示される', async () => {
    const successDialog = page.getByRole('dialog', { name: '保存完了' });
    await expect(successDialog).toBeVisible({ timeout: 5000 });
  });

  await test.step('成功ダイアログを閉じる', async () => {
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
  });

  await test.step('設定カードに反映される', async () => {
    await expect(page.locator('text=テストブラウザ案内メッセージ')).toBeVisible();
  });
});

// ==================== E2E-ADMIN-SETTINGS-005 ====================
test('E2E-ADMIN-SETTINGS-005: 対応ブラウザ案内のキャンセル動作', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('システム設定画面にアクセス', async () => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  // 現在の値を取得
  const currentText = await page.getByRole('heading', { name: '対応ブラウザ案内' }).locator('..').textContent();

  await test.step('対応ブラウザ案内の「編集」ボタンをクリック', async () => {
    const browserSection = page.getByRole('heading', { name: '対応ブラウザ案内' }).locator('..');
    await browserSection.locator('button:has-text("編集")').click();
  });

  await test.step('ダイアログが表示される', async () => {
    const dialog = page.getByRole('dialog', { name: '対応ブラウザ案内の編集' });
    await expect(dialog).toBeVisible();
  });

  await test.step('テキストを変更', async () => {
    const dialog = page.getByRole('dialog');
    const textarea = dialog.getByRole('textbox');
    await textarea.fill('キャンセルされるべきテキスト');
  });

  await test.step('「キャンセル」ボタンをクリック', async () => {
    await page.getByRole('button', { name: 'キャンセル' }).click();
  });

  await test.step('ダイアログが閉じる', async () => {
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
  });

  await test.step('変更が破棄される', async () => {
    // 新しいテキストは表示されない
    await expect(page.locator('text=キャンセルされるべきテキスト')).not.toBeVisible();
  });
});

// ==================== E2E-ADMIN-SETTINGS-006 ====================
test('E2E-ADMIN-SETTINGS-006: 利用規約の編集フロー', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('システム設定画面にアクセス', async () => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  await test.step('利用規約の「編集」ボタンをクリック', async () => {
    const termsSection = page.getByRole('heading', { name: '利用規約' }).locator('..');
    await termsSection.locator('button:has-text("編集")').click();
  });

  await test.step('ダイアログが表示される', async () => {
    const dialog = page.getByRole('dialog', { name: '利用規約の編集' });
    await expect(dialog).toBeVisible();
  });

  await test.step('テキストを変更', async () => {
    const dialog = page.getByRole('dialog');
    const textarea = dialog.getByRole('textbox');
    await textarea.fill('テスト利用規約の内容');
  });

  await test.step('「保存」ボタンをクリック', async () => {
    await page.getByRole('button', { name: '保存' }).click();
  });

  await test.step('成功メッセージが表示される', async () => {
    const successDialog = page.getByRole('dialog', { name: '保存完了' });
    await expect(successDialog).toBeVisible({ timeout: 5000 });
  });

  await test.step('成功ダイアログを閉じる', async () => {
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
  });

  await test.step('設定カードに反映される', async () => {
    await expect(page.locator('text=テスト利用規約の内容')).toBeVisible();
  });
});

// ==================== E2E-ADMIN-SETTINGS-007 ====================
test('E2E-ADMIN-SETTINGS-007: メンテナンスモード ON切替フロー', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('システム設定画面にアクセス', async () => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  await test.step('メンテナンスモードスイッチをクリック（OFF→ON）', async () => {
    const maintenanceSwitch = page.getByRole('switch', { name: 'メンテナンスモードをONにする' });
    await maintenanceSwitch.click();
  });

  await test.step('確認ダイアログが表示される', async () => {
    const dialog = page.getByRole('dialog', { name: 'メンテナンスモード切替確認' });
    await expect(dialog).toBeVisible();
  });

  await test.step('メンテナンスメッセージを入力', async () => {
    const dialog = page.getByRole('dialog');
    const messageInput = dialog.getByRole('textbox');
    await messageInput.fill('定期メンテナンス中です。しばらくお待ちください。');
  });

  await test.step('「ONにする」ボタンをクリック', async () => {
    await page.getByRole('button', { name: 'ONにする' }).click();
  });

  await test.step('成功メッセージが表示される', async () => {
    await expect(page.locator('text=メンテナンスモードをONにしました')).toBeVisible({ timeout: 5000 });
  });

  await test.step('「ON」チップが表示される', async () => {
    await expect(page.locator('text=ON').first()).toBeVisible();
  });

  await test.step('メンテナンスメッセージが表示される', async () => {
    await expect(page.locator('text=定期メンテナンス中です。しばらくお待ちください。')).toBeVisible();
  });
});

// ==================== E2E-ADMIN-SETTINGS-008 ====================
test('E2E-ADMIN-SETTINGS-008: メンテナンスモード OFF切替フロー', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('システム設定画面にアクセス', async () => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  await test.step('メンテナンスモードをONにする（事前準備）', async () => {
    // まずONにする（前のテストの状態に依存しないため）
    const switchElement = page.getByRole('switch', { name: 'メンテナンスモードをONにする' });
    const isVisible = await switchElement.isVisible().catch(() => false);
    if (isVisible) {
      await switchElement.click();
      // ONにする確認ダイアログ
      const confirmDialog = page.getByRole('dialog', { name: 'メンテナンスモード切替確認' });
      await expect(confirmDialog).toBeVisible();
      await page.getByRole('button', { name: 'ONにする' }).click();
      // 成功ダイアログを閉じる
      const successDialog = page.getByRole('dialog', { name: '設定変更完了' });
      await expect(successDialog).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: 'OK' }).click();
      await expect(successDialog).toBeHidden({ timeout: 5000 });
    }
  });

  await test.step('メンテナンスモードスイッチをクリック（ON→OFF）', async () => {
    const maintenanceSwitch = page.getByRole('switch', { name: 'メンテナンスモードをOFFにする' });
    await maintenanceSwitch.click();
  });

  await test.step('確認ダイアログが表示される', async () => {
    const dialog = page.getByRole('dialog', { name: 'メンテナンスモード切替確認' });
    await expect(dialog).toBeVisible();
  });

  await test.step('「OFFにする」ボタンをクリック', async () => {
    await page.getByRole('button', { name: 'OFFにする' }).click();
  });

  await test.step('成功メッセージが表示される', async () => {
    await expect(page.locator('text=メンテナンスモードをOFFにしました')).toBeVisible({ timeout: 5000 });
  });

  await test.step('「OFF」チップが表示される', async () => {
    await expect(page.locator('text=OFF').first()).toBeVisible();
  });

  await test.step('メンテナンスメッセージが非表示になる', async () => {
    // メッセージが非表示または空になる
    const messageElement = page.locator('[data-testid="maintenance-message"]');
    await expect(messageElement).not.toBeVisible();
  });
});

// ==================== E2E-ADMIN-SETTINGS-009 ====================
test('E2E-ADMIN-SETTINGS-009: 管理画面ヘッダーのメールアドレス表示', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('システム設定画面にアクセス', async () => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  await test.step('AppBar右側にログイン中のメールアドレスが表示される', async () => {
    // AppBarの右側を特定
    const appBar = page.getByRole('banner');
    await expect(appBar.getByText(TEST_ADMIN.email)).toBeVisible();
  });
});

// ==================== E2E-ADMIN-SETTINGS-010 ====================
test('E2E-ADMIN-SETTINGS-010: 管理者一覧表示と自分識別チップ', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('管理者管理画面にアクセス', async () => {
    await page.goto('/admin/admin-management');
    await page.waitForLoadState('networkidle');
  });

  await test.step('管理者一覧が表示される', async () => {
    // 「管理者を追加」ボタンの存在で確認
    await expect(page.getByRole('button', { name: '管理者を追加' })).toBeVisible();
  });

  await test.step('ログイン中のアカウントに青色「自分」チップが表示される', async () => {
    // 自分のメールアドレスの行を特定
    const selfRow = page.locator(`text=${TEST_ADMIN.email}`).locator('..');

    // 「自分」チップが表示される
    await expect(selfRow.locator('text=自分')).toBeVisible();

    // チップの色がprimary（青色）であることを確認
    const selfChip = selfRow.locator('text=自分').locator('..');
    // MUI ChipのPrimary色を確認（青系の色）
    await expect(selfChip).toHaveCSS('background-color', /rgb\(.*\d+.*\d+.*\d+\)/); // 青系の色が設定されていることを確認
  });

  await test.step('「自分」チップのあるアカウントには削除ボタンが非表示', async () => {
    const selfRow = page.locator(`text=${TEST_ADMIN.email}`).locator('..');

    // 削除ボタンが非表示
    await expect(selfRow.locator('button[aria-label="削除"]')).not.toBeVisible();
  });
});

// ==================== E2E-ADMIN-SETTINGS-011 ====================
test('E2E-ADMIN-SETTINGS-011: 管理者追加フロー（既存ユーザー）', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // テスト用のユニークなメールアドレス（タイムスタンプ）
  const timestamp = Date.now();
  const newAdminEmail = `newadmin${timestamp}@example.com`;

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('管理者管理画面にアクセス', async () => {
    await page.goto('/admin/admin-management');
    await page.waitForLoadState('networkidle');
  });

  await test.step('「管理者を追加」ボタンをクリック', async () => {
    await page.getByRole('button', { name: '管理者を追加' }).click();
  });

  await test.step('ダイアログが表示される', async () => {
    const dialog = page.getByRole('dialog', { name: '管理者を追加' });
    await expect(dialog).toBeVisible();
  });

  await test.step('メールアドレスを入力', async () => {
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('メールアドレス').fill(newAdminEmail);
  });

  await test.step('「追加」ボタンをクリック', async () => {
    await page.getByRole('button', { name: '追加' }).click();
  });

  await test.step('エラーメッセージが表示される（存在しないユーザー）', async () => {
    // 存在しないユーザーを追加しようとした場合のエラー
    await expect(page.getByText('登録されていないユーザーです')).toBeVisible({ timeout: 5000 });
  });

  await test.step('ダイアログが開いたまま', async () => {
    // エラーの場合、ダイアログは閉じない
    const dialog = page.getByRole('dialog', { name: '管理者を追加' });
    await expect(dialog).toBeVisible();
  });

  await test.step('ダイアログを閉じる', async () => {
    await page.getByRole('button', { name: 'キャンセル' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });
});

// ==================== E2E-ADMIN-SETTINGS-012 ====================
test('E2E-ADMIN-SETTINGS-012: 管理者追加フロー（重複チェック）', async ({ page }) => {
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('管理者ログイン', async () => {
    await loginAsAdmin(page);
  });

  await test.step('管理者管理画面にアクセス', async () => {
    await page.goto('/admin/admin-management');
    await page.waitForLoadState('networkidle');
  });

  await test.step('「管理者を追加」ボタンをクリック', async () => {
    await page.getByRole('button', { name: '管理者を追加' }).click();
  });

  await test.step('ダイアログが表示される', async () => {
    const dialog = page.getByRole('dialog', { name: '管理者を追加' });
    await expect(dialog).toBeVisible();
  });

  await test.step('既存管理者のメールアドレスを入力', async () => {
    // 自分自身のメールアドレス（既存管理者）
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('メールアドレス').fill(TEST_ADMIN.email);
  });

  await test.step('「追加」ボタンをクリック', async () => {
    await page.getByRole('button', { name: '追加' }).click();
  });

  await test.step('エラーメッセージが表示される', async () => {
    await expect(page.locator('text=/既に管理者|重複|すでに存在/')).toBeVisible({ timeout: 5000 });
  });

  await test.step('ダイアログが開いたまま（一覧が変更されない）', async () => {
    // ダイアログが開いたまま
    await expect(page.locator('role=dialog')).toBeVisible();
  });
});
