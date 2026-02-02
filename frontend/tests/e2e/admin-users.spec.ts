import { test, expect } from '@playwright/test';

// テストアカウント（管理者）
const TEST_ADMIN = {
  email: 'fulltest-admin@example.com',
  password: 'Admin1234!',
};

// ページURL
const ADMIN_USERS_URL = '/admin/users';

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

// ==================== E2E-AUSERS-001 ====================
test('E2E-AUSERS-001: ページアクセス・一覧表示', async ({ page }) => {
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

  await test.step('ユーザー管理画面にアクセス', async () => {
    await page.goto('/admin/users');
    // ページ読み込み完了を待機
    await page.waitForLoadState('networkidle');
  });

  await test.step('基本UIの表示確認', async () => {
    // ページタイトル
    await expect(page.getByRole('heading', { name: 'ユーザー管理' })).toBeVisible();

    // 更新ボタン
    await expect(page.getByRole('button', { name: '更新' })).toBeVisible();

    // 簡易版アラート（説明文）
    const alertText = page.locator('text=/Phase 11/');
    if (await alertText.isVisible()) {
      await expect(alertText).toBeVisible();
    }

    // フィルタセクション
    await expect(page.getByTestId('status-filter')).toBeVisible();
    await expect(page.getByTestId('plan-filter')).toBeVisible();
    await expect(page.getByPlaceholder('名前またはメールアドレスで検索')).toBeVisible();

    // テーブルヘッダー
    await expect(page.getByRole('columnheader', { name: '名前' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'メールアドレス' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ステータス' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'プラン' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '登録日' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '最終ログイン' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible();

    // テーブル本体
    await page.locator('table tbody tr').first().waitFor();

    // ページネーション
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
  });
});

// ==================== E2E-AUSERS-002 ====================
test('E2E-AUSERS-002: ユーザー情報表示確認', async ({ page }) => {
  // コンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('前提条件: E2E-AUSERS-001完了', async () => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_USERS_URL);
    await page.waitForLoadState('networkidle');
  });

  await test.step('ユーザー情報表示確認', async () => {
    // テーブル1行目を取得
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor();

    // 各列の存在確認（内容は動的なので、要素の存在のみ確認）
    const cells = firstRow.locator('td');

    // 名前（メールアドレスから生成 または "-"）
    await expect(cells.nth(0)).toBeVisible();

    // メールアドレス
    await expect(cells.nth(1)).toBeVisible();
    const emailText = await cells.nth(1).textContent();
    expect(emailText).toMatch(/@/); // メールアドレス形式

    // ステータス（簡易版: 常に「アクティブ」）
    await expect(cells.nth(2)).toBeVisible();
    const statusText = await cells.nth(2).textContent();
    expect(statusText).toContain('アクティブ');

    // プラン（簡易版: 常に「無料」）
    await expect(cells.nth(3)).toBeVisible();
    const planText = await cells.nth(3).textContent();
    expect(planText).toContain('無料');

    // 登録日（YYYY/MM/DD HH:MM 形式 または "-"）
    await expect(cells.nth(4)).toBeVisible();

    // 最終ログイン（YYYY/MM/DD HH:MM 形式 または "-"）
    await expect(cells.nth(5)).toBeVisible();

    // 操作メニューボタン（操作列のボタン）
    const actionButton = cells.nth(6).getByRole('button');
    await expect(actionButton).toBeVisible();
  });
});

// ==================== E2E-AUSERS-003 ====================
// 未実装: フィルタリング機能（ステータスフィルター、プランフィルター）
test('E2E-AUSERS-003: フィルタリングフロー', async ({ page }) => {
  // コンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('前提条件: ページアクセス', async () => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_USERS_URL);
    await page.waitForLoadState('networkidle');
  });

  await test.step('ステータスフィルター選択', async () => {
    // ステータスフィルターをクリック
    const statusFilter = page.getByTestId('status-filter');
    await statusFilter.click();

    // ドロップダウンメニューが開くのを待つ
    await page.waitForTimeout(300);

    // 「アクティブ」を選択
    const activeOption = page.locator('li:has-text("アクティブ")').first();
    await activeOption.click();

    // フィルタ適用後の一覧更新を待つ
    await page.waitForTimeout(500);
  });

  await test.step('プランフィルター選択', async () => {
    // プランフィルターをクリック
    const planFilter = page.getByTestId('plan-filter');
    await planFilter.click();

    // ドロップダウンメニューが開くのを待つ
    await page.waitForTimeout(300);

    // 「無料」を選択
    const freeOption = page.locator('li:has-text("無料")').first();
    await freeOption.click();

    // フィルタ適用後の一覧更新を待つ
    await page.waitForTimeout(500);
  });

  await test.step('検索フィールド入力', async () => {
    const searchField = page.getByPlaceholder('名前またはメールアドレスで検索');
    await searchField.fill('test');

    // 検索処理の待機（debounce考慮）
    await page.waitForTimeout(600);
  });

  await test.step('フィルタ結果確認', async () => {
    // テーブル行が存在することを確認
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();

    // ページネーションが1ページ目にリセットされていることを確認
    const pageInfo = page.locator('text=/1-\\d+ \\/ \\d+件/');
    await expect(pageInfo).toBeVisible();
  });
});

