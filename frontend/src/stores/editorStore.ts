import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorSettings } from '../types';

interface EditorState {
  // 状態
  settings: EditorSettings;
  cursorPosition: { line: number; column: number };
  selection: { start: number; end: number } | null;

  // アクション
  updateSettings: (settings: Partial<EditorSettings>) => void;
  setCursorPosition: (line: number, column: number) => void;
  setSelection: (selection: { start: number; end: number } | null) => void;
  resetSettings: () => void;
}

const defaultSettings: EditorSettings = {
  fontSize: 14,
  theme: 'auto',
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  tabSize: 2,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      // 初期状態
      settings: defaultSettings,
      cursorPosition: { line: 1, column: 1 },
      selection: null,

      // アクション
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setCursorPosition: (line, column) =>
        set({ cursorPosition: { line, column } }),
      setSelection: (selection) => set({ selection }),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'editor-settings',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
