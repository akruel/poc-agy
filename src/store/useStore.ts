import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentItem } from '../types';
import { userContentService } from '../services/userContent';

interface ListStore {
  myList: ContentItem[];
  watchedIds: number[];
  addToList: (item: ContentItem) => void;
  removeFromList: (id: number) => void;
  isInList: (id: number) => boolean;
  markAsWatched: (id: number) => void;
  markAsUnwatched: (id: number) => void;
  isWatched: (id: number) => boolean;
  syncWithSupabase: () => Promise<void>;
}

export const useStore = create<ListStore>()(
  persist(
    (set, get) => ({
      myList: [],
      watchedIds: [],
      
      addToList: (item) => {
        set((state) => {
          if (state.myList.some((i) => i.id === item.id)) return state;
          // Optimistic update
          userContentService.addToWatchlist(item);
          return { myList: [...state.myList, item] };
        });
      },

      removeFromList: (id) => {
        set((state) => {
          // Optimistic update
          userContentService.removeFromWatchlist(id);
          return {
            myList: state.myList.filter((i) => i.id !== id),
          };
        });
      },

      isInList: (id) => get().myList.some((i) => i.id === id),

      markAsWatched: (id) => {
        set((state) => {
          if (state.watchedIds.includes(id)) return state;
          
          // Try to find item metadata from myList if available
          const item = state.myList.find(i => i.id === id);
          userContentService.markAsWatched(id, item?.media_type || 'movie', item || {});
          
          return { watchedIds: [...state.watchedIds, id] };
        });
      },

      markAsUnwatched: (id) => {
        set((state) => {
          userContentService.markAsUnwatched(id);
          return {
            watchedIds: state.watchedIds.filter((watchedId) => watchedId !== id),
          };
        });
      },

      isWatched: (id) => get().watchedIds.includes(id),

      syncWithSupabase: async () => {
        const state = get();
        // 1. Upload local data to Supabase (migration)
        await userContentService.syncLocalData(state.myList, state.watchedIds);
        
        // 2. Fetch latest data from Supabase (source of truth)
        const { watchlist, watchedIds } = await userContentService.getUserContent();
        
        set({ myList: watchlist, watchedIds });
      }
    }),
    {
      name: 'cinepwa-storage',
    }
  )
);
