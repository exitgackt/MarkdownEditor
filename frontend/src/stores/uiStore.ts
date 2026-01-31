import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // 状態
  sidebarVisible: boolean;
  sidebarWidth: number;
  statusBarVisible: boolean;
  isDiffMode: boolean;
  diffFiles: { left: string; right: string } | null;
  diffLeftTabId: string | null;
  diffRightTabId: string | null;

  // アクション
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleStatusBar: () => void;
  setStatusBarVisible: (visible: boolean) => void;
  enterDiffMode: (leftTabId: string, rightTabId: string) => void;
  exitDiffMode: () => void;
  setDiffLeftTab: (tabId: string) => void;
  setDiffRightTab: (tabId: string) => void;
  toggleDiffMode: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 初期状態
      sidebarVisible: true,
      sidebarWidth: 250,
      statusBarVisible: true,
      isDiffMode: false,
      diffFiles: null,
      diffLeftTabId: null,
      diffRightTabId: null,

      // アクション
      toggleSidebar: () =>
        set((state) => ({ sidebarVisible: !state.sidebarVisible })),
      setSidebarVisible: (sidebarVisible) => set({ sidebarVisible }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      toggleStatusBar: () =>
        set((state) => ({ statusBarVisible: !state.statusBarVisible })),
      setStatusBarVisible: (statusBarVisible) => set({ statusBarVisible }),
      enterDiffMode: (leftTabId, rightTabId) =>
        set({ isDiffMode: true, diffLeftTabId: leftTabId, diffRightTabId: rightTabId }),
      exitDiffMode: () => set({ isDiffMode: false, diffLeftTabId: null, diffRightTabId: null }),
      setDiffLeftTab: (tabId) => set({ diffLeftTabId: tabId }),
      setDiffRightTab: (tabId) => set({ diffRightTabId: tabId }),
      toggleDiffMode: () =>
        set((state) => {
          if (state.isDiffMode) {
            return { isDiffMode: false, diffLeftTabId: null, diffRightTabId: null };
          }
          return { isDiffMode: true };
        }),
    }),
    {
      name: 'ui-settings',
      partialize: (state) => ({
        sidebarVisible: state.sidebarVisible,
        sidebarWidth: state.sidebarWidth,
        statusBarVisible: state.statusBarVisible,
      }),
    }
  )
);
