import React, { useState, useEffect, useRef } from 'react';
import { attendanceApi } from '../api/services';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';

type AttendanceData = {
  id: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  totalHours?: number | null;
  netHours?: number | null;
  status: string;
  isLate?: boolean;
  currentSession?: {
    id: string;
    startTime: string;
    endTime: string | null;
  } | null;
  sessions?: Array<{
    id: string;
    startTime: string;
    endTime: string | null;
  }>;
};

interface AttendanceTimerCardProps {
  shiftStartTime?: string;
  shiftEndTime?: string;
  onAttendanceChange?: (attendance: AttendanceData | null) => void;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTimeDisplay(dateStr?: string | null): string {
  if (!dateStr) return '--:--';
  return format(new Date(dateStr), 'hh:mm a');
}

export const AttendanceTimerCard: React.FC<AttendanceTimerCardProps> = ({
  shiftStartTime = '09:00',
  shiftEndTime = '18:00',
  onAttendanceChange,
}) => {
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [timer, setTimer] = useState('00:00:00');
  const [roundTimer, setRoundTimer] = useState('00:00:00');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const attendanceRef = useRef<AttendanceData | null>(null);

  const isPunchedIn = !!attendance?.currentSession?.startTime && !attendance?.currentSession?.endTime;
  const hasAttendanceForToday = !!(attendance?.sessions?.length || attendance?.punchInTime);
  const isReadyForNextPunch = hasAttendanceForToday && !isPunchedIn;

  const getShiftDurationSeconds = (): number => {
    const [startH, startM] = shiftStartTime.split(':').map(Number);
    const [endH, endM] = shiftEndTime.split(':').map(Number);
    return Math.max(0, (endH * 60 + endM - (startH * 60 + startM)) * 60);
  };

  const getFirstPunchInMs = (data: AttendanceData | null): number | null => {
    if (!data) return null;
    const sessionStart = data.sessions?.[0]?.startTime;
    const anchor = sessionStart || data.punchInTime;
    return anchor ? new Date(anchor).getTime() : null;
  };

  const computeNetSeconds = (data: AttendanceData | null): number => {
    if (!data) return 0;
    if (data.currentSession?.startTime && !data.currentSession.endTime) {
      const completed = Math.max(0, Math.floor((data.totalHours || 0) * 3600));
      const running = Math.max(0, Math.floor((Date.now() - new Date(data.currentSession.startTime).getTime()) / 1000));
      return completed + running;
    }
    if (data.punchInTime) return Math.max(0, Math.floor((data.totalHours || 0) * 3600));
    return 0;
  };

  const applyAttendance = (data: AttendanceData | null) => {
    setAttendance(data);
    attendanceRef.current = data;
    onAttendanceChange?.(data);

    const netSecs = computeNetSeconds(data);
    setTimer(formatDuration(netSecs));
    setElapsedSeconds(netSecs);

    const firstMs = getFirstPunchInMs(data);
    setRoundTimer(firstMs ? formatDuration(Math.max(0, Math.floor((Date.now() - firstMs) / 1000))) : '00:00:00');
  };

  const loadedDayRef = useRef<number>(new Date().getDate());

  const loadToday = () => {
    loadedDayRef.current = new Date().getDate();
    return attendanceApi.getToday()
      .then((res) => {
        if (res.data.success) {
          applyAttendance(res.data.data.attendance ?? null);
        }
      })
      .catch(() => {/* no attendance today */});
  };

  useEffect(() => {
    loadToday().finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().getDate();
      if (today !== loadedDayRef.current) {
        loadToday();
        return;
      }

      const current = attendanceRef.current;

      const firstMs = getFirstPunchInMs(current);
      setRoundTimer(firstMs ? formatDuration(Math.max(0, Math.floor((Date.now() - firstMs) / 1000))) : '00:00:00');

      const netSecs = computeNetSeconds(current);
      setTimer(formatDuration(netSecs));
      setElapsedSeconds(netSecs);
    }, 1000);

    return () => clearInterval(interval);
  }, []); // intentionally empty — interval is alive for the full component lifetime

  const handlePunchIn = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.punchIn();
      if (res.data.success) applyAttendance(res.data.data.attendance);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Punch in failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.punchOut();
      if (res.data.success) applyAttendance(res.data.data.attendance);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Punch out failed');
    } finally {
      setLoading(false);
    }
  };

  const RADIUS = 70;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const shiftDuration = getShiftDurationSeconds();
  const progress = shiftDuration > 0 ? Math.min(elapsedSeconds / shiftDuration, 1) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const strokeColor = isReadyForNextPunch ? '#3b82f6' : '#22c55e';

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="font-semibold text-lg text-slate-800">
            {format(new Date(), 'dd MMM yyyy')}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Shift: {shiftStartTime} – {shiftEndTime}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{isPunchedIn ? 'Active' : hasAttendanceForToday ? 'Ready' : 'Offline'}</span>
          <span
            className={`w-3 h-3 rounded-full ${
              isPunchedIn
                ? 'bg-green-500 animate-pulse'
                : hasAttendanceForToday
                ? 'bg-blue-500'
                : 'bg-red-400'
            }`}
          />
        </div>
      </div>

      <div className="flex justify-center my-4">
        <div className="relative w-44 h-44">
          <svg width="176" height="176" className="-rotate-90">
            <circle cx="88" cy="88" r={RADIUS} fill="none" stroke="#f3f4f6" strokeWidth="12" />
            <circle
              cx="88"
              cy="88"
              r={RADIUS}
              fill="none"
              stroke={strokeColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-slate-400 mb-0.5">
              {hasAttendanceForToday ? 'Total Time' : 'Not started'}
            </p>
            <h1 className="text-2xl font-bold font-mono text-slate-800 tabular-nums">{roundTimer}</h1>
            {isPunchedIn && (
              <p className="text-xs text-green-600 mt-1 font-semibold animate-pulse">Running...</p>
            )}
            {isReadyForNextPunch && (
              <p className="text-xs text-blue-600 mt-1 font-semibold">Punched out</p>
            )}
            {!hasAttendanceForToday && (
              <p className="text-xs text-slate-400 mt-1">Punch in to begin</p>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mb-5 flex items-center justify-center gap-2 flex-wrap">
        {hasAttendanceForToday ? (
          <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
            {isPunchedIn ? 'Net Hours (running)' : 'Net Hours today'}: {timer}
          </span>
        ) : (
          <span className="bg-slate-50 text-slate-500 px-4 py-1.5 rounded-full text-sm font-medium">
            Punch in to start tracking
          </span>
        )}
        {attendance?.isLate && (
          <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Late
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-center mb-5 p-3 bg-slate-50 rounded-lg">
        <div>
          <p className="text-xs text-slate-500 mb-1">In Time</p>
          <p className="font-semibold text-slate-800">{formatTimeDisplay(attendance?.punchInTime)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Out Time</p>
          <p className="font-semibold text-slate-800">{formatTimeDisplay(attendance?.punchOutTime)}</p>
        </div>
      </div>

      {!isPunchedIn && (
        <button
          onClick={handlePunchIn}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Please wait...' : hasAttendanceForToday ? 'PUNCH IN AGAIN' : 'PUNCH IN'}
        </button>
      )}

      {isPunchedIn && (
        <button
          onClick={handlePunchOut}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Please wait...' : 'PUNCH OUT'}
        </button>
      )}

    </div>
  );
};

export default AttendanceTimerCard;
