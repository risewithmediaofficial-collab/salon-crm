import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Customer — portal users who book appointments via OTP auth.
 * Separate from User to keep auth flows distinct.
 */
const customerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 15,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 255,
      sparse: true, // allows multiple null values
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    // OTP auth fields — sensitive, not selected by default
    otpHash: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    otpLockedUntil: {
      type: Date,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    // Loyalty / stats — denormalized for dashboard performance
    totalVisits: {
      type: Number,
      default: 0,
    },
    totalSpend: {
      type: Number,
      default: 0,
    },
    lastVisitAt: Date,
    notes: {
      type: String,
      maxlength: 500,
    },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.otpHash;
        delete ret.otpExpiresAt;
        delete ret.otpAttempts;
        delete ret.otpLockedUntil;
        delete ret.refreshTokenHash;
        return ret;
      },
    },
  }
);

customerSchema.index({ name: 'text' }); // text search
customerSchema.index({ createdAt: -1 });

export default mongoose.model('Customer', customerSchema);
