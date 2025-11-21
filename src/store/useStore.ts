import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentItem } from '../types';

interface ListStore {
  myList: ContentItem[];
  addToList: (item: ContentItem) => void;
  removeFromList: (id: number) => void;
  isInList: (id: number) => boolean;
}

export const useStore = create<ListStore>()(
  persist(
    (set, get) => ({
      myList: [],
      addToList: (item) => set((state) => {
        if (state.myList.some((i) => i.id === item.id)) return state;
        return { myList: [...state.myList, item] };
      }),
      removeFromList: (id) => set((state) => ({
        myList: state.myList.filter((i) => i.id !== id),
      })),
      isInList: (id) => get().myList.some((i) => i.id === id),
    }),
    {
      name: 'cinepwa-storage',
    }
  )
);
