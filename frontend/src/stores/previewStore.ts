import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewMode, SplitMode } from '../types';

interface PreviewState {
  // 状態
  viewMode: ViewMode;
  splitMode: SplitMode;
  splitRatio: number;
  syncScroll: boolean;
  splitEditorMode: boolean; // 分割エディタモード（同じファイルを2つのエディタで表示）

  // アクション
  setViewMode: (mode: ViewMode) => void;
  setSplitMode: (mode: SplitMode) => void;
  setSplitRatio: (ratio: number) => void;
  setSplitEditorMode: (enabled: boolean) => void;
  toggleSyncScroll: () => void;
  toggleViewMode: () => void;
  togglePreview: () => void;
  toggleMindmap: () => void;
  toggleSplit: () => void;
  toggleSplitEditor: () => void;
  enableSplitEditor: () => void;
}

export const usePreviewStore = create<PreviewState>()(
  persist(
    (set, get) => ({
      // 初期状態
      viewMode: 'preview',
      splitMode: 'editor-only',
      splitRatio: 50,
      syncScroll: true,
      splitEditorMode: false,

      // アクション
      setViewMode: (viewMode) => set({ viewMode }),
      setSplitMode: (splitMode) => set({ splitMode }),
      setSplitRatio: (splitRatio) => set({ splitRatio }),
      setSplitEditorMode: (splitEditorMode) => set({ splitEditorMode }),
      toggleSyncScroll: () =>
        set((state) => ({ syncScroll: !state.syncScroll })),
      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === 'preview' ? 'mindmap' : 'preview',
        })),
      // プレビュー表示/非表示の切り替え
      togglePreview: () => {
        const current = get().splitMode;
        const currentView = get().viewMode;
        const isSplitEditor = get().splitEditorMode;
        if (current === 'editor-only' || currentView !== 'preview' || isSplitEditor) {
          // プレビューを表示（分割エディタモードを解除）
          set({ splitMode: 'horizontal', viewMode: 'preview', splitEditorMode: false });
        } else {
          // エディタのみ表示
          set({ splitMode: 'editor-only' });
        }
      },
      // マインドマップ表示/非表示の切り替え
      toggleMindmap: () => {
        const current = get().splitMode;
        const currentView = get().viewMode;
        const isSplitEditor = get().splitEditorMode;
        if (current === 'editor-only' || currentView !== 'mindmap' || isSplitEditor) {
          // マインドマップを表示（分割エディタモードを解除）
          set({ splitMode: 'horizontal', viewMode: 'mindmap', splitEditorMode: false });
        } else {
          // エディタのみ表示
          set({ splitMode: 'editor-only' });
        }
      },
      // 分割表示の切り替え（エディタのみ ↔ 分割表示）
      toggleSplit: () => {
        const current = get().splitMode;
        if (current === 'editor-only') {
          // 分割表示にする
          set({ splitMode: 'horizontal' });
        } else {
          // エディタのみ表示
          set({ splitMode: 'editor-only' });
        }
      },
      // 分割エディタモードの切り替え
      toggleSplitEditor: () => {
        const current = get().splitEditorMode;
        if (!current) {
          // 分割エディタモードを有効化（分割表示も有効にする）
          set({ splitEditorMode: true, splitMode: 'horizontal' });
        } else {
          // 分割エディタモードを無効化（エディタのみ表示に戻す）
          set({ splitEditorMode: false, splitMode: 'editor-only' });
        }
      },
      // 分割エディタモードを明示的に有効化（差分比較モードからの切り替え用）
      enableSplitEditor: () => {
        set({ splitEditorMode: true, splitMode: 'horizontal' });
      },
    }),
    {
      name: 'preview-settings',
      // splitModeとsplitEditorModeは永続化しない（起動時は常にエディタのみ表示）
      partialize: (state) => ({
        viewMode: state.viewMode,
        splitRatio: state.splitRatio,
        syncScroll: state.syncScroll,
      }),
    }
  )
);
