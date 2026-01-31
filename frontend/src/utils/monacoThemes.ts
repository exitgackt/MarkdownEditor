import type { Monaco } from '@monaco-editor/react';

let themesInitialized = false;

/**
 * Monaco Editorのカスタムテーマを初期化
 * アプリケーション全体で一度だけ呼び出される
 */
export const initializeMonacoThemes = (monaco: Monaco) => {
  if (themesInitialized) {
    return;
  }

  // ダークテーマを定義（検索結果のハイライト色を目立つ色に）
  monaco.editor.defineTheme('custom-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      // 選択範囲の背景色（検索結果のハイライト）- 明るいオレンジ/黄色
      'editor.selectionBackground': '#E5A50A',
      // 非アクティブ時の選択範囲の背景色（フォーカスが別の場所にある時）
      'editor.inactiveSelectionBackground': '#E5A50A',
      // 選択範囲と同じテキストのハイライト
      'editor.selectionHighlightBackground': '#E5A50A50',
      // 検索結果のハイライト（現在のマッチ）
      'editor.findMatchBackground': '#E5A50A',
      // 検索結果のハイライト（他のマッチ）
      'editor.findMatchHighlightBackground': '#E5A50A60',
      // 現在行のハイライト（選択と干渉しないよう透明に近い色に）
      'editor.lineHighlightBackground': '#ffffff08',
      'editor.lineHighlightBorder': '#ffffff00',
      // スクロールバーのスタイル（マインドマップと同じ）
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#555555',
      'scrollbarSlider.hoverBackground': '#666666',
      'scrollbarSlider.activeBackground': '#777777',
    },
  });

  // ライトテーマを定義
  monaco.editor.defineTheme('custom-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      // 選択範囲の背景色（検索結果のハイライト）- 明るいオレンジ/黄色
      'editor.selectionBackground': '#FFD700',
      // 非アクティブ時の選択範囲の背景色
      'editor.inactiveSelectionBackground': '#FFD700',
      // 選択範囲と同じテキストのハイライト
      'editor.selectionHighlightBackground': '#FFD70050',
      // 検索結果のハイライト（現在のマッチ）
      'editor.findMatchBackground': '#FFD700',
      // 検索結果のハイライト（他のマッチ）
      'editor.findMatchHighlightBackground': '#FFD70060',
      // 現在行のハイライト
      'editor.lineHighlightBackground': '#00000008',
      'editor.lineHighlightBorder': '#00000000',
      // スクロールバーのスタイル（マインドマップと同じ）
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#555555',
      'scrollbarSlider.hoverBackground': '#666666',
      'scrollbarSlider.activeBackground': '#777777',
    },
  });

  // 差分比較用ダークテーマ
  monaco.editor.defineTheme('diff-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      // 差分比較の色（濃い色に変更）
      'diffEditor.insertedTextBackground': '#1E5E1ECC',  // 濃い緑
      'diffEditor.removedTextBackground': '#8B0000CC',   // 濃い赤
      'diffEditor.insertedLineBackground': '#1E5E1E99',  // 濃い緑（行全体）
      'diffEditor.removedLineBackground': '#8B000099',   // 濃い赤（行全体）
      'diffEditor.diagonalFill': '#3C3C3C',
    },
  });

  // 差分比較用ライトテーマ
  monaco.editor.defineTheme('diff-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      // 差分比較の色
      'diffEditor.insertedTextBackground': '#9CFF9C80',  // 薄い緑
      'diffEditor.removedTextBackground': '#FF9C9C80',   // 薄い赤
      'diffEditor.insertedLineBackground': '#9CFF9C40',  // 薄い緑（行全体）
      'diffEditor.removedLineBackground': '#FF9C9C40',   // 薄い赤（行全体）
      'diffEditor.diagonalFill': '#E0E0E0',
    },
  });

  themesInitialized = true;
};
