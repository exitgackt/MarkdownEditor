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
  onOriginalChange?: (value: string) => void;
  onModifiedChange?: (value: string) => void;
}

const MonacoDiffEditor = ({
  original,
  modified,
  originalLanguage = 'markdown',
  modifiedLanguage = 'markdown',
  onOriginalChange,
  onModifiedChange,
}: MonacoDiffEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const { fontSize, colorTheme, wordWrap } = useSettingsStore();

  const colorThemeRef = useRef(colorTheme);
  const [themesInitialized, setThemesInitialized] = useState(false);
  const originalRef = useRef(original);
  const modifiedRef = useRef(modified);
  const isSettingValueRef = useRef(false);

  // colorThemeの最新値をrefに保存
  useEffect(() => {
    colorThemeRef.current = colorTheme;
  }, [colorTheme]);

  // テーマ定義は1回だけ実行（エディタ作成前に完了させる）
  useEffect(() => {
    initializeMonacoThemes(monaco as any);
    setThemesInitialized(true);
  }, []);

  // エディタの初期化（テーマ初期化完了後のみ実行）
  useEffect(() => {
    if (!containerRef.current || !themesInitialized) return;

    // Diff Editorを作成
    const themeName = colorThemeRef.current === 'vs-light' ? 'vs' : 'vs-dark';
    const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
      theme: themeName,
      fontSize,
      fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
      fontLigatures: true,
      automaticLayout: true,
      readOnly: false,
      originalEditable: true,
      renderSideBySide: true,
      enableSplitViewResizing: true,
      ignoreTrimWhitespace: false,
      renderOverviewRuler: true,
      renderIndicators: true,  // 差分インジケーターを常時表示
      glyphMargin: true,  // グリフマージンを有効化（行番号左側の装飾領域）
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
      overviewRulerLanes: 3,  // overview rulerの表示レーン数を増やす
      padding: { top: 8, bottom: 16 },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'none',
      // Monacoの組み込み検索機能を無効化（カスタム検索ダイアログを使用）
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: 'never',
        seedSearchStringFromSelection: 'never',
      },
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

    // 左側（original）エディタを取得
    const originalEditor = diffEditor.getOriginalEditor();

    // 右側（modified）エディタを取得
    const modifiedEditor = diffEditor.getModifiedEditor();

    // 両方のエディタでCtrl+Fのデフォルト動作を無効化
    originalEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      // 何もしない（カスタム検索ダイアログを使用）
    });
    modifiedEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      // 何もしない（カスタム検索ダイアログを使用）
    });

    // 左側（original）の変更を監視
    const originalChangeDisposable = originalEditor.onDidChangeModelContent(() => {
      if (isSettingValueRef.current) return; // プログラムによる更新は無視
      const newValue = originalModel.getValue();
      originalRef.current = newValue; // refを更新してループを防ぐ
      onOriginalChange?.(newValue);
    });

    // 右側（modified）の変更を監視
    const modifiedChangeDisposable = modifiedEditor.onDidChangeModelContent(() => {
      if (isSettingValueRef.current) return; // プログラムによる更新は無視
      const newValue = modifiedModel.getValue();
      modifiedRef.current = newValue; // refを更新してループを防ぐ
      onModifiedChange?.(newValue);
    });

    return () => {
      originalChangeDisposable.dispose();
      modifiedChangeDisposable.dispose();
      originalModel.dispose();
      modifiedModel.dispose();
      diffEditor.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themesInitialized]);

  // テーマ変更時にMonacoのテーマを更新
  useEffect(() => {
    const themeName = colorTheme === 'vs-light' ? 'vs' : 'vs-dark';
    monaco.editor.setTheme(themeName);

    if (editorRef.current) {
      const modifiedEditor = editorRef.current.getModifiedEditor();
      const originalEditor = editorRef.current.getOriginalEditor();

      modifiedEditor.updateOptions({ theme: themeName });
      originalEditor.updateOptions({ theme: themeName });
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

  // コンテンツが変更されたらモデルを更新（外部からの変更のみ）
  useEffect(() => {
    if (!editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    // 前回の値と比較して、外部から変更された場合のみ更新
    const needUpdateOriginal = originalRef.current !== original;
    const needUpdateModified = modifiedRef.current !== modified;

    if (!needUpdateOriginal && !needUpdateModified) return;

    // setValueを呼ぶ際はフラグを立ててonChangeを無視
    isSettingValueRef.current = true;

    if (needUpdateOriginal) {
      console.log('[MonacoDiffEditor] Original更新:', {
        oldLength: originalRef.current.length,
        newLength: original.length,
      });
      model.original.setValue(original);
      originalRef.current = original;
    }

    if (needUpdateModified) {
      console.log('[MonacoDiffEditor] Modified更新:', {
        oldLength: modifiedRef.current.length,
        newLength: modified.length,
      });
      model.modified.setValue(modified);
      modifiedRef.current = modified;
    }

    // 次のイベントループでフラグをリセット
    setTimeout(() => {
      isSettingValueRef.current = false;
    }, 0);
  }, [original, modified]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: 'calc(100% - 20px)',
        marginBottom: '20px',
        overflow: 'hidden',
        // Revert Blockのメニューボタン（...）を完全に非表示
        '& .monaco-diff-editor .monaco-action-bar': {
          display: 'none !important',
        },
        // 中央の3点メニューも非表示
        '& .monaco-diff-editor .gutterDiffActions': {
          '& .monaco-toolbar': {
            display: 'none !important',
          },
          '& [aria-label="More Actions..."]': {
            display: 'none !important',
          },
        },
        // 矢印ボタン（差分アクション）のみ表示
        '& .monaco-diff-editor .gutterDiffActions .action-label': {
          display: 'inline-block !important',
        },
        // 差分の縦線（gutterItem）を常時表示 - これが重要！
        '& .monaco-diff-editor .gutter .gutterItem': {
          opacity: '1 !important',
        },
      }}
    />
  );
};

export default MonacoDiffEditor;
