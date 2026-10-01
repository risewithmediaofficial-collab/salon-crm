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
} from 'lucide-react';
import {
  formatCurrency,
  formatDuration,
  formatTime12Hour,
  formatDateYMD,
} from '../../../../../shared/utils/index.js';

export function BookingWizardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const openAuthModal = useUIStore((state) => state.openAuthModal);
  const showToast = useUIStore((state) => state.showToast);

  // Wizard state: 1 to 6
  const [currentStep, setCurrentStep] = useState(1);

  // Selections
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [offerCode, setOfferCode] = useState(searchParams.get('offerCode') || '');
  const [validatedOffer, setValidatedOffer] = useState(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState('');

  // Data sources
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  // Booking completion state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Load initial services & staff
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

        // Preselect service if passed in URL
        const preServiceId = searchParams.get('serviceId');
        if (preServiceId) {
          const matched = allServices.find((s) => s._id === preServiceId);
          if (matched) setSelectedService(matched);
        }

        // Preselect staff if passed in URL
        const preStaffId = searchParams.get('staffId');
        if (preStaffId) {
          const matchedStaff = allStaff.find((st) => st._id === preStaffId);
          if (matchedStaff) setSelectedStaff(matchedStaff);
        }
      } catch (err) {
        console.error('Failed to load booking dependencies:', err);
      }
    }
    loadInitial();
  }, [searchParams]);

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

  // Keep selected service in sync if staff changes and cannot perform it
  useEffect(() => {
    if (selectedStaff && selectedService) {
      const staffServiceIds = new Set(
        (selectedStaff.services || []).map((s) => String(typeof s === 'string' ? s : s?._id))
      );
      if (!staffServiceIds.has(String(selectedService._id))) {
        setSelectedService(null);
      }
    }
  }, [selectedStaff, selectedService]);

  // Clear staff filter
  const handleClearStaff = () => {
    setSelectedStaff(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('staffId');
    navigate(`/book?${newParams.toString()}`, { replace: true });
  };

  // Filter staff who can perform the selected service
  const eligibleStaff = useMemo(() => {
    if (!selectedService) return staffList;
    return staffList.filter((st) =>
      st.services?.some((s) => String(typeof s === 'string' ? s : s?._id) === String(selectedService._id))
    );
  }, [selectedService, staffList]);

  // Load available slots whenever staff, service, or date changes and we are at step 4
  useEffect(() => {
    if (selectedService && selectedStaff && selectedDate && currentStep === 4) {
      loadSlots();
    }
  }, [selectedService, selectedStaff, selectedDate, currentStep]);

  const loadSlots = async () => {
    setIsLoadingSlots(true);
    setSlotsError('');
    setSelectedSlot(null);

    try {
      const res = await appointmentService.getSlots({
        staffId: selectedStaff._id,
        serviceId: selectedService._id,
        date: selectedDate,
      });

      if (!res.data?.available) {
        if (res.data?.reason === 'STAFF_ON_LEAVE') {
          setSlotsError(`${selectedStaff.name} is on leave on this date. Please choose another date or stylist.`);
        } else if (res.data?.reason === 'NOT_WORKING_DAY') {
          setSlotsError(`${selectedStaff.name} does not work on this day of the week. Please select another day.`);
        } else {
          setSlotsError('No available time slots for this date. Please pick another date.');
        }
        setAvailableSlots([]);
      } else {
        setAvailableSlots(res.data.slots || []);
      }
    } catch (err) {
      setSlotsError(err.message || 'Unable to retrieve available slots.');
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Validate offer promo code
  const handleApplyOffer = async () => {
    if (!offerCode.trim() || !selectedService) return;
    setOfferLoading(true);
    setOfferError('');

    try {
      const res = await billingService.validateOffer(offerCode.trim(), selectedService._id);
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

    setIsSubmitting(true);
    try {
      const bookingData = {
        serviceId: selectedService._id,
        staffId: selectedStaff._id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        notes: notes.trim() || undefined,
        offerCode: validatedOffer?.offer?.code || undefined,
      };

      const res = await appointmentService.create(bookingData);
      setConfirmedBooking(res.data);
      setCurrentStep(6);
      showToast({
        type: 'success',
        title: 'Booking Confirmed!',
        message: 'Your appointment has been registered and is pending salon review.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Booking Failed',
        message: err.message || 'The selected slot was just reserved by someone else. Please pick another slot.',
      });
      // Return to slot step if slot unavailable
      if (err.code === 'SLOT_UNAVAILABLE') {
        setCurrentStep(4);
        loadSlots();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Service' },
    { num: 2, title: 'Stylist' },
    { num: 3, title: 'Date' },
    { num: 4, title: 'Time Slot' },
    { num: 5, title: 'Review' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Wizard Progress Indicator (Steps 1 to 5) */}
      {currentStep < 6 && (
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {stepsList.map((st, idx) => {
              const isPassed = currentStep > st.num;
              const isCurrent = currentStep === st.num;

              return (
                <React.Fragment key={st.num}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-salon-800 text-white ring-4 ring-salon-100 shadow-sm'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : st.num}
                    </div>
                    <span
                      className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                        isCurrent ? 'text-salon-900 font-bold' : 'text-stone-500'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>

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

      {/* STEP 1: Select Service */}
      {currentStep === 1 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              {selectedStaff ? `Step 1: Choose Your Treatment with ${selectedStaff.name.split(' ')[0]}` : 'Step 1: Choose Your Treatment'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {selectedStaff
                ? `Showing exclusive treatments offered by ${selectedStaff.name}`
                : 'Select the service you wish to book'}
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

          {displayedServices.length === 0 ? (
            <div className="text-center py-12 p-6 bg-white rounded-2xl border border-stone-200 shadow-soft">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-bold text-stone-900 mb-1">
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
                const isSelected = selectedService?._id === svc._id;
                return (
                  <div
                    key={svc._id}
                    onClick={() => setSelectedService(svc)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-salon-800 bg-salon-50/50 ring-2 ring-salon-800/10 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-salon-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="stone">{svc.category}</Badge>
                        <span className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {formatDuration(svc.duration)}
                        </span>
                      </div>

                      <h4 className="text-base font-serif font-bold text-stone-900 mb-1">{svc.name}</h4>
                      <p className="text-xs text-stone-500 line-clamp-2 mb-4">{svc.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <span className="text-base font-serif font-bold text-stone-900">
                        {formatCurrency(svc.price)}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          isSelected ? 'bg-salon-800 text-white' : 'text-stone-600 bg-stone-100'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              disabled={!selectedService}
              onClick={() => {
                if (selectedStaff) {
                  setCurrentStep(3);
                } else {
                  setCurrentStep(2);
                }
              }}
              icon={ChevronRight}
            >
              {selectedStaff
                ? `Continue with ${selectedStaff.name.split(' ')[0]} to Date`
                : 'Continue to Stylist Selection'}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Staff */}
      {currentStep === 2 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900">Step 2: Select Preferred Stylist</h2>
            <p className="text-xs text-stone-500 mt-1">
              Choose an available specialist for <span className="font-semibold text-stone-800">{selectedService?.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {eligibleStaff.map((staff) => {
              const isSelected = selectedStaff?._id === staff._id;
              return (
                <div
                  key={staff._id}
                  onClick={() => setSelectedStaff(staff)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                    isSelected
                      ? 'border-salon-800 bg-salon-50/50 ring-2 ring-salon-800/10 shadow-sm'
                      : 'border-stone-200 bg-white hover:border-salon-300 shadow-2xs'
                  }`}
                >
                  <Avatar src={staff.avatarUrl} name={staff.name} size="lg" />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-serif font-bold text-stone-900 mb-0.5 truncate">
                      {staff.name}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-2 mb-2">{staff.bio}</p>
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-salon-800 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Choose Specialist'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!selectedStaff}
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
            <h2 className="text-2xl font-serif font-bold text-stone-900">Step 3: Select Appointment Date</h2>
            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 mt-1 flex-wrap">
              <span>Booking with <strong className="text-stone-800">{selectedStaff?.name}</strong></span>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-salon-700 underline font-semibold hover:text-salon-950 cursor-pointer"
              >
                (change stylist)
              </button>
              <span>for <strong className="text-stone-800">{selectedService?.name}</strong></span>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-salon-700 underline font-semibold hover:text-salon-950 cursor-pointer"
              >
                (change service)
              </button>
            </div>
          </div>

          <Card className="max-w-md mx-auto p-6 mb-8 text-center">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Select Booking Date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={formatDateYMD(new Date())}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-center text-base font-semibold py-3 px-4 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-salon-600 bg-stone-50"
            />
            <p className="text-xs text-stone-500 mt-3">
              Salon operational hours: Mon–Sat 09:00 AM – 08:00 PM (Closed Sundays)
            </p>
          </Card>

          <div className="flex items-center justify-between">
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
            <h2 className="text-2xl font-serif font-bold text-stone-900">Step 4: Select Time Slot</h2>
            <p className="text-xs text-stone-500 mt-1">
              Date: <span className="font-semibold text-stone-800">{selectedDate}</span> &bull; Specialist:{' '}
              <span className="font-semibold text-stone-800">{selectedStaff?.name}</span> &bull; Duration:{' '}
              <span className="font-semibold text-stone-800">{selectedService?.duration} mins</span>
            </p>
          </div>

          {isLoadingSlots ? (
            <div className="py-16 text-center">
              <LoadingSpinner size="lg" className="text-salon-800 mx-auto mb-3" />
              <p className="text-xs text-stone-500">Checking live stylist schedule & salon availability...</p>
            </div>
          ) : slotsError ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center max-w-md mx-auto mb-8">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-amber-900 mb-1">Slot Unavailable</h4>
              <p className="text-xs text-amber-700 mb-4">{slotsError}</p>
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep(3)}>
                Choose Another Date
              </Button>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center max-w-md mx-auto mb-8">
              <Clock className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-800 mb-1">No Available Slots Today</h4>
              <p className="text-xs text-stone-500 mb-4">
                All slots for this specialist are booked or unavailable. Please choose another date.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setCurrentStep(3)}>
                Change Date
              </Button>
            </div>
          ) : (
            <div className="mb-8">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-2 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-salon-800 text-white font-bold shadow-md scale-105 ring-2 ring-salon-700/20'
                          : 'bg-white text-stone-800 border border-stone-200 hover:border-salon-400 hover:bg-salon-50/40 text-xs font-semibold'
                      }`}
                    >
                      <span className="block text-xs">{formatTime12Hour(slot.startTime)}</span>
                    </button>
                  );
                })}
              </div>
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
            <h2 className="text-2xl font-serif font-bold text-stone-900">Step 5: Review & Confirm</h2>
            <p className="text-xs text-stone-500 mt-1">Please verify all booking details before final confirmation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Booking Details Card */}
            <Card className="md:col-span-2 p-6 space-y-4">
              <h4 className="text-base font-serif font-bold text-stone-900 border-b border-stone-100 pb-3">
                Appointment Summary
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 block font-medium">Service</span>
                  <span className="font-bold text-stone-900 text-sm">{selectedService?.name}</span>
                  <span className="text-stone-500 block">Duration: {selectedService?.duration} mins</span>
                </div>

                <div>
                  <span className="text-stone-400 block font-medium">Specialist</span>
                  <span className="font-bold text-stone-900 text-sm">{selectedStaff?.name}</span>
                </div>

                <div>
                  <span className="text-stone-400 block font-medium">Date</span>
                  <span className="font-bold text-stone-900">{selectedDate}</span>
                </div>

                <div>
                  <span className="text-stone-400 block font-medium">Time Slot</span>
                  <span className="font-bold text-stone-900">
                    {formatTime12Hour(selectedSlot?.startTime)} – {formatTime12Hour(selectedSlot?.endTime)}
                  </span>
                </div>
              </div>

              {/* Special instructions / notes */}
              <div className="pt-3 border-t border-stone-100">
                <Textarea
                  label="Special requests or notes for your stylist (optional)"
                  placeholder="e.g. Sensitive skin, prefer subtle blowdry, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Promo code application */}
              <div className="pt-3 border-t border-stone-100">
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
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
                  <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Promo code applied: -{formatCurrency(validatedOffer.discountAmount)}
                  </p>
                )}
              </div>
            </Card>

            {/* Price Breakdown Card */}
            <Card className="p-6 flex flex-col justify-between bg-stone-50/50">
              <div>
                <h4 className="text-base font-serif font-bold text-stone-900 border-b border-stone-200/80 pb-3 mb-4">
                  Billing Breakdown
                </h4>

                <div className="space-y-2.5 text-xs text-stone-600 mb-4">
                  <div className="flex justify-between">
                    <span>Service Price</span>
                    <span className="font-semibold text-stone-900">{formatCurrency(selectedService?.price)}</span>
                  </div>

                  {validatedOffer && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount ({validatedOffer.offer?.code})</span>
                      <span>-{formatCurrency(validatedOffer.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-500">
                    <span>Estimated GST (18%)</span>
                    <span>
                      {formatCurrency(
                        Math.round(((selectedService?.price - (validatedOffer?.discountAmount || 0)) * 0.18) * 100) / 100
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline mb-2">
                  <span className="font-bold text-stone-900 text-sm">Estimated Total</span>
                  <span className="font-serif font-bold text-stone-900 text-xl">
                    {formatCurrency(
                      validatedOffer
                        ? validatedOffer.finalPrice
                        : Math.round(selectedService?.price * 1.18 * 100) / 100
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400">
                  Payment is collected at the salon after your service via Cash, UPI, or Card.
                </p>
              </div>

              <div className="pt-6">
                {!user ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => openAuthModal('login')}
                  >
                    Sign In to Confirm Booking
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    isLoading={isSubmitting}
                    onClick={handleConfirmBooking}
                    icon={Check}
                  >
                    Confirm & Submit Booking
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => setCurrentStep(4)}>
              Back
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: Confirmation Receipt */}
      {currentStep === 6 && confirmedBooking && (
        <Card className="max-w-xl mx-auto p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Booking Received
          </span>

          <h2 className="text-2xl font-serif font-bold text-stone-900 mt-3 mb-2">
            Appointment Booked Successfully!
          </h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto mb-6">
            Your booking request has been registered and is in <span className="font-semibold text-amber-700">PENDING</span> status. Our salon reception will confirm it shortly and send you an SMS notification.
          </p>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2 mb-8">
            <div className="flex justify-between">
              <span className="text-stone-400">Appointment ID</span>
              <span className="font-mono font-bold text-stone-900">#{confirmedBooking._id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Treatment</span>
              <span className="font-semibold text-stone-900">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Specialist</span>
              <span className="font-semibold text-stone-900">{selectedStaff?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Date & Time</span>
              <span className="font-semibold text-stone-900">
                {selectedDate} at {formatTime12Hour(selectedSlot?.startTime)}
              </span>
            </div>
            <div className="flex justify-between">
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
