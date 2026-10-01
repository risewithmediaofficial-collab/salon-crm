import React, { useState, useEffect } from 'react';
import serviceService from '../serviceService.js';
import useUIStore from '../../../store/uiStore.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Table from '../../../components/common/Table.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Textarea from '../../../components/common/Textarea.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx';
import { Plus, Scissors, Clock, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDuration } from '../../../../../shared/utils/index.js';
import { SERVICE_CATEGORY } from '../../../../../shared/constants/index.js';

export function AdminServicesPage() {
  const showToast = useUIStore((state) => state.showToast);

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'HAIR',
    duration: 45,
    bufferTime: 10,
    price: 500,
    description: '',
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Deactivate confirm
  const [deactivatingService, setDeactivatingService] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const res = await serviceService.getAll({ activeOnly: 'false' });
      setServices(res.data || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category: 'HAIR',
      duration: 45,
      bufferTime: 10,
      price: 500,
      description: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (svc) => {
    setEditingService(svc);
    setFormData({
      name: svc.name,
      category: svc.category,
      duration: svc.duration,
      bufferTime: svc.bufferTime || 0,
      price: svc.price,
      description: svc.description || '',
      isActive: svc.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        duration: parseInt(formData.duration, 10),
        bufferTime: parseInt(formData.bufferTime, 10) || 0,
        price: parseFloat(formData.price),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      };

      if (editingService) {
        await serviceService.update(editingService._id, payload);
        showToast({ type: 'success', title: 'Service Updated', message: 'Service details saved!' });
      } else {
        await serviceService.create(payload);
        showToast({ type: 'success', title: 'Service Added', message: 'New service created!' });
      }

      setIsModalOpen(false);
      loadServices();
    } catch (err) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message || 'Unable to save service' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingService) return;
    setIsDeleting(true);

    try {
      await serviceService.delete(deactivatingService._id);
      showToast({ type: 'success', title: 'Service Deactivated', message: 'Service removed from customer view' });
      setDeactivatingService(null);
      loadServices();
    } catch (err) {
      showToast({ type: 'error', title: 'Failed', message: err.message || 'Could not deactivate service' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Treatment Menu & Pricing</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure salon services, pricing, buffer windows, and category classifications
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Add New Treatment
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-stone-200">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
          <Table headers={['Service Name', 'Category', 'Duration', 'Buffer', 'Price', 'Status', 'Actions']}>
            {services.map((svc) => (
              <tr key={svc._id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-5 py-3.5 font-bold text-stone-900 text-xs">
                  <div>
                    <span className="block">{svc.name}</span>
                    <span className="text-[11px] text-stone-400 font-normal line-clamp-1">
                      {svc.description || 'No description'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs">
                  <Badge variant="stone">{svc.category}</Badge>
                </td>
                <td className="px-5 py-3.5 text-xs text-stone-600 font-medium">
                  {formatDuration(svc.duration)}
                </td>
                <td className="px-5 py-3.5 text-xs text-stone-400">
                  {svc.bufferTime ? `${svc.bufferTime}m` : '0m'}
                </td>
                <td className="px-5 py-3.5 font-bold text-stone-900 text-xs tabular-nums">
                  {formatCurrency(svc.price)}
                </td>
                <td className="px-5 py-3.5 text-xs">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      svc.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    {svc.isActive ? 'Active' : 'Archived'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(svc)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                      title="Edit Service"
                      aria-label="Edit service"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {svc.isActive && (
                      <button
                        onClick={() => setDeactivatingService(svc)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Archive Service"
                        aria-label="Archive service"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Treatment' : 'Create Treatment'}
        subtitle="Manage treatment parameters, timings, and standard salon rate"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Service Title"
            placeholder="e.g. Keratin Hair Spa"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={Object.values(SERVICE_CATEGORY).map((c) => ({ value: c, label: c }))}
            />

            <Input
              label="Price (INR ₹)"
              type="number"
              min="0"
              step="10"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Minutes)"
              type="number"
              min="5"
              max="480"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            />

            <Input
              label="Buffer Time (Minutes)"
              type="number"
              min="0"
              max="60"
              value={formData.bufferTime}
              onChange={(e) => setFormData({ ...formData, bufferTime: e.target.value })}
              helperText="Sanitization gap after service"
            />
          </div>

          <Textarea
            label="Service Description"
            placeholder="Key ingredients, benefits, skin type suitability..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-salon-800 focus:ring-salon-600 border-stone-300"
            />
            <label htmlFor="isActive" className="text-xs font-medium text-stone-800">
              Active on customer booking menu
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingService ? 'Save Changes' : 'Create Treatment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingService)}
        onClose={() => setDeactivatingService(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Service"
        message={`Are you sure you want to deactivate "${deactivatingService?.name}"? Historical bookings and invoices will remain intact, but it will be hidden from new bookings.`}
        confirmLabel="Deactivate"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default AdminServicesPage;
