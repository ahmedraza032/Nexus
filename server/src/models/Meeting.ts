import mongoose, { Schema, Document, Types } from 'mongoose';

export type MeetingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface IMeeting extends Document {
  title: string;
  organizer: Types.ObjectId;
  attendee: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: MeetingStatus;
  message?: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attendee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    message: { type: String, trim: true },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound index for efficient conflict detection queries
meetingSchema.index({ organizer: 1, startTime: 1, endTime: 1 });
meetingSchema.index({ attendee: 1, startTime: 1, endTime: 1 });

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);
