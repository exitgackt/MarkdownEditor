import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Favorite } from '../types';

interface FavoriteState {
  // 状態
  favorites: Favorite[];

  // アクション
  addFavorite: (filePath: string, fileName: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (filePath: string) => boolean;
  reset: () => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      // 初期状態
      favorites: [],

      // アクション
      addFavorite: (filePath, fileName) =>
        set((state) => {
          // 既に登録済みの場合は追加しない
          if (state.favorites.some((f) => f.filePath === filePath)) {
            return state;
          }
          const newFavorite: Favorite = {
            id: `fav-${Date.now()}`,
            filePath,
            fileName,
            addedAt: new Date().toISOString(),
          };
          return { favorites: [...state.favorites, newFavorite] };
        }),

      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),

      isFavorite: (filePath) => {
        const state = get();
        return state.favorites.some((f) => f.filePath === filePath);
      },

      reset: () => set({ favorites: [] }),
    }),
    {
      name: 'favorite-storage',
    }
  )
);
