import { create } from 'zustand';

function getStoredAuth() {
  const isAdminPath =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/staff-login'));

  if (isAdminPath) {
    const adminToken = localStorage.getItem('adminAccessToken');
    const adminRole = localStorage.getItem('adminRole');
    const adminUser = localStorage.getItem('adminUser');
    if (adminToken && adminRole) {
      try {
        return {
          user: JSON.parse(adminUser || 'null'),
          role: adminRole,
          accessToken: adminToken,
          isAuthenticated: true,
        };
      } catch (e) {}
    }
  } else {
    const custToken = localStorage.getItem('customerAccessToken');
    const custRole = localStorage.getItem('customerRole');
    const custUser = localStorage.getItem('customerUser');
    if (custToken && custRole) {
      try {
        return {
          user: JSON.parse(custUser || 'null'),
          role: custRole,
          accessToken: custToken,
          isAuthenticated: true,
        };
      } catch (e) {}
    }
  }

  // Fallback to standard generic keys
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = localStorage.getItem('userRole') || null;
  const accessToken =
    localStorage.getItem('adminAccessToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('customerAccessToken') ||
    null;

  return {
    user,
    role,
    accessToken,
    isAuthenticated: Boolean(accessToken),
  };
}

const initial = getStoredAuth();

export const useAuthStore = create((set) => ({
  user: initial.user,
  role: initial.role,
  accessToken: initial.accessToken,
  isAuthenticated: initial.isAuthenticated,

  setAuth: ({ user, role, accessToken, refreshToken }) => {
    const isCustomer = role === 'CUSTOMER';
    if (isCustomer) {
      localStorage.setItem('customerUser', JSON.stringify(user));
      localStorage.setItem('customerRole', role);
      localStorage.setItem('customerAccessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('customerRefreshToken', refreshToken);
      }
    } else {
      localStorage.setItem('adminUser', JSON.stringify(user));
      localStorage.setItem('adminRole', role);
      localStorage.setItem('adminAccessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('adminRefreshToken', refreshToken);
      }
    }

    // Synchronize to current active key
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
      if (state.role === 'CUSTOMER') {
        localStorage.setItem('customerUser', JSON.stringify(newUser));
      } else {
        localStorage.setItem('adminUser', JSON.stringify(newUser));
      }
      return { user: newUser };
    });
  },

  logout: (explicitRole) => {
    const roleToLogout = explicitRole || localStorage.getItem('userRole');
    if (roleToLogout === 'CUSTOMER') {
      localStorage.removeItem('customerUser');
      localStorage.removeItem('customerRole');
      localStorage.removeItem('customerAccessToken');
      localStorage.removeItem('customerRefreshToken');
    } else {
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminRole');
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
    }

    const isAdminPath =
      typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/admin') ||
        window.location.pathname.startsWith('/staff-login'));

    if (isAdminPath) {
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, role: null, accessToken: null, isAuthenticated: false });
    } else {
      const adminToken = localStorage.getItem('adminAccessToken');
      if (!adminToken) {
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, role: null, accessToken: null, isAuthenticated: false });
      } else {
        localStorage.removeItem('customerUser');
        localStorage.removeItem('customerAccessToken');
        set({ user: null, role: null, accessToken: null, isAuthenticated: false });
      }
    }
  },
}));

export default useAuthStore;
