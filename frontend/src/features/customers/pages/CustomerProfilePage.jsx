import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../../store/authStore.js';
import useUIStore from '../../../store/uiStore.js';
import customerService from '../customerService.js';
import appointmentService from '../../appointments/appointmentService.js';
import Card from '../../../components/common/Card.jsx';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Button from '../../../components/common/Button.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import StatusBadge from '../../../components/common/StatusBadge.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  Receipt,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RotateCw,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Check,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import {
  formatCurrency,
  formatTime12Hour,
  formatDuration,
  formatDateYMD,
} from '../../../../../shared/utils/index.js';

export function CustomerProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const showToast = useUIStore((state) => state.showToast);

  // Active sub-navigation tab: 'profile' | 'orders'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'orders' ? 'orders' : 'profile');

  // Profile edit form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState(user?.gender || 'PREFER_NOT_TO_SAY');
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Orders / Bookings history state
  const [appointments, setAppointments] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Cancel order state
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Sync tab with URL param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'orders' && activeTab !== 'orders') {
      setActiveTab('orders');
    } else if (tabParam === 'profile' && activeTab !== 'profile') {
      setActiveTab('profile');
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Load customer profile data
  useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true);
      try {
        const res = await customerService.getProfile();
        setProfileData(res.data);
        if (res.data?.name) setName(res.data.name);
        if (res.data?.email) setEmail(res.data.email);
        if (res.data?.gender) setGender(res.data.gender);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  // Load previous orders / appointments
  const loadOrders = async (silent = false) => {
    if (!silent) setIsLoadingOrders(true);
    try {
      const res = await appointmentService.getAll();
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      if (!silent) setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders(false);

    // Live cross-tab and real-time sync for order status updates
    let channel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('salon_appointment_sync');
        channel.onmessage = () => loadOrders(true);
      }
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === 'salon_last_booking_event') loadOrders(true);
    };
    // Background polling every 45 seconds only when tab is visible
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      loadOrders(true);
    }, 45000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, []);

  // Save personal information
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await customerService.update('profile', {
        name,
        email,
        gender,
      });

      updateUser(res.data);
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal details have been saved successfully.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Unable to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel order action
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setIsCancelling(true);

    try {
      await appointmentService.cancel(cancellingOrder._id, {
        reason: cancelReason.trim() || 'Customer requested cancellation',
      });
      showToast({
        type: 'success',
        title: 'Order Cancelled',
        message: 'Your appointment request has been cancelled.',
      });
      setCancellingOrder(null);
      setCancelReason('');
      if (selectedOrder && selectedOrder._id === cancellingOrder._id) {
        setSelectedOrder((prev) => ({ ...prev, status: 'CANCELLED' }));
      }
      loadOrders(true);
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

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'ALL') return appointments;
    if (orderStatusFilter === 'ACTIVE') {
      return appointments.filter((a) =>
        ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'RESCHEDULED'].includes(a.status)
      );
    }
    if (orderStatusFilter === 'COMPLETED') {
      return appointments.filter((a) => a.status === 'COMPLETED');
    }
    if (orderStatusFilter === 'CANCELLED') {
      return appointments.filter((a) => a.status === 'CANCELLED');
    }
    return appointments;
  }, [appointments, orderStatusFilter]);

  // Aggregate metrics
  const activeOrdersCount = useMemo(() => {
    return appointments.filter((a) =>
      ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'RESCHEDULED'].includes(a.status)
    ).length;
  }, [appointments]);

  const completedVisitsCount = useMemo(() => {
    return appointments.filter((a) => a.status === 'COMPLETED').length;
  }, [appointments]);

  const totalSpent = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + (Number(a.billingSnapshot?.totalAmount) || 0), 0);
  }, [appointments]);

  // Helper to get all service names for an order
  const getOrderServices = (order) => {
    const list = [];
    if (order?.service) list.push(order.service);
    if (Array.isArray(order?.additionalServices)) {
      list.push(...order.additionalServices);
    }
    return list;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-stone-900 tracking-tight">
            Account & Profile
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage your personal profile, review previous orders, invoices, and visit history
          </p>
        </div>

        <Link to="/book">
          <Button variant="primary" size="sm" icon={Calendar} className="shadow-md shadow-salon-900/10">
            Book New Appointment
          </Button>
        </Link>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-100/90 border border-stone-200/80 mb-8 max-w-md backdrop-blur-xs">
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200/60'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal Details</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200/60'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Previous Orders</span>
          {appointments.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                activeTab === 'orders' ? 'bg-salon-900 text-white' : 'bg-stone-200 text-stone-700'
              }`}
            >
              {appointments.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Profile Overview Card */}
        <Card className="p-6 text-center flex flex-col items-center h-fit shadow-soft">
          <Avatar name={user?.name || user?.phone} size="xl" className="mb-3 ring-4 ring-salon-100" />
          <h3 className="text-base font-display font-bold text-stone-900">{user?.name || 'Valued Client'}</h3>
          <p className="text-xs text-stone-500 font-mono mt-0.5">+91 {user?.phone}</p>

          <div className="w-full mt-6 pt-6 border-t border-stone-100 text-left space-y-3.5 text-xs">
            {/* Total Orders link */}
            <div
              onClick={() => handleTabChange('orders')}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer group"
            >
              <span className="text-stone-500 flex items-center gap-2 font-medium">
                <Receipt className="w-3.5 h-3.5 text-salon-800" />
                Total Orders
              </span>
              <span className="font-bold text-stone-900 group-hover:text-salon-800 transition-colors flex items-center gap-1">
                {appointments.length}
                <ChevronRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            {/* Completed visits */}
            <div className="flex items-center justify-between px-2">
              <span className="text-stone-500 flex items-center gap-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Completed Visits
              </span>
              <span className="font-bold text-stone-900">{completedVisitsCount || profileData?.totalVisits || 0}</span>
            </div>

            {/* Total Spend if any */}
            {totalSpent > 0 && (
              <div className="flex items-center justify-between px-2">
                <span className="text-stone-500 flex items-center gap-2 font-medium">
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
                  Total Spend
                </span>
                <span className="font-bold text-stone-900 tabular-nums">{formatCurrency(totalSpent)}</span>
              </div>
            )}

            {/* Member Status */}
            <div className="flex items-center justify-between px-2 pt-1 border-t border-stone-100">
              <span className="text-stone-500 flex items-center gap-2 font-medium">
                <Award className="w-3.5 h-3.5 text-gold-500" />
                Member Status
              </span>
              <span className="font-bold text-salon-800 text-[11px] bg-salon-50 px-2 py-0.5 rounded-full border border-salon-200">
                Privilege Patron
              </span>
            </div>
          </div>

          <div className="w-full mt-6 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => handleTabChange('orders')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-salon-900 text-white border-salon-900 shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Previous Orders ({appointments.length})</span>
            </button>
          </div>
        </Card>

        {/* Right Content Area: TAB 1 (Personal Details) */}
        {activeTab === 'profile' && (
          <Card className="md:col-span-2 p-6 shadow-soft">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-stone-100">
              <div>
                <h4 className="text-base font-display font-bold text-stone-900">Personal Information</h4>
                <p className="text-xs text-stone-500">Update your account name, email, and preferences</p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('orders')}
                className="text-xs font-semibold text-salon-800 hover:text-salon-950 underline cursor-pointer"
              >
                Switch to Previous Orders &rarr;
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Full Name"
                icon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Madhu"
                required
              />

              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. madhu@example.com"
              />

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Mobile Number (Verified)
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-600 text-xs font-mono">
                  <Phone className="w-4 h-4 text-stone-400" />
                  <span>+91 {user?.phone}</span>
                  <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Mobile number is your primary account login and cannot be altered directly.
                </p>
              </div>

              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={[
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'MALE', label: 'Male' },
                  { value: 'OTHER', label: 'Other' },
                  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
                ]}
              />

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">All personal data is kept confidential and private.</span>
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Right Content Area: TAB 2 (Previous Orders & Details) */}
        {activeTab === 'orders' && (
          <div className="md:col-span-2 space-y-4">
            <Card className="p-6 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                  <h4 className="text-base font-display font-bold text-stone-900">
                    Previous Orders & Bookings
                  </h4>
                  <p className="text-xs text-stone-500">
                    Track incoming requests, completed parlour visits, and payment receipts
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadOrders(false)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Refresh orders list"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <Link to="/my-appointments">
                    <Button variant="secondary" size="sm" icon={ExternalLink} className="text-xs">
                      Live Portal View
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-2 scrollbar-none">
                {[
                  { id: 'ALL', label: 'All Orders', count: appointments.length },
                  { id: 'ACTIVE', label: 'Active & Upcoming', count: activeOrdersCount },
                  { id: 'COMPLETED', label: 'Completed', count: completedVisitsCount },
                  {
                    id: 'CANCELLED',
                    label: 'Cancelled',
                    count: appointments.filter((a) => a.status === 'CANCELLED').length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      orderStatusFilter === tab.id
                        ? 'bg-salon-900 text-white shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                        orderStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Orders List */}
            {isLoadingOrders ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-5">
                    <Skeleton className="h-5 w-1/3 mb-3" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <EmptyState
                  icon={Receipt}
                  title={
                    orderStatusFilter === 'ALL'
                      ? 'No Orders Found'
                      : `No ${orderStatusFilter.toLowerCase()} orders found`
                  }
                  description={
                    orderStatusFilter === 'ALL'
                      ? "You haven't placed any bookings yet. Book an appointment with our master stylists!"
                      : 'No appointment orders match this status filter.'
                  }
                  action={
                    <Link to="/book">
                      <Button variant="primary" size="sm" icon={Calendar} className="mt-4">
                        Book Your First Treatment
                      </Button>
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const servicesList = getOrderServices(order);
                  const totalDurationMin = servicesList.reduce(
                    (sum, s) => sum + (Number(s.duration) || 0),
                    0
                  );
                  const totalPrice =
                    order.billingSnapshot?.totalAmount ||
                    servicesList.reduce((sum, s) => sum + (Number(s.price) || 0), 0) * 1.18;

                  const canCancel = ['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(order.status);

                  return (
                    <Card
                      key={order._id}
                      className="p-5 hover:border-salon-300 transition-all duration-200 shadow-soft"
                    >
                      {/* Top Order Header: Order Reference, Date, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-stone-900 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-xs text-stone-400 font-medium">
                            Booked on {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={order.status} />
                        </div>
                      </div>

                      {/* Middle Order Content: Services, Stylist, Timing */}
                      <div className="py-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                            Treatments ({servicesList.length})
                          </span>
                          <h5 className="text-sm font-display font-bold text-stone-900 leading-snug">
                            {servicesList.map((s) => s.name).join(' + ') || order.service?.name}
                          </h5>
                          <span className="text-xs text-stone-500 flex items-center gap-1.5 mt-1 font-sans">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {formatDuration(totalDurationMin || order.service?.duration || 45)}
                          </span>
                        </div>

                        <div className="sm:border-l sm:border-stone-100 sm:pl-4 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400 font-medium">Specialist</span>
                            <span className="font-bold text-stone-800 flex items-center gap-1.5">
                              <Avatar src={order.staff?.avatarUrl} name={order.staff?.name} size="xs" />
                              {order.staff?.name}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-stone-400 font-medium">Scheduled</span>
                            <span className="font-semibold text-stone-800 tabular-nums">
                              {new Date(order.appointmentDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              at {formatTime12Hour(order.startTime)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                            <span className="text-stone-500 font-medium">Order Total</span>
                            <span className="font-bold text-stone-900 text-sm tabular-nums">
                              {formatCurrency(totalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-stone-100 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Eye}
                            className="text-xs py-1.5 px-3"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Order Details
                          </Button>

                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setCancellingOrder(order)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>

                        <Link
                          to={`/book?serviceId=${order.service?._id || ''}&staffId=${order.staff?._id || ''}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={RotateCw}
                            className="text-xs text-salon-800 hover:text-salon-950 font-semibold"
                          >
                            Book Again
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULL ORDER DETAILS MODAL */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder._id.slice(-8).toUpperCase()}`}
          subtitle={`Placed on ${new Date(selectedOrder.createdAt).toLocaleString()}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-6 text-xs font-sans">
            {/* Status Highlight Banner */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                  Order Status
                </span>
                <p className="text-xs text-stone-700 font-medium">
                  {selectedOrder.status === 'PENDING' &&
                    'Booking request registered. Salon reception will confirm shortly.'}
                  {selectedOrder.status === 'ACCEPTED' &&
                    'Your appointment request has been accepted by the salon manager.'}
                  {selectedOrder.status === 'CONFIRMED' &&
                    'Appointment is confirmed. We look forward to seeing you!'}
                  {selectedOrder.status === 'ARRIVED' &&
                    'You are checked in at the salon reception.'}
                  {selectedOrder.status === 'IN_SERVICE' &&
                    'Your salon service is currently in progress.'}
                  {selectedOrder.status === 'COMPLETED' &&
                    'Service visit completed. Thank you for choosing us!'}
                  {selectedOrder.status === 'CANCELLED' &&
                    'This booking order was cancelled.'}
                </p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {/* Treatment Items Breakdown */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Selected Treatments
              </span>
              <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 bg-white shadow-2xs">
                {getOrderServices(selectedOrder).map((svc) => (
                  <div key={svc._id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <h6 className="font-bold text-stone-900 text-xs">{svc.name}</h6>
                      <span className="text-[11px] text-stone-500">
                        {formatDuration(svc.duration)} &bull; {svc.category || 'Hair & Beauty'}
                      </span>
                    </div>
                    <span className="font-bold text-stone-900 tabular-nums">
                      {formatCurrency(svc.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specialist & Appointment Schedule */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Stylist Specialist
                </span>
                <div className="flex items-center gap-2">
                  <Avatar
                    src={selectedOrder.staff?.avatarUrl}
                    name={selectedOrder.staff?.name}
                    size="sm"
                  />
                  <span className="font-bold text-stone-900 text-xs">
                    {selectedOrder.staff?.name || 'Assigned Stylist'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Scheduled Time
                </span>
                <span className="font-bold text-stone-900 block text-xs tabular-nums">
                  {new Date(selectedOrder.appointmentDate).toDateString()}
                </span>
                <span className="text-[11px] text-stone-500 font-semibold tabular-nums">
                  {formatTime12Hour(selectedOrder.startTime)} – {formatTime12Hour(selectedOrder.endTime)}
                </span>
              </div>
            </div>

            {/* Itemized Billing Breakdown */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Payment & Billing Details
              </span>

              <div className="flex justify-between text-stone-600">
                <span>Treatments Subtotal</span>
                <span className="font-bold tabular-nums">
                  {formatCurrency(
                    selectedOrder.billingSnapshot?.servicePrice ||
                      getOrderServices(selectedOrder).reduce((s, x) => s + (Number(x.price) || 0), 0)
                  )}
                </span>
              </div>

              {selectedOrder.billingSnapshot?.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Offer Discount</span>
                  <span className="font-bold tabular-nums">
                    -{formatCurrency(selectedOrder.billingSnapshot.discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-stone-500">
                <span>Estimated GST (18%)</span>
                <span className="tabular-nums">
                  {formatCurrency(
                    selectedOrder.billingSnapshot?.taxAmount ||
                      Math.round(
                        (selectedOrder.billingSnapshot?.servicePrice ||
                          getOrderServices(selectedOrder).reduce((s, x) => s + (Number(x.price) || 0), 0)) *
                          0.18
                      )
                  )}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 font-bold text-stone-900 text-sm">
                <span>Total Amount Payable</span>
                <span className="text-base font-extrabold text-salon-900 tabular-nums">
                  {formatCurrency(
                    selectedOrder.billingSnapshot?.totalAmount ||
                      Math.round(
                        getOrderServices(selectedOrder).reduce((s, x) => s + (Number(x.price) || 0), 0) * 1.18
                      )
                  )}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 pt-1">
                Settled in person upon service completion via UPI, Debit/Credit Card, or Cash.
              </p>
            </div>

            {/* Special Instructions Notes */}
            {selectedOrder.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                  Client Notes & Requests
                </span>
                <p className="text-xs text-amber-950">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Status History Timeline */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  Order Progression Timeline
                </span>
                <div className="space-y-2 border-l-2 border-salon-300 pl-3 ml-1.5">
                  {selectedOrder.statusHistory.map((hist, idx) => (
                    <div key={idx} className="relative">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wide">
                          {hist.status}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(hist.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {hist.reason && <p className="text-[10px] text-stone-500 mt-0.5">{hist.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                {['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(selectedOrder.status) && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setCancellingOrder(selectedOrder);
                      setSelectedOrder(null);
                    }}
                  >
                    Cancel Order
                  </Button>
                )}

                <Link
                  to={`/book?serviceId=${selectedOrder.service?._id || ''}&staffId=${selectedOrder.staff?._id || ''}`}
                >
                  <Button variant="primary" size="sm" icon={RotateCw}>
                    Book Again
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM CANCELLATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(cancellingOrder)}
        title="Cancel Appointment Order"
        message={`Are you sure you wish to cancel order #${cancellingOrder?._id
          ?.slice(-8)
          .toUpperCase()} scheduled for ${cancellingOrder?.service?.name}?`}
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep Appointment"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setCancellingOrder(null);
          setCancelReason('');
        }}
      />
    </div>
  );
}

export default CustomerProfilePage;
