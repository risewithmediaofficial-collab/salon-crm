import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  role: localStorage.getItem('userRole') || null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: Boolean(localStorage.getItem('accessToken')),

  setAuth: ({ user, role, accessToken, refreshToken }) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userRole', role);
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ user, role, accessToken, isAuthenticated: true });
  },

  updateUser: (updatedData) => {
    set((state) => {
      const newUser = { ...state.user, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, role: null, accessToken: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
