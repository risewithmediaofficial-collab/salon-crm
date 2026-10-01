import React, { useState, useEffect } from 'react';
import useAuthStore from '../../../store/authStore.js';
import useUIStore from '../../../store/uiStore.js';
import authService from '../authService.js';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Button from '../../../components/common/Button.jsx';
import { Phone, KeyRound, User, ArrowRight, RotateCcw } from 'lucide-react';
import { isValidIndianPhone } from '../../../../../shared/validation-rules/index.js';

export function AuthModal() {
  const isOpen = useUIStore((state) => state.isAuthModalOpen);
  const closeModal = useUIStore((state) => state.closeAuthModal);
  const showToast = useUIStore((state) => state.showToast);
  const setAuth = useAuthStore((state) => state.setAuth);

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleClose = () => {
    closeModal();
    setStep('phone');
    setPhone('');
    setName('');
    setOtp('');
    setError('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!isValidIndianPhone(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendCustomerOtp(cleanPhone, name);
      setStep('otp');
      setCountdown(60);
      showToast({
        type: 'success',
        title: 'OTP Sent',
        message: 'A verification code has been generated. For testing, check developer log / default is 123456.',
      });
    } catch (err) {
      setError(err.message || 'Unable to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 4) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await authService.verifyCustomerOtp(cleanPhone, otp);

      const accessToken = res.data.tokens?.accessToken || res.data.accessToken;
      const refreshToken = res.data.tokens?.refreshToken || res.data.refreshToken;
      const customer = res.data.customer;

      setAuth({
        user: customer,
        role: 'CUSTOMER',
        accessToken,
        refreshToken,
      });

      showToast({
        type: 'success',
        title: 'Welcome Back!',
        message: `Signed in as ${res.data.customer.name || res.data.customer.phone}`,
      });

      handleClose();
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'phone' ? 'Customer Sign In' : 'Verify Mobile Number'}
      subtitle={
        step === 'phone'
          ? 'Enter your mobile number to book or view appointments'
          : `Enter the code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`
      }
      maxWidth="max-w-md"
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <Input
            label="Mobile Number"
            type="tel"
            placeholder="e.g. 9876543210"
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Your Name (Optional for first-time visitors)"
            type="text"
            placeholder="e.g. Priya Sharma"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <p className="text-[11px] text-stone-500 leading-relaxed">
            By continuing, you agree to receive appointment reminders and updates via SMS.
          </p>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 text-sm font-medium shadow-md shadow-salon-900/10"
            isLoading={isLoading}
            icon={ArrowRight}
          >
            Send Verification Code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          {/* Quick Dev Tip */}
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between">
            <span>Development Test Code: <strong className="font-mono font-bold text-amber-950">123456</strong></span>
            <button
              type="button"
              onClick={() => setOtp('123456')}
              className="text-[11px] font-semibold text-salon-800 underline hover:text-salon-950 cursor-pointer"
            >
              Auto-fill
            </button>
          </div>

          <Input
            label="One-Time Password (OTP)"
            type="text"
            placeholder="6-digit code (e.g. 123456)"
            icon={KeyRound}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            autoFocus
            maxLength={6}
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="text-stone-500 hover:text-stone-800 font-medium transition-colors"
            >
              Change number
            </button>

            {countdown > 0 ? (
              <span className="text-stone-400 font-medium">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-salon-800 hover:text-salon-950 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resend OTP
              </button>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 text-sm font-medium shadow-md shadow-salon-900/10"
            isLoading={isLoading}
          >
            Verify & Continue
          </Button>
        </form>
      )}
    </Modal>
  );
}

export default AuthModal;
