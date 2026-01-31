# CLAUDE.md - AI開発ガイド

このファイルはAI（Claude等）がプロジェクトを理解し、効果的に開発支援を行うためのガイドです。

---

## プロジェクト概要

**プロダクト名**: Visual Studio風マークダウンエディタ

**概要**: サブスクリプション型で提供するVisual Studio風マークダウンエディタ。ブラウザサービス（Webアプリ）として開発。

**主な特徴**:
- Googleログイン認証
- Monaco Editorによるマークダウン編集
- リアルタイムプレビュー
- ファイルツリー・タブ管理
- 差分比較機能
- マインドマップ表示
- PDF/HTML/Word エクスポート
- お気に入り機能
- 管理者機能

---

## 技術スタック

### フロントエンド
```
Vite + React 18 + TypeScript
├── UIライブラリ: MUI v6
├── エディタ: Monaco Editor
├── 状態管理: Zustand
├── ファイル操作: File System Access API
├── PDF生成: html2pdf.js / jsPDF
├── Word変換: mammoth.js
├── マインドマップ: markmap-lib + markmap-view
└── ホスティング: Vercel / Cloudflare Pages
```

### バックエンド
```
Python + FastAPI
├── 認証: Google OAuth 2.0
├── DB: PostgreSQL (Neon)
├── 課金: Stripe (Phase 11)
└── ホスティング: Google Cloud Run
```

---

## ディレクトリ構造（予定）

```
MarkdownEditor/
├── docs/                          # ドキュメント
│   ├── requirements.md            # 要件定義書
│   ├── requirements_draft.md      # 要件定義ドラフト
│   └── SCOPE_PROGRESS.md          # 開発進捗状況
├── frontend/                      # フロントエンド（React）
│   ├── src/
│   │   ├── components/            # Reactコンポーネント
│   │   │   ├── Editor/            # エディタ関連
│   │   │   ├── Preview/           # プレビュー関連
│   │   │   ├── FileTree/          # ファイルツリー
│   │   │   ├── Mindmap/           # マインドマップ
│   │   │   ├── Layout/            # レイアウト
│   │   │   └── common/            # 共通コンポーネント
│   │   ├── hooks/                 # カスタムフック
│   │   ├── stores/                # Zustand ストア
│   │   ├── services/              # API呼び出し
│   │   ├── utils/                 # ユーティリティ
│   │   ├── types/                 # 型定義
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                       # バックエンド（FastAPI）
│   ├── app/
│   │   ├── api/                   # APIエンドポイント
│   │   ├── core/                  # 設定、認証
│   │   ├── models/                # DBモデル
│   │   ├── schemas/               # Pydantic スキーマ
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── CLAUDE.md                      # このファイル
└── README.md
```

---

## 主要機能と実装ポイント

### 1. 認証（Google OAuth 2.0）
- フロントエンド: `@react-oauth/google`
- バックエンド: `google-auth` ライブラリ
- JWTトークンでセッション管理

### 2. エディタ（Monaco Editor）
- `@monaco-editor/react` パッケージ使用
- マークダウンシンタックスハイライト
- 差分比較: Monaco Diff Editor

### 3. ファイル操作（File System Access API）
- `window.showDirectoryPicker()` でフォルダ選択
- Chrome/Edge優先対応
- 権限はIndexedDBで永続化

### 4. プレビュー
- `react-markdown` または `markdown-it` 使用
- リアルタイム同期（debounce処理）

### 5. マインドマップ
- `markmap-lib`: マークダウン → ツリー構造変換
- `markmap-view`: SVGレンダリング
- D3.jsベースのズーム/パン

### 6. エクスポート
- PDF: `html2pdf.js` + `jsPDF`
- HTML: `marked` でレンダリング
- Word: 検討中（docx-templater等）

### 7. お気に入り
- Zustandで状態管理
- バックエンドDBに永続化

---

## コーディング規約

### TypeScript
- 厳格モード（strict: true）
- 型定義は `types/` ディレクトリに集約
- `any` 型は原則禁止

### React
- 関数コンポーネント + Hooks
- コンポーネントは1ファイル1コンポーネント
- Props型は `XxxProps` 命名

### 命名規則
| 対象 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `EditorPanel.tsx` |
| 関数 | camelCase | `handleFileOpen()` |
| 定数 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 型/インターフェース | PascalCase | `FileNode`, `EditorState` |

