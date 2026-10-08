import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from '../../store/uiStore.js';

describe('UI Store (useUIStore)', () => {
  beforeEach(() => {
    // Reset state before each test
    useUIStore.setState({
      toasts: [],
      isAuthModalOpen: false,
      authModalTab: 'login',
      isSidebarOpen: true,
    });
    vi.useRealTimers();
  });

  it('adds and removes toasts properly', () => {
    const { showToast, removeToast } = useUIStore.getState();

    showToast({ title: 'Success', message: 'Profile updated', type: 'success', duration: 0 });

    let toasts = useUIStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].title).toBe('Success');
    expect(toasts[0].message).toBe('Profile updated');
    expect(toasts[0].type).toBe('success');

    const toastId = toasts[0].id;
    removeToast(toastId);

    toasts = useUIStore.getState().toasts;
    expect(toasts).toHaveLength(0);
  });

  it('auto-removes toasts when duration expires', () => {
    vi.useFakeTimers();

    const { showToast } = useUIStore.getState();
    showToast({ title: 'Temp', message: 'Fading out', type: 'info', duration: 3000 });

    expect(useUIStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(3000);

    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('opens and closes auth modal with tab selection', () => {
    const { openAuthModal, closeAuthModal } = useUIStore.getState();

    openAuthModal('otp');
    expect(useUIStore.getState().isAuthModalOpen).toBe(true);
    expect(useUIStore.getState().authModalTab).toBe('otp');

    closeAuthModal();
    expect(useUIStore.getState().isAuthModalOpen).toBe(false);
  });

  it('toggles sidebar and sets sidebar visibility explicitly', () => {
    const { toggleSidebar, setSidebarOpen } = useUIStore.getState();

    expect(useUIStore.getState().isSidebarOpen).toBe(true);
    toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(false);

    setSidebarOpen(true);
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
  });
});
