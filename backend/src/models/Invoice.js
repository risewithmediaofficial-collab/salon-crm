import mongoose from 'mongoose';
import { INVOICE_STATUS, PAYMENT_METHOD } from '../constants/index.js';

const { Schema } = mongoose;

const lineItemSchema = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    referenceNumber: String,
    paidAt: { type: Date, default: Date.now },
    notes: String,
  },
  { _id: true, timestamps: false }
);

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    lineItems: [lineItemSchema],
    subtotal: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.DRAFT,
    },
    payments: [paymentSchema],
    notes: { type: String, maxlength: 500 },
    issuedAt: Date,
    dueDate: Date,
  },
  { timestamps: true }
);

invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ appointment: 1 }, { unique: true });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issuedAt: -1 });

export default mongoose.model('Invoice', invoiceSchema);