### ファイル構成
```typescript
// 1. インポート（外部→内部の順）
import React from 'react';
import { Box } from '@mui/material';
import { useEditorStore } from '@/stores/editorStore';

// 2. 型定義
interface EditorPanelProps {
  fileId: string;
}

// 3. コンポーネント
export const EditorPanel: React.FC<EditorPanelProps> = ({ fileId }) => {
  // hooks
  // state
  // handlers
  // render
};
```

---

## 重要ファイル

| ファイル | 説明 |
|----------|------|
| `docs/requirements.md` | 要件定義書（機能一覧、技術仕様） |
| `docs/SCOPE_PROGRESS.md` | 開発進捗状況 |
| `frontend/src/stores/` | Zustand状態管理 |
| `frontend/src/components/Editor/` | Monaco Editor統合 |
| `backend/app/core/auth.py` | Google OAuth認証 |

---

## 開発時の注意事項

### ブラウザ対応
- File System Access APIはChrome/Edgeのみフル対応
- Safari/Firefoxはフォールバック実装が必要

### パフォーマンス
- プレビュー更新はdebounce（300-500ms）
- 大きいファイル（>500KB）は仮想スクロール検討
- マインドマップは1000ノード以上で遅延可能性

### セキュリティ
- 環境変数で認証情報管理（.envはGit除外）
- HTTPS必須
- XSS対策（マークダウンレンダリング時のサニタイズ）

---

## よく使うコマンド

### フロントエンド
```bash
cd frontend
npm install          # 依存関係インストール
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run lint         # Lint実行
npm run type-check   # 型チェック
```

### バックエンド
```bash
cd backend
pip install -r requirements.txt  # 依存関係インストール
uvicorn app.main:app --reload    # 開発サーバー起動
```

---

## 開発フェーズ

### Phase 1: 要件定義 ✅
- 要件定義書作成完了

### Phase 2: プロジェクトセットアップ（次）
- Vite + React + TypeScript初期化
- MUI導入
- 基本ディレクトリ構造作成

### Phase 3-10: 機能実装
- エディタ、プレビュー、ファイル操作等

### Phase 11: 課金機能
- Stripe統合

---

## 参考リンク

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Markmap](https://markmap.js.org/)
- [File System Access API](https://developer.chrome.com/articles/file-system-access/)
- [MUI v6](https://mui.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Neon](https://neon.tech/)

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-26 | 初版作成 |

---

### 13. E2Eテスト自律実行の絶対原則

**【重要】セッション開始時・compact後の自動判定**

このセクションはE2Eテストオーケストレーターによって自動生成されました。

---

**最初に必ず専門知識を注入してください**

E2Eテスト実行中の場合、以下を実行してから開始してください：

```
inject_knowledge ツールで keyword: "@E2Eテストオーケストレーター"
を実行してから開始してください。（初回必須・compact後も必須）
```

重要：キーワードは "@E2Eテストオーケストレーター"
をそのまま使用してください。変換や推測は不要です。

準備完了です。まず知識注入を実行してから、タスクを開始してください。

---

**E2Eテストオーケストレーター実行中の判定**:
- SCOPE_PROGRESS.mdに「## 📊 E2Eテスト全体進捗」が存在する場合
- または、セッション再開時に前回のメッセージに「E2Eテスト」「オーケストレーター」キーワードがある場合

**セッション開始時・compact後の自動処理**:
1. 上記の判定基準でE2Eテスト実行中と判定
2. inject_knowledge('@E2Eテストオーケストレーター') を必ず実行
3. docs/e2e-best-practices.md の存在確認（なければ初期テンプレート作成）
4. SCOPE_PROGRESS.mdから [ ] テストの続きを自動で特定
5. [x] のテストは絶対にスキップ
6. ユーザー確認不要、完全自律モードで継続
7. ページ選定も自動（未完了ページを上から順に選択）
8. 停止条件：全テスト100%完了のみ

**5回エスカレーション後の処理**:
- チェックリストに [-] マークを付ける
- docs/e2e-test-history/skipped-tests.md に記録
- 次のテストへ自動で進む（停止しない）

**ベストプラクティス自動蓄積**:
- 各テストで成功した方法を docs/e2e-best-practices.md に自動保存
- 後続テストが前のテストの知見を自動活用
- 試行錯誤が減っていく（学習効果）

**重要**:
- この原則はCLAUDE.mdに記載されているため、compact後も自動で適用される
- セッション開始時にこのセクションがない場合、オーケストレーターが自動で追加する
