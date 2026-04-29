import React, { useState, useEffect } from 'react';
import { holidayApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { Gift, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const HOLIDAYS_2026 = [
  { id: 1, title: 'Republic Day', date: '2026-01-26', description: 'National Holiday' },
  { id: 2, title: 'Maha Shivaratri', date: '2026-03-08', description: 'Festival' },
  { id: 3, title: 'Holi', date: '2026-03-28', description: 'Festival' },
  { id: 4, title: 'Good Friday', date: '2026-04-03', description: 'National Holiday' },
  { id: 5, title: 'Eid ul-Fitr', date: '2026-04-14', description: 'Festival' },
  { id: 6, title: 'Ambedkar Jayanti', date: '2026-04-14', description: 'National Holiday' },
  { id: 7, title: 'Ram Navami', date: '2026-04-15', description: 'Festival' },
  { id: 8, title: 'Mahavir Jayanti', date: '2026-04-21', description: 'Festival' },
  { id: 9, title: 'Labour Day', date: '2026-05-01', description: 'National Holiday' },
  { id: 10, title: 'Buddha Purnima', date: '2026-05-15', description: 'Festival' },
  { id: 11, title: 'Eid ul-Adha', date: '2026-08-10', description: 'Festival' },
  { id: 12, title: 'Independence Day', date: '2026-08-15', description: 'National Holiday' },
  { id: 13, title: 'Janmashtami', date: '2026-08-16', description: 'Festival' },
  { id: 14, title: 'Ganesh Chaturthi', date: '2026-08-28', description: 'Festival' },
  { id: 15, title: 'Mahatma Gandhi Jayanti', date: '2026-10-02', description: 'National Holiday' },
  { id: 16, title: 'Dussehra', date: '2026-10-21', description: 'Festival' },
  { id: 17, title: 'Diwali', date: '2026-10-24', description: 'Festival' },
  { id: 18, title: 'Guru Nanak Jayanti', date: '2026-11-14', description: 'Festival' },
  { id: 19, title: 'Christmas', date: '2026-12-25', description: 'National Holiday' },
];

const Holidays: React.FC = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const response = await holidayApi.getAll(2026);
      if (response.data.success) {
        const apiHolidays = response.data.data.holidays;
        if (apiHolidays && apiHolidays.length > 0) {
          setHolidays(apiHolidays);
        } else {
          setHolidays(HOLIDAYS_2026);
        }
      } else {
        setHolidays(HOLIDAYS_2026);
      }
    } catch {
      setHolidays(HOLIDAYS_2026);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const upcomingHolidays = holidays.filter((h) => new Date(h.date) >= new Date());
  const pastHolidays = holidays.filter((h) => new Date(h.date) < new Date());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Holidays</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingHolidays.length > 0 ? (
            <div className="space-y-3">
              {upcomingHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100"
                >
                  <div className="w-14 h-14 bg-yellow-100 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-yellow-700">
                      {format(new Date(holiday.date), 'd')}
                    </span>
                    <span className="text-xs text-yellow-600">
                      {format(new Date(holiday.date), 'MMM')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{holiday.title}</p>
                    <p className="text-sm text-gray-500">{holiday.description}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {format(new Date(holiday.date), 'EEEE, yyyy')}
                    </p>
                  </div>
                  <Gift className="w-8 h-8 text-yellow-500" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="w-12 h-12 text-gray-300" />}
              title="No upcoming holidays"
              description="There are no holidays scheduled"
            />
          )}
        </CardContent>
      </Card>

      {pastHolidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg opacity-60"
                >
                  <div className="w-14 h-14 bg-gray-200 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-gray-600">
                      {format(new Date(holiday.date), 'd')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(holiday.date), 'MMM')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-600">{holiday.title}</p>
                    <p className="text-sm text-gray-400">
                      {format(new Date(holiday.date), 'EEEE, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Holidays;
