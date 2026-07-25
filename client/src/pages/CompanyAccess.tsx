import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Fingerprint, Building2, CalendarCheck, Clock } from 'lucide-react';
import { authApi } from '../api/services';
import { ToastContainer, toast } from '../components/Toast';
import useFormValidation from '../hooks/useFormValidation';
import { minLength, required, ValidationRules } from '../utils/validation';

interface CompanyValues {
  companyName: string;
}

const CompanyAccess: React.FC = () => {
  const navigate = useNavigate();

  const rules = useMemo<ValidationRules<CompanyValues>>(
    () => ({
      companyName: [required('Company name or code'), minLength(2, 'Company name or code')],
    }),
    []
  );

  const form = useFormValidation<CompanyValues>({
    initialValues: { companyName: '' },
    rules,
    onSubmit: async (values) => {
      const input = values.companyName.trim();
      try {
        const response = await authApi.validateCompany(input);
        if (!response.data.success) {
          toast.error(response.data.message || 'We could not find that company');
          return;
        }
        const company = response.data.data.company;
        localStorage.setItem('companyCode', company.code);
        localStorage.setItem('companyName', company.name);
        localStorage.setItem('companyInput', input);
        navigate('/login');
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            (error?.code === 'ERR_NETWORK'
              ? 'Cannot reach the server. Check your connection and try again.'
              : 'We could not find that company. Check the spelling and try again.')
        );
      }
    },
  });

  const fieldError =
    form.touched.companyName && form.errors.companyName ? form.errors.companyName : '';

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
          <h2 className="text-3xl font-bold leading-tight">
            Attendance, leave and payroll in one place.
          </h2>
          <p className="mt-3 text-white/70 leading-relaxed">
            Web check-ins and fingerprint terminals write to the same sheet, so HR reads one
            source instead of three.
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
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">Step 1 of 2</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Find your company</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter the company name or the code your HR team gave you.
          </p>

          <form onSubmit={form.handleSubmit} noValidate className="mt-7 space-y-4">
            <div>
              <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-slate-700">
                Company name or code
              </label>
              <input
                id="companyName"
                type="text"
                autoFocus
                autoComplete="organization"
                placeholder="STAFFSYNC"
                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2 ${
                  fieldError
                    ? 'border-red-400 bg-red-50 focus:ring-red-200'
                    : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                {...form.fieldProps('companyName')}
              />
              {fieldError ? (
                <p id="companyName-error" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldError}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">Codes are short and uppercase, like STAFFSYNC.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={form.isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
            >
              {form.isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Checking
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Not sure which company code to use? Ask your HR administrator.
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

export default CompanyAccess;
