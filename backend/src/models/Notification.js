import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '../constants/index.js';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      refPath: 'recipientModel',
      required: true,
    },
    recipientModel: {
      type: String,
      enum: ['Customer', 'User'],
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: true,
    },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    relatedEntityType: String,
    relatedEntityId: Schema.Types.ObjectId,
    // For SMS notifications
    smsSent: { type: Boolean, default: false },
    smsSentAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
