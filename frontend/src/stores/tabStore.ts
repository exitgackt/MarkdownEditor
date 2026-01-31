import { create } from 'zustand';
import type { Tab } from '../types';

interface TabState {
  // 状態
  tabs: Tab[];
  activeTabId: string | null;
  rightActiveTabId: string | null; // 右側エディタのアクティブタブID

  // アクション
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string | null) => void;
  setRightActiveTab: (tabId: string | null) => void; // 右側エディタのアクティブタブ設定
  updateTabContent: (tabId: string, content: string) => void;
  markTabAsSaved: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  getActiveTab: () => Tab | undefined;
  getRightActiveTab: () => Tab | undefined; // 右側エディタのアクティブタブ取得
  hasUnsavedChanges: () => boolean;
  reset: () => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  // 初期状態
  tabs: [],
  activeTabId: null,
  rightActiveTabId: null,

  // アクション
  addTab: (tab) =>
    set((state) => {
      // 既に同じファイルが開かれている場合はそのタブをアクティブに
      const existingTab = state.tabs.find((t) => t.filePath === tab.filePath);
      if (existingTab) {
        return { activeTabId: existingTab.id };
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    }),

  removeTab: (tabId) =>
    set((state) => {
      const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
      const newTabs = state.tabs.filter((t) => t.id !== tabId);

      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === tabId) {
        // 削除するタブがアクティブな場合、次のタブまたは前のタブをアクティブに
        if (newTabs.length > 0) {
          const newIndex = Math.min(tabIndex, newTabs.length - 1);
          newActiveTabId = newTabs[newIndex].id;
        } else {
          newActiveTabId = null;
        }
      }

      // 右側のアクティブタブも同様に処理
      let newRightActiveTabId = state.rightActiveTabId;
      if (state.rightActiveTabId === tabId) {
        if (newTabs.length > 0) {
          const newIndex = Math.min(tabIndex, newTabs.length - 1);
          newRightActiveTabId = newTabs[newIndex].id;
        } else {
          newRightActiveTabId = null;
        }
      }

      return { tabs: newTabs, activeTabId: newActiveTabId, rightActiveTabId: newRightActiveTabId };
    }),

  setActiveTab: (activeTabId) => set({ activeTabId }),

  setRightActiveTab: (rightActiveTabId) => set({ rightActiveTabId }),

  updateTabContent: (tabId, content) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, content, isDirty: content !== tab.originalContent }
          : tab
      ),
    })),

  markTabAsSaved: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, originalContent: tab.content, isDirty: false }
          : tab
      ),
    })),

  updateTab: (tabId, updates) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    })),

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      const newTabs = [...state.tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return { tabs: newTabs };
    }),

  getActiveTab: () => {
    const state = get();
    return state.tabs.find((t) => t.id === state.activeTabId);
  },

  getRightActiveTab: () => {
    const state = get();
    return state.tabs.find((t) => t.id === state.rightActiveTabId);
  },

  hasUnsavedChanges: () => {
    const state = get();
    return state.tabs.some((t) => t.isDirty);
  },

  reset: () => set({ tabs: [], activeTabId: null, rightActiveTabId: null }),
}));
