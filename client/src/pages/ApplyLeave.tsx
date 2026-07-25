import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { toast } from '../components/Toast';
import { Calendar, Send, AlertCircle } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';
import useFormValidation from '../hooks/useFormValidation';
import { minLength, notBefore, required, ValidationRule, ValidationRules } from '../utils/validation';

interface LeaveValues {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

const ApplyLeave: React.FC = () => {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaveBalance();
  }, []);

  const loadLeaveBalance = async () => {
    try {
      const response = await leaveApi.getBalance();
      if (response.data.success) {
        setLeaveTypes(response.data.data.leaveBalances);
      }
    } catch (error) {
      toast.error('Could not load your leave balance. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  const countDays = (from: string, to: string) => {
    if (!from || !to) return 0;
    const days = differenceInCalendarDays(new Date(to), new Date(from)) + 1;
    return days > 0 ? days : 0;
  };

  const withinBalance: ValidationRule<LeaveValues> = (value, all) => {
    if (!value || !all.fromDate || !all.leaveTypeId) return null;

    const selected = leaveTypes.find((item) => item.leaveTypeId === all.leaveTypeId);
    if (!selected) return null;

    const requested = countDays(all.fromDate, value);
    if (requested === 0) return null;

    return requested > selected.remainingLeaves
      ? `Only ${selected.remainingLeaves} day(s) left in ${selected.leaveType.name}. You asked for ${requested}.`
      : null;
  };

  const rules = useMemo<ValidationRules<LeaveValues>>(
    () => ({
      leaveTypeId: [required('Leave type')],
      fromDate: [required('From date')],
      toDate: [
        required('To date'),
        notBefore('fromDate', 'To date cannot be earlier than the from date'),
        withinBalance,
      ],
      reason: [required('Reason'), minLength(10, 'Reason')],
    }),

    [leaveTypes]
  );

  const form = useFormValidation<LeaveValues>({
    initialValues: { leaveTypeId: '', fromDate: '', toDate: '', reason: '' },
    rules,
    onSubmit: async (values) => {
      try {
        const response = await leaveApi.apply({ ...values, reason: values.reason.trim() });
        if (response.data.success) {
          toast.success('Leave application submitted');
          navigate('/leave-history');
        } else {
          toast.error(response.data.message || 'Could not submit the application');
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Could not submit the application');
      }
    },
  });

  const days = countDays(form.values.fromDate, form.values.toDate);
  const today = new Date().toISOString().split('T')[0];

  const error = (field: keyof LeaveValues) =>
    form.touched[field] && form.errors[field] ? form.errors[field] : '';

  const FieldError: React.FC<{ field: keyof LeaveValues }> = ({ field }) =>
    error(field) ? (
      <p id={`${field}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {error(field)}
      </p>
    ) : null;

  const inputClass = (field: keyof LeaveValues) =>
    `w-full px-4 py-3 border rounded-lg outline-none transition-colors focus:ring-2 ${
      error(field)
        ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500'
        : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'
    }`;

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apply for Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit} noValidate className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
              <select className={inputClass('leaveTypeId')} {...form.fieldProps('leaveTypeId')}>
                <option value="">Select leave type</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.leaveTypeId} disabled={lt.remainingLeaves <= 0}>
                    {lt.leaveType.name} ({lt.remainingLeaves} days remaining)
                  </option>
                ))}
              </select>
              <FieldError field="leaveTypeId" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                <div className="relative">
                  <input
                    type="date"
                    min={today}
                    className={`${inputClass('fromDate')} pr-10 cursor-pointer`}
                    {...form.fieldProps('fromDate')}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                <FieldError field="fromDate" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                <div className="relative">
                  <input
                    type="date"
                    min={form.values.fromDate || today}
                    className={`${inputClass('toDate')} pr-10 cursor-pointer`}
                    {...form.fieldProps('toDate')}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                <FieldError field="toDate" />
              </div>
            </div>

            {days > 0 && !error('toDate') && (
              <div className="bg-primary-50 text-primary-700 px-4 py-3 rounded-lg text-sm">
                <span className="font-semibold">{days}</span> day{days > 1 ? 's' : ''} requested
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <textarea
                rows={4}
                placeholder="Tell your approver why you need these days off"
                className={`${inputClass('reason')} resize-none`}
                {...form.fieldProps('reason')}
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                <FieldError field="reason" />
                <span className="ml-auto shrink-0 text-xs text-slate-400">
                  {form.values.reason.trim().length}/10 min
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={form.isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:bg-primary-300"
            >
              {form.isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyLeave;
