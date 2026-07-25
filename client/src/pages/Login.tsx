import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle, Fingerprint, Building2, CalendarCheck, Clock } from 'lucide-react';
import { ToastContainer, toast } from '../components/Toast';
import useFormValidation from '../hooks/useFormValidation';
import { email as emailRule, mapServerErrors, required, ValidationRules } from '../utils/validation';

interface LoginValues {
  email: string;
  password: string;
}

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [companyName] = useState(
    () => localStorage.getItem('companyInput') || localStorage.getItem('companyCode') || ''
  );
  const [companyDisplayName] = useState(() => localStorage.getItem('companyName') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY)));

  const setFieldErrorsRef = useRef<((errors: any) => void) | null>(null);

  useEffect(() => {
    if (!companyName) navigate('/company');
  }, [companyName, navigate]);

  const rules = useMemo<ValidationRules<LoginValues>>(
    () => ({
      email: [required('Email'), emailRule()],
      password: [required('Password')],
    }),
    []
  );

  const resolveRedirect = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
      case 'HR':
      case 'MANAGER':
        return '/admin';
      case 'TEAM_LEADER':
        return '/team-leader';
      default:
        return '/dashboard';
    }
  };

  const submit = useCallback(
    async (values: LoginValues) => {
      try {
        const result = await login(companyName.trim(), values.email.trim().toLowerCase(), values.password);
        if (!result.success) {
          toast.error(result.message || 'Email or password is incorrect');
          return;
        }
        if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email.trim().toLowerCase());
        else localStorage.removeItem(REMEMBERED_EMAIL_KEY);

        const stored = localStorage.getItem('user');
        const user = stored ? JSON.parse(stored) : null;
        toast.success(`Signed in as ${user?.fullName || values.email.trim()}`);
        navigate(resolveRedirect(user?.role));
      } catch (error: any) {
        const serverErrors = mapServerErrors<LoginValues>(error?.response?.data?.errors);
        if (Object.keys(serverErrors).length > 0) {
          setFieldErrorsRef.current?.(serverErrors);
          return;
        }
        toast.error(
          error?.response?.data?.message ||
            (error?.code === 'ERR_NETWORK'
              ? 'Cannot reach the server. Check your connection and try again.'
              : 'Sign in failed. Please try again.')
        );
      }
    },
    [companyName, login, navigate, remember]
  );

  const form = useFormValidation<LoginValues>({
    initialValues: {
      email: localStorage.getItem(REMEMBERED_EMAIL_KEY) || '',
      password: '',
    },
    rules,
    onSubmit: submit,
  });

  setFieldErrorsRef.current = form.setErrors;

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState?.('CapsLock') ?? false);
  };

  const changeCompany = () => {
    localStorage.removeItem('companyCode');
    localStorage.removeItem('companyName');
    localStorage.removeItem('companyInput');
    navigate('/company');
  };

  if (!companyName) return null;

  const fieldError = (field: keyof LoginValues) =>
    form.touched[field] && form.errors[field] ? form.errors[field] : '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <ToastContainer position="top-right" />

      <aside className="lg:w-1/2 bg-primary-700 text-white px-8 py-10 lg:px-14 lg:py-14 flex flex-col justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
            <Fingerprint className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold leading-tight">StaffSync</p>
            <p className="text-xs uppercase tracking-widest text-white/60">Attendance &amp; leave</p>
          </div>
        </div>

        <div className="hidden lg:block max-w-md">
          <h2 className="text-3xl font-bold leading-tight">Welcome back.</h2>
          <p className="mt-3 text-white/70 leading-relaxed">
            Sign in to check in, apply for leave, and see where your hours stand this month.
          </p>

          <div className="mt-8 space-y-4">
            <Feature icon={<Clock className="h-5 w-5" />} title="Live attendance" text="Punch in and out from the web or a fingerprint device." />
            <Feature icon={<CalendarCheck className="h-5 w-5" />} title="Leave tracking" text="Balances, approvals and history in one view." />
            <Feature icon={<Building2 className="h-5 w-5" />} title="One workspace per company" text="Your team, your data, kept separate." />
          </div>
        </div>

        <p className="hidden lg:block text-xs text-white/50">
          &copy; {new Date().getFullYear()} StaffSync
        </p>
      </aside>

      <main className="lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">Step 2 of 2</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1.5 text-sm text-slate-500">Use your work email to reach your workspace.</p>

          <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Company</p>
                <p className="truncate text-sm font-semibold text-slate-900">{companyDisplayName || companyName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={changeCompany}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change
            </button>
          </div>

          <form onSubmit={form.handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Work email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                placeholder="you@company.com"
                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2 ${
                  fieldError('email')
                    ? 'border-red-400 bg-red-50 focus:ring-red-200'
                    : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                {...form.fieldProps('email')}
              />
              {fieldError('email') && (
                <p id="email-error" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldError('email')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  onKeyUp={handleKeyEvent}
                  onKeyDown={handleKeyEvent}
                  className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm outline-none transition-colors focus:ring-2 ${
                    fieldError('password')
                      ? 'border-red-400 bg-red-50 focus:ring-red-200'
                      : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                  {...form.fieldProps('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
              {fieldError('password') && (
                <p id="password-error" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldError('password')}
                </p>
              )}
              {capsLockOn && !fieldError('password') && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Caps Lock is on
                </p>
              )}
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Remember my email on this device
            </label>

            <button
              type="submit"
              disabled={form.isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
            >
              {form.isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Trouble signing in? Contact your HR administrator.
          </p>
        </div>
      </main>
    </div>
  );
};

const Feature: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white">{icon}</span>
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-white/60">{text}</p>
    </div>
  </div>
);

export default Login;
