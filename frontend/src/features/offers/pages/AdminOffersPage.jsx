import React, { useState, useEffect } from 'react';
import offerService from '../offerService.js';
import useUIStore from '../../../store/uiStore.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Table from '../../../components/common/Table.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Textarea from '../../../components/common/Textarea.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx';
import { Plus, Tag, Trash2, Edit2 } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils/index.js';
import { OFFER_TYPE } from '../../../../../shared/constants/index.js';

export function AdminOffersPage() {
  const showToast = useUIStore((state) => state.showToast);

  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    type: 'PERCENTAGE',
    value: 20,
    maxDiscountAmount: 300,
    minOrderAmount: 500,
    description: '',
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Deactivate
  const [deactivatingOffer, setDeactivatingOffer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      const res = await offerService.getAll({ activeOnly: 'false' });
      setOffers(res.data || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleOpenAdd = () => {
    setEditingOffer(null);
    setFormData({
      title: '',
      code: '',
      type: 'PERCENTAGE',
      value: 20,
      maxDiscountAmount: 300,
      minOrderAmount: 500,
      description: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      };

      if (editingOffer) {
        await offerService.update(editingOffer._id, payload);
        showToast({ type: 'success', title: 'Offer Updated', message: 'Promotional offer updated!' });
      } else {
        await offerService.create(payload);
        showToast({ type: 'success', title: 'Offer Created', message: 'New promo code active!' });
      }

      setIsModalOpen(false);
      loadOffers();
    } catch (err) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message || 'Unable to save offer' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingOffer) return;
    setIsDeleting(true);

    try {
      await offerService.delete(deactivatingOffer._id);
      showToast({ type: 'success', title: 'Offer Deactivated', message: 'Offer is now inactive' });
      setDeactivatingOffer(null);
      loadOffers();
    } catch (err) {
      showToast({ type: 'error', title: 'Failed', message: err.message || 'Could not deactivate offer' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Promotions & Offers</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure discount codes, seasonal vouchers, and minimum booking qualifiers
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Create New Offer
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
          <Table headers={['Promo Title & Code', 'Type & Discount', 'Min Order', 'Redemptions', 'Status', 'Actions']}>
            {offers.map((off) => (
              <tr key={off._id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-5 py-3.5 text-xs font-bold text-stone-900">
                  <div>
                    <span>{off.title}</span>
                    <span className="block font-mono text-[11px] text-salon-800 font-bold">
                      {off.code}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-3.5 text-xs text-stone-700 font-semibold">
                  {off.type === 'PERCENTAGE'
                    ? `${off.value}% OFF (Max ${formatCurrency(off.maxDiscountAmount || 0)})`
                    : `Flat ${formatCurrency(off.value)} OFF`}
                </td>

                <td className="px-5 py-3.5 text-xs text-stone-500">
                  {formatCurrency(off.minOrderAmount)}
                </td>

                <td className="px-5 py-3.5 text-xs font-bold text-stone-700">
                  {off.usageCount || 0}
                </td>

                <td className="px-5 py-3.5 text-xs">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      off.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    {off.isActive ? 'Active' : 'Expired'}
                  </span>
                </td>

                <td className="px-5 py-3.5 text-xs">
                  {off.isActive && (
                    <button
                      onClick={() => setDeactivatingOffer(off)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Deactivate Offer"
                      aria-label="Deactivate offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* Add Offer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Offer"
        subtitle="Configure promo coupon rules and thresholds"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Offer Title"
            placeholder="e.g. Festival Glow Discount"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Promo Code"
              placeholder="e.g. FESTIVE20"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />

            <Select
              label="Discount Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FLAT', label: 'Flat Cash (₹)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={formData.type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
              type="number"
              min="1"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />

            {formData.type === 'PERCENTAGE' && (
              <Input
                label="Max Discount Cap (₹)"
                type="number"
                min="0"
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
              />
            )}
          </div>

          <Input
            label="Minimum Order Subtotal (₹)"
            type="number"
            min="0"
            value={formData.minOrderAmount}
            onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
          />

          <Textarea
            label="Offer Description"
            placeholder="Terms, service exclusions, valid dates..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Offer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingOffer)}
        onClose={() => setDeactivatingOffer(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Promo Code"
        message={`Are you sure you want to deactivate code "${deactivatingOffer?.code}"? Customers will no longer be able to apply it during checkout.`}
        confirmLabel="Deactivate"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default AdminOffersPage;
