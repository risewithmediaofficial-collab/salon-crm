import React, { useState, useEffect } from 'react';
import staffService from '../staffService.js';
import serviceService from '../../services/serviceService.js';
import useUIStore from '../../../store/uiStore.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Table from '../../../components/common/Table.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Textarea from '../../../components/common/Textarea.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx';
import { UserPlus, Calendar, Plus, Clock, Trash2, CalendarOff } from 'lucide-react';

export function AdminStaffPage() {
  const showToast = useUIStore((state) => state.showToast);

  const [staffList, setStaffList] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add staff modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'STAFF',
    bio: '',
    selectedServices: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Leave Modal
  const [leaveModalStaff, setLeaveModalStaff] = useState(null);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [isSavingLeave, setIsSavingLeave] = useState(false);

  // Deactivate
  const [deactivatingStaff, setDeactivatingStaff] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, svcRes] = await Promise.all([
        staffService.getAll({ activeOnly: 'false' }),
        serviceService.getAll({ activeOnly: 'true' }),
      ]);
      setStaffList(staffRes.data || []);
      setServices(svcRes.data || []);
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await staffService.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
        bio: formData.bio.trim() || undefined,
        services: formData.selectedServices,
      });

      showToast({
        type: 'success',
        title: 'Staff Member Added',
        message: `${formData.name} was successfully registered!`,
      });

      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'STAFF',
        bio: '',
        selectedServices: [],
      });
      loadData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Unable to create staff member',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveModalStaff) return;
    setIsSavingLeave(true);

    try {
      await staffService.addLeave(leaveModalStaff._id, {
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason.trim() || undefined,
      });

      showToast({
        type: 'success',
        title: 'Leave Recorded',
        message: `Leave added for ${leaveModalStaff.name}. Slot engine will automatically block appointments during this period.`,
      });

      setLeaveModalStaff(null);
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      loadData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Leave Failed',
        message: err.message || 'Unable to add leave schedule',
      });
    } finally {
      setIsSavingLeave(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingStaff) return;
    setIsDeactivating(true);

    try {
      await staffService.delete(deactivatingStaff._id);
      showToast({
        type: 'success',
        title: 'Staff Deactivated',
        message: `${deactivatingStaff.name} is now inactive`,
      });
      setDeactivatingStaff(null);
      loadData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Failed',
        message: err.message || 'Could not deactivate staff member',
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Stylists & Staff Roster</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage salon team accounts, assigned treatments, working shifts, and approved leaves
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={UserPlus}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Staff Member
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-stone-200">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
          <Table headers={['Staff Member', 'Role & Contact', 'Services Handled', 'Active Leaves', 'Status', 'Actions']}>
            {staffList.map((st) => (
              <tr key={st._id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-5 py-3.5 text-xs font-bold text-stone-900">
                  <div className="flex items-center gap-3">
                    <Avatar src={st.avatarUrl} name={st.name} size="sm" />
                    <div>
                      <span>{st.name}</span>
                      <span className="block text-[11px] text-stone-400 font-normal line-clamp-1">{st.bio}</span>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-3.5 text-xs text-stone-600">
                  <span className="font-semibold text-stone-800 block">{st.user?.role || 'STAFF'}</span>
                  <span className="text-stone-400 font-mono text-[11px]">{st.email}</span>
                </td>

                <td className="px-5 py-3.5 text-xs">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {st.services?.slice(0, 3).map((s) => (
                      <Badge key={s._id} variant="stone" className="text-[10px]">
                        {s.name}
                      </Badge>
                    ))}
                    {st.services?.length > 3 && (
                      <span className="text-[10px] text-stone-400 self-center">
                        +{st.services.length - 3} more
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-5 py-3.5 text-xs">
                  {st.leaves?.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <CalendarOff className="w-3 h-3" />
                      {st.leaves.length} booked leave(s)
                    </span>
                  ) : (
                    <span className="text-stone-400 text-xs">No active leaves</span>
                  )}
                </td>

                <td className="px-5 py-3.5 text-xs">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      st.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    {st.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td className="px-5 py-3.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs px-2.5 py-1"
                      icon={Calendar}
                      onClick={() => setLeaveModalStaff(st)}
                    >
                      Schedule Leave
                    </Button>

                    {st.isActive && (
                      <button
                        onClick={() => setDeactivatingStaff(st)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Deactivate Staff"
                        aria-label="Deactivate staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Member"
        subtitle="Create staff account with login credentials and assigned services"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input
            label="Stylist Full Name"
            placeholder="e.g. Priya Sharma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Login Email"
              type="email"
              placeholder="e.g. priya@salon.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Password (min 8 chars)"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              placeholder="e.g. 9876543201"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'STAFF', label: 'Staff / Stylist' },
                { value: 'MANAGER', label: 'Salon Manager' },
              ]}
            />
          </div>

          <Textarea
            label="Bio & Specialties"
            placeholder="Years of experience, certifications, styling focus..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={2}
          />

          {/* Assigned Services Checklist */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Assigned Services (Stylist can be booked for these treatments)
            </label>
            <div className="max-h-36 overflow-y-auto p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5">
              {services.map((svc) => {
                const isChecked = formData.selectedServices.includes(svc._id);
                return (
                  <label key={svc._id} className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            selectedServices: [...formData.selectedServices, svc._id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selectedServices: formData.selectedServices.filter((id) => id !== svc._id),
                          });
                        }
                      }}
                      className="rounded text-salon-800 focus:ring-salon-600"
                    />
                    <span>{svc.name}</span>
                    <span className="text-[10px] text-stone-400">({svc.category})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Leave Modal */}
      <Modal
        isOpen={Boolean(leaveModalStaff)}
        onClose={() => setLeaveModalStaff(null)}
        title="Schedule Leave / Block Dates"
        subtitle={`Mark off-duty dates for ${leaveModalStaff?.name}. Slots will automatically be blocked.`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddLeave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={leaveStart}
              onChange={(e) => setLeaveStart(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={leaveEnd}
              onChange={(e) => setLeaveEnd(e.target.value)}
              required
            />
          </div>

          <Input
            label="Reason (Optional)"
            placeholder="e.g. Annual leave, Personal, Training"
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button variant="secondary" size="sm" onClick={() => setLeaveModalStaff(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingLeave}>
              Record Leave
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingStaff)}
        onClose={() => setDeactivatingStaff(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Staff Account"
        message={`Are you sure you want to deactivate ${deactivatingStaff?.name}? Their login will be disabled and they will not appear on customer booking.`}
        confirmLabel="Deactivate"
        isLoading={isDeactivating}
      />
    </div>
  );
}

export default AdminStaffPage;
