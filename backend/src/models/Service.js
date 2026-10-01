import mongoose from 'mongoose';
import { SERVICE_CATEGORY } from '../constants/index.js';

const { Schema } = mongoose;

const serviceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      enum: Object.values(SERVICE_CATEGORY),
      required: true,
    },
    // Duration in minutes
    duration: {
      type: Number,
      required: true,
      min: 5,
      max: 480,
    },
    // Buffer time after service (in minutes) before next booking can start
    bufferTime: {
      type: Number,
      default: 0,
      min: 0,
      max: 60,
    },
    // Price in INR (paisa not used; store as number with 2 decimal precision)
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Tax rate override per service (falls back to global TAX_RATE if null)
    taxRate: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    imageUrl: String,
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Service', serviceSchema);
