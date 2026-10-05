import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../../store/authStore.js';
import useUIStore from '../../../store/uiStore.js';
import appointmentService from '../appointmentService.js';

import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import StatusBadge from '../../../components/common/StatusBadge.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Textarea from '../../../components/common/Textarea.jsx';
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx';

import {
  Calendar,
  Clock,
  Sparkles,
  Scissors,
  Star,
  AlertCircle,
  Receipt,
  RotateCw,
} from 'lucide-react';
import { formatCurrency, formatTime12Hour, formatDuration } from '../../../../../shared/utils/index.js';

export function MyAppointmentsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cancellation state
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Review modal state
  const [reviewingAppointment, setReviewingAppointment] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadAppointments = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await appointmentService.getAll();
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Failed to load customer appointments:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments(true);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadAppointments();

    // Live cross-tab and real-time synchronization
    let channel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('salon_appointment_sync');
        channel.onmessage = () => loadAppointments(true);
      }
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === 'salon_last_booking_event') loadAppointments(true);
    };
    window.addEventListener('storage', handleStorage);

    // Auto-poll every 4 seconds so status transitions (e.g. Accepted) reflect live
    const interval = setInterval(() => {
      loadAppointments(true);
    }, 4000);

    // Also auto-refresh when customer switches back to this browser tab
    const handleFocus = () => loadAppointments(true);
    window.addEventListener('focus', handleFocus);

    // Also re-fetch immediately if a real-time status update notification arrives
    const handleNotification = () => loadAppointments(true);
    window.addEventListener('new-appointment-notification', handleNotification);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('new-appointment-notification', handleNotification);
    };
  }, [user, navigate]);

  const handleConfirmCancel = async () => {
    if (!cancellingAppointment) return;
    setIsCancelling(true);

    try {
      await appointmentService.cancel(cancellingAppointment._id, {
        reason: cancelReason.trim() || 'Customer requested cancellation',
      });
      showToast({
        type: 'success',
        title: 'Appointment Cancelled',
        message: 'Your booking has been cancelled.',
      });
      setCancellingAppointment(null);
      setCancelReason('');
      loadAppointments();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Cancellation Failed',
        message: err.message || 'Unable to cancel appointment.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewingAppointment) return;
    setIsSubmittingReview(true);

    try {
      await appointmentService.submitReview(reviewingAppointment._id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      showToast({
        type: 'success',
        title: 'Thank You!',
        message: 'Your review has been submitted successfully.',
      });
      setReviewingAppointment(null);
      setReviewComment('');
      setReviewRating(5);
      loadAppointments();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Review Submission Failed',
        message: err.message || 'Unable to submit review.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const canCancel = (status) =>
    ['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-stone-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track your past and upcoming luxury grooming visits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCw}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="text-xs font-semibold text-stone-700 bg-white border-stone-200 hover:bg-stone-50"
          >
            Refresh
          </Button>

          <Link to="/book">
            <Button variant="primary" size="sm" icon={Calendar}>
              Book New Treatment
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-stone-200 shadow-soft">
              <div className="flex justify-between mb-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments booked yet"
          description="You haven't scheduled any treatments with us yet. Book your first session today!"
          actionLabel="Book Appointment"
          onAction={() => navigate('/book')}
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const isCompleted = apt.status === 'COMPLETED';
            const hasReview = Boolean(apt.review?.rating);

            return (
              <Card key={apt._id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-lg font-display font-bold text-stone-900">
                        {apt.service?.name}
                      </h3>
                      <StatusBadge status={apt.status} />
                    </div>
                    <p className="text-xs text-stone-500">
                      Booking Ref: <span className="font-mono font-semibold">#{apt._id.slice(-8).toUpperCase()}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start">
                    {canCancel(apt.status) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={() => setCancellingAppointment(apt)}
                      >
                        Cancel Booking
                      </Button>
                    )}

                    {isCompleted && !hasReview && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Star}
                        onClick={() => setReviewingAppointment(apt)}
                      >
                        Write Review
                      </Button>
                    )}

                    {hasReview && (
                      <div className="flex items-center gap-1 text-xs text-gold-600 font-semibold px-3 py-1.5 rounded-lg bg-gold-50 border border-gold-200">
                        <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                        <span>Rated {apt.review.rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                  <div>
                    <span className="text-stone-400 block font-medium">Stylist</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar src={apt.staff?.avatarUrl} name={apt.staff?.name} size="sm" />
                      <span className="font-bold text-stone-900">{apt.staff?.name}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Date</span>
                    <span className="font-bold text-stone-900 mt-1 block">
                      {new Date(apt.appointmentDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Time</span>
                    <span className="font-bold text-stone-900 mt-1 block">
                      {formatTime12Hour(apt.startTime)}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Amount</span>
                    <span className="font-sans font-bold text-stone-900 mt-1 block tabular-nums">
                      {apt.billingSnapshot?.totalAmount
                        ? formatCurrency(apt.billingSnapshot.totalAmount)
                        : apt.service?.price
                        ? formatCurrency(apt.service.price)
                        : '—'}
                    </span>
                  </div>
                </div>

                {apt.notes && (
                  <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700">Special requests: </span>
                    {apt.notes}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancellingAppointment)}
        onClose={() => setCancellingAppointment(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel your appointment for ${cancellingAppointment?.service?.name}? You can reschedule later.`}
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Appointment"
        isLoading={isCancelling}
      />

      {/* Review Modal */}
      <Modal
        isOpen={Boolean(reviewingAppointment)}
        onClose={() => setReviewingAppointment(null)}
        title="Rate Your Experience"
        subtitle={`How was your service with ${reviewingAppointment?.staff?.name}?`}
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <div className="text-center">
            <span className="text-xs text-stone-500 block mb-2 font-medium">Overall Rating</span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1 text-stone-300 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= reviewRating
                        ? 'fill-gold-400 text-gold-400'
                        : 'text-stone-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Your Feedback / Comment (Optional)"
            placeholder="Share details of your experience, styling results, or stylist appreciation..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReviewingAppointment(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitReview}
              isLoading={isSubmittingReview}
            >
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MyAppointmentsPage;
