import React, { useState, useEffect, useMemo, useRef } from 'react';
import appointmentService from '../appointmentService.js';
import useNotificationStore from '../../../store/notificationStore.js';
import useUIStore from '../../../store/uiStore.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import StatusBadge from '../../../components/common/StatusBadge.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import Drawer from '../../../components/common/Drawer.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import Pagination from '../../../components/common/Pagination.jsx';
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle,
  XCircle,
  Play,
  CheckCheck,
  UserCheck,
  Ban,
  Filter,
  Sparkles,
  Bell,
} from 'lucide-react';
import {
  formatCurrency,
  formatTime12Hour,
  formatDateYMD,
} from '../../../../../shared/utils/index.js';
import { VALID_TRANSITIONS, APPOINTMENT_STATUS } from '../../../../../shared/constants/index.js';

export function AdminAppointmentsPage() {
  const showToast = useUIStore((state) => state.showToast);

  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(formatDateYMD(new Date()));
  const [isLoading, setIsLoading] = useState(true);

  // Detail drawer
  const [activeAppointment, setActiveAppointment] = useState(null);

  // Status change action
  const [actionConfirm, setActionConfirm] = useState(null); // { appointmentId, newStatus, title, message }
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // Live new appointment arrival alert banner
  const [liveBanner, setLiveBanner] = useState(null);
  const knownAptIdsRef = useRef(new Set());

  // Auto-clear notification badges when admin visits this page
  useEffect(() => {
    useNotificationStore.getState().markAllRead();
  }, []);

  const loadAppointments = async (page = 1, options = {}) => {
    const isSilent = Boolean(options.silent);
    if (!isSilent) setIsLoading(true);
    try {
      const params = { page, limit: 15 };
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (dateFilter) params.date = dateFilter;

      const res = await appointmentService.getAll(params);
      const incoming = res.data || [];

      // Detect new appointments arriving in real-time
      if (knownAptIdsRef.current.size > 0 && incoming.length > 0) {
        const newlyArrived = incoming.filter((apt) => !knownAptIdsRef.current.has(apt._id));
        if (newlyArrived.length > 0) {
          const latest = newlyArrived[0];
          setLiveBanner({
            title: '✨ New Online Appointment Received!',
            message: `${latest.customer?.name || 'A customer'} booked ${latest.service?.name || 'service'} with ${latest.staff?.name || 'stylist'}.`,
            appointmentId: latest._id,
          });

          showToast({
            type: 'info',
            title: '🔔 New Appointment Received',
            message: `${latest.customer?.name || 'A customer'} booked ${latest.service?.name || 'service'}. List updated live.`,
            duration: 8000,
          });
        }
      }

      incoming.forEach((apt) => knownAptIdsRef.current.add(apt._id));
      setAppointments(incoming);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments(1);
  }, [selectedStatus, dateFilter]);

  // Real-time live synchronization: BroadcastChannel, storage event, window event, visibility change, and 4s silent background polling
  useEffect(() => {
    const triggerSilentSync = () => {
      loadAppointments(pagination.page || 1, { silent: true });
    };

    // 1. Cross-tab BroadcastChannel
    let channel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('salon_appointment_sync');
        channel.onmessage = () => {
          triggerSilentSync();
        };
      }
    } catch (err) {}

    // 2. Storage event fallback for cross-tab sync
    const handleStorageEvent = (e) => {
      if (e.key === 'salon_last_booking_event') {
        triggerSilentSync();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 3. Tab visibility change & window focus (instant sync when admin returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerSilentSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', triggerSilentSync);

    // 4. Background polling every 30 seconds only when tab is visible
    const pollTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      triggerSilentSync();
    }, 30000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', triggerSilentSync);
      clearInterval(pollTimer);
    };
  }, [selectedStatus, dateFilter, pagination.page]);

  const handleStatusTransition = async () => {
    if (!actionConfirm) return;
    setIsUpdatingStatus(true);

    try {
      await appointmentService.updateStatus(actionConfirm.appointmentId, {
        status: actionConfirm.newStatus,
      });

      showToast({
        type: 'success',
        title: 'Status Updated',
        message: `Appointment is now marked as ${actionConfirm.newStatus}`,
      });

      setActionConfirm(null);
      if (activeAppointment && activeAppointment._id === actionConfirm.appointmentId) {
        setActiveAppointment((prev) => ({ ...prev, status: actionConfirm.newStatus }));
      }
      useNotificationStore.getState().markAllRead();
      loadAppointments(pagination.page);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Unable to update status',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const statusTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'ARRIVED', label: 'Arrived' },
    { id: 'IN_SERVICE', label: 'In Service' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Live New Appointment Alert Banner */}
      {liveBanner && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-amber-950">{liveBanner.title}</p>
              <p className="text-xs text-amber-800">{liveBanner.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setLiveBanner(null);
              useNotificationStore.getState().markAllRead();
            }}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors shrink-0"
          >
            Acknowledge
          </button>
        </div>
      )}
      {/* Page Title & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">
            Appointments Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Process incoming bookings, track client arrivals, and update service progress
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDateFilter(formatDateYMD(new Date()))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              dateFilter === formatDateYMD(new Date())
                ? 'bg-salon-800 text-white border-salon-800'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => {
              const tmrw = new Date();
              tmrw.setDate(tmrw.getDate() + 1);
              setDateFilter(formatDateYMD(tmrw));
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              dateFilter === formatDateYMD(new Date(Date.now() + 86400000))
                ? 'bg-salon-800 text-white border-salon-800'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            Tomorrow
          </button>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-salon-600"
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-stone-400 hover:text-stone-700 underline"
            >
              All Dates
            </button>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === tab.id
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live New Appointment Arrival Alert */}
      {liveBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-salon-500/10 border border-amber-300 shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-amber-950 flex items-center gap-2">
                <span>{liveBanner.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-800 uppercase tracking-wider">
                  Live Sync
                </span>
              </h4>
              <p className="text-xs text-amber-800 truncate mt-0.5">
                {liveBanner.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLiveBanner(null)}
            className="text-amber-700 hover:text-amber-950 p-1.5 rounded-lg hover:bg-amber-100 transition-colors shrink-0 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Appointments List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-stone-200">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description="There are no appointments matching this status and date filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
          <div className="divide-y divide-stone-100">
            {appointments.map((apt) => {
              const allowedNext = VALID_TRANSITIONS[apt.status] || [];

              return (
                <div
                  key={apt._id}
                  className="p-5 hover:bg-stone-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Time & Customer */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-stone-900">
                        {formatTime12Hour(apt.startTime).split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">
                        {formatTime12Hour(apt.startTime).split(' ')[1]}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-stone-900 truncate">
                          {apt.customer?.name || 'Guest Customer'}
                        </h4>
                        <span className="text-xs text-stone-400 font-mono">
                          +{apt.customer?.phone}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-600">
                        <span className="font-semibold text-salon-800">
                          {[apt.service?.name, ...(apt.additionalServices || []).map((s) => s.name)].filter(Boolean).join(' + ')}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 text-stone-500">
                          <User className="w-3.5 h-3.5" />
                          {apt.staff?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Status Badge */}
                  <div className="flex items-center gap-3">
                    <StatusBadge status={apt.status} />
                  </div>

                  {/* Right: State Transition Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* PENDING -> ACCEPT */}
                    {allowedNext.includes(APPOINTMENT_STATUS.ACCEPTED) && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1.5"
                        onClick={() =>
                          setActionConfirm({
                            appointmentId: apt._id,
                            newStatus: APPOINTMENT_STATUS.ACCEPTED,
                            title: 'Accept Booking Request',
                            message: `Accept appointment for ${apt.customer?.name} at ${formatTime12Hour(apt.startTime)}?`,
                            variant: 'primary',
                          })
                        }
                      >
                        Accept
                      </Button>
                    )}

                    {/* ACCEPTED / CONFIRMED -> ARRIVED */}
                    {allowedNext.includes(APPOINTMENT_STATUS.ARRIVED) && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1.5"
                        icon={UserCheck}
                        onClick={() =>
                          setActionConfirm({
                            appointmentId: apt._id,
                            newStatus: APPOINTMENT_STATUS.ARRIVED,
                            title: 'Mark Client Arrived',
                            message: `Mark that ${apt.customer?.name} has arrived at the salon?`,
                            variant: 'primary',
                          })
                        }
                      >
                        Client Arrived
                      </Button>
                    )}

                    {/* ARRIVED -> IN_SERVICE */}
                    {allowedNext.includes(APPOINTMENT_STATUS.IN_SERVICE) && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700 text-xs px-3 py-1.5"
                        icon={Play}
                        onClick={() =>
                          setActionConfirm({
                            appointmentId: apt._id,
                            newStatus: APPOINTMENT_STATUS.IN_SERVICE,
                            title: 'Start Service',
                            message: `Mark that ${apt.staff?.name} has begun service on ${apt.customer?.name}?`,
                            variant: 'primary',
                          })
                        }
                      >
                        Start Service
                      </Button>
                    )}

                    {/* IN_SERVICE -> COMPLETED */}
                    {allowedNext.includes(APPOINTMENT_STATUS.COMPLETED) && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs px-3 py-1.5"
                        icon={CheckCheck}
                        onClick={() =>
                          setActionConfirm({
                            appointmentId: apt._id,
                            newStatus: APPOINTMENT_STATUS.COMPLETED,
                            title: 'Complete Appointment',
                            message: `Mark appointment for ${apt.customer?.name} as completed?`,
                            variant: 'primary',
                          })
                        }
                      >
                        Complete
                      </Button>
                    )}

                    {/* CANCEL */}
                    {allowedNext.includes(APPOINTMENT_STATUS.CANCELLED) && (
                      <button
                        type="button"
                        onClick={() =>
                          setActionConfirm({
                            appointmentId: apt._id,
                            newStatus: APPOINTMENT_STATUS.CANCELLED,
                            title: 'Cancel Appointment',
                            message: `Are you sure you want to cancel booking #${apt._id.slice(-6)}?`,
                            variant: 'danger',
                          })
                        }
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Cancel"
                        aria-label="Cancel appointment"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}

                    {/* View Details Drawer */}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs px-2.5 py-1.5"
                      onClick={() => setActiveAppointment(apt)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(p) => loadAppointments(p)}
          />
        </div>
      )}

      {/* Appointment Details Drawer */}
      <Drawer
        isOpen={Boolean(activeAppointment)}
        onClose={() => setActiveAppointment(null)}
        title="Appointment Overview"
        subtitle={`Reference #${activeAppointment?._id?.slice(-8).toUpperCase()}`}
      >
        {activeAppointment && (
          <div className="space-y-6 text-xs">
            {/* Customer Box */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Client Information
              </span>
              <div className="flex items-center gap-3">
                <Avatar name={activeAppointment.customer?.name} size="md" />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    {activeAppointment.customer?.name || 'Walk-in Client'}
                  </h4>
                  <p className="text-stone-500 font-mono">+{activeAppointment.customer?.phone}</p>
                </div>
              </div>
            </div>

            {/* Service & Specialist */}
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-400 font-medium">Treatment</span>
                <span className="font-bold text-stone-900 text-right max-w-[220px]">
                  {[activeAppointment.service?.name, ...(activeAppointment.additionalServices || []).map((s) => s.name)].filter(Boolean).join(' + ')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-400 font-medium">Specialist</span>
                <span className="font-bold text-stone-900">{activeAppointment.staff?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-400 font-medium">Date</span>
                <span className="font-bold text-stone-900">
                  {new Date(activeAppointment.appointmentDate).toDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-400 font-medium">Time Window</span>
                <span className="font-bold text-stone-900">
                  {formatTime12Hour(activeAppointment.startTime)} – {formatTime12Hour(activeAppointment.endTime)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-400 font-medium">Status</span>
                <StatusBadge status={activeAppointment.status} />
              </div>
            </div>

            {/* Special Notes */}
            {activeAppointment.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800 block mb-1">
                  Customer Requests
                </span>
                <p className="text-stone-700 leading-relaxed">{activeAppointment.notes}</p>
              </div>
            )}

            {/* Review If Completed */}
            {activeAppointment.review?.rating && (
              <div className="p-3.5 rounded-xl bg-gold-50/60 border border-gold-200">
                <span className="text-[10px] font-bold uppercase text-gold-800 block mb-1">
                  Customer Review ({activeAppointment.review.rating}/5)
                </span>
                <p className="text-stone-700 italic">"{activeAppointment.review.comment}"</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(actionConfirm)}
        onClose={() => setActionConfirm(null)}
        onConfirm={handleStatusTransition}
        title={actionConfirm?.title}
        message={actionConfirm?.message}
        confirmLabel="Proceed"
        variant={actionConfirm?.variant || 'primary'}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
}

export default AdminAppointmentsPage;
