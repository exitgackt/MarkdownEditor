import { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { Box } from '@mui/material';
import { useSettingsStore } from '../../stores';
import { initializeMonacoThemes } from '../../utils/monacoThemes';

interface MonacoDiffEditorProps {
  original: string;
  modified: string;
  originalLanguage?: string;
  modifiedLanguage?: string;
}

const MonacoDiffEditor = ({
  original,
  modified,
  originalLanguage = 'markdown',
  modifiedLanguage = 'markdown',
}: MonacoDiffEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const { fontSize, colorTheme, wordWrap } = useSettingsStore();

  // デバッグ: colorThemeの値を確認
  console.log('[MonacoDiffEditor] マウント時 colorTheme:', colorTheme);

  const colorThemeRef = useRef(colorTheme);
  const [themesInitialized, setThemesInitialized] = useState(false);

  // colorThemeの最新値をrefに保存
  useEffect(() => {
    console.log('[MonacoDiffEditor] colorTheme更新:', colorTheme);
    colorThemeRef.current = colorTheme;
  }, [colorTheme]);

  // テーマ定義は1回だけ実行（エディタ作成前に完了させる）
  useEffect(() => {
    console.log('[MonacoDiffEditor] テーマ初期化開始');
    // グローバルにテーマを初期化（一度だけ実行される）
    initializeMonacoThemes(monaco as any);
    console.log('[MonacoDiffEditor] テーマ初期化完了');
    setThemesInitialized(true);
  }, []);

  // エディタの初期化（テーマ初期化完了後のみ実行）
  useEffect(() => {
    if (!containerRef.current || !themesInitialized) return;

    // Diff Editorを作成（colorThemeRefから最新の値を取得）
    // 組み込みテーマを直接使用（vs-dark / vs）
    const themeName = colorThemeRef.current === 'vs-light' ? 'vs' : 'vs-dark';
    console.log('[MonacoDiffEditor] エディタ作成 colorThemeRef.current:', colorThemeRef.current, '→ themeName:', themeName);
    const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
      theme: themeName,
      fontSize,
      fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
      fontLigatures: true,
      automaticLayout: true,
      readOnly: false,
      originalEditable: true,  // 左側（original）も編集可能にする
      renderSideBySide: true,
      enableSplitViewResizing: true,
      ignoreTrimWhitespace: false,
      renderOverviewRuler: true,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      wordWrap,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 9,
        horizontalScrollbarSize: 9,
        useShadows: false,
      },
      overviewRulerLanes: 0,
      padding: { top: 8, bottom: 16 },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'none',
    });

    editorRef.current = diffEditor;

    // モデルを設定
    const originalModel = monaco.editor.createModel(original, originalLanguage);
    const modifiedModel = monaco.editor.createModel(modified, modifiedLanguage);

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    // テーマを確実に適用
    monaco.editor.setTheme(themeName);

    return () => {
      originalModel.dispose();
      modifiedModel.dispose();
      diffEditor.dispose();
    };
  }, [originalLanguage, modifiedLanguage, themesInitialized]);

  // テーマ変更時にMonacoのテーマを更新
  useEffect(() => {
    // 組み込みテーマを直接使用（vs-dark / vs）
    const themeName = colorTheme === 'vs-light' ? 'vs' : 'vs-dark';
    console.log('[MonacoDiffEditor] テーマ変更:', colorTheme, '→', themeName);
    console.log('[MonacoDiffEditor] editorRef.current:', !!editorRef.current);

    // グローバルにテーマを設定（エディタの有無に関係なく）
    console.log('[MonacoDiffEditor] setTheme を実行:', themeName);
    monaco.editor.setTheme(themeName);

    // エディタインスタンスにも明示的に適用
    if (editorRef.current) {
      console.log('[MonacoDiffEditor] updateOptions を実行:', themeName);
      const modifiedEditor = editorRef.current.getModifiedEditor();
      const originalEditor = editorRef.current.getOriginalEditor();

      modifiedEditor.updateOptions({
        theme: themeName,
      });

      originalEditor.updateOptions({
        theme: themeName,
      });

      // 強制的に再レイアウト
      editorRef.current.layout();
    }
  }, [colorTheme]);

  // フォントサイズと折り返し設定の変更時に更新
  useEffect(() => {
    if (editorRef.current) {
      const modifiedEditor = editorRef.current.getModifiedEditor();
      const originalEditor = editorRef.current.getOriginalEditor();

      modifiedEditor.updateOptions({
        fontSize,
        wordWrap,
      });

      originalEditor.updateOptions({
        fontSize,
        wordWrap,
      });
    }
  }, [fontSize, wordWrap]);

  // コンテンツが変更されたらモデルを更新
  useEffect(() => {
    if (!editorRef.current) return;

    const model = editorRef.current.getModel();
    if (model) {
      if (model.original.getValue() !== original) {
        model.original.setValue(original);
      }
      if (model.modified.getValue() !== modified) {
        model.modified.setValue(modified);
      }
    }
  }, [original, modified]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: 'calc(100% - 20px)',
        marginBottom: '20px',
        overflow: 'hidden',
      }}
    />
  );
};

export default MonacoDiffEditor;
