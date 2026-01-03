import mongoose, { Schema, Document } from 'mongoose';

export interface IWaitlist extends Document {
  email: string;
  position: number;
  notified?: boolean;
  notifiedAt?: Date;
  registeredAt?: Date;
}

const WaitlistSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    position: {
      type: Number,
      required: true,
    },
    notified: {
      type: Boolean,
      default: false,
    },
    notifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
WaitlistSchema.index({ email: 1 });
WaitlistSchema.index({ position: 1 });

export default mongoose.model<IWaitlist>('Waitlist', WaitlistSchema);

