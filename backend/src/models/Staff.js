import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Working hours per day of week: 0=Sun … 6=Sat
 */
const workingHourSchema = new Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    isWorking: { type: Boolean, default: true },
    startTime: { type: String, default: '09:00' }, // "HH:MM"
    endTime: { type: String, default: '18:00' }, // "HH:MM"
  },
  { _id: false }
);

/**
 * Leave/block — a date range when a staff member is unavailable
 */
const leaveSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, maxlength: 200 },
  },
  { _id: true, timestamps: false }
);

const staffSchema = new Schema(
  {
    // Link to User account for login
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 15,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    bio: {
      type: String,
      maxlength: 300,
    },
    avatarUrl: String,
    // Services this staff can perform
    services: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    workingHours: [workingHourSchema],
    leaves: [leaveSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Aggregated stats (denormalized)
    totalAppointments: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

staffSchema.index({ isActive: 1 });

export default mongoose.model('Staff', staffSchema);
