import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2Eテスト設定
 * プロジェクト: Visual Studio風マークダウンエディタ
 */
export default defineConfig({
  testDir: './tests/e2e',

  // ヘッドレスモード強制（絶対に変更禁止）
  use: {
    headless: true,
    baseURL: 'http://localhost:5177',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  // タイムアウト設定
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // テスト実行設定
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,

  // レポート設定
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  // プロジェクト設定（Chrome/Edgeのみ）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Webサーバー設定（既存サーバーを使用）
  webServer: undefined,
});
