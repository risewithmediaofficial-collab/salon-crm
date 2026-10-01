import React, { useState, useEffect } from 'react';
import customerService from '../customerService.js';
import useUIStore from '../../../store/uiStore.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Table from '../../../components/common/Table.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import SearchInput from '../../../components/common/SearchInput.jsx';
import Pagination from '../../../components/common/Pagination.jsx';
import Drawer from '../../../components/common/Drawer.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Textarea from '../../../components/common/Textarea.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import useDebounce from '../../../hooks/useDebounce.js';
import { UserPlus, Users, Phone, Mail, Calendar, Eye } from 'lucide-react';
import { formatCurrency, formatTime12Hour } from '../../../../../shared/utils/index.js';

export function AdminCustomersPage() {
  const showToast = useUIStore((state) => state.showToast);

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustGender, setNewCustGender] = useState('PREFER_NOT_TO_SAY');
  const [newCustNotes, setNewCustNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Active customer drawer
  const [activeCustomerId, setActiveCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const loadCustomers = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await customerService.getAll({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
      });
      setCustomers(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(1);
  }, [debouncedSearch]);

  const handleOpenDetails = async (id) => {
    setActiveCustomerId(id);
    setLoadingDetails(true);
    try {
      const res = await customerService.getById(id);
      setCustomerDetails(res.data);
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Unable to load customer details' });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await customerService.createAdmin({
        name: newCustName.trim(),
        phone: newCustPhone.trim().replace(/\D/g, '').slice(-10),
        email: newCustEmail.trim() || undefined,
        gender: newCustGender,
        notes: newCustNotes.trim() || undefined,
      });

      showToast({
        type: 'success',
        title: 'Customer Added',
        message: `${newCustName} registered successfully!`,
      });

      setIsAddModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustNotes('');
      loadCustomers(1);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Registration Failed',
        message: err.message || 'Unable to register customer',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Salon Client Directory</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            View salon customer profiles, visit tallies, and past service appointments
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={UserPlus}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add New Client
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by client name, mobile, or email..."
        />
      </div>

      {/* Customer Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-stone-200">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers match your search"
          description="Check your spelling or add a new customer to the salon database."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
          <Table headers={['Client Name', 'Mobile Number', 'Email', 'Visits', 'Joined', 'Actions']}>
            {customers.map((c) => (
              <tr key={c._id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-5 py-3.5 font-bold text-stone-900">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size="sm" />
                    <span>{c.name || 'Walk-in Client'}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-stone-700">+{c.phone}</td>
                <td className="px-5 py-3.5 text-xs text-stone-500">{c.email || '—'}</td>
                <td className="px-5 py-3.5 font-bold text-xs text-salon-800">{c.totalVisits || 0}</td>
                <td className="px-5 py-3.5 text-xs text-stone-400">
                  {new Date(c.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-5 py-3.5 text-xs">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs px-2.5 py-1"
                    icon={Eye}
                    onClick={() => handleOpenDetails(c._id)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </Table>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(p) => loadCustomers(p)}
          />
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Client"
        subtitle="Add client information for in-salon appointments and reminders"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Client Full Name"
            placeholder="e.g. Ananya Roy"
            value={newCustName}
            onChange={(e) => setNewCustName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Mobile Number (10 Digits)"
            type="tel"
            placeholder="e.g. 9876543210"
            value={newCustPhone}
            onChange={(e) => setNewCustPhone(e.target.value)}
            required
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="e.g. client@example.com"
            value={newCustEmail}
            onChange={(e) => setNewCustEmail(e.target.value)}
          />

          <Select
            label="Gender"
            value={newCustGender}
            onChange={(e) => setNewCustGender(e.target.value)}
            options={[
              { value: 'FEMALE', label: 'Female' },
              { value: 'MALE', label: 'Male' },
              { value: 'OTHER', label: 'Other' },
              { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
            ]}
          />

          <Textarea
            label="Client Notes / Styling Preferences"
            placeholder="e.g. Prefers organic shampoo, scalp sensitivity, etc."
            value={newCustNotes}
            onChange={(e) => setNewCustNotes(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Register Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Details Drawer */}
      <Drawer
        isOpen={Boolean(activeCustomerId)}
        onClose={() => {
          setActiveCustomerId(null);
          setCustomerDetails(null);
        }}
        title={customerDetails?.name || 'Client Details'}
        subtitle={`Registered ${customerDetails ? new Date(customerDetails.createdAt).toLocaleDateString() : ''}`}
      >
        {loadingDetails ? (
          <div className="py-12 text-center">
            <Skeleton className="h-6 w-1/2 mx-auto mb-3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : customerDetails ? (
          <div className="space-y-6 text-xs">
            {/* Quick Contact Box */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center gap-2 text-stone-700">
                <Phone className="w-4 h-4 text-stone-400" />
                <span className="font-mono font-bold">+{customerDetails.phone}</span>
              </div>
              {customerDetails.email && (
                <div className="flex items-center gap-2 text-stone-700">
                  <Mail className="w-4 h-4 text-stone-400" />
                  <span>{customerDetails.email}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200/80 flex justify-between text-stone-500">
                <span>Total Salon Visits:</span>
                <span className="font-bold text-stone-900">{customerDetails.totalVisits || 0}</span>
              </div>
            </div>

            {/* Recent Appointments */}
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-3">Recent Appointments</h4>
              {!customerDetails.recentAppointments?.length ? (
                <p className="text-stone-400 italic">No previous visits recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {customerDetails.recentAppointments.map((apt) => (
                    <div key={apt._id} className="p-3 rounded-xl border border-stone-100 bg-white">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-stone-900">{apt.service?.name}</span>
                        <span className="text-[10px] uppercase font-bold text-salon-800">{apt.status}</span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        {new Date(apt.appointmentDate).toDateString()} with {apt.staff?.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {customerDetails.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Client Notes</span>
                <p className="text-stone-700">{customerDetails.notes}</p>
              </div>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

export default AdminCustomersPage;
