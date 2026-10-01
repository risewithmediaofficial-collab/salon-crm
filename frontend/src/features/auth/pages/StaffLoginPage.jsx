import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../../store/authStore.js';
import useUIStore from '../../../store/uiStore.js';
import authService from '../authService.js';
import Input from '../../../components/common/Input.jsx';
import Button from '../../../components/common/Button.jsx';
import Card from '../../../components/common/Card.jsx';
import { Mail, Lock, Shield, ArrowLeft, Eye, EyeOff, Sparkles, Check } from 'lucide-react';
import config from '../../../config/index.js';

export function StaffLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const showToast = useUIStore((state) => state.showToast);

  const [email, setEmail] = useState('admin@salon.com');
  const [password, setPassword] = useState('Admin@Salon2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fillCredentials = (fillEmail, fillPassword) => {
    setEmail(fillEmail);
    setPassword(fillPassword);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const res = await authService.staffLogin(cleanEmail, cleanPassword);
      const accessToken = res.data.tokens?.accessToken || res.data.accessToken;
      const refreshToken = res.data.tokens?.refreshToken || res.data.refreshToken;
      const user = res.data.user;

      setAuth({
        user,
        role: user.role,
        accessToken,
        refreshToken,
      });

      showToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome back, ${user.name} (${user.role})`,
      });

      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 selection:bg-salon-200">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Portal
        </Link>

        {/* Login Card */}
        <Card className="p-8 shadow-xl border-stone-200/80">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-salon-800 to-amber-700 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-salon-800/20">
              <Sparkles className="w-6 h-6 text-amber-200" />
            </div>
            <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">
              Staff Portal Login
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Authorized access for {config.SALON_NAME} stylists and managers
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@salon.com"
              required
              autoFocus
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-stone-400 hover:text-stone-700 focus:outline-none transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                icon={Shield}
              >
                Sign In to Admin Panel
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <p className="text-[11px] font-semibold text-stone-700 mb-2.5 text-center">
              Quick Fill Demo Credentials (Click to load):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@salon.com', 'Admin@Salon2026!')}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-100 hover:border-salon-500/50 transition-all text-left group"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 mb-0.5">
                  <span>Owner / Admin</span>
                  <span className="text-[10px] text-salon-600 font-normal group-hover:underline">Fill</span>
                </div>
                <div className="text-[10px] text-stone-500 font-mono truncate">admin@salon.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('priya@salon.com', 'Staff@Salon2026!')}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-100 hover:border-salon-500/50 transition-all text-left group"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 mb-0.5">
                  <span>Specialist / Staff</span>
                  <span className="text-[10px] text-salon-600 font-normal group-hover:underline">Fill</span>
                </div>
                <div className="text-[10px] text-stone-500 font-mono truncate">priya@salon.com</div>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default StaffLoginPage;