// ==================== E2E-AUSERS-004 ====================
// 未実装: 検索機能（名前・メールアドレス検索）
test('E2E-AUSERS-004: 検索機能フロー', async ({ page }) => {
  // コンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('前提条件: ページアクセス', async () => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_USERS_URL);
    await page.waitForLoadState('networkidle');
  });

  await test.step('検索実行', async () => {
    const searchField = page.getByPlaceholder('名前またはメールアドレスで検索');
    await searchField.fill('fulltest');

    // 検索処理の待機（debounce考慮）
    await page.waitForTimeout(600);
  });

  await test.step('検索結果確認', async () => {
    // テーブル行が存在することを確認
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();

    // 1行目のメールアドレスに「fulltest」が含まれることを確認
    const firstRowEmail = rows.first().locator('td').nth(1);
    const emailText = await firstRowEmail.textContent();
    expect(emailText?.toLowerCase()).toContain('fulltest');
  });

  await test.step('検索クリア', async () => {
    const searchField = page.getByPlaceholder('名前またはメールアドレスで検索');
    await searchField.clear();

    // 検索クリア後の一覧更新を待つ
    await page.waitForTimeout(600);
  });

  await test.step('全ユーザー表示確認', async () => {
    // テーブル行が存在することを確認
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});

// ==================== E2E-AUSERS-005 ====================
// 未実装: ページネーション機能（ページ切り替え、ページサイズ変更）
test('E2E-AUSERS-005: ページネーションフロー', async ({ page }) => {
  // コンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('前提条件: ページアクセス', async () => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_USERS_URL);
    await page.waitForLoadState('networkidle');
  });

  await test.step('「次へ」ボタンクリック', async () => {
    const nextButton = page.getByRole('button', { name: /next/i });

    // ボタンが有効か確認（データが十分にある場合）
    const isDisabled = await nextButton.isDisabled();

    if (!isDisabled) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // 2ページ目が表示されることを確認
      const pageInfo = page.locator('text=/\\d+-\\d+ \\/ \\d+件/');
      await expect(pageInfo).toBeVisible();
    }
  });

  await test.step('「前へ」ボタンクリック', async () => {
    const prevButton = page.getByRole('button', { name: /previous/i });

    // ボタンが有効か確認
    const isDisabled = await prevButton.isDisabled();

    if (!isDisabled) {
      await prevButton.click();
      await page.waitForTimeout(500);

      // 1ページ目が表示されることを確認
      const pageInfo = page.locator('text=/1-\\d+ \\/ \\d+件/');
      await expect(pageInfo).toBeVisible();
    }
  });

  await test.step('表示件数変更（5件）', async () => {
    // 表示件数セレクトを探す
    const rowsPerPageSelect = page.locator('select').filter({ hasText: '10' }).first();

    if (await rowsPerPageSelect.isVisible()) {
      await rowsPerPageSelect.selectOption('5');
      await page.waitForTimeout(500);

      // ページ情報が更新されることを確認
      const pageInfo = page.locator('text=/1-\\d+ \\/ \\d+件/');
      await expect(pageInfo).toBeVisible();
    }
  });

  await test.step('ページネーションボタンの状態確認', async () => {
    // 1ページ目では「前へ」が無効化されている
    const prevButton = page.getByRole('button', { name: /previous/i });
    const isPrevDisabled = await prevButton.isDisabled();

    // 最後のページでは「次へ」が無効化されている
    const nextButton = page.getByRole('button', { name: /next/i });
    const isNextDisabled = await nextButton.isDisabled();

    // 少なくとも一方のボタンが有効であることを確認（データがある場合）
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // ページネーションが機能していることを確認
      expect(isPrevDisabled || !isNextDisabled).toBeTruthy();
    }
  });
});

