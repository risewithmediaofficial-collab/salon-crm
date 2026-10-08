import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/authStore.js';

describe('Auth Store (useAuthStore)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      role: null,
      accessToken: null,
      isAuthenticated: false,
    });
  });

  it('initializes with unauthenticated state when localStorage is empty', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
  });

  it('updates state and persists to localStorage on setAuth for customer', () => {
    const customerUser = { id: 'cust1', name: 'John Doe', phone: '9876543210' };
    const { setAuth } = useAuthStore.getState();

    setAuth({
      user: customerUser,
      role: 'CUSTOMER',
      accessToken: 'test-cust-token',
      refreshToken: 'test-cust-refresh',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(customerUser);
    expect(state.role).toBe('CUSTOMER');
    expect(state.accessToken).toBe('test-cust-token');

    expect(localStorage.getItem('customerAccessToken')).toBe('test-cust-token');
    expect(localStorage.getItem('customerRole')).toBe('CUSTOMER');
    expect(JSON.parse(localStorage.getItem('customerUser'))).toEqual(customerUser);
  });

  it('updates state and persists to localStorage on setAuth for staff/admin', () => {
    const adminUser = { id: 'admin1', name: 'Manager Admin', email: 'admin@salon.com' };
    const { setAuth } = useAuthStore.getState();

    setAuth({
      user: adminUser,
      role: 'OWNER',
      accessToken: 'test-admin-token',
      refreshToken: 'test-admin-refresh',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(adminUser);
    expect(state.role).toBe('OWNER');

    expect(localStorage.getItem('adminAccessToken')).toBe('test-admin-token');
    expect(localStorage.getItem('adminRole')).toBe('OWNER');
    expect(JSON.parse(localStorage.getItem('adminUser'))).toEqual(adminUser);
  });

  it('updates user profile via updateUser and syncs to storage', () => {
    const { setAuth, updateUser } = useAuthStore.getState();
    setAuth({
      user: { id: 'cust1', name: 'Original Name' },
      role: 'CUSTOMER',
      accessToken: 'tok',
    });

    updateUser({ name: 'Updated Name', email: 'cust@mail.com' });

    const state = useAuthStore.getState();
    expect(state.user.name).toBe('Updated Name');
    expect(state.user.email).toBe('cust@mail.com');
    expect(JSON.parse(localStorage.getItem('customerUser')).name).toBe('Updated Name');
  });

  it('clears state and removes storage items on logout', () => {
    const { setAuth, logout } = useAuthStore.getState();
    setAuth({
      user: { id: 'cust1', name: 'Cust' },
      role: 'CUSTOMER',
      accessToken: 'tok',
    });

    logout('CUSTOMER');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(localStorage.getItem('customerAccessToken')).toBeNull();
  });
});
