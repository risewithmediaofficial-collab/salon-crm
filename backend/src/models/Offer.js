import mongoose from 'mongoose';
import { OFFER_TYPE } from '../constants/index.js';

const { Schema } = mongoose;

const offerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 300,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
      sparse: true,
    },
    type: {
      type: String,
      enum: Object.values(OFFER_TYPE),
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    // Max discount cap (for percentage offers)
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    // Minimum order amount to qualify
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    // Applicable services (empty = all services)
    applicableServices: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    startDate: Date,
    endDate: Date,
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

export default mongoose.model('Offer', offerSchema);
