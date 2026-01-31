import { create } from 'zustand';
import type { FileNode } from '../types';

interface FileState {
  // 状態
  rootFolder: FileNode | null;
  rootHandle: FileSystemDirectoryHandle | null;
  expandedFolders: Set<string>;
  isLoading: boolean;
  error: string | null;

  // アクション
  setRootFolder: (folder: FileNode | null) => void;
  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  toggleFolder: (folderId: string) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  // 初期状態
  rootFolder: null,
  rootHandle: null,
  expandedFolders: new Set<string>(),
  isLoading: false,
  error: null,

  // アクション
  setRootFolder: (rootFolder) => set({ rootFolder }),
  setRootHandle: (rootHandle) => set({ rootHandle }),
  toggleFolder: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return { expandedFolders: newExpanded };
    }),
  expandFolder: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.add(folderId);
      return { expandedFolders: newExpanded };
    }),
  collapseFolder: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.delete(folderId);
      return { expandedFolders: newExpanded };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      rootFolder: null,
      rootHandle: null,
      expandedFolders: new Set<string>(),
      isLoading: false,
      error: null,
    }),
}));
