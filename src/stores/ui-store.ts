import { create } from 'zustand'

/**
 * So estado de interface. A sessao vive no cache do TanStack Query e a lista
 * de instancias na API; aqui mora apenas o que o usuario escolheu na tela.
 */
interface UiState {
  isSidebarOpen: boolean
  selectedInstanceId: string | null
  selectInstance: (instanceId: string | null) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  isSidebarOpen: true,
  selectedInstanceId: null,
  selectInstance: (selectedInstanceId) => set({ selectedInstanceId }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
}))

export const selectSelectedInstanceId = (state: UiState): string | null =>
  state.selectedInstanceId