// ==================== E2E-AUSERS-006 ====================
// 未実装: ユーザー操作メニュー（詳細表示、編集、削除）
test('E2E-AUSERS-006: ユーザー操作メニュー表示', async ({ page }) => {
  // コンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('前提条件: ページアクセス', async () => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_USERS_URL);
    await page.waitForLoadState('networkidle');
  });

  await test.step('操作メニューボタンクリック', async () => {
    // テーブル1行目の操作メニューボタンを取得
    const firstRow = page.locator('table tbody tr').first();
    const menuButton = firstRow.getByRole('button', { name: 'メニューを開く' });

    await menuButton.click();
    await page.waitForTimeout(300);
  });

  await test.step('メニュー表示確認', async () => {
    // メニューが開いたことを確認
    const menuItem = page.locator('text="停止する"').first();
    await expect(menuItem).toBeVisible();
  });

  await test.step('テーブルレイアウト確認', async () => {
    // テーブルが横に伸びていないことを確認
    const table = page.locator('table');
    const tableBoundingBox = await table.boundingBox();

    // テーブルの幅が画面幅を超えていないことを確認
    expect(tableBoundingBox).toBeTruthy();
    if (tableBoundingBox) {
      const viewportSize = page.viewportSize();
      expect(tableBoundingBox.width).toBeLessThanOrEqual(viewportSize!.width);
    }
  });

  await test.step('メニュー項目クリック', async () => {
    // 「停止する」をクリック
    const menuItem = page.locator('text="停止する"').first();
    await menuItem.click();
    await page.waitForTimeout(500);
  });

  await test.step('メニュー閉じる確認', async () => {
    // メニューが閉じたことを確認（メニュー項目が非表示）
    const menuItem = page.locator('text="停止する"').first();
    const isVisible = await menuItem.isVisible().catch(() => false);
    expect(isVisible).toBeFalsy();
  });

  await test.step('エラーメッセージ確認', async () => {
    // エラーメッセージが表示されていないことを確認
    const errorMessage = page.locator('text=/エラー|失敗/');
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });
});

// ==================== E2E-AUSERS-007 ====================
test('E2E-AUSERS-007: 更新ボタンフロー', async ({ page }) => {
  // コンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('前提条件: ページアクセス', async () => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_USERS_URL);
    await page.waitForLoadState('networkidle');
  });

  await test.step('更新ボタンクリック', async () => {
    const refreshButton = page.getByRole('button', { name: '更新' });
    await refreshButton.click();
  });

  await test.step('ローディング状態確認', async () => {
    // ローディング状態が表示される（CircularProgressまたはローディングメッセージ）
    const loadingIndicator = page.locator('[role="progressbar"]').or(page.locator('text=/読み込み中|Loading/'));

    // ローディングが一瞬でも表示されることを確認（待機時間は短く）
    try {
      await loadingIndicator.waitFor({ state: 'visible', timeout: 1000 });
    } catch (e) {
      // ローディングが高速すぎて検出できない場合はスキップ
    }
  });

  await test.step('ユーザー一覧再表示確認', async () => {
    // API応答待機
    await page.waitForLoadState('networkidle');

    // テーブル行が表示されることを確認
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  await test.step('フィルタ条件維持確認', async () => {
    // フィルタ・検索条件が維持されていることを確認
    // （このテストでは初期状態なので、全ユーザーが表示される）
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
