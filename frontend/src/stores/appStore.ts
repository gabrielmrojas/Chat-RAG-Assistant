/**
 * Zustand store for global application state
 */
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { AppState } from '@/types'

interface AppStore extends AppState {
  // Actions
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setDarkMode: (darkMode: boolean) => void
  toggleDarkMode: () => void
  setCurrentView: (view: 'chat' | 'documents' | 'settings') => void
  
  // Utility actions
  resetAppState: () => void
}

const initialState: AppState = {
  sidebarOpen: true,
  darkMode: false,
  currentView: 'chat'
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Sidebar actions
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        // Theme actions
        setDarkMode: (darkMode) => {
          set({ darkMode })
          // Apply theme to document
          if (darkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        },
        
        toggleDarkMode: () => {
          const { darkMode } = get()
          const newDarkMode = !darkMode
          set({ darkMode: newDarkMode })
          
          // Apply theme to document
          if (newDarkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        },

        // View actions
        setCurrentView: (currentView) => set({ currentView }),

        // Utility actions
        resetAppState: () => set(initialState)
      }),
      {
        name: 'app-store',
        onRehydrateStorage: () => (state) => {
          // Apply theme on rehydration
          if (state?.darkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      }
    ),
    { name: 'AppStore' }
  )
)
