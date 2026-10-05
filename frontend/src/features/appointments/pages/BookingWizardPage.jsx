import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../../store/authStore.js';
import useUIStore from '../../../store/uiStore.js';
import serviceService from '../../services/serviceService.js';
import staffService from '../../staff/staffService.js';
import appointmentService from '../appointmentService.js';
import billingService from '../../billing/billingService.js';

import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import Input from '../../../components/common/Input.jsx';
import Textarea from '../../../components/common/Textarea.jsx';
import LoadingSpinner from '../../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';

import {
  Check,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  User,
  Scissors,
  Tag,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Plus,
  Lock,
} from 'lucide-react';
import {
  formatCurrency,
  formatDuration,
  formatTime12Hour,
  formatDateYMD,
} from '../../../../../shared/utils/index.js';

const DRAFT_STORAGE_KEY = 'salon_booking_wizard_draft';

const loadDraftFromStorage = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const clearDraftFromStorage = () => {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {}
};

export function BookingWizardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const openAuthModal = useUIStore((state) => state.openAuthModal);
  const showToast = useUIStore((state) => state.showToast);

  // Restore draft if user was previously booking or authenticating
  const savedDraft = useMemo(() => loadDraftFromStorage(), []);

  // Wizard state: 1 to 6 (defaults to draft step if active)
  const [currentStep, setCurrentStep] = useState(() => {
    if (savedDraft?.currentStep && savedDraft.currentStep >= 1 && savedDraft.currentStep <= 5) {
      return savedDraft.currentStep;
    }
    return 1;
  });

  // Multi-service selection: array of selected services
  const [selectedServices, setSelectedServices] = useState(() => {
    return Array.isArray(savedDraft?.selectedServices) ? savedDraft.selectedServices : [];
  });
  const [selectedStaff, setSelectedStaff] = useState(() => {
    return savedDraft?.selectedStaff || null;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    if (savedDraft?.selectedDate) return savedDraft.selectedDate;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedSlot, setSelectedSlot] = useState(() => {
    return savedDraft?.selectedSlot || null;
  });
  const [notes, setNotes] = useState(() => {
    return savedDraft?.notes || '';
  });
  const [offerCode, setOfferCode] = useState(() => {
    return savedDraft?.offerCode || searchParams.get('offerCode') || '';
  });
  const [validatedOffer, setValidatedOffer] = useState(() => {
    return savedDraft?.validatedOffer || null;
  });
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState('');

  // Data sources
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [slotConflictAlert, setSlotConflictAlert] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [slotLastRefreshed, setSlotLastRefreshed] = useState(null);
  const slotRefreshTimerRef = React.useRef(null);
  const isRefreshingRef = React.useRef(false);

  // Booking completion state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Computed summary of selected services
  const totalSelectedDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  }, [selectedServices]);

  const totalSelectedPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }, [selectedServices]);

  // Persist draft whenever booking progress changes (steps 1 through 5)
  useEffect(() => {
    if (currentStep < 6 && (selectedServices.length > 0 || currentStep > 1)) {
      try {
        sessionStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            currentStep,
            selectedServices,
            selectedStaff,
            selectedDate,
            selectedSlot,
            notes,
            offerCode,
            validatedOffer,
          })
        );
      } catch (e) {}
    }
  }, [currentStep, selectedServices, selectedStaff, selectedDate, selectedSlot, notes, offerCode, validatedOffer]);

  // Reset wizard progress and clear storage
  const handleResetBooking = () => {
    clearDraftFromStorage();
    setCurrentStep(1);
    setSelectedServices([]);
    setSelectedStaff(null);
    setSelectedSlot(null);
    setNotes('');
    setOfferCode('');
    setValidatedOffer(null);
    showToast({
      type: 'info',
      title: 'Booking Cleared',
      message: 'Draft reset. Starting a fresh new booking.',
    });
  };

  // Load initial services & staff with draft reconciliation
  useEffect(() => {
    async function loadInitial() {
      try {
        const [servicesRes, staffRes] = await Promise.all([
          serviceService.getAll({ activeOnly: 'true' }),
          staffService.getAll({ activeOnly: 'true' }),
        ]);

        const allServices = servicesRes.data || [];
        setServices(allServices);
        const allStaff = staffRes.data || [];
        setStaffList(allStaff);

        // Reconcile saved services if draft exists, otherwise check URL param
        if (savedDraft?.selectedServices?.length > 0) {
          const draftIds = new Set(savedDraft.selectedServices.map((s) => s._id));
          const refreshed = allServices.filter((s) => draftIds.has(s._id));
          if (refreshed.length > 0) {
            setSelectedServices(refreshed);
          }
        } else {
          const preServiceId = searchParams.get('serviceId');
          if (preServiceId) {
            const matched = allServices.find((s) => s._id === preServiceId);
            if (matched) setSelectedServices([matched]);
          }
        }

        // Reconcile saved staff if draft exists, otherwise check URL param
        if (savedDraft?.selectedStaff?._id) {
          const refreshedStaff = allStaff.find((st) => st._id === savedDraft.selectedStaff._id);
          if (refreshedStaff) setSelectedStaff(refreshedStaff);
        } else {
          const preStaffId = searchParams.get('staffId');
          if (preStaffId) {
            const matchedStaff = allStaff.find((st) => st._id === preStaffId);
            if (matchedStaff) setSelectedStaff(matchedStaff);
          }
        }
      } catch (err) {
        console.error('Failed to load booking dependencies:', err);
      }
    }
    loadInitial();
  }, [searchParams, savedDraft]);

  // Filter services to only those performed by the selected staff (when staff is chosen)
  const displayedServices = useMemo(() => {
    if (!selectedStaff) return services;
    if (!selectedStaff.services || selectedStaff.services.length === 0) {
      return [];
    }
    const staffServiceIds = new Set(
      selectedStaff.services.map((s) => String(typeof s === 'string' ? s : s?._id))
    );
    return services.filter((svc) => staffServiceIds.has(String(svc._id)));
  }, [selectedStaff, services]);

  // Keep selected services in sync if staff changes and cannot perform some of them
  useEffect(() => {
    if (selectedStaff && selectedServices.length > 0) {
      const staffServiceIds = new Set(
        (selectedStaff.services || []).map((s) => String(typeof s === 'string' ? s : s?._id))
      );
      const stillValid = selectedServices.filter((s) => staffServiceIds.has(String(s._id)));
      if (stillValid.length !== selectedServices.length) {
        setSelectedServices(stillValid);
      }
    }
  }, [selectedStaff]);

  // Toggle service selection (multi-select support)
  const handleToggleService = (svc) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s._id === svc._id);
      if (exists) {
        return prev.filter((s) => s._id !== svc._id);
      } else {
        return [...prev, svc];
      }
    });
  };

  // Clear staff filter
  const handleClearStaff = () => {
    setSelectedStaff(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('staffId');
    navigate(`/book?${newParams.toString()}`, { replace: true });
  };

  // Filter staff who can perform ALL selected services
  const eligibleStaff = useMemo(() => {
    if (selectedServices.length === 0) return staffList;
    return staffList.filter((st) => {
      const staffServiceIds = new Set(
        (st.services || []).map((s) => String(typeof s === 'string' ? s : s?._id))
      );
      return selectedServices.every((svc) => staffServiceIds.has(String(svc._id)));
    });
  }, [selectedServices, staffList]);

  // Load available slots whenever staff, services, or date changes and we are at step 4 or 5
  useEffect(() => {
    if (selectedServices.length > 0 && selectedStaff && selectedDate && (currentStep === 4 || currentStep === 5)) {
      loadSlots(true);
    }
  }, [selectedServices, selectedStaff, selectedDate, currentStep]);

  // Real-time slot refresh while on Step 4 — ticket-booking style: auto-refresh every 8s
  useEffect(() => {
    if (currentStep !== 4 || selectedServices.length === 0 || !selectedStaff || !selectedDate) {
      if (slotRefreshTimerRef.current) clearInterval(slotRefreshTimerRef.current);
      return;
    }

    slotRefreshTimerRef.current = setInterval(async () => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;
      try {
        const serviceIds = selectedServices.map((s) => s._id);
        const res = await appointmentService.getSlots({
          staffId: selectedStaff._id,
          serviceId: serviceIds[0],
          serviceIds: serviceIds.join(','),
          date: selectedDate,
        });
        const freshSlots = res.data?.slots || [];
        const freshBlocked = res.data?.blockedSlots || [];
        setAvailableSlots(freshSlots);
        setBlockedSlots(freshBlocked);
        setSlotLastRefreshed(new Date());
        // If the currently selected slot is no longer available, alert and clear it
        if (selectedSlot) {
          const stillOpen = freshSlots.find((s) => s.startTime === selectedSlot.startTime);
          if (!stillOpen) {
            setSelectedSlot(null);
            setSlotConflictAlert(
              `⚠️ The ${formatTime12Hour(selectedSlot.startTime)} slot was just booked by another client. Please select a new available time below.`
            );
          }
        }
      } catch (_) {}
      isRefreshingRef.current = false;
    }, 8000);

    return () => {
      if (slotRefreshTimerRef.current) clearInterval(slotRefreshTimerRef.current);
    };
  }, [currentStep, selectedServices, selectedStaff, selectedDate, selectedSlot]);

  const loadSlots = async (preserveExistingSlot = false) => {
    if (selectedServices.length === 0 || !selectedStaff || !selectedDate) return;
    setIsLoadingSlots(true);
    setSlotsError('');
    if (!preserveExistingSlot) {
      setSelectedSlot(null);
    }

    try {
      const serviceIds = selectedServices.map((s) => s._id);
      const res = await appointmentService.getSlots({
        staffId: selectedStaff._id,
        serviceId: serviceIds[0],
        serviceIds: serviceIds.join(','),
        date: selectedDate,
      });

      if (!res.data?.available) {
        if (res.data?.reason === 'STAFF_ON_LEAVE') {
          setSlotsError(`${selectedStaff.name} is on leave on this date. Please choose another date or specialist.`);
        } else if (res.data?.reason === 'NOT_WORKING_DAY') {
          setSlotsError(`${selectedStaff.name} does not work on this day of the week. Please select another day.`);
        } else {
          setSlotsError('All slots for this specialist are booked or unavailable for this treatment duration. Please pick another date.');
        }
        setAvailableSlots([]);
        setBlockedSlots(res.data?.blockedSlots || []);
      } else {
        const slots = res.data?.slots || [];
        const blocked = res.data?.blockedSlots || [];
        setAvailableSlots(slots);
        setBlockedSlots(blocked);
        // If a slot was previously selected (e.g. restored from draft), verify it remains valid
        if (preserveExistingSlot && selectedSlot) {
          const match = slots.find((s) => s.startTime === selectedSlot.startTime);
          if (match) {
            setSelectedSlot(match);
          } else {
            setSelectedSlot(null);
            setSlotConflictAlert('Your previously selected time slot is now blocked or occupied by another booking. Please select an available slot below.');
          }
        }
      }
    } catch (err) {
      setSlotsError(err.message || 'Unable to retrieve available slots.');
      setAvailableSlots([]);
      setBlockedSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Validate offer promo code
  const handleApplyOffer = async () => {
    if (!offerCode.trim() || selectedServices.length === 0) return;
    setOfferLoading(true);
    setOfferError('');

    try {
      const primaryId = selectedServices[0]._id;
      const res = await billingService.validateOffer(offerCode.trim(), primaryId);
      setValidatedOffer(res.data);
      showToast({
        type: 'success',
        title: 'Offer Applied!',
        message: `Saved ${formatCurrency(res.data.discountAmount)} with code ${offerCode.toUpperCase()}`,
      });
    } catch (err) {
      setOfferError(err.message || 'Invalid or expired offer code.');
      setValidatedOffer(null);
    } finally {
      setOfferLoading(false);
    }
  };

  // Final booking submission
  const handleConfirmBooking = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedSlot) {
      showToast({
        type: 'error',
        title: 'Incomplete Details',
        message: 'Please complete all booking steps before confirming.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        serviceId: selectedServices[0]._id,
        serviceIds: selectedServices.map((s) => s._id),
        staffId: selectedStaff._id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        notes: notes.trim() || undefined,
        offerCode: validatedOffer?.offer?.code || undefined,
      };

      const res = await appointmentService.create(bookingData);
      setConfirmedBooking(res.data);
      setCurrentStep(6);
      clearDraftFromStorage();
      showToast({
        type: 'success',
        title: 'Booking Confirmed!',
        message: 'Your appointment has been registered and is pending salon review.',
      });
    } catch (err) {
      const isSlotConflict =
        err.code === 'SLOT_UNAVAILABLE' ||
        err.statusCode === 409 ||
        err.message?.toLowerCase().includes('slot') ||
        err.message?.toLowerCase().includes('no longer available');

      if (isSlotConflict) {
        showToast({
          type: 'error',
          title: 'Time Slot Blocked',
          message: 'The selected time slot was just taken by another client. The slot has been blocked. Please choose an open slot.',
        });
        setSlotConflictAlert(
          'The time slot you selected was just booked or blocked by another client. The slot is locked. Please pick an alternative available slot below.'
        );
        setCurrentStep(4);
        setSelectedSlot(null);
        loadSlots();
      } else {
        showToast({
          type: 'error',
          title: 'Booking Failed',
          message: err.message || 'Unable to confirm appointment. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Treatments' },
    { num: 2, title: 'Stylist' },
    { num: 3, title: 'Date' },
    { num: 4, title: 'Time Slot' },
    { num: 5, title: 'Review' },
  ];

  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 ${currentStep === 1 && selectedServices.length > 0 ? 'pb-28 sm:pb-32' : ''}`}>
      {/* Wizard Progress Indicator (Steps 1 to 5) */}
      {currentStep < 6 && (
        <div className="mb-10 sm:mb-12">
          <div className="flex items-center justify-between">
            {stepsList.map((st, idx) => {
              const isPassed = currentStep > st.num;
              const isCurrent = currentStep === st.num;

              return (
                <React.Fragment key={st.num}>
                  <button
                    type="button"
                    onClick={() => isPassed && setCurrentStep(st.num)}
                    disabled={!isPassed}
                    className={`flex flex-col items-center group transition-all ${
                      isPassed ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-sans font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-xs group-hover:scale-105'
                          : isCurrent
                          ? 'bg-salon-800 text-white ring-4 ring-salon-100 shadow-sm'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : st.num}
                    </div>
                    <span
                      className={`text-[11px] font-sans font-medium mt-1.5 hidden sm:block ${
                        isCurrent
                          ? 'text-salon-900 font-bold'
                          : isPassed
                          ? 'text-stone-700 font-semibold group-hover:text-stone-900'
                          : 'text-stone-400'
                      }`}
                    >
                      {st.title}
                    </span>
                  </button>

                  {idx < stepsList.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all ${
                        currentStep > st.num ? 'bg-emerald-600' : 'bg-stone-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 1: Select Service(s) */}
      {currentStep === 1 && (
        <div>
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider text-salon-800 bg-salon-100/80 border border-salon-300 mb-2 shadow-2xs">
              Step 1 of 5
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
              {selectedStaff ? `Choose Treatments with ${selectedStaff.name.split(' ')[0]}` : 'Choose Your Treatments'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
              Select one or multiple services you wish to book in this visit
            </p>
          </div>

          {/* Selected Stylist Callout Banner */}
          {selectedStaff && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-salon-50/90 via-amber-50/40 to-stone-50 border border-salon-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <Avatar src={selectedStaff.avatarUrl} name={selectedStaff.name} size="md" className="ring-2 ring-salon-300" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900">
                      Booking with {selectedStaff.name}
                    </span>
                    <Badge variant="salon" className="text-[10px]">Stylist Selected</Badge>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Showing only {displayedServices.length} {displayedServices.length === 1 ? 'treatment' : 'treatments'} provided by {selectedStaff.name.split(' ')[0]}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearStaff}
                className="text-xs font-semibold text-salon-800 hover:text-salon-950 underline self-start sm:self-center px-2 py-1 rounded hover:bg-white/60 transition-colors cursor-pointer"
              >
                Clear stylist / View all services &rarr;
              </button>
            </div>
          )}

          {/* Top Quick Status Bar when treatments are selected */}
          {selectedServices.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-salon-50/90 border border-salon-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-salon-800 text-white flex items-center justify-center font-bold text-xs font-sans shrink-0">
                  {selectedServices.length}
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 block font-sans">
                    {selectedServices.length} {selectedServices.length === 1 ? 'Treatment' : 'Treatments'} Selected
                  </span>
                  <span className="text-xs text-stone-600 font-sans">
                    Total: <strong className="text-stone-900 font-bold tabular-nums">{formatCurrency(totalSelectedPrice)}</strong> &bull; {formatDuration(totalSelectedDuration)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep(selectedStaff ? 3 : 2)}
                icon={ChevronRight}
                className="self-start sm:self-center shadow-xs"
              >
                Continue to {selectedStaff ? 'Date Selection' : 'Stylist Selection'}
              </Button>
            </div>
          )}

          {displayedServices.length === 0 ? (
            <div className="text-center py-12 p-6 bg-white rounded-2xl border border-stone-200 shadow-soft">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="text-base font-display font-bold text-stone-900 mb-1">
                No treatments found for {selectedStaff?.name || 'this stylist'}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-5">
                There are no active treatments assigned to this specialist at this moment. You can browse all treatments available at our salon.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearStaff}
              >
                Browse All Salon Services
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {displayedServices.map((svc) => {
                const isSelected = selectedServices.some((s) => s._id === svc._id);
                return (
                  <div
                    key={svc._id}
                    onClick={() => handleToggleService(svc)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? 'border-salon-800 bg-salon-50/70 ring-2 ring-salon-800/20 shadow-md'
                        : 'border-stone-200 bg-white hover:border-salon-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant={isSelected ? 'salon' : 'stone'}>{svc.category}</Badge>
                        <span className="text-xs font-sans text-stone-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {formatDuration(svc.duration)}
                        </span>
                      </div>

                      <h4 className="text-base font-display font-bold text-stone-900 mb-1">{svc.name}</h4>
                      <p className="text-xs text-stone-500 line-clamp-2 mb-4">{svc.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <span className="text-base sm:text-lg font-sans font-bold text-stone-900 tabular-nums">
                        {formatCurrency(svc.price)}
                      </span>
                      <span
                        className={`text-xs font-sans font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-salon-800 text-white shadow-xs'
                            : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Selected
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Select
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Action Button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="md"
              disabled={selectedServices.length === 0}
              onClick={() => {
                if (selectedStaff) {
                  setCurrentStep(3);
                } else {
                  setCurrentStep(2);
                }
              }}
              icon={ChevronRight}
              className="shadow-sm"
            >
              {selectedStaff
                ? `Continue with ${selectedStaff.name.split(' ')[0]} to Date`
                : `Continue to Stylist Selection (${selectedServices.length})`}
            </Button>
          </div>

          {/* Sticky Bottom Action Bar — Always accessible without having to search or scroll */}
          {selectedServices.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200/90 shadow-2xl py-3.5 px-4 sm:px-8 animate-in slide-in-from-bottom duration-300">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-salon-800 text-white flex items-center justify-center font-bold text-sm font-sans shrink-0 shadow-sm">
                    {selectedServices.length}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-stone-900 font-sans truncate">
                      {selectedServices.length} {selectedServices.length === 1 ? 'Treatment' : 'Treatments'} Selected
                    </p>
                    <p className="text-[11px] text-stone-500 font-sans truncate">
                      {formatDuration(totalSelectedDuration)} &bull;{' '}
                      <strong className="font-bold text-stone-900 tabular-nums">
                        {formatCurrency(totalSelectedPrice)}
                      </strong>
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (selectedStaff) {
                      setCurrentStep(3);
                    } else {
                      setCurrentStep(2);
                    }
                  }}
                  icon={ChevronRight}
                  className="shrink-0 shadow-md py-2.5 px-5 text-sm"
                >
                  Continue to {selectedStaff ? 'Date' : 'Stylist'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Select Staff */}
      {currentStep === 2 && (
        <div>
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider text-salon-800 bg-salon-100/80 border border-salon-300 mb-2 shadow-2xs">
              Step 2 of 5
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
              Select Preferred Stylist
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
              Choose an available specialist who performs your selected treatments
            </p>
          </div>

          {/* Selected Services Quick Capsule List */}
          <div className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-stone-700">Selected:</span>
              {selectedServices.map((s) => (
                <span
                  key={s._id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-800 font-medium"
                >
                  {s.name}
                  <span className="text-[11px] text-stone-400">({formatDuration(s.duration)})</span>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-salon-700 hover:text-salon-950 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Modify treatments
            </button>
          </div>

          {eligibleStaff.length === 0 ? (
            <div className="p-8 rounded-2xl bg-amber-50/80 border border-amber-200 text-center max-w-lg mx-auto mb-8 shadow-xs">
              <AlertCircle className="w-9 h-9 text-amber-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-amber-950 mb-1">No Matching Specialist Found</h4>
              <p className="text-xs text-amber-800 leading-relaxed mb-5">
                None of our stylists perform all {selectedServices.length} selected treatments together in a single session. Please adjust your treatment selection or book them as separate appointments.
              </p>
              <Button variant="primary" size="sm" onClick={() => setCurrentStep(1)}>
                Change Selected Treatments
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {eligibleStaff.map((staff) => {
                const isSelected = selectedStaff?._id === staff._id;
                return (
                  <div
                    key={staff._id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? 'border-salon-800 bg-salon-50/70 ring-2 ring-salon-800/20 shadow-md'
                        : 'border-stone-200 bg-white hover:border-salon-300 shadow-2xs'
                    }`}
                  >
                    <Avatar src={staff.avatarUrl} name={staff.name} size="lg" />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-display font-bold text-stone-900 mb-0.5 truncate">
                        {staff.name}
                      </h4>
                      <p className="text-xs text-stone-500 line-clamp-2 mb-2">{staff.bio}</p>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-sans font-semibold px-2.5 py-1 rounded-lg ${
                          isSelected ? 'bg-salon-800 text-white shadow-xs' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3 h-3" />
                            Selected
                          </>
                        ) : (
                          'Choose Specialist'
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!selectedStaff || eligibleStaff.length === 0}
              onClick={() => setCurrentStep(3)}
              icon={ChevronRight}
            >
              Continue to Date Selection
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Select Date */}
      {currentStep === 3 && (
        <div>
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider text-salon-800 bg-salon-100/80 border border-salon-300 mb-2 shadow-2xs">
              Step 3 of 5
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
              Select Appointment Date
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 mt-1.5 flex-wrap">
              <span>Booking with <strong className="text-stone-800 font-bold">{selectedStaff?.name}</strong></span>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-salon-700 underline font-semibold hover:text-salon-950 cursor-pointer"
              >
                (change stylist)
              </button>
              <span>for <strong className="text-stone-800 font-bold">{selectedServices.length} {selectedServices.length === 1 ? 'treatment' : 'treatments'}</strong></span>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-salon-700 underline font-semibold hover:text-salon-950 cursor-pointer"
              >
                (change services)
              </button>
            </div>
          </div>

          <Card className="max-w-md mx-auto p-6 mb-8 text-center shadow-soft">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 font-sans">
              Select Booking Date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={formatDateYMD(new Date())}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-center text-base font-sans font-semibold py-3 px-4 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-salon-600 bg-stone-50"
            />
            <p className="text-xs text-stone-500 mt-3 font-sans">
              Salon operational hours: Mon–Sat 09:00 AM – 08:00 PM (Closed Sundays)
            </p>
          </Card>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (searchParams.get('staffId')) {
                  setCurrentStep(1);
                } else {
                  setCurrentStep(2);
                }
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!selectedDate}
              onClick={() => setCurrentStep(4)}
              icon={ChevronRight}
            >
              View Available Slots
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Select Time Slot */}
      {currentStep === 4 && (
        <div>
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider text-salon-800 bg-salon-100/80 border border-salon-300 mb-2 shadow-2xs">
              Step 4 of 5
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
              Select Time Slot
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5 font-sans">
              Date: <span className="font-semibold text-stone-800">{selectedDate}</span> &bull; Specialist:{' '}
              <span className="font-semibold text-stone-800">{selectedStaff?.name}</span> &bull; Total Session:{' '}
              <span className="font-semibold text-stone-800">{formatDuration(totalSelectedDuration)}</span>
            </p>
          </div>

          {/* Slot Conflict Alert */}
          {slotConflictAlert && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold block text-rose-900">Slot Blocked / Reserved</span>
                  <span className="text-rose-700">{slotConflictAlert}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSlotConflictAlert('')}
                className="text-rose-400 hover:text-rose-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isLoadingSlots ? (
            <div className="py-16 text-center">
              <LoadingSpinner size="lg" className="text-salon-800 mx-auto mb-3" />
              <p className="text-xs text-stone-500 font-sans">Checking live stylist schedule & salon availability...</p>
            </div>
          ) : slotsError ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center max-w-md mx-auto mb-8 shadow-xs">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-amber-900 mb-1">Slot Unavailable</h4>
              <p className="text-xs text-amber-700 mb-4">{slotsError}</p>
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep(3)}>
                Choose Another Date
              </Button>
            </div>
          ) : availableSlots.length === 0 && blockedSlots.length === 0 ? (
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center max-w-md mx-auto mb-8 shadow-xs">
              <Clock className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-800 mb-1">No Available Slots Today</h4>
              <p className="text-xs text-stone-500 mb-4 font-sans">
                All slots for this specialist are booked or unavailable for the required {formatDuration(totalSelectedDuration)}. Please choose another date.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep(3)}>
                Change Date
              </Button>
            </div>
          ) : (
            <div className="mb-8">
              {/* Availability & Blocking Status Bar — Ticket-booking style */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {availableSlots.length} Open {availableSlots.length === 1 ? 'Slot' : 'Slots'}
                  </span>
                  {blockedSlots.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <Lock className="w-3 h-3 text-rose-400" />
                      {blockedSlots.length} Already Booked
                    </span>
                  )}
                </div>
                {slotLastRefreshed && (
                  <span className="text-[10px] text-stone-400 font-sans flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live · Updated {slotLastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Slots Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setSlotConflictAlert('');
                      }}
                      className={`py-3 px-2 rounded-xl text-center transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-salon-800 text-white font-bold shadow-md scale-105 ring-2 ring-salon-700/20'
                          : 'bg-white text-stone-800 border border-stone-200 hover:border-salon-400 hover:bg-salon-50/40 text-xs font-semibold'
                      }`}
                    >
                      <span className="block text-xs font-sans font-bold tabular-nums">
                        {formatTime12Hour(slot.startTime)}
                      </span>
                      <span
                        className={`text-[9px] font-semibold block mt-0.5 uppercase tracking-wider ${
                          isSelected ? 'text-amber-200' : 'text-emerald-600'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Open'}
                      </span>
                    </button>
                  );
                })}

                {/* Blocked Slots — always shown, ticket-booking style */}
                {blockedSlots.map((slot) => (
                  <div
                    key={`blocked-${slot.startTime}`}
                    className="py-3 px-2 rounded-xl text-center bg-rose-50/60 border border-rose-200/70 text-rose-400 cursor-not-allowed select-none relative overflow-hidden"
                    title="This time slot is already reserved by another client"
                  >
                    <span className="block text-xs font-sans font-semibold tabular-nums text-rose-400 line-through">
                      {formatTime12Hour(slot.startTime)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-400 uppercase mt-0.5">
                      <Lock className="w-2.5 h-2.5" /> Booked
                    </span>
                  </div>
                ))}
              </div>

              {/* Selected Slot Confirmation Badge */}
              {selectedSlot && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-900 block text-sm">
                        Slot Available: {formatTime12Hour(selectedSlot.startTime)} – {formatTime12Hour(selectedSlot.endTime)}
                      </span>
                      <span className="text-emerald-700 text-xs">
                        This slot is currently open and will be locked exclusively for you upon confirmation.
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-200/70 text-emerald-800 self-start sm:self-auto">
                    Verified Open
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <Button variant="secondary" onClick={() => setCurrentStep(3)}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!selectedSlot}
              onClick={() => setCurrentStep(5)}
              icon={ChevronRight}
            >
              Continue to Review
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Review Booking & Apply Promo */}
      {currentStep === 5 && (
        <div>
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider text-salon-800 bg-salon-100/80 border border-salon-300 mb-2 shadow-2xs">
              Step 5 of 5
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
              Review & Confirm
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
              Please verify all booking details before final confirmation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Booking Details Card */}
            <Card className="md:col-span-2 p-6 space-y-5">
              <h4 className="text-base font-display font-bold text-stone-900 border-b border-stone-100 pb-3">
                Appointment Summary
              </h4>

              {/* Slot Availability & Auto-Lock Status */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">
                      Time Slot Verified Open: {formatTime12Hour(selectedSlot?.startTime)} – {formatTime12Hour(selectedSlot?.endTime)}
                    </span>
                    <span className="text-emerald-700 text-[11px]">
                      This slot is currently available and will be immediately locked & blocked upon confirmation.
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 shrink-0">
                  <Lock className="w-3 h-3 text-emerald-700" /> Auto-Lock
                </span>
              </div>

              {/* Multi-services list */}
              <div>
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  Selected Treatments ({selectedServices.length})
                </span>
                <div className="divide-y divide-stone-100 rounded-xl border border-stone-100 bg-stone-50/50 p-2 space-y-1">
                  {selectedServices.map((svc) => (
                    <div key={svc._id} className="p-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900 block">{svc.name}</span>
                        <span className="text-[11px] text-stone-500">{formatDuration(svc.duration)}</span>
                      </div>
                      <span className="font-sans font-bold text-stone-900 tabular-nums">
                        {formatCurrency(svc.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <span className="text-stone-400 block font-medium">Specialist</span>
                  <span className="font-bold text-stone-900 text-sm">{selectedStaff?.name}</span>
                </div>

                <div>
                  <span className="text-stone-400 block font-medium">Date</span>
                  <span className="font-bold text-stone-900">{selectedDate}</span>
                </div>

                <div>
                  <span className="text-stone-400 block font-medium">Time Window</span>
                  <span className="font-sans font-bold text-stone-900 tabular-nums">
                    {formatTime12Hour(selectedSlot?.startTime)} – {formatTime12Hour(selectedSlot?.endTime)}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block font-medium">Total Duration</span>
                  <span className="font-sans font-bold text-stone-900">
                    {formatDuration(totalSelectedDuration)}
                  </span>
                </div>
              </div>

              {/* Special instructions / notes */}
              <div className="pt-3 border-t border-stone-100">
                <Textarea
                  label="Special requests or notes for your stylist (optional)"
                  placeholder="e.g. Sensitive scalp, prefer subtle blowdry, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Promo code application */}
              <div className="pt-3 border-t border-stone-100">
                <label className="block text-xs font-sans font-medium text-stone-700 mb-1.5">
                  Have a Promo Code?
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. WELCOME20"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    containerClassName="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleApplyOffer}
                    isLoading={offerLoading}
                    disabled={!offerCode.trim()}
                  >
                    Apply
                  </Button>
                </div>
                {offerError && <p className="text-xs text-rose-600 mt-1 font-medium">{offerError}</p>}
                {validatedOffer && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1 font-sans">
                    <Check className="w-3.5 h-3.5" />
                    Promo code applied: -{formatCurrency(validatedOffer.discountAmount)}
                  </p>
                )}
              </div>
            </Card>

            {/* Price Breakdown Card */}
            <Card className="p-6 flex flex-col justify-between bg-stone-50/50">
              <div>
                <h4 className="text-base font-display font-bold text-stone-900 border-b border-stone-200/80 pb-3 mb-4">
                  Billing Breakdown
                </h4>

                <div className="space-y-2.5 text-xs text-stone-600 mb-4 font-sans">
                  <div className="flex justify-between">
                    <span>Treatments Subtotal</span>
                    <span className="font-bold text-stone-900 tabular-nums">{formatCurrency(totalSelectedPrice)}</span>
                  </div>

                  {validatedOffer && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount ({validatedOffer.offer?.code})</span>
                      <span className="font-bold tabular-nums">-{formatCurrency(validatedOffer.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-500">
                    <span>Estimated GST (18%)</span>
                    <span className="tabular-nums">
                      {formatCurrency(
                        Math.round(((totalSelectedPrice - (validatedOffer?.discountAmount || 0)) * 0.18) * 100) / 100
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline mb-2">
                  <span className="font-bold text-stone-900 text-sm">Estimated Total</span>
                  <span className="font-sans font-bold text-stone-900 text-2xl tabular-nums">
                    {formatCurrency(
                      validatedOffer
                        ? validatedOffer.finalPrice
                        : Math.round(totalSelectedPrice * 1.18 * 100) / 100
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-sans">
                  Payment is collected at the salon after your services via Cash, UPI, or Card.
                </p>
              </div>

              <div className="pt-6">
                {!user ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs">
                      <p className="font-bold text-[12px] mb-0.5">Quick Sign In Required</p>
                      <p className="text-[11px] text-amber-700 leading-relaxed font-sans">
                        Sign in with your mobile number to confirm this booking. All your selected treatments and appointment details are saved and will remain selected!
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full shadow-md"
                      onClick={() => openAuthModal('login')}
                    >
                      Sign In to Confirm Booking
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-[12px]">{user.name || 'Valued Client'}</p>
                          <p className="text-[11px] text-emerald-700 font-mono">+{user.phone}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans">
                        Ready to Book
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full shadow-md"
                      isLoading={isSubmitting}
                      onClick={handleConfirmBooking}
                      icon={Check}
                    >
                      Confirm & Submit Booking
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => setCurrentStep(4)}>
              Back
            </Button>
            <button
              type="button"
              onClick={handleResetBooking}
              className="text-xs text-stone-400 hover:text-rose-600 underline cursor-pointer transition-colors font-medium"
            >
              Start Over / Clear Selections
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Confirmation Receipt */}
      {currentStep === 6 && confirmedBooking && (
        <Card className="max-w-xl mx-auto p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-sans">
            Booking Received
          </span>

          <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mt-3 mb-2">
            Appointment Booked Successfully!
          </h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto mb-6 font-sans">
            Your booking request has been registered and is in <span className="font-semibold text-amber-700">PENDING</span> status. Our salon reception will confirm it shortly and send you an SMS notification.
          </p>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2.5 mb-8 font-sans">
            <div className="flex justify-between">
              <span className="text-stone-400">Appointment ID</span>
              <span className="font-mono font-bold text-stone-900">#{confirmedBooking._id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Treatments</span>
              <span className="font-semibold text-stone-900 text-right">
                {selectedServices.map((s) => s.name).join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Specialist</span>
              <span className="font-semibold text-stone-900">{selectedStaff?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Date & Time</span>
              <span className="font-semibold text-stone-900 tabular-nums">
                {selectedDate} at {formatTime12Hour(selectedSlot?.startTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Total Duration</span>
              <span className="font-semibold text-stone-900">
                {formatDuration(totalSelectedDuration)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Estimated Total</span>
              <span className="font-bold text-stone-900 tabular-nums">
                {formatCurrency(confirmedBooking.billingSnapshot?.totalAmount || totalSelectedPrice * 1.18)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-stone-200">
              <span className="text-stone-400">Status</span>
              <span className="font-bold text-amber-600 uppercase">PENDING SALON CONFIRMATION</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/my-appointments" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full">
                View My Appointments
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full">
                Return Home
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

export default BookingWizardPage;
