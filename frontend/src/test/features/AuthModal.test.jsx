import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from '../../features/auth/components/AuthModal.jsx';
import useUIStore from '../../store/uiStore.js';
import useAuthStore from '../../store/authStore.js';
import authService from '../../features/auth/authService.js';

// Mock authService
vi.mock('../../features/auth/authService.js', () => ({
  default: {
    sendCustomerOtp: vi.fn(),
    verifyCustomerOtp: vi.fn(),
  },
}));

describe('AuthModal Feature UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({
      isAuthModalOpen: true,
      authModalTab: 'login',
    });
    useAuthStore.setState({
      user: null,
      role: null,
      isAuthenticated: false,
    });
  });

  it('renders phone input when modal is open at step 1', () => {
    render(<AuthModal />);

    expect(screen.getByText('Customer Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument();
  });

  it('shows error if an invalid Indian phone number is submitted', async () => {
    render(<AuthModal />);

    const phoneInput = screen.getByLabelText(/mobile number/i);
    fireEvent.change(phoneInput, { target: { value: '12345' } });

    const submitBtn = screen.getByRole('button', { name: /send verification code/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('Please enter a valid 10-digit Indian mobile number')
    ).toBeInTheDocument();
    expect(authService.sendCustomerOtp).not.toHaveBeenCalled();
  });

  it('advances to OTP step when valid phone number is submitted', async () => {
    authService.sendCustomerOtp.mockResolvedValueOnce({ success: true });

    render(<AuthModal />);

    const phoneInput = screen.getByLabelText(/mobile number/i);
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    const submitBtn = screen.getByRole('button', { name: /send verification code/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.sendCustomerOtp).toHaveBeenCalledWith('9876543210', '');
    });

    expect(await screen.findByText('Verify Mobile Number')).toBeInTheDocument();
    expect(screen.getByLabelText(/one-time password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify & continue/i })).toBeInTheDocument();
  });

  it('verifies OTP and authenticates user into store upon successful verification', async () => {
    authService.sendCustomerOtp.mockResolvedValueOnce({ success: true });
    authService.verifyCustomerOtp.mockResolvedValueOnce({
      data: {
        customer: { id: 'cust_456', name: 'Ravi', phone: '9876543210' },
        tokens: { accessToken: 'access_abc', refreshToken: 'refresh_xyz' },
      },
    });

    render(<AuthModal />);

    // Step 1: Phone
    const phoneInput = screen.getByLabelText(/mobile number/i);
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /send verification code/i }));

    // Step 2: OTP
    const otpInput = await screen.findByLabelText(/one-time password/i);
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify & continue/i }));

    await waitFor(() => {
      expect(authService.verifyCustomerOtp).toHaveBeenCalledWith('9876543210', '123456');
    });

    await waitFor(() => {
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).toEqual({ id: 'cust_456', name: 'Ravi', phone: '9876543210' });
    });
  });
});
