import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { authApi } from '../api/services';
import { ToastContainer } from '../components/Toast';
import { gsap } from 'gsap';
import AnimatedCartoonScene from '../components/auth/AnimatedCartoonScene';
import AuthCard from '../components/auth/AuthCard';

const CompanyAccess: React.FC = () => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [checkingCompany, setCheckingCompany] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const formCardRef = useRef<HTMLDivElement>(null);
  const duoSceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (duoSceneRef.current) {
      timeline.fromTo(
        duoSceneRef.current,
        { x: -42, y: 14, scale: 1.08, opacity: 0.3 },
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.15, ease: 'power4.out' }
      );
    }

    if (formCardRef.current) {
      timeline.fromTo(
        formCardRef.current,
        { y: 70, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.95, ease: 'back.out(1.45)' },
        0.18
      );
    }

    timeline.fromTo(
      '.auth-company-field',
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.07, duration: 0.42 },
      0.24
    );

    return () => {
      timeline.kill();
    };
  }, []);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setToasts((prev: any[]) => [
        ...prev,
        { id: Date.now().toString(), type: 'error', message: 'Please enter company name or code' },
      ]);
      return;
    }

    setCheckingCompany(true);
    try {
      const response = await authApi.validateCompany(companyName.trim());
      if (response.data.success) {
        const company = response.data.data.company;
        localStorage.setItem('companyCode', company.code);
        localStorage.setItem('companyName', company.name);
        localStorage.setItem('companyInput', companyName.trim());
        navigate('/login');
      }
    } catch (error: any) {
      setToasts((prev: any[]) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'error',
          message: error.response?.data?.message || 'Company is not eligible',
        },
      ]);
    } finally {
      setCheckingCompany(false);
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

          <AuthCard ref={formCardRef} className="w-full max-w-md mx-auto rounded-[30px] p-7 md:p-8">
            <div className="text-center mb-7">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Select Company</h1>
              <p className="text-sm text-slate-500 mt-2">Enter your company name or code to continue</p>
            </div>

            <form onSubmit={handleContinue} className="space-y-5">
              <div className="auth-company-field">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name / Code</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Example: PROATTEND"
                  className="auth-premium-input w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300"
                  required
                />
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Try a company code like PROATTEND or NEXORA.</span>
                  <span className="rounded-full bg-primary-50 px-3 py-1 font-medium text-primary-700">Step 1 of 2</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkingCompany}
                className="auth-company-field group w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white py-3.5 font-semibold shadow-[0_18px_36px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 disabled:bg-primary-300"
              >
                {checkingCompany ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    Continue to Login
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

export default CompanyAccess;