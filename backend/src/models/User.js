import mongoose from 'mongoose';
import { ROLES } from '../constants/index.js';

const { Schema } = mongoose;

/**
 * User — admin/manager/staff portal users
 * Customers are separate (Customer.js) to keep auth flows clean.
 */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES).filter((r) => r !== ROLES.CUSTOMER),
      required: true,
      default: ROLES.STAFF,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
    // Refresh token hashed for rotation strategy
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        return ret;
      },
    },
  }
);

// Compound index: email is already unique; index role for RBAC queries
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);
