import React, { useState, useEffect } from 'react';
import billingService from '../billingService.js';
import useUIStore from '../../../store/uiStore.js';
import Card from '../../../components/common/Card.jsx';
import Button from '../../../components/common/Button.jsx';
import Table from '../../../components/common/Table.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Pagination from '../../../components/common/Pagination.jsx';
import Skeleton from '../../../components/common/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { Receipt, IndianRupee, CheckCircle2, AlertCircle, Eye, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils/index.js';
import { PAYMENT_METHOD, INVOICE_STATUS_COLORS } from '../../../constants/index.js';

export function AdminBillingPage() {
  const showToast = useUIStore((state) => state.showToast);

  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Record Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // View Invoice Receipt Modal
  const [receiptInvoice, setReceiptInvoice] = useState(null);

  const loadInvoices = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;

      const res = await billingService.getAll(params);
      setInvoices(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(1);
  }, [statusFilter]);

  const handleOpenPayment = (inv) => {
    setPaymentInvoice(inv);
    setPaymentAmount(String(inv.amountDue));
    setPaymentMethod('UPI');
    setPaymentRef('');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    setIsRecordingPayment(true);

    try {
      await billingService.recordPayment(paymentInvoice._id, {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        referenceNumber: paymentRef.trim() || undefined,
      });

      showToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Received ${formatCurrency(paymentAmount)} via ${paymentMethod}`,
      });

      setPaymentInvoice(null);
      loadInvoices(pagination.page);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Payment Failed',
        message: err.message || 'Unable to record payment',
      });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Audit customer invoices, manage payments (Cash/UPI/Card), and review tax receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Invoices"
            options={[
              { value: 'PAID', label: 'Paid' },
              { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'ISSUED', label: 'Issued' },
            ]}
            containerClassName="w-44"
          />
        </div>
      </div>

      {/* Invoice Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-stone-200">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="There are no billing records matching this filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-soft overflow-hidden">
          <Table headers={['Invoice #', 'Client Name', 'Total Bill', 'Paid', 'Due Balance', 'Status', 'Actions']}>
            {invoices.map((inv) => {
              const statusTheme = INVOICE_STATUS_COLORS[inv.status] || INVOICE_STATUS_COLORS.DRAFT;

              return (
                <tr key={inv._id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-stone-900">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-bold text-stone-800">
                    {inv.customer?.name || 'Walk-in Client'}
                    <span className="block text-[11px] text-stone-400 font-mono font-normal">
                      +{inv.customer?.phone}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-stone-900 text-xs tabular-nums">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-emerald-700 font-medium">
                    {formatCurrency(inv.amountPaid)}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-bold text-rose-600">
                    {inv.amountDue > 0 ? formatCurrency(inv.amountDue) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      {inv.amountDue > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs px-2.5 py-1"
                          icon={IndianRupee}
                          onClick={() => handleOpenPayment(inv)}
                        >
                          Collect
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-2 py-1"
                        icon={Eye}
                        onClick={() => setReceiptInvoice(inv)}
                      >
                        Receipt
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(p) => loadInvoices(p)}
          />
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={Boolean(paymentInvoice)}
        onClose={() => setPaymentInvoice(null)}
        title="Record Client Payment"
        subtitle={`Invoice: ${paymentInvoice?.invoiceNumber} &bull; Outstanding Balance: ${formatCurrency(
          paymentInvoice?.amountDue || 0
        )}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input
            label="Payment Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            max={paymentInvoice?.amountDue}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={Object.values(PAYMENT_METHOD).map((m) => ({ value: m, label: m }))}
          />

          <Input
            label="Transaction / UPI Ref (Optional)"
            placeholder="e.g. UPI-1234567890"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button variant="secondary" size="sm" onClick={() => setPaymentInvoice(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isRecordingPayment}>
              Record & Generate Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Receipt Modal */}
      <Modal
        isOpen={Boolean(receiptInvoice)}
        onClose={() => setReceiptInvoice(null)}
        title="Invoice Details"
        subtitle={`Invoice ${receiptInvoice?.invoiceNumber}`}
        maxWidth="max-w-lg"
      >
        {receiptInvoice && (
          <div className="space-y-5 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div>
                <span className="text-stone-400 block">Customer</span>
                <span className="font-bold text-stone-900 text-sm">
                  {receiptInvoice.customer?.name}
                </span>
                <span className="text-stone-500 font-mono">+{receiptInvoice.customer?.phone}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block">Date</span>
                <span className="font-bold text-stone-900">
                  {new Date(receiptInvoice.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Line items */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Services Rendered
              </span>
              <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden bg-stone-50/50">
                {receiptInvoice.lineItems?.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-stone-900">{item.description}</span>
                      <span className="text-stone-400 block text-[11px]">
                        Qty: {item.quantity} &bull; Rate: {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                    <span className="font-bold text-stone-900 tabular-nums">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-2 pt-2 border-t border-stone-100 text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(receiptInvoice.subtotal)}</span>
              </div>
              {receiptInvoice.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Promo Discount</span>
                  <span>-{formatCurrency(receiptInvoice.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxes (GST)</span>
                <span>{formatCurrency(receiptInvoice.totalTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-900 text-sm pt-2 border-t border-stone-200">
                <span>Total Amount</span>
                <span className="font-bold tabular-nums">{formatCurrency(receiptInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Amount Paid</span>
                <span>{formatCurrency(receiptInvoice.amountPaid)}</span>
              </div>
              {receiptInvoice.amountDue > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Balance Due</span>
                  <span>{formatCurrency(receiptInvoice.amountDue)}</span>
                </div>
              )}
            </div>

            {/* Payments history */}
            {receiptInvoice.payments?.length > 0 && (
              <div className="pt-3 border-t border-stone-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  Payment History
                </span>
                <div className="space-y-1.5">
                  {receiptInvoice.payments.map((p, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-stone-50 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-bold text-stone-900">{p.method}</span>
                        {p.referenceNumber && (
                          <span className="text-stone-400 ml-2 font-mono">({p.referenceNumber})</span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-700">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminBillingPage;
