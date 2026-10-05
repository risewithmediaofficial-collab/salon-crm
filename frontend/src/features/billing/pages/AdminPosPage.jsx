import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import serviceService from '../../services/serviceService.js';
import staffService from '../../staff/staffService.js';
import customerService from '../../customers/customerService.js';
import billingService from '../billingService.js';
import useUIStore from '../../../store/uiStore.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import {
  ShoppingBag,
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  CheckCircle2,
  Printer,
  RotateCcw,
  Clock,
  ArrowRight,
  UserPlus,
  Scissors,
  Check,
  List,
  LayoutGrid,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDuration } from '../../../../../shared/utils/index.js';
import config from '../../../config/index.js';

export function AdminPosPage() {
  const showToast = useUIStore((state) => state.showToast);

  // Data sources
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Service catalog filters & view mode (default to list view)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [catalogViewMode, setCatalogViewMode] = useState('list'); // 'list' | 'grid'

  // POS Ticket / Cart State
  const [ticketItems, setTicketItems] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [isWalkin, setIsWalkin] = useState(true);

  // Discount & Offers
  const [discountType, setDiscountType] = useState('FLAT'); // 'FLAT' | 'PERCENT' | 'CODE'
  const [discountValue, setDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'UPI' | 'CARD'
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Custom Item Modal
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemStaff, setCustomItemStaff] = useState('');

  // Completed Receipt Modal
  const [completedReceipt, setCompletedReceipt] = useState(null);

  // Sticky header state: activates compact mode when scrolled past 20-30% of screen (~25px)
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(scrollPos > 25);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { passive: true, capture: true });
    };
  }, []);

  // Load initial services, staff & customers with resilience & fallback
  const loadPosData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [servicesResult, staffResult, customersResult] = await Promise.allSettled([
        serviceService.getAll({ activeOnly: 'true' }),
        staffService.getAll({ activeOnly: 'true' }),
        customerService.getAll({ limit: 100 }),
      ]);

      let hasServices = false;

      // 1. Handle services (catalog products)
      if (
        servicesResult.status === 'fulfilled' &&
        Array.isArray(servicesResult.value?.data) &&
        servicesResult.value.data.length > 0
      ) {
        const loaded = servicesResult.value.data;
        setServices(loaded);
        hasServices = true;
        try {
          localStorage.setItem('salon_pos_services_cache', JSON.stringify(loaded));
        } catch (e) {}
      } else {
        // Fallback to cached catalog so screen never goes blank during brief server restarts
        try {
          const cached = localStorage.getItem('salon_pos_services_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setServices(parsed);
              hasServices = true;
            }
          }
        } catch (e) {}
      }

      // 2. Handle staff list
      if (staffResult.status === 'fulfilled' && Array.isArray(staffResult.value?.data)) {
        setStaffList(staffResult.value.data);
      }

      // 3. Handle customers (optional for POS, failure must not block catalog)
      if (customersResult.status === 'fulfilled' && Array.isArray(customersResult.value?.data)) {
        setCustomers(customersResult.value.data);
      }

      // Only warn if services failed and cache wasn't available
      if (servicesResult.status === 'rejected' && !hasServices) {
        showToast({
          type: 'error',
          title: 'Catalog Load Issue',
          message: 'Unable to reach service catalog. Click "Retry Loading Catalog" below.',
        });
      }
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPosData();
  }, [loadPosData]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [services, selectedCategory, searchQuery]);

  // Filtered customers for autocomplete
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    ).slice(0, 6);
  }, [customers, customerSearch]);

  // Add service to ticket
  const handleAddServiceToTicket = (service) => {
    setTicketItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.serviceId === service._id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          serviceId: service._id,
          description: service.name,
          quantity: 1,
          unitPrice: service.price,
          taxRate: service.taxRate || 18,
          staffId: staffList[0]?._id || null,
          staffName: staffList[0]?.name || '',
        },
      ];
    });
  };

  // Add custom line item
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customItemName.trim() || !customItemPrice) return;

    const matchedStaff = staffList.find((s) => s._id === customItemStaff);

    setTicketItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        description: customItemName.trim(),
        quantity: 1,
        unitPrice: parseFloat(customItemPrice),
        taxRate: 18,
        staffId: matchedStaff?._id || null,
        staffName: matchedStaff?.name || '',
      },
    ]);

    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemStaff('');
    setIsCustomItemModalOpen(false);
  };

  // Update item quantity
  const handleUpdateQuantity = (id, delta) => {
    setTicketItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Update assigned staff for item
  const handleUpdateItemStaff = (id, staffId) => {
    const matched = staffList.find((s) => s._id === staffId);
    setTicketItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, staffId: matched?._id || null, staffName: matched?.name || '' }
          : item
      )
    );
  };

  // Remove item from ticket
  const handleRemoveItem = (id) => {
    setTicketItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear ticket
  const handleClearTicket = () => {
    setTicketItems([]);
    setSelectedCustomerId('');
    setCustomerSearch('');
    setWalkinName('');
    setWalkinPhone('');
    setIsWalkin(true);
    setDiscountValue('');
    setAppliedPromo(null);
    setPromoCode('');
    setPaymentReference('');
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return ticketItems.reduce(
      (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
      0
    );
  }, [ticketItems]);

  const discountAmount = useMemo(() => {
    if (appliedPromo) {
      return appliedPromo.discountAmount || 0;
    }
    const val = parseFloat(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === 'PERCENT') {
      return Math.round(subtotal * (val / 100) * 100) / 100;
    }
    return Math.min(val, subtotal);
  }, [subtotal, discountValue, discountType, appliedPromo]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * 0.18 * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  // Apply Promo Code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    try {
      const primaryServiceId = ticketItems[0]?.serviceId;
      const res = await billingService.validateOffer(promoCode.trim(), primaryServiceId);
      setAppliedPromo(res.data);
      showToast({
        type: 'success',
        title: 'Offer Applied',
        message: `Saved ${formatCurrency(res.data.discountAmount)} with code ${promoCode.toUpperCase()}`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Promo Error',
        message: err.message || 'Invalid or expired offer code',
      });
      setAppliedPromo(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Complete POS Sale Checkout
  const handleCheckoutSale = async () => {
    if (ticketItems.length === 0) {
      showToast({
        type: 'error',
        title: 'Empty Ticket',
        message: 'Please add at least one service to the ticket before checkout.',
      });
      return;
    }

    if (isWalkin && (!walkinName.trim() || !walkinPhone.trim())) {
      showToast({
        type: 'error',
        title: 'Client Details Required',
        message: 'Please provide client name and phone number for billing.',
      });
      return;
    }

    setIsProcessingSale(true);
    try {
      const posPayload = {
        customerId: isWalkin ? undefined : selectedCustomerId,
        customerName: isWalkin ? walkinName.trim() : undefined,
        customerPhone: isWalkin ? walkinPhone.trim() : undefined,
        items: ticketItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          staffId: item.staffId,
          staffName: item.staffName,
        })),
        offerCode: appliedPromo?.offer?.code || undefined,
        discountAmount,
        payment: {
          method: paymentMethod,
          amount: grandTotal,
          referenceNumber: paymentReference.trim() || undefined,
        },
      };

      const res = await billingService.createPosSale(posPayload);
      const createdInvoice = res.data;

      setCompletedReceipt(createdInvoice);
      handleClearTicket();

      showToast({
        type: 'success',
        title: 'Sale Completed!',
        message: `Invoice #${createdInvoice.invoiceNumber} recorded successfully.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'POS Checkout Failed',
        message: err.message || 'Unable to record POS transaction.',
      });
    } finally {
      setIsProcessingSale(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden space-y-1.5 sm:space-y-2">
      {/* Top Header Bar: Sticky on top, smoothly compresses when scrolled past 20-30% */}
      <div
        className={`shrink-0 sticky top-0 z-20 bg-stone-100/95 backdrop-blur-xs transition-all duration-200 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isScrolled ? 'py-1 pb-1 mb-1' : 'pb-2 mb-1'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`rounded-xl bg-salon-800 text-white flex items-center justify-center shadow-md shadow-salon-800/20 shrink-0 transition-all duration-200 ${
              isScrolled ? 'w-7 h-7' : 'w-8 h-8 sm:w-9 sm:h-9'
            }`}
          >
            <ShoppingBag className={`text-gold-400 ${isScrolled ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className={`font-display font-extrabold text-stone-900 tracking-tight transition-all duration-200 truncate ${
                  isScrolled ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
                }`}
              >
                POS Billing Counter
              </h1>
              <span className="text-[10px] bg-salon-50 text-salon-800 border border-salon-200 px-2 py-0.5 rounded-full font-semibold hidden md:inline-block shrink-0">
                Fixed Terminal
              </span>
            </div>
            {!isScrolled && (
              <p className="text-[11px] text-stone-500 truncate hidden sm:block">
                Point of Sale terminal for walk-in clients, instant service checkout, and printed invoices
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setIsCustomItemModalOpen(true)}
            className="text-xs py-1"
          >
            Add Custom Item
          </Button>

          <Link to="/admin/billing">
            <Button variant="ghost" size="sm" icon={Receipt} className="text-xs text-stone-600 py-1">
              View All Invoices
            </Button>
          </Link>
        </div>
      </div>

      {/* Main 2-Column POS Workspace with independent split-pane inline scroll */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 h-full overflow-hidden items-stretch">
        {/* LEFT COLUMN: Service Catalog & Items (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 space-y-2 overflow-hidden">
          {/* Search, View Mode Toggle & Category Filter Bar (Fixed at top of catalog, shrink-0) */}
          <div className="shrink-0 bg-white p-2.5 sm:p-3 rounded-2xl border border-stone-200/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search treatments or styling services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-salon-600 font-sans"
                />
              </div>

              {/* View Mode Toggle: List View (default) vs Grid View */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setCatalogViewMode('list')}
                  title="List View"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    catalogViewMode === 'list'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    catalogViewMode === 'grid'
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-salon-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {cat === 'ALL' ? 'All Services' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Service Items Container (Independently scrollable inline with scrollbar-thin) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-1 scrollbar-thin scroll-smooth">
            {isLoadingData ? (
              <div className={catalogViewMode === 'list' ? 'space-y-2' : 'grid grid-cols-2 sm:grid-cols-3 gap-3'}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-white border border-stone-200">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <AlertCircle className="w-5 h-5 text-salon-600" />
                </div>
                {services.length === 0 ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-stone-800 text-sm">Service & Product Catalog Unavailable</p>
                    <p className="text-[11px] text-stone-400 max-w-sm mx-auto leading-relaxed">
                      Could not retrieve the salon catalog from the server. Ensure the backend is active.
                    </p>
                    <button
                      type="button"
                      onClick={loadPosData}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-salon-800 hover:bg-salon-900 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Loading Catalog
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="font-medium text-stone-700">No salon services found matching "{searchQuery}".</p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-semibold text-salon-800 hover:underline"
                      >
                        Clear search filter
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : catalogViewMode === 'list' ? (
              /* LIST VIEW */
              <div className="space-y-2">
                {filteredServices.map((service) => (
                  <div
                    key={service._id}
                    onClick={() => handleAddServiceToTicket(service)}
                    className="p-2.5 sm:p-3 rounded-2xl bg-white border border-stone-200/90 hover:border-salon-600 hover:shadow-xs hover:bg-salon-50/20 transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-salon-700 bg-salon-50 px-2 py-1 rounded-md shrink-0">
                        {service.category || 'Treatment'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-display font-bold text-stone-900 truncate group-hover:text-salon-900">
                          {service.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400 font-sans">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(service.duration)}
                          </span>
                          {service.description && (
                            <span className="hidden sm:inline text-stone-400 truncate max-w-xs">
                              &bull; {service.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-sans font-extrabold text-stone-900 text-sm tabular-nums">
                        {formatCurrency(service.price)}
                      </span>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-xl bg-stone-100 group-hover:bg-salon-800 text-stone-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs font-bold"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* GRID VIEW */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredServices.map((service) => (
                  <div
                    key={service._id}
                    onClick={() => handleAddServiceToTicket(service)}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200/90 hover:border-salon-600 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-95"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-salon-700 bg-salon-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
                        {service.category || 'Treatment'}
                      </span>
                      <h4 className="text-xs font-display font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-salon-900">
                        {service.name}
                      </h4>
                      <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-1 font-sans">
                        <Clock className="w-3 h-3" />
                        {formatDuration(service.duration)}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                      <span className="font-sans font-bold text-stone-900 text-sm tabular-nums">
                        {formatCurrency(service.price)}
                      </span>
                      <button
                        type="button"
                        className="w-6 h-6 rounded-lg bg-stone-100 group-hover:bg-salon-800 text-stone-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Bill / Cart / Payment (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden">
          <div className="bg-white rounded-2xl border border-stone-300/80 shadow-soft flex flex-col h-full min-h-0 overflow-hidden">
            {/* Ticket Header & Client Switcher (Fixed at top, shrink-0) */}
            <div className="shrink-0 p-2.5 sm:p-3 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-display font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-salon-800" />
                  Active Ticket ({ticketItems.length} items)
                </span>
                {ticketItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearTicket}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline"
                  >
                    Clear Ticket
                  </button>
                )}
              </div>

              {/* Client Selection Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100/90 text-xs mb-2">
                <button
                  type="button"
                  onClick={() => setIsWalkin(true)}
                  className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all ${
                    isWalkin ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                >
                  Walk-in Client
                </button>
                <button
                  type="button"
                  onClick={() => setIsWalkin(false)}
                  className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all ${
                    !isWalkin ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                >
                  Existing Patron
                </button>
              </div>

              {isWalkin ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Client Name *"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-salon-600"
                  />
                  <input
                    type="tel"
                    placeholder="10-digit Phone *"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-salon-600 font-mono"
                  />
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type name or phone to search patron..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 pl-8 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-salon-600 font-sans"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />

                  {filteredCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-stone-100">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c._id}
                          onClick={() => {
                            setSelectedCustomerId(c._id);
                            setCustomerSearch(`${c.name} (${c.phone})`);
                          }}
                          className="p-2.5 hover:bg-stone-50 transition-colors cursor-pointer text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-stone-900 block">{c.name}</span>
                            <span className="text-[10px] text-stone-500 font-mono">+{c.phone}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-salon-800 bg-salon-50 px-2 py-0.5 rounded-full">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Middle Section: Scrollable Cart Products List ("keep scroll in the carts products") */}
            <div className="flex-1 min-h-[60px] overflow-y-auto px-3 sm:px-4 divide-y divide-stone-100 scrollbar-thin scroll-smooth">
              {ticketItems.length === 0 ? (
                <div className="py-4 sm:py-5 text-center text-xs text-stone-400 font-sans flex flex-col items-center justify-center">
                  <Receipt className="w-5 h-5 text-stone-300 mb-1 stroke-1" />
                  <span className="font-semibold text-stone-600 text-xs">Active ticket is empty</span>
                  <span className="text-[10px] text-stone-400 mt-0.5">Click any treatment from the catalog to add</span>
                </div>
              ) : (
                ticketItems.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-stone-900 truncate">{item.description}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-sans text-stone-500 font-medium">
                          {formatCurrency(item.unitPrice)} each
                        </span>
                        {/* Stylist selector per item */}
                        <select
                          value={item.staffId || ''}
                          onChange={(e) => handleUpdateItemStaff(item.id, e.target.value)}
                          className="text-[10px] py-0.5 px-1.5 rounded-md border border-stone-200 bg-stone-50 font-medium text-stone-700 max-w-[130px] truncate"
                        >
                          <option value="">No stylist</option>
                          {staffList.map((st) => (
                            <option key={st._id} value={st._id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-stone-900 text-xs tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Section: Offer Code, Totals, Payment & Charge (Fixed at bottom, shrink-0) */}
            <div className="shrink-0 p-2.5 sm:p-3 border-t border-stone-200/90 bg-stone-50/70 space-y-1.5">
              {/* Discount / Promo Code Row */}
              <div className="space-y-1">
                <div className="flex gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Offer code (e.g. WELCOME20)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white uppercase font-sans text-xs focus:outline-none"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={isApplyingPromo}
                    disabled={!promoCode.trim()}
                    onClick={handleApplyPromo}
                    className="text-xs px-3 py-1.5"
                  >
                    Apply
                  </Button>
                </div>

                {appliedPromo && (
                  <div className="p-1.5 px-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
                    <span>Offer Applied: -{formatCurrency(appliedPromo.discountAmount)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCode('');
                      }}
                      className="font-bold underline text-rose-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Bill Summary Calculations */}
              <div className="pt-1.5 border-t border-stone-200/70 space-y-1 text-xs text-stone-600 font-sans">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900 tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-bold tabular-nums">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-500">
                  <span>GST (18%)</span>
                  <span className="tabular-nums">{formatCurrency(taxAmount)}</span>
                </div>

                <div className="flex justify-between items-baseline pt-1 border-t border-stone-200 text-xs sm:text-sm font-bold text-stone-900">
                  <span className="font-display">Total Amount</span>
                  <span className="font-sans text-lg font-extrabold text-salon-900 tabular-nums">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-1.5 border-t border-stone-200/70">
                <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                  {[
                    { id: 'CASH', label: 'Cash', icon: Banknote },
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'CARD', label: 'Card', icon: CreditCard },
                  ].map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`py-1 px-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-salon-800 bg-salon-50 text-salon-950 ring-2 ring-salon-800/20 shadow-xs'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <Icon className="w-3 h-3 text-salon-700" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* UPI Reference */}
                {paymentMethod === 'UPI' && (
                  <div className="mb-1.5">
                    <input
                      type="text"
                      placeholder="UPI Reference / UTR Number (optional)"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-xl border border-stone-200 bg-white text-xs font-mono"
                    />
                  </div>
                )}

                {/* Card Reference */}
                {paymentMethod === 'CARD' && (
                  <div className="mb-1.5">
                    <input
                      type="text"
                      placeholder="Card Approval / Auth Code (optional)"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-xl border border-stone-200 bg-white text-xs font-mono"
                    />
                  </div>
                )}

                {/* Charge & Print Action Button */}
                <Button
                  variant="primary"
                  className="w-full py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-salon-900/20 active:scale-[0.99]"
                  isLoading={isProcessingSale}
                  disabled={ticketItems.length === 0}
                  onClick={handleCheckoutSale}
                  icon={Check}
                >
                  Charge {formatCurrency(grandTotal)} & Print Bill
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM ITEM MODAL */}
      <Modal
        isOpen={isCustomItemModalOpen}
        onClose={() => setIsCustomItemModalOpen(false)}
        title="Add Custom Service / Product"
        subtitle="Add a miscellaneous styling service, treatment add-on, or retail product to this ticket"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddCustomItem} className="space-y-4 text-xs font-sans">
          <Input
            label="Item Description"
            placeholder="e.g. Special Hair Serum / Touch-up"
            value={customItemName}
            onChange={(e) => setCustomItemName(e.target.value)}
            required
          />

          <Input
            label="Price (₹)"
            type="number"
            placeholder="e.g. 450"
            value={customItemPrice}
            onChange={(e) => setCustomItemPrice(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Assigned Specialist (Optional)
            </label>
            <select
              value={customItemStaff}
              onChange={(e) => setCustomItemStaff(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs font-medium"
            >
              <option value="">No specific stylist</option>
              {staffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <Button variant="secondary" onClick={() => setIsCustomItemModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add to Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE COMPLETED POS RECEIPT MODAL */}
      {completedReceipt && (
        <Modal
          isOpen={Boolean(completedReceipt)}
          onClose={() => setCompletedReceipt(null)}
          title="Payment Received — Tax Invoice"
          subtitle={`Invoice #${completedReceipt.invoiceNumber}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs font-sans">
            {/* Printable Receipt Paper Container */}
            <div
              id="printable-receipt"
              className="p-6 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4 text-stone-900"
            >
              {/* Salon Brand Header */}
              <div className="text-center pb-3 border-b border-dashed border-stone-300">
                <h3 className="font-display font-extrabold text-base tracking-tight text-stone-900">
                  {config.SALON_NAME}
                </h3>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold mt-0.5">
                  Luxury Parlour & Spa
                </p>
                <p className="text-[10px] text-stone-500 mt-1">
                  108 Grand Avenue, Luxury District &bull; Tel: +91 98765 43210
                </p>
                <p className="text-[9px] text-stone-400 font-mono mt-0.5">GSTIN: 29AAAAA0000A1Z5</p>
              </div>

              {/* Invoice Meta */}
              <div className="flex justify-between text-[11px] text-stone-600 font-mono">
                <div>
                  <span>INV: #{completedReceipt.invoiceNumber}</span>
                  <br />
                  <span>
                    DATE: {new Date(completedReceipt.createdAt || Date.now()).toLocaleDateString()}{' '}
                    {new Date(completedReceipt.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-stone-900">
                    CLIENT: {completedReceipt.customer?.name || 'Walk-in'}
                  </span>
                  <br />
                  <span>TEL: +{completedReceipt.customer?.phone}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border-t border-b border-dashed border-stone-300 py-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-stone-400 border-b border-stone-100">
                      <th className="pb-1 font-semibold">Service</th>
                      <th className="pb-1 text-center font-semibold">Qty</th>
                      <th className="pb-1 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 font-sans">
                    {(completedReceipt.lineItems || []).map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1">
                          <span className="font-bold text-stone-900 block">{item.description}</span>
                          {item.staffName && (
                            <span className="text-[9px] text-stone-500">Stylist: {item.staffName}</span>
                          )}
                        </td>
                        <td className="py-1 text-center font-mono">{item.quantity}</td>
                        <td className="py-1 text-right font-mono font-bold">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1 text-[11px] font-sans">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(completedReceipt.subtotal)}</span>
                </div>

                {completedReceipt.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCurrency(completedReceipt.totalDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-500">
                  <span>GST (18%)</span>
                  <span className="font-mono">{formatCurrency(completedReceipt.totalTax)}</span>
                </div>

                <div className="flex justify-between text-sm font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                  <span>Grand Total</span>
                  <span className="font-mono text-base font-extrabold text-salon-900">
                    {formatCurrency(completedReceipt.totalAmount)}
                  </span>
                </div>

                {completedReceipt.payments?.[0] && (
                  <div className="pt-2 text-[10px] text-stone-500 border-t border-dashed border-stone-200 flex justify-between font-mono">
                    <span>Paid via {completedReceipt.payments[0].method}</span>
                    <span className="font-bold text-emerald-700">PAID IN FULL</span>
                  </div>
                )}
              </div>

              {/* Thank you note */}
              <div className="text-center pt-2 text-[10px] text-stone-400 font-sans">
                *** Thank You for Pampering with Us! ***
                <br />
                Follow us on Instagram: @glowandglamour
              </div>
            </div>

            {/* Print & Next Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
                className="flex-1"
              >
                Print Receipt
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={Check}
                onClick={() => setCompletedReceipt(null)}
                className="flex-1"
              >
                Next Customer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AdminPosPage;
