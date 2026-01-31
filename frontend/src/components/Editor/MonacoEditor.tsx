import { useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount, OnChange, BeforeMount, Monaco } from '@monaco-editor/react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { editor } from 'monaco-editor';
import { initializeMonacoThemes } from '../../utils/monacoThemes';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  fontSize?: number;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  theme?: 'vs-dark' | 'vs-light';
  onCursorPositionChange?: (line: number, column: number) => void;
  onSearch?: () => void;
  onReplace?: () => void;
}

// 検索オプションの型定義
export interface FindOptions {
  searchText: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

// 置換オプションの型定義
export interface ReplaceOptions extends FindOptions {
  replaceText: string;
}

// 外部から呼び出せるメソッドの型定義
export interface MonacoEditorHandle {
  undo: () => void;
  redo: () => void;
  focus: () => void;
  findNext: (options: FindOptions) => boolean;
  findPrevious: (options: FindOptions) => boolean;
  getSelectedText: () => string;
  replace: (options: ReplaceOptions) => boolean;
  replaceAll: (options: ReplaceOptions) => number;
  setTheme: (theme: 'vs-dark' | 'vs-light') => void;
}

// ローディング表示
const LoadingComponent = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      bgcolor: '#1E1E1E',
      gap: 2,
    }}
  >
    <CircularProgress size={40} sx={{ color: '#007ACC' }} />
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      エディタを読み込んでいます...
    </Typography>
  </Box>
);

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(({
  value,
  onChange,
  language = 'markdown',
  readOnly = false,
  fontSize = 14,
  wordWrap = 'on',
  minimap = false,
  lineNumbers = 'on',
  theme = 'vs-dark',
  onCursorPositionChange,
  onSearch,
  onReplace,
}, ref) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const themeRef = useRef(theme);

  // themeの最新値をrefに保存
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // エディタマウント前の処理（カスタムテーマ定義）
  const handleEditorWillMount: BeforeMount = useCallback((monaco) => {
    // グローバルにテーマを初期化（一度だけ実行される）
    initializeMonacoThemes(monaco);
  }, []);

  // 外部から呼び出せるメソッドを公開
  useImperativeHandle(ref, () => ({
    undo: () => {
      editorRef.current?.trigger('keyboard', 'undo', null);
    },
    redo: () => {
      editorRef.current?.trigger('keyboard', 'redo', null);
    },
    focus: () => {
      editorRef.current?.focus();
    },
    setTheme: (newTheme: 'vs-dark' | 'vs-light') => {
      const themeName = newTheme === 'vs-light' ? 'vs' : 'vs-dark';
      console.log('[MonacoEditor.setTheme] テーマを設定:', themeName);
      if (monacoRef.current) {
        monacoRef.current.editor.setTheme(themeName);
      }
      if (editorRef.current) {
        editorRef.current.updateOptions({ theme: themeName });
        editorRef.current.layout();
      }
    },
    findNext: (options: FindOptions) => {
      const editor = editorRef.current;
      if (!editor) return false;

      const model = editor.getModel();
      if (!model) return false;

      const currentPosition = editor.getPosition();
      if (!currentPosition) return false;

      // 検索オプションを設定
      const searchString = options.searchText;
      const isRegex = options.useRegex;
      const matchCase = options.caseSensitive;
      // 単語単位の場合は標準的なワードセパレータを使用
      const wordSeparators = options.wholeWord ? '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?' : null;

      // 現在位置から検索
      const matches = model.findMatches(
        searchString,
        true, // searchOnlyEditableRange
        isRegex,
        matchCase,
        wordSeparators,
        false // captureMatches
      );

      if (matches.length === 0) return false;

      // 現在位置より後の最初のマッチを探す
      let nextMatch = matches.find(m =>
        m.range.startLineNumber > currentPosition.lineNumber ||
        (m.range.startLineNumber === currentPosition.lineNumber && m.range.startColumn > currentPosition.column)
      );

      // 見つからない場合は最初のマッチに戻る（ラップアラウンド）
      if (!nextMatch) {
        nextMatch = matches[0];
      }

      // マッチ箇所を選択してスクロール
      editor.setSelection(nextMatch.range);
      editor.revealRangeInCenter(nextMatch.range);
      return true;
    },
    findPrevious: (options: FindOptions) => {
      const editor = editorRef.current;
      if (!editor) return false;

      const model = editor.getModel();
      if (!model) return false;

      // 選択範囲がある場合は選択範囲の開始位置を基準にする
      const selection = editor.getSelection();
      const searchFromPosition = selection && !selection.isEmpty()
        ? { lineNumber: selection.startLineNumber, column: selection.startColumn }
        : editor.getPosition();

      if (!searchFromPosition) return false;

      // 検索オプションを設定
      const searchString = options.searchText;
      const isRegex = options.useRegex;
      const matchCase = options.caseSensitive;
      // 単語単位の場合は標準的なワードセパレータを使用
      const wordSeparators = options.wholeWord ? '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?' : null;

      // 全体を検索
      const matches = model.findMatches(
        searchString,
        true,
        isRegex,
        matchCase,
        wordSeparators,
        false
      );

      if (matches.length === 0) return false;

      // 現在位置より前の最後のマッチを探す（選択範囲の開始位置を基準）
      let prevMatch = [...matches].reverse().find(m =>
        m.range.startLineNumber < searchFromPosition.lineNumber ||
        (m.range.startLineNumber === searchFromPosition.lineNumber && m.range.startColumn < searchFromPosition.column)
      );

      // 見つからない場合は最後のマッチに戻る（ラップアラウンド）
      if (!prevMatch) {
        prevMatch = matches[matches.length - 1];
      }

      // マッチ箇所を選択してスクロール
      editor.setSelection(prevMatch.range);
      editor.revealRangeInCenter(prevMatch.range);
      return true;
    },
    getSelectedText: () => {
      const editor = editorRef.current;
      if (!editor) return '';
      const selection = editor.getSelection();
      if (!selection) return '';
      const model = editor.getModel();
      if (!model) return '';
      return model.getValueInRange(selection);
    },
    replace: (options: ReplaceOptions) => {
      const editor = editorRef.current;
      if (!editor) return false;

      const model = editor.getModel();
      if (!model) return false;

      const selection = editor.getSelection();
      if (!selection || selection.isEmpty()) return false;

      const selectedText = model.getValueInRange(selection);
      const searchString = options.searchText;
      const isRegex = options.useRegex;
      const matchCase = options.caseSensitive;

      // 選択テキストが検索文字列と一致するか確認
      let isMatch = false;
      if (isRegex) {
        try {
          const flags = matchCase ? '' : 'i';
          const regex = new RegExp(`^${searchString}$`, flags);
          isMatch = regex.test(selectedText);
        } catch {
          return false;
        }
      } else {
        if (matchCase) {
          isMatch = selectedText === searchString;
        } else {
          isMatch = selectedText.toLowerCase() === searchString.toLowerCase();
        }
      }

      if (!isMatch) return false;

      // 置換を実行
      editor.executeEdits('replace', [{
        range: selection,
        text: options.replaceText,
      }]);

      return true;
    },
    replaceAll: (options: ReplaceOptions) => {
      const editor = editorRef.current;
      if (!editor) return 0;

      const model = editor.getModel();
      if (!model) return 0;

      const searchString = options.searchText;
      const isRegex = options.useRegex;
      const matchCase = options.caseSensitive;
      const wordSeparators = options.wholeWord ? '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?' : null;

      // 全てのマッチを検索
      const matches = model.findMatches(
        searchString,
        true,
        isRegex,
        matchCase,
        wordSeparators,
        false
      );

      if (matches.length === 0) return 0;

      // 後ろから置換（位置がずれないように）
      const edits = [...matches].reverse().map(match => ({
        range: match.range,
        text: options.replaceText,
      }));

      editor.executeEdits('replaceAll', edits);

      return matches.length;
    },
  }), []);

  // エディタマウント時の処理
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    console.log('[MonacoEditor.handleEditorDidMount] エディタがマウントされました');
    console.log('[MonacoEditor.handleEditorDidMount] theme:', theme);
    editorRef.current = editor;
    monacoRef.current = monaco;

    // テーマはEditorコンポーネントのpropsで管理されるため、ここでは設定しない

    // カーソル位置変更のリスナー
    editor.onDidChangeCursorPosition((e) => {
      onCursorPositionChange?.(e.position.lineNumber, e.position.column);
    });

    // Monaco内蔵の検索機能（Find Widget）を無効化
    // Ctrl+F のキーバインドをカスタム検索ダイアログに置き換え
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      onSearch?.();
    });
    // Ctrl+R（置換）のキーバインドをカスタム置換ダイアログに置き換え
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      onReplace?.();
    });
    // F3（次を検索）のキーバインドも削除
    editor.addCommand(monaco.KeyCode.F3, () => {
      // 何もしない
    });
    // Shift+F3（前を検索）のキーバインドも削除
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F3, () => {
      // 何もしない
    });

    // フォーカスを設定
    editor.focus();
  }, [theme, onCursorPositionChange, onSearch, onReplace]);

  // コンテンツ変更時の処理
  const handleChange: OnChange = useCallback((newValue) => {
    if (newValue !== undefined) {
      onChange?.(newValue);
    }
  }, [onChange]);

  // 設定変更時にエディタオプションを更新
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize,
        wordWrap,
        minimap: { enabled: minimap },
        lineNumbers,
        readOnly,
      });
    }
  }, [fontSize, wordWrap, minimap, lineNumbers, readOnly]);

  // テーマ変更時に手動でMonacoテーマを更新（エディタマウント後のみ）
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) {
      return;
    }

    const themeName = theme === 'vs-light' ? 'vs' : 'vs-dark';
    console.log('[MonacoEditor] テーマプロップが変更されました:', theme, '→', themeName);

    // グローバルテーマを設定
    monacoRef.current.editor.setTheme(themeName);

    // エディタインスタンスのオプションも更新
    editorRef.current.updateOptions({ theme: themeName });
  }, [theme]);

  return (
    <Box
      sx={{
        width: '100%',
        height: 'calc(100% - 20px)',
        marginBottom: '20px',
        '& .monaco-editor': {
          paddingTop: '8px',
        },
      }}
    >
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        loading={<LoadingComponent />}
        theme={theme === 'vs-light' ? 'vs' : 'vs-dark'}
        options={{
          fontSize,
          fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
          fontLigatures: true,
          wordWrap,
          minimap: { enabled: minimap },
          lineNumbers,
          readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 9,
            horizontalScrollbarSize: 9,
            useShadows: false,
          },
          overviewRulerLanes: 0,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          fixedOverflowWidgets: true,
          revealHorizontalRightPadding: 30,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          padding: { top: 8, bottom: 16 },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'none',
          occurrencesHighlight: 'singleFile',
          selectionHighlight: true,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          links: true,
          colorDecorators: true,
          contextmenu: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          snippetSuggestions: 'inline',
          formatOnPaste: false,
          formatOnType: false,
        }}
      />
    </Box>
  );
});

MonacoEditor.displayName = 'MonacoEditor';

export default MonacoEditor;
