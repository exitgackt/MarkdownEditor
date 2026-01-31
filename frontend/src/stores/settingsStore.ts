import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColorTheme = 'vs-dark' | 'vs-light';
export type WordWrap = 'on' | 'off' | 'wordWrapColumn' | 'bounded';
export type LineNumbers = 'on' | 'off' | 'relative' | 'interval';

interface SettingsState {
  // エディタ設定
  fontSize: number;
  wordWrap: WordWrap;
  minimap: boolean;
  lineNumbers: LineNumbers;
  colorTheme: ColorTheme;

  // アクション
  setFontSize: (size: number) => void;
  setWordWrap: (wrap: WordWrap) => void;
  setMinimap: (enabled: boolean) => void;
  setLineNumbers: (lineNumbers: LineNumbers) => void;
  setColorTheme: (theme: ColorTheme) => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  fontSize: 14,
  wordWrap: 'on' as WordWrap,
  minimap: false,
  lineNumbers: 'on' as LineNumbers,
  colorTheme: 'vs-dark' as ColorTheme,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 初期状態
      ...defaultSettings,

      // アクション
      setFontSize: (fontSize) => set({ fontSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setMinimap: (minimap) => set({ minimap }),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      setColorTheme: (colorTheme) => {
        console.log('[settingsStore] setColorTheme が呼ばれました:', colorTheme);
        set({ colorTheme });
      },
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'editor-settings',
    }
  )
);
