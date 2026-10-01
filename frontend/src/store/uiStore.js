import { create } from 'zustand';

let toastCounter = 0;

export const useUIStore = create((set) => ({
  toasts: [],
  isAuthModalOpen: false,
  authModalTab: 'login', // 'login' | 'otp' | 'staff'
  isSidebarOpen: true,

  showToast: ({ title, message, type = 'info', duration = 4000 }) => {
    const id = ++toastCounter;
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, type }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  openAuthModal: (tab = 'login') => {
    set({ isAuthModalOpen: true, authModalTab: tab });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (isOpen) => {
    set({ isSidebarOpen: isOpen });
  },
}));

export default useUIStore;
