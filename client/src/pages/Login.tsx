import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { ToastContainer } from '../components/Toast';
import { gsap } from 'gsap';
import AnimatedCartoonScene from '../components/auth/AnimatedCartoonScene';
import AuthCard from '../components/auth/AuthCard';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [companyName] = useState(localStorage.getItem('companyInput') || localStorage.getItem('companyCode') || '');
  const [companyDisplayName] = useState(localStorage.getItem('companyName') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const loginCardRef = useRef<HTMLDivElement>(null);
  const duoSceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!companyName) {
      navigate('/company');
    }
  }, [companyName, navigate]);

  useEffect(() => {
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (duoSceneRef.current) {
      timeline.fromTo(
        duoSceneRef.current,
        { x: -42, y: 14, scale: 1.08, opacity: 0.3 },
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.15, ease: 'power4.out' }
      );
    }

    if (loginCardRef.current) {
      timeline.fromTo(
        loginCardRef.current,
        { y: 70, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.95, ease: 'back.out(1.45)' },
        0.18
      );
    }

    timeline.fromTo(
      '.auth-company-field',
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.48 },
      0.24
    );

    return () => {
      timeline.kill();
    };
  }, []);

  if (!companyName) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(companyName.trim(), email, password);
      if (result.success) {
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        let redirectPath = '/dashboard';

        if (user) {
          switch (user.role) {
            case 'SUPER_ADMIN':
            case 'ADMIN':
            case 'HR':
            case 'MANAGER':
              redirectPath = '/admin';
              break;
            case 'TEAM_LEADER':
              redirectPath = '/team-leader';
              break;
            default:
              redirectPath = '/dashboard';
          }
        }
        navigate(redirectPath);
      } else {
        setToasts([...toasts, { id: Date.now().toString(), type: 'error', message: result.message }]);
      }
    } catch (error: any) {
      setToasts([...toasts, { id: Date.now().toString(), type: 'error', message: error.response?.data?.message || 'Login failed' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-scene auth-login-minimal auth-scene-cinematic flex items-center justify-center p-4 md:p-6">
      <ToastContainer toasts={toasts} onClose={() => {}} />
      <div className="auth-shell auth-login-shell">
        <div className="auth-orb w-44 h-44 bg-primary-200/50 top-12 right-20" />
        <div className="auth-orb w-52 h-52 bg-sky-100/60 bottom-8 left-8" />

        <section className="auth-login-stack cartoon-side-layout">
          <div className="cartoon-float-shape cartoon-float-shape-a" aria-hidden="true" />
          <div className="cartoon-float-shape cartoon-float-shape-b" aria-hidden="true" />

          <div ref={duoSceneRef}>
            <AnimatedCartoonScene side="right" />
          </div>

          <AuthCard ref={loginCardRef} className="w-full max-w-md mx-auto rounded-[30px] p-7 md:p-8">
            <div className="text-center mb-7">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Sign In</h1>
              <p className="text-sm text-slate-500 mt-2">Welcome back to your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="auth-company-field flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-700">Company</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{companyDisplayName || companyName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('companyCode');
                    localStorage.removeItem('companyName');
                    localStorage.removeItem('companyInput');
                    navigate('/company');
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change
                </button>
              </div>

              <div className="auth-company-field">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="auth-premium-input w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300"
                  required
                />
              </div>

              <div className="auth-company-field">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="auth-premium-input w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3.5 pr-12 text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-company-field group w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white py-3.5 font-semibold shadow-[0_18px_36px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 disabled:bg-primary-300"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </AuthCard>
        </section>
      </div>
    </div>
  );
};

export default Login;
