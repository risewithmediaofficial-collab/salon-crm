import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal.jsx';
import Button from '../../../components/common/Button.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import Textarea from '../../../components/common/Textarea.jsx';
import LoadingSpinner from '../../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import staffService from '../staffService.js';
import useAuthStore from '../../../store/authStore.js';
import useUIStore from '../../../store/uiStore.js';
import {
  Star,
  Sparkles,
  Award,
  CheckCircle2,
  Calendar,
  MessageSquarePlus,
  Scissors,
} from 'lucide-react';

export function StaffReviewsModal({ staff, isOpen, onClose, onReviewAdded }) {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const openAuthModal = useUIStore((state) => state.openAuthModal);
  const showToast = useUIStore((state) => state.showToast);

  const [reviewsData, setReviewsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Write Review form state
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = async () => {
    if (!staff?._id) return;
    setIsLoading(true);
    try {
      const res = await staffService.getReviews(staff._id);
      setReviewsData(res.data);
    } catch (err) {
      console.error('Failed to load staff reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && staff?._id) {
      loadReviews();
      setIsWritingReview(false);
      setReviewRating(5);
      setReviewComment('');
    }
  }, [isOpen, staff?._id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!reviewComment.trim()) {
      showToast({
        type: 'error',
        title: 'Review Required',
        message: 'Please write a brief comment about your experience.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await staffService.submitReview(staff._id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      showToast({
        type: 'success',
        title: 'Review Published',
        message: `Thank you! Your feedback for ${staff.name} is now live.`,
      });

      setIsWritingReview(false);
      setReviewComment('');
      setReviewRating(5);
      await loadReviews();
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Unable to save review. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !staff) return null;

  const averageRating = reviewsData?.averageRating || staff.rating || 5.0;
  const totalReviews = reviewsData?.totalReviews || reviewsData?.reviews?.length || staff.reviewCount || 0;
  const breakdown = reviewsData?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const reviews = reviewsData?.reviews || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Client Reviews • ${staff.name}`}
      subtitle="Verified feedback and testimonials from salon appointments"
      size="lg"
    >
      <div className="space-y-6">
        {/* Stylist Profile Capsule */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-50 via-amber-50/30 to-stone-50 border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar src={staff.avatarUrl} name={staff.name} size="lg" className="ring-2 ring-salon-700/20" />
            <div>
              <h3 className="text-base font-display font-bold text-stone-900 flex items-center gap-2">
                {staff.name}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Specialist
                </span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{staff.bio || 'Master Salon Artist'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-2xl font-bold font-display text-stone-900">{averageRating.toFixed(1)}</span>
                <div className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(averageRating) ? 'fill-amber-400 text-amber-500' : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                {totalReviews} verified {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {!isWritingReview && (
              <Button
                variant="primary"
                size="sm"
                icon={MessageSquarePlus}
                onClick={() => {
                  if (!user) {
                    openAuthModal('login');
                  } else {
                    setIsWritingReview(true);
                  }
                }}
                className="shadow-sm"
              >
                Write Review
              </Button>
            )}
          </div>
        </div>

        {/* Rating Breakdown Bar Graph */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 px-2 text-xs">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = breakdown[stars] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="w-4 font-bold text-stone-700 text-right">{stars}★</span>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-400 w-5">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Write Review Form (Collapsible) */}
        {isWritingReview && (
          <form
            onSubmit={handleSubmitReview}
            className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-xs animate-in fade-in duration-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Share Your Experience with {staff.name}
              </h4>
              <button
                type="button"
                onClick={() => setIsWritingReview(false)}
                className="text-xs text-stone-400 hover:text-stone-700 underline"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Your Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewRating
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-stone-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-900 ml-2">
                  {reviewRating === 5 && '🌟 Exceptional / Masterclass'}
                  {reviewRating === 4 && '✨ Great & Professional'}
                  {reviewRating === 3 && '👍 Satisfactory'}
                  {reviewRating <= 2 && 'Needs improvement'}
                </span>
              </div>
            </div>

            <div>
              <Textarea
                label="Your Feedback & Comments"
                placeholder={`What made your service with ${staff.name} special? (e.g. attention to detail, styling advice, great haircut)`}
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsWritingReview(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                Publish Review
              </Button>
            </div>
          </form>
        )}

        {/* Reviews Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Verified Client Feedback ({totalReviews})
            </h4>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">
              <LoadingSpinner size="md" className="mx-auto text-salon-800 mb-2" />
              <p className="text-xs text-stone-400">Loading verified testimonials...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center bg-stone-50 rounded-2xl border border-stone-200">
              <Star className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-stone-700">No reviews yet for {staff.name}</p>
              <p className="text-[11px] text-stone-400 mt-1 max-w-sm mx-auto">
                Be the first to share your experience and pampering visit with this specialist!
              </p>
              {!isWritingReview && (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    if (!user) openAuthModal('login');
                    else setIsWritingReview(true);
                  }}
                >
                  Be the first to review
                </Button>
              )}
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
              {reviews.map((rev, idx) => (
                <div
                  key={rev.appointmentId || idx}
                  className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs hover:border-amber-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-salon-800 to-amber-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {rev.customerName ? rev.customerName[0].toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900">{rev.customerName}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                            Verified Client
                          </span>
                        </div>
                        {rev.serviceName && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                            <Scissors className="w-3 h-3 text-salon-600" />
                            <span>{rev.serviceName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-500' : 'text-stone-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        {rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString() : 'Recent Visit'}
                      </span>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-stone-700 leading-relaxed italic bg-stone-50/80 p-3 rounded-lg border border-stone-100/80">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default StaffReviewsModal;
