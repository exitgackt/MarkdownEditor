import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { MenuBar, Sidebar, TabBar } from '../../components/Layout';
import { MonacoEditor } from '../../components/Editor';
import MonacoDiffEditor from '../../components/Editor/MonacoDiffEditor';
import type { MonacoEditorHandle } from '../../components/Editor';
import { MarkdownPreview } from '../../components/Preview';
import { MindmapView, type MindmapViewRef } from '../../components/Mindmap';
import { SaveConfirmDialog, MessageDialog, SearchDialog, ReplaceDialog, VersionInfoDialog, SettingsDialog, NewFolderDialog, ConfirmDialog, KeyboardShortcutsDialog, HelpDialog, ExportDialog } from '../../components/Common';
import type { SaveConfirmResult, SearchOptions, ReplaceOptions } from '../../components/Common';
import { useFileStore, useTabStore, useUIStore, useFavoriteStore, usePreviewStore, useSettingsStore, useAuthStore } from '../../stores';
import type { FileNode, Tab } from '../../types';
import { saveFileHandle, getFileHandle, removeFileHandle, verifyPermission } from '../../utils/favoriteHandleStore';
import { exportDocument } from '../../services/exportService';
import type { ExportFormat } from '../../services/exportService';
import { importFile } from '../../services/importService';
import { useFileSystemWatcher } from '../../hooks/useFileSystemWatcher';

// ユニークIDを生成
const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ファイルノードの展開状態を適用
const applyExpandedState = (
  nodes: FileNode[],
  expandedFolders: Set<string>
): FileNode[] => {
  return nodes.map((node) => ({
    ...node,
    isExpanded: expandedFolders.has(node.id),
    children: node.children
      ? applyExpandedState(node.children, expandedFolders)
      : undefined,
  }));
};

// ファイルノードをフラット化して配列に変換
const flattenToArray = (node: FileNode | null): FileNode[] => {
  if (!node) return [];
  return [node];
};

// リサイズハンドルコンポーネント
const ResizeHandle = ({
  onMouseDown,
  orientation = 'horizontal',
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  orientation?: 'horizontal' | 'vertical';
}) => (
  <Box
    onMouseDown={onMouseDown}
    sx={{
      width: orientation === 'horizontal' ? 4 : '100%',
      height: orientation === 'horizontal' ? '100%' : 4,
      cursor: orientation === 'horizontal' ? 'col-resize' : 'row-resize',
      bgcolor: 'transparent',
      flexShrink: 0,
      '&:hover': {
        bgcolor: '#007ACC',
      },
      zIndex: 10,
    }}
  />
);


