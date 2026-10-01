import React, { useState, useEffect } from 'react';
import appointmentService from '../../appointments/appointmentService.js';
import staffService from '../../staff/staffService.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import StatusBadge from '../../../components/common/StatusBadge.jsx';
import LoadingSpinner from '../../../components/common/LoadingSpinner.jsx';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { formatTime12Hour, formatDateYMD } from '../../../../../shared/utils/index.js';

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(formatDateYMD(new Date()));
  const [staffList, setStaffList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hours: 09:00 to 20:00 (11 hours)
  const hours = Array.from({ length: 11 }, (_, i) => 9 + i);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [staffRes, aptRes] = await Promise.all([
          staffService.getAll({ activeOnly: 'true' }),
          appointmentService.getAll({ date: selectedDate, limit: 100 }),
        ]);
        setStaffList(staffRes.data || []);
        setAppointments(aptRes.data || []);
      } catch (err) {
        console.error('Failed to load calendar appointments:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDateYMD(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateYMD(d));
  };

  return (
    <div className="space-y-6">
      {/* Header and Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Salon Schedule Grid</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time daily calendar grid showing stylist allocations and occupied slots
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrevDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-stone-200 bg-white font-bold text-stone-900"
          />

          <Button variant="secondary" size="sm" onClick={handleNextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedDate(formatDateYMD(new Date()))}
          >
            Today
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <LoadingSpinner size="lg" className="text-salon-800 mx-auto mb-3" />
          <p className="text-xs text-stone-500">Loading daily salon appointments schedule...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="py-12 text-center text-xs text-stone-500">
          No active stylists configured. Please add staff members first.
        </div>
      ) : (
        /* Calendar Grid */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header: Stylist columns */}
            <div className="grid grid-cols-[80px_repeat(auto-fit,minmax(180px,1fr))] border-b border-stone-200 bg-stone-50/80">
              <div className="p-3 text-center text-xs font-semibold text-stone-400 border-r border-stone-200">
                Time
              </div>

              {staffList.map((st) => (
                <div
                  key={st._id}
                  className="p-3.5 text-center border-r border-stone-200 last:border-r-0 flex items-center justify-center gap-2.5"
                >
                  <Avatar src={st.avatarUrl} name={st.name} size="sm" />
                  <span className="text-xs font-bold text-stone-900 truncate">{st.name}</span>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="divide-y divide-stone-100">
              {hours.map((hour) => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                const displayTime = formatTime12Hour(hourFormatted);

                return (
                  <div
                    key={hour}
                    className="grid grid-cols-[80px_repeat(auto-fit,minmax(180px,1fr))] min-h-[64px]"
                  >
                    {/* Time slot header */}
                    <div className="p-2.5 text-center text-xs font-semibold text-stone-400 border-r border-stone-100 bg-stone-50/30 flex items-start justify-center">
                      {displayTime}
                    </div>

                    {/* Staff slots */}
                    {staffList.map((st) => {
                      // Find appointment starting around this hour
                      const apt = appointments.find((a) => {
                        const isThisStaff = (a.staff?._id || a.staff) === st._id;
                        if (!isThisStaff) return false;
                        const aptHour = new Date(a.startTime).getHours();
                        return aptHour === hour;
                      });

                      return (
                        <div
                          key={st._id}
                          className="p-1.5 border-r border-stone-100 last:border-r-0 transition-colors hover:bg-stone-50/50 relative"
                        >
                          {apt && (
                            <div className="p-2 rounded-xl bg-salon-50 border border-salon-300 shadow-2xs text-[11px] h-full flex flex-col justify-between">
                              <div>
                                <span className="font-bold text-stone-900 block truncate">
                                  {apt.customer?.name || 'Client'}
                                </span>
                                <span className="text-stone-500 block truncate">
                                  {apt.service?.name}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {formatTime12Hour(apt.startTime)}
                                </span>
                                <span className="text-[9px] font-bold text-salon-800 uppercase">
                                  {apt.status}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
