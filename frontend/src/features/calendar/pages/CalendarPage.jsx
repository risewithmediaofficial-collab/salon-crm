import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import appointmentService from '../../appointments/appointmentService.js';
import staffService from '../../staff/staffService.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import StatusBadge from '../../../components/common/StatusBadge.jsx';
import LoadingSpinner from '../../../components/common/LoadingSpinner.jsx';
import Modal from '../../../components/common/Modal.jsx';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShoppingBag,
  Plus,
  Lock,
  CheckCircle2,
  User,
  Phone,
  Scissors,
  CalendarCheck,
} from 'lucide-react';
import { formatTime12Hour, formatDateYMD, formatCurrency } from '../../../../../shared/utils/index.js';

export function CalendarPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(formatDateYMD(new Date()));
  const [staffList, setStaffList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlotModal, setSelectedSlotModal] = useState(null);

  // Hours: 09:00 to 20:00 (11 hours)
  const hours = Array.from({ length: 11 }, (_, i) => 9 + i);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
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
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [selectedDate]);

  // Real-time live synchronization for calendar grid
  useEffect(() => {
    const triggerSilentSync = () => {
      loadData(true);
    };

    let channel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('salon_appointment_sync');
        channel.onmessage = () => triggerSilentSync();
      }
    } catch (err) {}

    const handleStorageEvent = (e) => {
      if (e.key === 'salon_last_booking_event') triggerSilentSync();
    };
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('new-appointment-notification', triggerSilentSync);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') triggerSilentSync();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', triggerSilentSync);

    const pollTimer = setInterval(() => {
      triggerSilentSync();
    }, 4000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('new-appointment-notification', triggerSilentSync);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', triggerSilentSync);
      clearInterval(pollTimer);
    };
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
                          className="p-1.5 border-r border-stone-100 last:border-r-0 transition-colors relative min-h-[64px]"
                        >
                          {apt ? (
                            <div
                              onClick={() => setSelectedSlotModal({ type: 'APPOINTMENT', appointment: apt, staff: st, time: displayTime })}
                              className="p-2 rounded-xl bg-salon-50/90 border border-salon-300 shadow-2xs text-[11px] h-full flex flex-col justify-between cursor-pointer hover:bg-salon-100 hover:border-salon-500 hover:shadow-xs transition-all"
                            >
                              <div>
                                <span className="font-bold text-stone-900 block truncate">
                                  {apt.customer?.name || 'Client'}
                                </span>
                                <span className="text-stone-500 block truncate">
                                  {apt.service?.name}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] text-stone-500 font-mono">
                                  {formatTime12Hour(apt.startTime)}
                                </span>
                                <span className="text-[9px] font-bold text-salon-800 uppercase px-1.5 py-0.5 rounded bg-salon-200/50">
                                  {apt.status}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedSlotModal({ type: 'AVAILABLE', staff: st, hour, time: displayTime })}
                              className="w-full h-full rounded-xl border border-dashed border-stone-200 hover:border-salon-400 hover:bg-salon-50/40 p-2 flex items-center justify-center text-stone-400 hover:text-salon-800 transition-all group cursor-pointer"
                            >
                              <span className="text-[10px] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-3 h-3 text-salon-700" /> Book / POS
                              </span>
                            </button>
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

      {/* Slot / Appointment Modal */}
      {selectedSlotModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSlotModal(null)}
          title={
            selectedSlotModal.type === 'APPOINTMENT'
              ? 'Booked Appointment Details'
              : 'Slot Management'
          }
          subtitle={
            selectedSlotModal.type === 'APPOINTMENT'
              ? `${selectedSlotModal.staff.name} • ${selectedSlotModal.time}`
              : `${selectedSlotModal.staff.name} • ${selectedSlotModal.time} • ${selectedDate}`
          }
        >
          {selectedSlotModal.type === 'APPOINTMENT' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-salon-50/80 border border-salon-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Client</span>
                  <span className="text-sm font-bold text-stone-900">{selectedSlotModal.appointment.customer?.name || 'Client'}</span>
                </div>
                {selectedSlotModal.appointment.customer?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">Phone</span>
                    <span className="text-xs font-mono font-semibold text-stone-800">{selectedSlotModal.appointment.customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Treatment</span>
                  <span className="text-xs font-bold text-salon-900">{selectedSlotModal.appointment.service?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Status</span>
                  <span className="text-xs font-bold text-salon-800 uppercase px-2 py-0.5 rounded bg-salon-200/60">
                    {selectedSlotModal.appointment.status} (Slot Blocked)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setSelectedSlotModal(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedSlotModal(null);
                    navigate('/admin/appointments');
                  }}
                  icon={CalendarCheck}
                >
                  Manage in Appointments
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block text-sm">Slot is Open & Available</span>
                  <span className="text-emerald-700">
                    This time slot with {selectedSlotModal.staff.name} is currently unreserved. You can create a walk-in POS bill or book an appointment.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  icon={ShoppingBag}
                  onClick={() => {
                    setSelectedSlotModal(null);
                    navigate(`/admin/pos?staffId=${selectedSlotModal.staff._id}`);
                  }}
                >
                  POS Billing Counter
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  icon={CalendarCheck}
                  onClick={() => {
                    setSelectedSlotModal(null);
                    navigate(`/book?staffId=${selectedSlotModal.staff._id}`);
                  }}
                >
                  Book Appointment
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export default CalendarPage;
