# ファイルシステム監視機能

## 📋 概要

フォルダーを開いている状態で、ファイルシステムの変更を**5秒ごと**に自動検出し、ファイルツリーをリアルタイムで更新します。

## ✨ 機能

### 自動検出される変更

- ✅ **新規ファイル作成** - 新しいファイルがツリーに自動追加
- ✅ **ファイル削除** - 削除されたファイルがツリーから自動削除
- ✅ **ファイル名変更** - 名前変更が自動反映
- ✅ **フォルダー作成** - 新しいフォルダーがツリーに追加
- ✅ **フォルダー削除** - 削除されたフォルダーがツリーから削除
- ✅ **フォルダー名変更** - フォルダー名の変更が反映

### 更新頻度

- **デフォルト**: 5秒ごとにスキャン
- **カスタマイズ可能**: `useFileSystemWatcher` フックの第3引数で変更可能

```typescript
// 例: 3秒ごとに更新
useFileSystemWatcher(rootHandle, handleUpdate, 3000);

// 例: 10秒ごとに更新
useFileSystemWatcher(rootHandle, handleUpdate, 10000);
```

## 🛠️ 実装詳細

### 使用技術

- **File System Access API** - ディレクトリへのアクセス
- **ポーリング方式** - 定期的にフォルダーをスキャンして変更を検出
- **React Hooks** - `useEffect` で監視を管理

### 変更検出の仕組み

1. **ディレクトリスキャン**
   5秒ごとにルートディレクトリを再帰的にスキャン

2. **ツリーのシリアライズ**
   ファイル名、パス、タイプ、サイズ、更新日時をJSON化

3. **差分検出**
   前回のツリーと比較して変更を検出

4. **UI更新**
   変更があった場合のみ、ファイルツリーを更新

### パフォーマンス最適化

- ✅ 変更がない場合はUI更新をスキップ
- ✅ 軽量なシリアライズによる比較
- ✅ 不要なレンダリングを防止
- ✅ ルートハンドルがない場合は監視を停止

## 📁 ファイル構成

```
frontend/src/
├── hooks/
│   ├── useFileSystemWatcher.ts  # ファイル監視フック
│   └── index.ts                  # エクスポート
└── pages/
    └── EditorPage/
        └── index.tsx             # フック使用場所
```

## 🔧 カスタマイズ

### 更新頻度の変更

`EditorPage/index.tsx` の以下の行を編集：

```typescript
// 現在: 5秒ごと
useFileSystemWatcher(rootHandle, handleFileSystemUpdate, 5000);

// 3秒ごとに変更
useFileSystemWatcher(rootHandle, handleFileSystemUpdate, 3000);

// 10秒ごとに変更
useFileSystemWatcher(rootHandle, handleFileSystemUpdate, 10000);
```

### 監視の無効化

監視を完全に無効にしたい場合：

```typescript
// この行をコメントアウト
// useFileSystemWatcher(rootHandle, handleFileSystemUpdate, 5000);
```

### 手動リフレッシュの追加

ボタンでの手動リフレッシュも可能：

```typescript
const { refresh } = useFileSystemWatcher(
  rootHandle,
  handleFileSystemUpdate,
  5000
);

// ボタンのクリックハンドラー
const handleRefreshClick = async () => {
  await refresh();
  console.log('手動リフレッシュ完了');
};
```

## 🐛 トラブルシューティング

### 問題: ファイルが追加されても反映されない

**原因**:
- ブラウザのファイルアクセス権限が失われている
- フォルダーが開かれていない

**解決策**:
1. フォルダーを再度開く
2. ブラウザを再起動
3. コンソールでエラーを確認

### 問題: パフォーマンスが低下する

**原因**:
- 非常に大きなフォルダー構造
- 更新頻度が高すぎる

**解決策**:
1. 更新頻度を10秒に変更
2. サブフォルダーの深さを制限（実装の変更が必要）

### 問題: コンソールにエラーが表示される

**エラー例**:
```
Error scanning directory: NotAllowedError
```

**原因**: ファイルアクセス権限が拒否された

**解決策**:
1. フォルダーピッカーで再度フォルダーを選択
2. ブラウザの設定でファイルアクセスを許可

## 💡 今後の改善案

### 実装予定の機能

1. **選択的監視**
   - 特定のフォルダーのみ監視
   - ファイルタイプでフィルタリング

2. **変更通知**
   - 変更内容をトースト通知で表示
   - 「新しいファイルが追加されました」

3. **競合検出**
   - 開いているファイルが外部で変更された場合の警告
   - 「再読み込みしますか？」ダイアログ

4. **パフォーマンス改善**
   - 増分スキャン（変更があった部分のみ）
   - Web Worker での非同期スキャン

5. **設定UI**
   - 設定画面で更新頻度を変更可能に
   - 監視のON/OFF切り替え

## 📚 関連ドキュメント

- [File System Access API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [React Hooks - useEffect](https://react.dev/reference/react/useEffect)
- [React Hooks - useCallback](https://react.dev/reference/react/useCallback)

---

**作成日**: 2026-01-29
**バージョン**: 1.0.0
**更新頻度**: 5秒（デフォルト）