const EditorPage = () => {
  // ストアからの状態取得
  const { rootFolder, rootHandle, expandedFolders, toggleFolder, setRootFolder, setRootHandle, expandFolder } = useFileStore();
  const { tabs: storeTabs, activeTabId: storeActiveTabId, rightActiveTabId, setActiveTab, setRightActiveTab, removeTab, addTab, updateTabContent, markTabAsSaved, updateTab, reorderTabs } = useTabStore();
  const { sidebarVisible, toggleSidebar, isDiffMode, diffLeftTabId, diffRightTabId, setDiffLeftTab, setDiffRightTab, exitDiffMode, enterDiffMode } = useUIStore();
  const { favorites, addFavorite, removeFavorite } = useFavoriteStore();
  const { splitMode, viewMode, setSplitMode, setSplitEditorMode, togglePreview, toggleMindmap, toggleSplitEditor, enableSplitEditor, splitEditorMode } = usePreviewStore();
  const { fontSize, wordWrap, minimap, lineNumbers, colorTheme } = useSettingsStore();
  const { logout } = useAuthStore();

  // 差分比較モード用の独立したコンテンツ状態
  const [diffLeftContent, setDiffLeftContent] = useState<string>('');
  const [diffRightContent, setDiffRightContent] = useState<string>('');

  // 差分比較モード用のタブIDをrefで保持（クロージャー問題を回避）
  const diffLeftTabIdRef = useRef<string | null>(null);
  const diffRightTabIdRef = useRef<string | null>(null);

  // ファイルシステムの変更を監視（5秒ごと）
  const handleFileSystemUpdate = useCallback((newFileTree: FileNode) => {
    // 無効なツリーの場合は更新しない
    if (!newFileTree || !newFileTree.name) {
      console.warn('⚠️ 無効なファイルツリーを受信しました。更新をスキップします。');
      return;
    }

    console.log('📁 ファイルツリーを更新しました');
    // 展開状態を保持したまま更新
    const updatedTree = {
      ...newFileTree,
      isExpanded: expandedFolders.has(newFileTree.id),
      children: newFileTree.children
        ? applyExpandedState(newFileTree.children, expandedFolders)
        : undefined,
    };
    setRootFolder(updatedTree);
  }, [setRootFolder, expandedFolders]);

  useFileSystemWatcher(rootHandle, handleFileSystemUpdate, 5000);

  // タブの状態（ストアから取得）
  const tabs = storeTabs;
  const activeTabId = storeActiveTabId;

  // リサイズ状態
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [editorWidth, setEditorWidth] = useState(50); // パーセント
  const containerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Monaco Editor の ref
  const monacoEditorRef = useRef<MonacoEditorHandle>(null);

  // Mindmap View の ref
  const mindmapViewRef = useRef<MindmapViewRef | null>(null);

  // 差分比較に入る前のsplitModeとsplitEditorModeを保存するref
  const previousSplitModeRef = useRef<typeof splitMode>('editor-only');
  const previousSplitEditorModeRef = useRef<boolean>(false);

  // 保存確認ダイアログの状態
  const [saveConfirmDialog, setSaveConfirmDialog] = useState<{
    open: boolean;
    fileName: string;
    onResult: (result: SaveConfirmResult) => void;
  }>({
    open: false,
    fileName: '',
    onResult: () => {},
  });

  // メッセージダイアログの状態
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    message: string;
    type: 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    type: 'info',
  });

  // メッセージダイアログを表示するヘルパー関数
  const showMessage = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    setMessageDialog({ open: true, message, type });
  }, []);

  // 検索ダイアログの状態
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [initialSearchText, setInitialSearchText] = useState('');

  // 置換ダイアログの状態
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [initialReplaceSearchText, setInitialReplaceSearchText] = useState('');

  // バージョン情報ダイアログの状態
  const [versionInfoDialogOpen, setVersionInfoDialogOpen] = useState(false);

  // 設定ダイアログの状態
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // キーボードショートカットダイアログの状態
  const [keyboardShortcutsDialogOpen, setKeyboardShortcutsDialogOpen] = useState(false);

  // ヘルプダイアログの状態
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // エクスポートダイアログの状態
  const [exportPreviewDialogOpen, setExportPreviewDialogOpen] = useState(false);
  const [exportMindmapDialogOpen, setExportMindmapDialogOpen] = useState(false);

  // 新しいフォルダーダイアログの状態
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);

  // お気に入りファイル不在確認ダイアログの状態
  const [favoriteNotFoundDialog, setFavoriteNotFoundDialog] = useState<{
    open: boolean;
    favoriteId: string;
    fileName: string;
  }>({
    open: false,
    favoriteId: '',
    fileName: '',
  });

  // ファイルツリーの状態を適用
  const filesWithState = rootFolder
    ? applyExpandedState(flattenToArray(rootFolder), expandedFolders)
    : [];

  // お気に入りをSidebar用の形式に変換
  const sidebarFavorites = favorites.map((f) => ({
    id: f.id,
    path: f.filePath,
    name: f.fileName,
  }));

  // アクティブなタブを取得
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // 右側のアクティブなタブを取得
  const rightActiveTab = tabs.find((t) => t.id === rightActiveTabId);

  // 差分比較用のタブを取得
  const diffLeftTab = tabs.find((t) => t.id === diffLeftTabId);
  const diffRightTab = tabs.find((t) => t.id === diffRightTabId);

  // 分割エディタモード開始時に右側のアクティブタブを初期化
  useEffect(() => {
    if (splitEditorMode && !rightActiveTabId && activeTabId) {
      setRightActiveTab(activeTabId);
    }
  }, [splitEditorMode, rightActiveTabId, activeTabId, setRightActiveTab]);

  // 差分比較モード開始時に左右のタブを初期化
  useEffect(() => {
    if (isDiffMode && !diffLeftTabId && activeTabId) {
      setDiffLeftTab(activeTabId);
    }
    if (isDiffMode && !diffRightTabId && activeTabId) {
      setDiffRightTab(activeTabId);
    }
  }, [isDiffMode, diffLeftTabId, diffRightTabId, activeTabId, setDiffLeftTab, setDiffRightTab]);

  // 差分比較モード中に左側のタブが切り替わったら、左側のコンテンツを更新
  useEffect(() => {
    if (!isDiffMode || !diffLeftTabId) return;

    // refを更新
    diffLeftTabIdRef.current = diffLeftTabId;

    // 最新のタブ情報をストアから直接取得
    const currentTabs = useTabStore.getState().tabs;
    const leftTab = currentTabs.find((t) => t.id === diffLeftTabId);
    if (leftTab) {
      console.log('[EditorPage] 左側コンテンツ更新:', {
        diffLeftTabId,
        fileName: leftTab.fileName,
        contentLength: leftTab.content.length,
        isDirty: leftTab.isDirty,
      });
      setDiffLeftContent(leftTab.content);
    }
  }, [isDiffMode, diffLeftTabId]);

  // 差分比較モード中に右側のタブが切り替わったら、右側のコンテンツを更新
  useEffect(() => {
    if (!isDiffMode || !diffRightTabId) return;

    // refを更新
    diffRightTabIdRef.current = diffRightTabId;

    // 最新のタブ情報をストアから直接取得
    const currentTabs = useTabStore.getState().tabs;
    const rightTab = currentTabs.find((t) => t.id === diffRightTabId);
    if (rightTab) {
      console.log('[EditorPage] 右側コンテンツ更新:', {
        diffRightTabId,
        fileName: rightTab.fileName,
        contentLength: rightTab.content.length,
        isDirty: rightTab.isDirty,
      });
      setDiffRightContent(rightTab.content);
    }
  }, [isDiffMode, diffRightTabId]);

  // RAF のクリーンアップ
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (rightRafRef.current !== null) {
        cancelAnimationFrame(rightRafRef.current);
      }
    };
  }, []);

  // プレビュー切り替えハンドラ（差分比較モード時は差分モードを終了）
  const handleTogglePreview = useCallback(() => {
    if (isDiffMode) {
      exitDiffMode();
    }
    togglePreview();
  }, [isDiffMode, exitDiffMode, togglePreview]);

  // マインドマップ切り替えハンドラ（差分比較モード時は差分モードを終了）
  const handleToggleMindmap = useCallback(() => {
    if (isDiffMode) {
      exitDiffMode();
    }
    toggleMindmap();
  }, [isDiffMode, exitDiffMode, toggleMindmap]);

  // 分割エディタ切り替えハンドラ（差分比較モード時は差分モードを終了して分割エディタを有効化）
  const handleToggleSplitEditor = useCallback(() => {
    if (isDiffMode) {
      exitDiffMode();
      enableSplitEditor();
    } else {
      toggleSplitEditor();
    }
  }, [isDiffMode, exitDiffMode, enableSplitEditor, toggleSplitEditor]);

  // 差分比較切り替えハンドラ（差分比較モード終了時は元のモードに戻す）
  const handleToggleDiff = useCallback(() => {
    if (isDiffMode) {
      // 差分モード解除時: フォーカスがある側のタブをアクティブにする
      let tabIdToActivate = diffLeftTabIdRef.current; // デフォルトは左側

      const diffEditorElement = document.querySelector('.monaco-diff-editor');
      if (diffEditorElement) {
        const modifiedEditor = diffEditorElement.querySelector('.modified');
        const originalEditor = diffEditorElement.querySelector('.original');

        if (modifiedEditor?.contains(document.activeElement)) {
          // 右側にフォーカスがある
          tabIdToActivate = diffRightTabIdRef.current;
        } else if (originalEditor?.contains(document.activeElement)) {
          // 左側にフォーカスがある
          tabIdToActivate = diffLeftTabIdRef.current;
        }
        // どちらにもフォーカスがない場合は、デフォルトの左側
      }

      // 差分モードを終了
      exitDiffMode();

      // フォーカスがあった側のタブをアクティブにする
      if (tabIdToActivate) {
        setActiveTab(tabIdToActivate);
      }

      // 差分比較に入る前のsplitModeとsplitEditorModeに戻す
      setSplitMode(previousSplitModeRef.current);
      setSplitEditorMode(previousSplitEditorModeRef.current);
      // 差分コンテンツをクリア
      setDiffLeftContent('');
      setDiffRightContent('');
    } else {
      // アクティブなタブがない場合は何もしない
      if (!activeTabId) return;

      // 現在のアクティブなタブを取得
      const activeTab = tabs.find((t) => t.id === activeTabId);
      if (!activeTab) return;

      // 差分モードを開始 - 現在のタブを左右に表示
      // プレビュー、マインドマップ、または分割表示が表示されている場合は閉じる
      if (splitMode === 'horizontal' && (viewMode === 'preview' || viewMode === 'mindmap')) {
        // プレビュー/マインドマップを閉じて、差分比較終了後は'editor-only'に戻す
        previousSplitModeRef.current = 'editor-only';
        previousSplitEditorModeRef.current = false;
        setSplitMode('editor-only');
      } else if (splitEditorMode) {
        // 分割表示を閉じて、差分比較終了後は'editor-only'に戻す
        previousSplitModeRef.current = 'editor-only';
        previousSplitEditorModeRef.current = false;
        setSplitMode('editor-only');
        setSplitEditorMode(false);
      } else {
        // 通常モードの場合は現在の状態を保存
        previousSplitModeRef.current = splitMode;
        previousSplitEditorModeRef.current = splitEditorMode;
      }

      // 差分比較モード用の独立したコンテンツを初期化（両方とも現在のタブの内容でスタート）
      setDiffLeftContent(activeTab.content);
      setDiffRightContent(activeTab.content);

      // 現在のタブを左右に表示して差分比較開始
      enterDiffMode(activeTabId, activeTabId);
    }
  }, [isDiffMode, exitDiffMode, setSplitMode, setSplitEditorMode, splitMode, splitEditorMode, viewMode, activeTabId, enterDiffMode, tabs]);

  // タブ移動ハンドラ（次のタブ）
  const handleNextTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  }, [tabs, activeTabId, setActiveTab]);

  // タブ移動ハンドラ（前のタブ）
  const handlePreviousTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    if (currentIndex === -1) return;
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    setActiveTab(tabs[prevIndex].id);
  }, [tabs, activeTabId, setActiveTab]);

  // サイドバーリサイズハンドラ
  const handleSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(150, Math.min(500, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth]);

  // エディタ/プレビューリサイズハンドラ
  const handleEditorResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!editorContainerRef.current) return;

    const containerRect = editorContainerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startPercent = editorWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const deltaPercent = (delta / containerRect.width) * 100;
      const newPercent = Math.max(20, Math.min(80, startPercent + deltaPercent));
      setEditorWidth(newPercent);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [editorWidth]);

  // ファイルノードをパスから検索するヘルパー関数
  const findFileNode = useCallback((node: FileNode | null, path: string): FileNode | null => {
    if (!node) return null;
    if (node.path === path) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findFileNode(child, path);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // ファイル選択ハンドラ
  const handleFileSelect = useCallback(async (path: string) => {
    // ファイルノードを検索
    const fileNode = findFileNode(rootFolder, path);
    if (!fileNode || fileNode.type !== 'file') {
      console.error('ファイルが見つかりません:', path);
      return;
    }

    // ファイルハンドルがない場合
    if (!fileNode.handle) {
      console.error('ファイルハンドルがありません:', path);
      return;
    }

    const fileHandle = fileNode.handle as FileSystemFileHandle;

    // 既に開いているタブがあればそれをアクティブにする
    // filePathだけでなく、ファイルハンドルのisSameEntry()でもチェック
    for (const tab of tabs) {
      if (tab.filePath === path) {
        setActiveTab(tab.id);
        return;
      }
      // ファイルハンドルが同じファイルを指しているかチェック
      if (tab.handle && await tab.handle.isSameEntry(fileHandle)) {
        setActiveTab(tab.id);
        return;
      }
    }

    try {
      // ファイルを読み込み
      const file = await fileHandle.getFile();
      const content = await file.text();

      // 新しいタブを作成
      const newTab: Tab = {
        id: generateId(),
        fileId: fileNode.id,
        fileName: fileNode.name,
        filePath: path,
        content: content,
        originalContent: content,
        isDirty: false,
        handle: fileHandle,
      };

      addTab(newTab);
    } catch (err) {
      console.error('ファイルを開けませんでした:', err);
      showMessage('ファイルを開けませんでした。', 'error');
    }
  }, [tabs, rootFolder, findFileNode, setActiveTab, addTab, showMessage]);

  // フォルダ展開/折りたたみハンドラ
  const handleFolderToggle = (path: string) => {
    toggleFolder(path);
  };

  // お気に入り追加ハンドラ
  const handleAddFavorite = useCallback(async (path: string, name: string) => {
    // ファイルノードからハンドルを取得
    const fileNode = findFileNode(rootFolder, path);
    if (fileNode?.handle) {
      try {
        // IndexedDBにファイルハンドルを保存
        await saveFileHandle(path, fileNode.handle as FileSystemFileHandle);
      } catch (err) {
        console.error('ファイルハンドルの保存に失敗:', err);
      }
    }
    addFavorite(path, name);
  }, [rootFolder, findFileNode, addFavorite]);

  // お気に入り削除ハンドラ
  const handleRemoveFavorite = useCallback(async (id: string) => {
    // お気に入りのパスを取得してIndexedDBからも削除
    const favorite = favorites.find((f) => f.id === id);
    if (favorite) {
      try {
        await removeFileHandle(favorite.filePath);
      } catch (err) {
        console.error('ファイルハンドルの削除に失敗:', err);
      }
    }
    removeFavorite(id);
  }, [favorites, removeFavorite]);

  // お気に入り選択ハンドラ（存在チェック付き）
  const handleFavoriteSelect = useCallback(async (favoriteId: string, path: string, fileName: string) => {
    // 既に開いているタブがあればそれをアクティブにする
    const existingTab = tabs.find((t) => t.filePath === path);
    if (existingTab) {
      setActiveTab(existingTab.id);
      return;
    }

    // まずファイルツリーからファイルノードを検索
    const fileNode = findFileNode(rootFolder, path);
    let fileHandle: FileSystemFileHandle | null = null;

    if (fileNode?.handle) {
      fileHandle = fileNode.handle as FileSystemFileHandle;
    } else {
      // ファイルツリーで見つからない場合、IndexedDBからハンドルを取得
      try {
        fileHandle = await getFileHandle(path);
      } catch (err) {
        console.error('ファイルハンドルの取得に失敗:', err);
      }
    }

    // ファイルハンドルがない場合
    if (!fileHandle) {
      setFavoriteNotFoundDialog({
        open: true,
        favoriteId,
        fileName,
      });
      return;
    }

    try {
      // 権限を確認
      const hasPermission = await verifyPermission(fileHandle);
      if (!hasPermission) {
        setFavoriteNotFoundDialog({
          open: true,
          favoriteId,
          fileName,
        });
        return;
      }

      // ファイルを読み込み
      const file = await fileHandle.getFile();
      const content = await file.text();

      // 新しいタブを作成
      const newTab: Tab = {
        id: generateId(),
        fileId: `fav-${path}`,
        fileName: fileName,
        filePath: path,
        content: content,
        originalContent: content,
        isDirty: false,
        handle: fileHandle,
      };

      addTab(newTab);
    } catch (err) {
      // ファイルの読み込みに失敗した場合も確認ダイアログを表示
      console.error('ファイルを開けませんでした:', err);
      setFavoriteNotFoundDialog({
        open: true,
        favoriteId,
        fileName,
      });
    }
  }, [tabs, rootFolder, findFileNode, setActiveTab, addTab]);

  // お気に入り不在確認ダイアログの確定ハンドラ
  const handleFavoriteNotFoundConfirm = useCallback(() => {
    removeFavorite(favoriteNotFoundDialog.favoriteId);
    setFavoriteNotFoundDialog({ open: false, favoriteId: '', fileName: '' });
  }, [favoriteNotFoundDialog.favoriteId, removeFavorite]);

  // お気に入り不在確認ダイアログのキャンセルハンドラ
  const handleFavoriteNotFoundCancel = useCallback(() => {
    setFavoriteNotFoundDialog({ open: false, favoriteId: '', fileName: '' });
  }, []);

  // タブ選択ハンドラ（左側）
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
  };

  // タブ選択ハンドラ（右側）
  const handleRightTabSelect = (tabId: string) => {
    setRightActiveTab(tabId);
  };

  // タブ選択ハンドラ（差分比較左側）
  const handleDiffLeftTabSelect = (tabId: string) => {
    setDiffLeftTab(tabId);
  };

  // タブ選択ハンドラ（差分比較右側）
  const handleDiffRightTabSelect = (tabId: string) => {
    setDiffRightTab(tabId);
  };

  // タブを実際に閉じる処理
  const closeTab = useCallback((tabId: string) => {
    // 差分比較モード中に、差分比較対象のタブが閉じられた場合は差分比較モードを終了
    if (isDiffMode && (diffLeftTabId === tabId || diffRightTabId === tabId)) {
      exitDiffMode();
    }

    removeTab(tabId);
  }, [removeTab, isDiffMode, diffLeftTabId, diffRightTabId, exitDiffMode]);

  // タブを閉じるハンドラ
  const handleTabClose = (tabId: string) => {
    // 対象のタブを取得
    const targetTab = tabs.find((t) => t.id === tabId);

    // 未保存の変更がある場合はダイアログで確認
    if (targetTab?.isDirty) {
      setSaveConfirmDialog({
        open: true,
        fileName: targetTab.fileName,
        onResult: async (result) => {
          setSaveConfirmDialog((prev) => ({ ...prev, open: false }));
          if (result === 'save') {
            // 保存してから閉じる
            if (targetTab.handle) {
              try {
                const writable = await targetTab.handle.createWritable();
                await writable.write(targetTab.content);
                await writable.close();
                markTabAsSaved(targetTab.id);
                closeTab(tabId);
              } catch (err) {
                console.error('ファイルを保存できませんでした:', err);
                showMessage('ファイルを保存できませんでした。', 'error');
              }
            } else {
              // ハンドルがない場合は名前を付けて保存
              try {
                if ('showSaveFilePicker' in window) {
                  const fileHandle = await window.showSaveFilePicker({
                    suggestedName: targetTab.fileName,
                    types: [
                      { description: 'Markdownファイル', accept: { 'text/markdown': ['.md'] } },
                      { description: 'テキストファイル', accept: { 'text/plain': ['.txt'] } },
                    ],
                  });
                  const writable = await fileHandle.createWritable();
                  await writable.write(targetTab.content);
                  await writable.close();
                  closeTab(tabId);
                }
              } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                  console.error('ファイルを保存できませんでした:', err);
                  showMessage('ファイルを保存できませんでした。', 'error');
                }
              }
            }
          } else if (result === 'discard') {
            // 保存せずに閉じる
            closeTab(tabId);
          }
          // cancel の場合は何もしない
        },
      });
      return;
    }

    // 未保存の変更がない場合はそのまま閉じる
    closeTab(tabId);
  };

  // 全タブを閉じる実処理
  const closeAllTabs = useCallback(() => {
    // 差分比較モード中の場合は先に終了
    if (isDiffMode) {
      exitDiffMode();
    }
    tabs.forEach((tab) => removeTab(tab.id));
  }, [tabs, removeTab, isDiffMode, exitDiffMode]);

  // 全タブを閉じるハンドラ（未保存ファイルを順番に確認）
  const handleCloseAllTabs = useCallback(async () => {
    const unsavedTabs = tabs.filter((t) => t.isDirty);

    if (unsavedTabs.length === 0) {
      closeAllTabs();
      return;
    }

    // 未保存のファイルを1つずつ確認
    const processUnsavedTab = (index: number) => {
      if (index >= unsavedTabs.length) {
        // すべて処理完了、タブを閉じる
        closeAllTabs();
        return;
      }

      const tab = unsavedTabs[index];
      setSaveConfirmDialog({
        open: true,
        fileName: tab.fileName,
        onResult: async (result) => {
          setSaveConfirmDialog((prev) => ({ ...prev, open: false }));
          if (result === 'save') {
            // 保存処理
            if (tab.handle) {
              try {
                const writable = await tab.handle.createWritable();
                await writable.write(tab.content);
                await writable.close();
                markTabAsSaved(tab.id);
                // 次のファイルへ
                setTimeout(() => processUnsavedTab(index + 1), 100);
              } catch (err) {
                console.error('ファイルを保存できませんでした:', err);
                showMessage('ファイルを保存できませんでした。', 'error');
              }
            } else {
              // ハンドルがない場合は名前を付けて保存
              try {
                if ('showSaveFilePicker' in window) {
                  const fileHandle = await window.showSaveFilePicker({
                    suggestedName: tab.fileName,
                    types: [
                      { description: 'Markdownファイル', accept: { 'text/markdown': ['.md'] } },
                      { description: 'テキストファイル', accept: { 'text/plain': ['.txt'] } },
                    ],
                  });
                  const writable = await fileHandle.createWritable();
                  await writable.write(tab.content);
                  await writable.close();
                  // 次のファイルへ
                  setTimeout(() => processUnsavedTab(index + 1), 100);
                }
              } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                  console.error('ファイルを保存できませんでした:', err);
                  showMessage('ファイルを保存できませんでした。', 'error');
                }
              }
            }
          } else if (result === 'discard') {
            // 保存せずに次へ
            setTimeout(() => processUnsavedTab(index + 1), 100);
          }
          // cancel の場合は処理中止
        },
      });
    };

    processUnsavedTab(0);
  }, [tabs, closeAllTabs, markTabAsSaved]);

  // エクスポートハンドラー
  const handleExport = useCallback(async (format: ExportFormat, fileName: string) => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) {
      showMessage('エクスポートするファイルが選択されていません', 'error');
      return;
    }

    try {
      await exportDocument(activeTab.content, format, fileName);
    } catch (error) {
      console.error('Export failed:', error);
      showMessage(
        error instanceof Error ? error.message : 'エクスポートに失敗しました',
        'error'
      );
    }
  }, [tabs, activeTabId, showMessage]);

  // 他のタブを閉じる実処理
  const closeOtherTabs = useCallback((tabId: string) => {
    tabs.filter((t) => t.id !== tabId).forEach((t) => removeTab(t.id));
  }, [tabs, removeTab]);

  // 他のタブを閉じるハンドラ（未保存ファイルを順番に確認）
  const handleCloseOtherTabs = useCallback((tabId: string) => {
    const otherTabs = tabs.filter((t) => t.id !== tabId);
    const unsavedTabs = otherTabs.filter((t) => t.isDirty);

    if (unsavedTabs.length === 0) {
      closeOtherTabs(tabId);
      return;
    }

    // 未保存のファイルを1つずつ確認
    const processUnsavedTab = (index: number) => {
      if (index >= unsavedTabs.length) {
        // すべて処理完了、タブを閉じる
        closeOtherTabs(tabId);
        return;
      }

      const tab = unsavedTabs[index];
      setSaveConfirmDialog({
        open: true,
        fileName: tab.fileName,
        onResult: async (result) => {
          setSaveConfirmDialog((prev) => ({ ...prev, open: false }));
          if (result === 'save') {
            // 保存処理
            if (tab.handle) {
              try {
                const writable = await tab.handle.createWritable();
                await writable.write(tab.content);
                await writable.close();
                markTabAsSaved(tab.id);
                // 次のファイルへ
                setTimeout(() => processUnsavedTab(index + 1), 100);
              } catch (err) {
                console.error('ファイルを保存できませんでした:', err);
                showMessage('ファイルを保存できませんでした。', 'error');
              }
            } else {
              // ハンドルがない場合は名前を付けて保存
              try {
                if ('showSaveFilePicker' in window) {
                  const fileHandle = await window.showSaveFilePicker({
                    suggestedName: tab.fileName,
                    types: [
                      { description: 'Markdownファイル', accept: { 'text/markdown': ['.md'] } },
                      { description: 'テキストファイル', accept: { 'text/plain': ['.txt'] } },
                    ],
                  });
                  const writable = await fileHandle.createWritable();
                  await writable.write(tab.content);
                  await writable.close();
                  // 次のファイルへ
                  setTimeout(() => processUnsavedTab(index + 1), 100);
                }
              } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                  console.error('ファイルを保存できませんでした:', err);
                  showMessage('ファイルを保存できませんでした。', 'error');
                }
              }
            }
          } else if (result === 'discard') {
            // 保存せずに次へ
            setTimeout(() => processUnsavedTab(index + 1), 100);
          }
          // cancel の場合は処理中止
        },
      });
    };

    processUnsavedTab(0);
  }, [tabs, closeOtherTabs, markTabAsSaved]);

  // エディタ内容変更ハンドラ（左側）
  // コンテンツ更新を requestAnimationFrame でバッチ処理
  const rafRef = useRef<number | null>(null);
  const pendingContentRef = useRef<{ tabId: string; content: string } | null>(null);

  const handleEditorChange = useCallback((newContent: string) => {
    if (!activeTabId) return;

    // 保留中の更新を記録
    pendingContentRef.current = { tabId: activeTabId, content: newContent };

    // 既存の RAF をキャンセル
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // 次のフレームで更新を適用
    rafRef.current = requestAnimationFrame(() => {
      const pending = pendingContentRef.current;
      if (pending) {
        updateTabContent(pending.tabId, pending.content);
        pendingContentRef.current = null;
      }
      rafRef.current = null;
    });
  }, [activeTabId, updateTabContent]);

  // エディタ内容変更ハンドラ（右側）
  const rightRafRef = useRef<number | null>(null);
  const rightPendingContentRef = useRef<{ tabId: string; content: string } | null>(null);

  const handleRightEditorChange = useCallback((newContent: string) => {
    if (!rightActiveTabId) return;

    // 保留中の更新を記録
    rightPendingContentRef.current = { tabId: rightActiveTabId, content: newContent };

    // 既存の RAF をキャンセル
    if (rightRafRef.current !== null) {
      cancelAnimationFrame(rightRafRef.current);
    }

    // 次のフレームで更新を適用
    rightRafRef.current = requestAnimationFrame(() => {
      const pending = rightPendingContentRef.current;
      if (pending) {
        updateTabContent(pending.tabId, pending.content);
        rightPendingContentRef.current = null;
      }
      rightRafRef.current = null;
    });
  }, [rightActiveTabId, updateTabContent]);

  // カーソル位置変更ハンドラ（現在は使用していない）
  const handleCursorPositionChange = useCallback((_line: number, _column: number) => {
    // 将来的にステータスバーなどで表示する場合はここで状態を更新
  }, []);

  // 新規ファイル番号を追跡するためのref
  const newFileCounterRef = useRef(1);

  // Ctrl+K のコードショートカット用の状態
  const chordKeyRef = useRef<{ key: string | null; timeout: number | null }>({
    key: null,
    timeout: null,
  });

  // ログアウトハンドラ
  const handleLogout = useCallback(() => {
    logout();
    window.location.href = '/login';
  }, [logout]);

  // 新しいファイルハンドラ
  const handleNewFile = useCallback(() => {
    // 既存のタブから「無題」ファイルの最大番号を取得
    const existingNumbers = tabs
      .filter((t) => t.fileName.startsWith('無題'))
      .map((t) => {
        const match = t.fileName.match(/^無題(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });

    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const newNumber = Math.max(newFileCounterRef.current, maxNumber + 1);
    newFileCounterRef.current = newNumber + 1;

    const newTab: Tab = {
      id: generateId(),
      fileId: generateId(),
      fileName: `無題${newNumber}.md`,
      filePath: `無題${newNumber}.md`,
      content: '',
      originalContent: '',
      isDirty: false,
    };

    addTab(newTab);
  }, [tabs, addTab]);

  // ファイルを開くハンドラ
  const handleOpenFile = useCallback(async () => {
    try {
      // File System Access APIがサポートされているか確認
      if (!('showOpenFilePicker' in window)) {
        showMessage('このブラウザはFile System Access APIをサポートしていません。\nChrome または Edge をお使いください。', 'warning');
        return;
      }

      // ファイルピッカーを表示
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'テキストファイル',
            accept: {
              'text/*': ['.md', '.txt', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.xml', '.yaml', '.yml'],
            },
          },
        ],
        multiple: false,
      });

      // ファイルを読み込み
      const file = await fileHandle.getFile();
      const content = await file.text();

      // rootHandle を使って開いたファイルのフルパスを検索
      const findFilePathInDirectory = async (
        dirHandle: FileSystemDirectoryHandle,
        targetHandle: FileSystemFileHandle,
        basePath: string
      ): Promise<string | null> => {
        try {
          for await (const entry of dirHandle.values()) {
            const entryPath = `${basePath}/${entry.name}`;

            if (entry.kind === 'file') {
              try {
                const isSame = await targetHandle.isSameEntry(entry);
                if (isSame) {
                  return entryPath;
                }
              } catch (err) {
                // isSameEntry failed, continue
              }
            } else if (entry.kind === 'directory') {
              // サブディレクトリを再帰的に検索
              const found = await findFilePathInDirectory(
                entry as FileSystemDirectoryHandle,
                targetHandle,
                entryPath
              );
              if (found) return found;
            }
          }
        } catch (err) {
          console.error('ディレクトリスキャンエラー:', err);
        }
        return null;
      };

      // rootHandle から検索を開始
      let fullPath: string | null = null;
      if (rootHandle) {
        const rootPath = `/${rootHandle.name}`;
        fullPath = await findFilePathInDirectory(rootHandle, fileHandle, rootPath);
      }

      // 新しいタブを作成
      const newTab: Tab = {
        id: generateId(),
        fileId: generateId(),
        fileName: file.name,
        filePath: fullPath || file.name, // フルパスが見つかればそれを使用、なければファイル名のみ
        content: content,
        originalContent: content,
        isDirty: false,
        handle: fileHandle, // ファイルハンドルを保持して上書き保存を可能にする
      };

      addTab(newTab);

    } catch (err) {
      // ユーザーがキャンセルした場合は何もしない
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('ファイルを開けませんでした:', err);
      showMessage('ファイルを開けませんでした。', 'error');
    }
  }, [addTab, showMessage, rootHandle]);

  // インポートハンドラ
  const handleImport = useCallback(async () => {
    try {
      // File System Access APIがサポートされているか確認
      if (!('showOpenFilePicker' in window)) {
        showMessage('このブラウザはFile System Access APIをサポートしていません。\nChrome または Edge をお使いください。', 'warning');
        return;
      }

      // ファイルピッカーを表示
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'インポート可能なファイル',
            accept: {
              'text/markdown': ['.md'],
              'text/plain': ['.txt'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            },
          },
        ],
        multiple: false,
      });

      // ファイルを読み込み
      const file = await fileHandle.getFile();

      showMessage('ファイルを変換中...', 'info');

      // ファイル形式に応じて変換
      const content = await importFile(file);

      // rootHandle を使ってインポートしたファイルのフルパスを検索
      const findFilePathInDirectory = async (
        dirHandle: FileSystemDirectoryHandle,
        targetHandle: FileSystemFileHandle,
        basePath: string
      ): Promise<string | null> => {
        try {
          for await (const entry of dirHandle.values()) {
            const entryPath = `${basePath}/${entry.name}`;

            if (entry.kind === 'file') {
              try {
                const isSame = await targetHandle.isSameEntry(entry);
                if (isSame) {
                  return entryPath;
                }
              } catch (err) {
                // isSameEntry failed, continue
              }
            } else if (entry.kind === 'directory') {
              // サブディレクトリを再帰的に検索
              const found = await findFilePathInDirectory(
                entry as FileSystemDirectoryHandle,
                targetHandle,
                entryPath
              );
              if (found) return found;
            }
          }
        } catch (err) {
          console.error('ディレクトリスキャンエラー:', err);
        }
        return null;
      };

      // rootHandle から検索を開始
      let fullPath: string | null = null;
      if (rootHandle) {
        const rootPath = `/${rootHandle.name}`;
        fullPath = await findFilePathInDirectory(rootHandle, fileHandle, rootPath);
      }

      // 新しいタブを作成
      const fileName = file.name.replace(/\.docx$/, '.md'); // Wordファイルは.mdに変更
      const newTab: Tab = {
        id: generateId(),
        fileId: generateId(),
        fileName: fileName,
        filePath: fullPath || fileName, // フルパスが見つかればそれを使用、なければファイル名のみ
        content: content,
        originalContent: content,
        isDirty: false,
        handle: fileHandle, // ファイルハンドルを保持して上書き保存を可能にする
      };

      addTab(newTab);
      showMessage('インポートが完了しました', 'info');

    } catch (err) {
      // ユーザーがキャンセルした場合は何もしない
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('インポートに失敗しました:', err);
      showMessage(
        err instanceof Error ? err.message : 'インポートに失敗しました',
        'error'
      );
    }
  }, [addTab, showMessage, rootHandle]);

  // フォルダーを開くハンドラ
  const handleOpenFolder = useCallback(async () => {
    try {
      // File System Access APIがサポートされているか確認
      if (!('showDirectoryPicker' in window)) {
        showMessage('このブラウザはFile System Access APIをサポートしていません。\nChrome または Edge をお使いください。', 'warning');
        return;
      }

      // ディレクトリピッカーを表示
      const dirHandle = await window.showDirectoryPicker();

      // ディレクトリ構造を再帰的に読み込む関数
      const readDirectory = async (
        handle: FileSystemDirectoryHandle,
        path: string
      ): Promise<FileNode> => {
        const children: FileNode[] = [];

        for await (const entry of handle.values()) {
          const entryPath = `${path}/${entry.name}`;

          if (entry.kind === 'directory') {
            const childDir = await readDirectory(
              entry as FileSystemDirectoryHandle,
              entryPath
            );
            children.push(childDir);
          } else {
            children.push({
              id: `file-${entryPath}`,
              name: entry.name,
              path: entryPath,
              type: 'file',
              handle: entry as FileSystemFileHandle,
            });
          }
        }

        // フォルダを先に、ファイルを後に、それぞれアルファベット順でソート
        children.sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        });

        return {
          id: `folder-${path}`,
          name: handle.name,
          path: path,
          type: 'folder',
          children,
          handle,
          isExpanded: path === `/${handle.name}`, // ルートフォルダのみ展開
        };
      };

      // ディレクトリ構造を読み込み
      const rootPath = `/${dirHandle.name}`;
      const folderStructure = await readDirectory(dirHandle, rootPath);

      // ストアに保存
      setRootFolder(folderStructure);
      setRootHandle(dirHandle);
      expandFolder(`folder-${rootPath}`);

    } catch (err) {
      // ユーザーがキャンセルした場合は何もしない
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('フォルダを開けませんでした:', err);
      showMessage('フォルダを開けませんでした。', 'error');
    }
  }, [setRootFolder, setRootHandle, expandFolder]);

  // フォルダ更新ハンドラ
  const handleRefresh = useCallback(async () => {
    if (!rootHandle) {
      showMessage('フォルダが開かれていません。', 'warning');
      return;
    }

    try {
      // ディレクトリ構造を再帰的に読み込む関数
      const readDirectory = async (
        handle: FileSystemDirectoryHandle,
        path: string
      ): Promise<FileNode> => {
        const children: FileNode[] = [];

        for await (const entry of handle.values()) {
          const entryPath = `${path}/${entry.name}`;

          if (entry.kind === 'directory') {
            const childDir = await readDirectory(
              entry as FileSystemDirectoryHandle,
              entryPath
            );
            children.push(childDir);
          } else {
            children.push({
              id: `file-${entryPath}`,
              name: entry.name,
              path: entryPath,
              type: 'file',
              handle: entry as FileSystemFileHandle,
            });
          }
        }

        // フォルダを先に、ファイルを後に、それぞれアルファベット順でソート
        children.sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        });

        return {
          id: `folder-${path}`,
          name: handle.name,
          path: path,
          type: 'folder',
          children,
          handle,
          isExpanded: expandedFolders.has(`folder-${path}`),
        };
      };

      // ディレクトリ構造を読み込み
      const rootPath = `/${rootHandle.name}`;
      const folderStructure = await readDirectory(rootHandle, rootPath);

      // ストアに保存
      setRootFolder(folderStructure);

    } catch (err) {
      console.error('フォルダを更新できませんでした:', err);
      showMessage('フォルダを更新できませんでした。', 'error');
    }
  }, [rootHandle, expandedFolders, setRootFolder]);

  // 新しいフォルダーハンドラ（ダイアログを開く）
  const handleNewFolder = useCallback(() => {
    if (!rootHandle) {
      showMessage('フォルダーを開いてから新しいフォルダーを作成してください。', 'warning');
      return;
    }
    setNewFolderDialogOpen(true);
  }, [rootHandle, showMessage]);

  // 新しいフォルダー作成処理
  const handleCreateFolder = useCallback(async (result: { folderName: string; parentHandle: FileSystemDirectoryHandle } | null) => {
    setNewFolderDialogOpen(false);
    if (!result) return;

    try {
      // 選択された親フォルダーに新しいフォルダーを作成
      await result.parentHandle.getDirectoryHandle(result.folderName, { create: true });

      // ファイルツリーを更新
      handleRefresh();
      showMessage(`${result.folderName}\nを作成しました。`, 'info');
    } catch (err) {
      console.error('フォルダーを作成できませんでした:', err);
      showMessage('フォルダーを作成できませんでした。', 'error');
    }
  }, [handleRefresh, showMessage]);

  // ファイル保存ハンドラ
  const handleSave = useCallback(async () => {
    if (!activeTab) return;

    try {
      let contentToSave = activeTab.content;
      let tabIdToSave = activeTab.id;

      // 差分比較モード中の場合は、フォーカスがある側を保存
      if (isDiffMode) {
        // MonacoDiffEditorのrefを取得（存在する場合）
        const diffEditorElement = document.querySelector('.monaco-diff-editor');
        let savingLeftSide = true; // デフォルトは左側

        if (diffEditorElement) {
          // 右側（modified）エディタにフォーカスがあるかチェック
          const modifiedEditor = diffEditorElement.querySelector('.modified');
          const originalEditor = diffEditorElement.querySelector('.original');

          if (modifiedEditor?.contains(document.activeElement)) {
            // 右側にフォーカスがある
            savingLeftSide = false;
          } else if (originalEditor?.contains(document.activeElement)) {
            // 左側にフォーカスがある
            savingLeftSide = true;
          }
          // どちらにもフォーカスがない場合は、デフォルトの左側
        }

        if (savingLeftSide && diffLeftTabIdRef.current) {
          // 左側を保存
          contentToSave = diffLeftContent;
          tabIdToSave = diffLeftTabIdRef.current;
          console.log('[Save] 差分比較 - 左側を保存:', { tabId: tabIdToSave, contentLength: contentToSave.length });
        } else if (!savingLeftSide && diffRightTabIdRef.current) {
          // 右側を保存
          contentToSave = diffRightContent;
          tabIdToSave = diffRightTabIdRef.current;
          console.log('[Save] 差分比較 - 右側を保存:', { tabId: tabIdToSave, contentLength: contentToSave.length });
        }
      }
      // 分割エディタモードの場合は、フォーカスがある側を保存
      else if (splitEditorMode && rightActiveTab) {
        // 全てのMonaco Editorの要素を取得
        const editorElements = document.querySelectorAll('.monaco-editor');
        let savingRightSide = false;

        if (editorElements.length >= 2) {
          // 2つ目のエディタ（右側）にフォーカスがあるかチェック
          const rightEditor = editorElements[1];
          if (rightEditor?.contains(document.activeElement)) {
            savingRightSide = true;
          }
        }

        if (savingRightSide) {
          // 右側を保存
          contentToSave = rightActiveTab.content;
          tabIdToSave = rightActiveTab.id;
          console.log('[Save] 分割エディタ - 右側を保存:', { tabId: tabIdToSave, fileName: rightActiveTab.fileName });
        } else {
          // 左側を保存（デフォルト）
          contentToSave = activeTab.content;
          tabIdToSave = activeTab.id;
          console.log('[Save] 分割エディタ - 左側を保存:', { tabId: tabIdToSave, fileName: activeTab.fileName });
        }
      }

      // 保存するタブを取得
      const currentTabs = useTabStore.getState().tabs;
      const tabToSave = currentTabs.find(t => t.id === tabIdToSave);

      if (!tabToSave) {
        console.error('保存するタブが見つかりません:', tabIdToSave);
        return;
      }

      // ファイルハンドルがある場合は上書き保存
      if (tabToSave.handle) {
        const writable = await tabToSave.handle.createWritable();
        await writable.write(contentToSave);
        await writable.close();

        // タブの内容を更新
        updateTabContent(tabIdToSave, contentToSave);
        markTabAsSaved(tabIdToSave);
        return;
      }

      // ファイルハンドルがない場合は「名前を付けて保存」
      console.warn('⚠️ ファイルハンドルが見つかりません:', {
        fileName: tabToSave.fileName,
        filePath: tabToSave.filePath,
        hasHandle: !!tabToSave.handle,
        tab: tabToSave
      });
      await handleSaveAs();
    } catch (err) {
      console.error('ファイルを保存できませんでした:', err);
      showMessage('ファイルを保存できませんでした。', 'error');
    }
  }, [activeTab, markTabAsSaved, isDiffMode, diffLeftContent, diffRightContent, updateTabContent, splitEditorMode, rightActiveTab]);

  // 名前を付けて保存ハンドラ
  const handleSaveAs = useCallback(async () => {
    if (!activeTab) return;

    const contentToSave = activeTab.content;
    const suggestedName = activeTab.fileName || 'untitled.md';

    try {
      // File System Access APIがサポートされているか確認
      if (!('showSaveFilePicker' in window)) {
        // フォールバック: ダウンロードとして保存
        const blob = new Blob([contentToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // ファイルピッカーを表示
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [
          {
            description: 'Markdownファイル',
            accept: { 'text/markdown': ['.md'] },
          },
          {
            description: 'テキストファイル',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      });

      // ファイルを書き込み
      const writable = await fileHandle.createWritable();
      await writable.write(contentToSave);
      await writable.close();

      // タブを更新
      if (activeTab.id) {
        const file = await fileHandle.getFile();

        // rootHandle を使って保存したファイルのフルパスを検索
        const findFilePathInDirectory = async (
          dirHandle: FileSystemDirectoryHandle,
          targetHandle: FileSystemFileHandle,
          basePath: string
        ): Promise<string | null> => {
          try {
            for await (const entry of dirHandle.values()) {
              const entryPath = `${basePath}/${entry.name}`;

              if (entry.kind === 'file') {
                try {
                  const isSame = await targetHandle.isSameEntry(entry);
                  if (isSame) {
                    return entryPath;
                  }
                } catch (err) {
                  // isSameEntry failed, continue
                }
              } else if (entry.kind === 'directory') {
                // サブディレクトリを再帰的に検索
                const found = await findFilePathInDirectory(
                  entry as FileSystemDirectoryHandle,
                  targetHandle,
                  entryPath
                );
                if (found) return found;
              }
            }
          } catch (err) {
            console.error('ディレクトリスキャンエラー:', err);
          }
          return null;
        };

        // rootHandle から検索を開始
        let fullPath: string | null = null;
        if (rootHandle) {
          const rootPath = `/${rootHandle.name}`;
          fullPath = await findFilePathInDirectory(rootHandle, fileHandle, rootPath);
        }

        updateTab(activeTab.id, {
          fileName: file.name,
          filePath: fullPath || file.name, // フルパスが見つかればそれを使用、なければファイル名のみ
          handle: fileHandle, // ファイルハンドルを保持して上書き保存を可能にする
          originalContent: contentToSave,
          isDirty: false,
        });
      }

    } catch (err) {
      // ユーザーがキャンセルした場合は何もしない
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('ファイルを保存できませんでした:', err);
      showMessage('ファイルを保存できませんでした。', 'error');
    }
  }, [activeTab, updateTab, rootHandle]);

  // すべて保存ハンドラ
  const handleSaveAll = useCallback(async () => {
    // 未保存のタブを取得
    const unsavedTabs = tabs.filter((t) => t.isDirty);

    if (unsavedTabs.length === 0) {
      return;
    }

    let failedCount = 0;
    const tabsNeedingSaveAs: Tab[] = [];

    // ハンドルを持つタブを先に保存
    for (const tab of unsavedTabs) {
      if (tab.handle) {
        try {
          const writable = await tab.handle.createWritable();
          await writable.write(tab.content);
          await writable.close();
          markTabAsSaved(tab.id);
        } catch (err) {
          console.error(`ファイル ${tab.fileName} を保存できませんでした:`, err);
          failedCount++;
        }
      } else {
        // ハンドルがないタブは名前を付けて保存が必要
        tabsNeedingSaveAs.push(tab);
      }
    }

    // ハンドルがないタブを順番に名前を付けて保存
    const processSaveAs = async (index: number) => {
      if (index >= tabsNeedingSaveAs.length) {
        // エラーがあった場合のみメッセージ表示
        if (failedCount > 0) {
          showMessage(`${failedCount}件のファイルの保存に失敗しました。`, 'error');
        }
        return;
      }

      const tab = tabsNeedingSaveAs[index];

      try {
        if (!('showSaveFilePicker' in window)) {
          // フォールバック: ダウンロードとして保存
          const blob = new Blob([tab.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = tab.fileName;
          a.click();
          URL.revokeObjectURL(url);
          processSaveAs(index + 1);
          return;
        }

        const fileHandle = await window.showSaveFilePicker({
          suggestedName: tab.fileName,
          types: [
            { description: 'Markdownファイル', accept: { 'text/markdown': ['.md'] } },
            { description: 'テキストファイル', accept: { 'text/plain': ['.txt'] } },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(tab.content);
        await writable.close();

        // タブを更新
        const file = await fileHandle.getFile();
        updateTab(tab.id, {
          fileName: file.name,
          filePath: file.name,
          handle: fileHandle,
          originalContent: tab.content,
          isDirty: false,
        });

        // 次のファイルへ
        processSaveAs(index + 1);

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // キャンセルされた場合、以降のファイルの保存も中止
          return;
        }
        console.error(`ファイル ${tab.fileName} を保存できませんでした:`, err);
        failedCount++;
        processSaveAs(index + 1);
      }
    };

    // ハンドルがないタブの保存を開始
    if (tabsNeedingSaveAs.length > 0) {
      processSaveAs(0);
    } else {
      // すべてのタブにハンドルがあった場合、エラーがあれば表示
      if (failedCount > 0) {
        showMessage(`${failedCount}件のファイルの保存に失敗しました。`, 'error');
      }
    }
  }, [tabs, markTabAsSaved, updateTab, showMessage]);

  // 元に戻すハンドラ
  const handleUndo = useCallback(() => {
    monacoEditorRef.current?.undo();
  }, []);

  // やり直しハンドラ
  const handleRedo = useCallback(() => {
    monacoEditorRef.current?.redo();
  }, []);

  // 検索ダイアログを開くハンドラ
  const handleOpenSearch = useCallback(() => {
    // 他のダイアログが開いている場合は検索ダイアログを開かない
    if (
      messageDialog.open ||
      saveConfirmDialog.open ||
      versionInfoDialogOpen ||
      settingsDialogOpen ||
      keyboardShortcutsDialogOpen ||
      helpDialogOpen ||
      exportPreviewDialogOpen ||
      exportMindmapDialogOpen ||
      newFolderDialogOpen ||
      favoriteNotFoundDialog.open
    ) {
      return;
    }

    // 選択中のテキストがあれば検索文字列として設定
    const selectedText = monacoEditorRef.current?.getSelectedText() || '';
    setInitialSearchText(selectedText);
    // 置換ダイアログが開いていれば閉じる
    setReplaceDialogOpen(false);
    setSearchDialogOpen(true);
  }, [
    messageDialog.open,
    saveConfirmDialog.open,
    versionInfoDialogOpen,
    settingsDialogOpen,
    keyboardShortcutsDialogOpen,
    helpDialogOpen,
    exportPreviewDialogOpen,
    exportMindmapDialogOpen,
    newFolderDialogOpen,
    favoriteNotFoundDialog.open,
  ]);

  // 検索ダイアログを閉じるハンドラ
  const handleCloseSearch = useCallback(() => {
    setSearchDialogOpen(false);
    // エディタにフォーカスを戻す
    monacoEditorRef.current?.focus();
  }, []);

  // 次を検索ハンドラ
  const handleFindNext = useCallback((options: SearchOptions) => {
    const found = monacoEditorRef.current?.findNext({
      searchText: options.searchText,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord,
      useRegex: options.useRegex,
    });
    if (!found && options.showNotFoundMessage) {
      showMessage('検索条件に一致するテキストが見つかりませんでした。', 'info');
    }
  }, [showMessage]);

  // 前を検索ハンドラ
  const handleFindPrevious = useCallback((options: SearchOptions) => {
    const found = monacoEditorRef.current?.findPrevious({
      searchText: options.searchText,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord,
      useRegex: options.useRegex,
    });
    if (!found && options.showNotFoundMessage) {
      showMessage('検索条件に一致するテキストが見つかりませんでした。', 'info');
    }
  }, [showMessage]);

  // 置換ダイアログを開くハンドラ
  const handleOpenReplace = useCallback(() => {
    // 他のダイアログが開いている場合は置換ダイアログを開かない
    if (
      messageDialog.open ||
      saveConfirmDialog.open ||
      versionInfoDialogOpen ||
      settingsDialogOpen ||
      keyboardShortcutsDialogOpen ||
      helpDialogOpen ||
      exportPreviewDialogOpen ||
      exportMindmapDialogOpen ||
      newFolderDialogOpen ||
      favoriteNotFoundDialog.open
    ) {
      return;
    }

    const selectedText = monacoEditorRef.current?.getSelectedText() || '';
    setInitialReplaceSearchText(selectedText);
    // 検索ダイアログが開いていれば閉じる
    setSearchDialogOpen(false);
    setReplaceDialogOpen(true);
  }, [
    messageDialog.open,
    saveConfirmDialog.open,
    versionInfoDialogOpen,
    settingsDialogOpen,
    keyboardShortcutsDialogOpen,
    helpDialogOpen,
    exportPreviewDialogOpen,
    exportMindmapDialogOpen,
    newFolderDialogOpen,
    favoriteNotFoundDialog.open,
  ]);

  // 置換ダイアログを閉じるハンドラ
  const handleCloseReplace = useCallback(() => {
    setReplaceDialogOpen(false);
    monacoEditorRef.current?.focus();
  }, []);

  // 置換用の次を検索ハンドラ
  const handleReplaceFindNext = useCallback((options: ReplaceOptions) => {
    const found = monacoEditorRef.current?.findNext({
      searchText: options.searchText,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord,
      useRegex: options.useRegex,
    });
    if (!found && options.showNotFoundMessage) {
      showMessage('検索条件に一致するテキストが見つかりませんでした。', 'info');
    }
  }, [showMessage]);

  // 置換用の前を検索ハンドラ
  const handleReplaceFindPrevious = useCallback((options: ReplaceOptions) => {
    const found = monacoEditorRef.current?.findPrevious({
      searchText: options.searchText,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord,
      useRegex: options.useRegex,
    });
    if (!found && options.showNotFoundMessage) {
      showMessage('検索条件に一致するテキストが見つかりませんでした。', 'info');
    }
  }, [showMessage]);

  // 置換ハンドラ
  const handleReplace = useCallback((options: ReplaceOptions) => {
    const replaced = monacoEditorRef.current?.replace({
      searchText: options.searchText,
      replaceText: options.replaceText,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord,
      useRegex: options.useRegex,
    });
    if (replaced) {
      // 置換後、次を検索
      monacoEditorRef.current?.findNext({
        searchText: options.searchText,
        caseSensitive: options.caseSensitive,
        wholeWord: options.wholeWord,
        useRegex: options.useRegex,
      });
    } else {
      // 選択が検索文字列と一致しない場合、次を検索
      const found = monacoEditorRef.current?.findNext({
        searchText: options.searchText,
        caseSensitive: options.caseSensitive,
        wholeWord: options.wholeWord,
        useRegex: options.useRegex,
      });
      if (!found && options.showNotFoundMessage) {
        showMessage('検索条件に一致するテキストが見つかりませんでした。', 'info');
      }
    }
  }, [showMessage]);

  // すべて置換ハンドラ
  const handleReplaceAll = useCallback((options: ReplaceOptions): number => {
    const count = monacoEditorRef.current?.replaceAll({
      searchText: options.searchText,
      replaceText: options.replaceText,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord,
      useRegex: options.useRegex,
    }) || 0;
    if (count > 0) {
      showMessage(`${count}件を置換しました。`, 'info');
    } else if (options.showNotFoundMessage) {
      showMessage('検索条件に一致するテキストが見つかりませんでした。', 'info');
    }
    return count;
  }, [showMessage]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+N: 新しいファイル
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNewFile();
        return;
      }

      // Alt+B: 新しいフォルダー
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleNewFolder();
        return;
      }

      // Alt+O: ファイルを開く
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenFile();
        return;
      }

      // Alt+U: フォルダーを開く
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        handleOpenFolder();
        return;
      }

      // Alt+I: インポート
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        handleImport();
        return;
      }
      // Ctrl+S: 保存
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Alt+S: 名前を付けて保存
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveAs();
        return;
      }

      // Ctrl+Alt+S: すべて保存
      if (e.ctrlKey && e.altKey && !e.shiftKey && e.key === 's') {
        e.preventDefault();
        handleSaveAll();
        return;
      }

      // Alt+K: タブを閉じる
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (activeTab) {
          handleTabClose(activeTab.id);
        }
        return;
      }

      // Ctrl+W: アクティブタブを閉じる（VS Code標準）
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'w') {
        e.preventDefault();
        if (activeTab) {
          handleTabClose(activeTab.id);
        }
        return;
      }

      // Alt+J: 全てのタブを閉じる
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        handleCloseAllTabs();
        return;
      }

      // Alt+L: プレビュー切替
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        handleTogglePreview();
        return;
      }

      // Alt+M: マインドマップ切替
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        handleToggleMindmap();
        return;
      }

      // Alt+G: 分割エディタ切替
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        handleToggleSplitEditor();
        return;
      }

      // Alt+Y: 差分比較切替
      if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleToggleDiff();
        return;
      }
      // Ctrl+F: 検索
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'f') {
        e.preventDefault();
        handleOpenSearch();
      }
      // Ctrl+R: 置換ダイアログを開く（ブラウザのリロードを無効化）
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'r') {
        e.preventDefault();
        handleOpenReplace();
      }
      // Alt+X: 次のタブに移動
      if (!e.ctrlKey && !e.shiftKey && e.altKey && e.key === 'x') {
        e.preventDefault();
        handleNextTab();
      }
      // Alt+Z: 前のタブに移動
      if (!e.ctrlKey && !e.shiftKey && e.altKey && e.key === 'z') {
        e.preventDefault();
        handlePreviousTab();
      }
      // Ctrl+Tab: 次のタブへ（VS Code標準）
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'Tab') {
        e.preventDefault();
        handleNextTab();
        return;
      }
      // Ctrl+Shift+Tab: 前のタブへ（VS Code標準）
      if (e.ctrlKey && e.shiftKey && !e.altKey && e.key === 'Tab') {
        e.preventDefault();
        handlePreviousTab();
        return;
      }
    };

    // キャプチャフェーズでイベントをリスニングすることで、
    // Monacoエディタより先にショートカットを処理できる
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      // クリーンアップ時にタイムアウトをクリア
      if (chordKeyRef.current.timeout) {
        clearTimeout(chordKeyRef.current.timeout);
      }
    };
  }, [handleNewFile, handleNewFolder, handleOpenFile, handleOpenFolder, handleImport, handleSave, handleSaveAs, handleSaveAll, handleOpenSearch, handleOpenReplace, handleTabClose, handleCloseAllTabs, handleTogglePreview, handleToggleMindmap, handleToggleSplitEditor, handleToggleDiff, handleNextTab, handlePreviousTab, activeTab]);

  // ページを離れる前の確認（未保存の変更がある場合）
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 未保存のタブがあるかチェック
      const hasUnsavedChanges = tabs.some((t) => t.isDirty);

      if (hasUnsavedChanges) {
        // 標準的なブラウザの確認ダイアログを表示
        e.preventDefault();
        // Chrome では returnValue の設定が必要
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tabs]);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* メニューバー */}
      <MenuBar
        onNewFile={handleNewFile}
        onNewFolder={handleNewFolder}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onImport={handleImport}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onSaveAll={handleSaveAll}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onFind={handleOpenSearch}
        onReplace={handleOpenReplace}
        onToggleSidebar={toggleSidebar}
        onTogglePreview={handleTogglePreview}
        onToggleMindmap={handleToggleMindmap}
        onToggleSplit={handleToggleSplitEditor}
        onToggleDiff={handleToggleDiff}
        onCloseTab={() => activeTabId && handleTabClose(activeTabId)}
        onCloseAllTabs={handleCloseAllTabs}
        onNextTab={handleNextTab}
        onPreviousTab={handlePreviousTab}
        onVersionInfo={() => setVersionInfoDialogOpen(true)}
        onOpenSettings={() => setSettingsDialogOpen(true)}
        onOpenKeyboardShortcuts={() => setKeyboardShortcutsDialogOpen(true)}
        onOpenHelp={() => setHelpDialogOpen(true)}
        onExportPreview={() => setExportPreviewDialogOpen(true)}
        onExportMindmap={() => {
          if (viewMode !== 'mindmap' || splitMode === 'editor-only') {
            showMessage('マインドマップが開かれていないため、エクスポートできません。', 'error');
            return;
          }
          setExportMindmapDialogOpen(true);
        }}
        onLogout={handleLogout}
        hasContent={!!activeTab}
        hasRootFolder={!!rootFolder}
      />

      {/* メインコンテンツ */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* サイドバー */}
        {sidebarVisible && (
          <>
            <Box
              sx={{
                width: sidebarWidth,
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <Sidebar
                files={filesWithState}
                favorites={sidebarFavorites}
                selectedPath={activeTab?.filePath}
                onFileSelect={handleFileSelect}
                onFolderToggle={handleFolderToggle}
                onAddFavorite={handleAddFavorite}
                onRemoveFavorite={handleRemoveFavorite}
                onFavoriteSelect={handleFavoriteSelect}
                onRefresh={handleRefresh}
                onNewFile={handleNewFile}
                onNewFolder={handleNewFolder}
                onOpenFolder={handleOpenFolder}
                hasRootFolder={!!rootFolder}
              />
            </Box>
            <ResizeHandle onMouseDown={handleSidebarResize} orientation="horizontal" />
          </>
        )}

        {/* エディタ・プレビューエリア */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* タブバー（横並び） */}
          <Box sx={{ display: 'flex', flexShrink: 0 }}>
            {isDiffMode ? (
              // 差分比較モード：左右のタブバー
              <>
                <Box sx={{ width: `${editorWidth}%`, flexShrink: 0, overflow: 'hidden' }}>
                  <TabBar
                    tabs={tabs}
                    activeTabId={diffLeftTabId || undefined}
                    onTabSelect={handleDiffLeftTabSelect}
                    onTabClose={handleTabClose}
                    onTabCloseAll={handleCloseAllTabs}
                    onTabCloseOthers={handleCloseOtherTabs}
                    onTabReorder={reorderTabs}
                  />
                </Box>
                <Box sx={{ flex: 1, borderLeft: '1px solid #3C3C3C', overflow: 'hidden' }}>
                  <TabBar
                    tabs={tabs}
                    activeTabId={diffRightTabId || undefined}
                    onTabSelect={handleDiffRightTabSelect}
                    onTabClose={handleTabClose}
                    onTabCloseAll={handleCloseAllTabs}
                    onTabCloseOthers={handleCloseOtherTabs}
                    onTabReorder={reorderTabs}
                  />
                </Box>
              </>
            ) : (
              // 通常モード
              <>
                {/* 分割エディタモード：左右に別々のタブバー */}
                {splitEditorMode ? (
                  <>
                    {/* 左側タブバー */}
                    <Box sx={{ width: `${editorWidth}%`, flexShrink: 0, overflow: 'hidden' }}>
                      <TabBar
                        tabs={tabs}
                        activeTabId={activeTabId || undefined}
                        onTabSelect={handleTabSelect}
                        onTabClose={handleTabClose}
                        onTabCloseAll={handleCloseAllTabs}
                        onTabCloseOthers={handleCloseOtherTabs}
                        onTabReorder={reorderTabs}
                      />
                    </Box>
                    {/* タブバー間のスペーサー（リサイズハンドルと同じ幅） */}
                    <Box sx={{ width: 4, flexShrink: 0 }} />
                    {/* 右側タブバー */}
                    <Box sx={{ flex: 1, borderLeft: '1px solid #3C3C3C', overflow: 'hidden' }}>
                      <TabBar
                        tabs={tabs}
                        activeTabId={rightActiveTabId || undefined}
                        onTabSelect={handleRightTabSelect}
                        onTabClose={handleTabClose}
                        onTabCloseAll={handleCloseAllTabs}
                        onTabCloseOthers={handleCloseOtherTabs}
                        onTabReorder={reorderTabs}
                      />
                    </Box>
                  </>
                ) : (
                  /* プレビュー/マインドマップ表示時：全幅で単一のタブバー */
                  <Box sx={{ width: '100%', overflow: 'hidden' }}>
                    <TabBar
                      tabs={tabs}
                      activeTabId={activeTabId || undefined}
                      onTabSelect={handleTabSelect}
                      onTabClose={handleTabClose}
                      onTabCloseAll={handleCloseAllTabs}
                      onTabCloseOthers={handleCloseOtherTabs}
                      onTabReorder={reorderTabs}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* エディタ＆プレビュー */}
          <Box
            ref={editorContainerRef}
            className={splitEditorMode ? 'split-editor' : undefined}
            sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}
          >
            {isDiffMode ? (
              // 差分比較モード
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* 通常モードに戻るボタン */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    p: 1,
                    bgcolor: '#1E1E1E',
                    borderBottom: '1px solid #3C3C3C',
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleToggleDiff}
                    sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      color: '#fff',
                      borderColor: '#3C3C3C',
                      '&:hover': {
                        borderColor: '#0078d4',
                        bgcolor: 'rgba(0, 120, 212, 0.1)',
                      },
                    }}
                  >
                    通常モードに戻る
                  </Button>
                </Box>
                {/* Diff Editor */}
                {diffLeftTab && diffRightTab ? (
                  <MonacoDiffEditor
                    original={diffLeftContent}
                    modified={diffRightContent}
                    originalLanguage={diffLeftTab.fileName.endsWith('.md') ? 'markdown' : 'plaintext'}
                    modifiedLanguage={diffRightTab.fileName.endsWith('.md') ? 'markdown' : 'plaintext'}
                    onOriginalChange={(value) => {
                      setDiffLeftContent(value);
                      // refから最新のタブIDを取得して更新
                      if (diffLeftTabIdRef.current) {
                        updateTabContent(diffLeftTabIdRef.current, value);
                        // 左右が同じタブの場合は、右側も同期
                        if (diffLeftTabIdRef.current === diffRightTabIdRef.current) {
                          setDiffRightContent(value);
                        }
                      }
                    }}
                    onModifiedChange={(value) => {
                      setDiffRightContent(value);
                      // refから最新のタブIDを取得して更新
                      if (diffRightTabIdRef.current) {
                        updateTabContent(diffRightTabIdRef.current, value);
                        // 左右が同じタブの場合は、左側も同期
                        if (diffLeftTabIdRef.current === diffRightTabIdRef.current) {
                          setDiffLeftContent(value);
                        }
                      }
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#1E1E1E',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      比較するファイルを選択してください
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              // 通常モード
              <>
                {/* エディタエリア（preview-only以外で表示） */}
                {splitMode !== 'preview-only' && (
                  <Box
                    sx={{
                      width: splitMode === 'editor-only' ? '100%' : `${editorWidth}%`,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: '#1E1E1E',
                      overflow: 'hidden',
                    }}
                  >
                    {activeTab ? (
                      <MonacoEditor
                        key={activeTab.id}
                        ref={monacoEditorRef}
                        value={activeTab.content}
                        onChange={handleEditorChange}
                        language={activeTab.fileName.endsWith('.md') ? 'markdown' : 'plaintext'}
                        fontSize={fontSize}
                        wordWrap={wordWrap}
                        minimap={minimap}
                        lineNumbers={lineNumbers}
                        theme={colorTheme}
                        onCursorPositionChange={handleCursorPositionChange}
                        onSearch={handleOpenSearch}
                        onReplace={handleOpenReplace}
                      />
                    ) : (
                      <Box
                        sx={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="h6" color="text.secondary">
                          ファイルを開いてください
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* リサイズハンドル（両方表示時のみ） */}
                {splitMode !== 'editor-only' && splitMode !== 'preview-only' && (
                  <ResizeHandle onMouseDown={handleEditorResize} orientation="horizontal" />
                )}

                {/* プレビューエリア / 分割エディタエリア（editor-only以外で表示） */}
                {splitMode !== 'editor-only' && (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: '#1E1E1E',
                      borderLeft: splitMode !== 'preview-only' ? '1px solid #3C3C3C' : 'none',
                      overflow: 'hidden',
                    }}
                  >
                    {splitEditorMode ? (
                      // 分割エディタモード：エディタのみ表示（タブバーは上部に移動済み）
                      rightActiveTab ? (
                        <MonacoEditor
                          key={rightActiveTab.id}
                          value={rightActiveTab.content}
                          onChange={handleRightEditorChange}
                          language={rightActiveTab.fileName.endsWith('.md') ? 'markdown' : 'plaintext'}
                          fontSize={fontSize}
                          wordWrap={wordWrap}
                          minimap={minimap}
                          lineNumbers={lineNumbers}
                          theme={colorTheme}
                          onSearch={handleOpenSearch}
                          onReplace={handleOpenReplace}
                        />
                      ) : (
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="h6" color="text.secondary">
                            ファイルを開いてください
                          </Typography>
                        </Box>
                      )
                    ) : (
                      // 通常モード：プレビューまたはマインドマップを表示
                      activeTab ? (
                        viewMode === 'mindmap' ? (
                          <MindmapView ref={mindmapViewRef} content={activeTab.content} />
                        ) : (
                          <MarkdownPreview content={activeTab.content} />
                        )
                      ) : (
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="h6" color="text.secondary">
                            {viewMode === 'mindmap' ? '表示するマインドマップがありません' : '表示するプレビューがありません'}
                          </Typography>
                        </Box>
                      )
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* 保存確認ダイアログ */}
      <SaveConfirmDialog
        open={saveConfirmDialog.open}
        fileName={saveConfirmDialog.fileName}
        onClose={saveConfirmDialog.onResult}
      />

      {/* メッセージダイアログ */}
      <MessageDialog
        open={messageDialog.open}
        message={messageDialog.message}
        type={messageDialog.type}
        onClose={() => setMessageDialog((prev) => ({ ...prev, open: false }))}
      />

      {/* 検索ダイアログ */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={handleCloseSearch}
        onFindNext={handleFindNext}
        onFindPrevious={handleFindPrevious}
        initialSearchText={initialSearchText}
      />

      {/* 置換ダイアログ */}
      <ReplaceDialog
        open={replaceDialogOpen}
        onClose={handleCloseReplace}
        onFindNext={handleReplaceFindNext}
        onFindPrevious={handleReplaceFindPrevious}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        initialSearchText={initialReplaceSearchText}
      />

      {/* バージョン情報ダイアログ */}
      <VersionInfoDialog
        open={versionInfoDialogOpen}
        onClose={() => setVersionInfoDialogOpen(false)}
      />

      {/* 設定ダイアログ */}
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
      />

      {/* キーボードショートカットダイアログ */}
      <KeyboardShortcutsDialog
        open={keyboardShortcutsDialogOpen}
        onClose={() => setKeyboardShortcutsDialogOpen(false)}
      />

      {/* ヘルプダイアログ */}
      <HelpDialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
      />

      {/* プレビューエクスポートダイアログ */}
      <ExportDialog
        open={exportPreviewDialogOpen}
        onClose={() => setExportPreviewDialogOpen(false)}
        onExport={handleExport}
        defaultFileName={
          tabs.find((t) => t.id === activeTabId)?.fileName.replace(/\.md$/, '') || 'document'
        }
        viewMode="preview"
      />

      {/* マインドマップエクスポートダイアログ */}
      <ExportDialog
        open={exportMindmapDialogOpen}
        onClose={() => setExportMindmapDialogOpen(false)}
        onExport={handleExport}
        defaultFileName={
          tabs.find((t) => t.id === activeTabId)?.fileName.replace(/\.md$/, '') || 'document'
        }
        viewMode="mindmap"
        mindmapViewRef={mindmapViewRef}
        content={activeTab?.content || ''}
      />

      {/* 新しいフォルダーダイアログ */}
      <NewFolderDialog
        open={newFolderDialogOpen}
        rootFolder={rootFolder}
        onClose={handleCreateFolder}
      />

      {/* お気に入りファイル不在確認ダイアログ */}
      <ConfirmDialog
        open={favoriteNotFoundDialog.open}
        message={`${favoriteNotFoundDialog.fileName}\nが見つかりません。\nお気に入りから削除しますか？`}
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={handleFavoriteNotFoundConfirm}
        onCancel={handleFavoriteNotFoundCancel}
      />
    </Box>
  );
};

export default EditorPage;
