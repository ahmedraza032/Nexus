import mongoose, { Schema, Document, Types } from 'mongoose';

export type ConnectionStatusType = 'pending' | 'accepted' | 'rejected';

export interface IConnection extends Document {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: ConnectionStatusType;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const connectionSchema = new Schema<IConnection>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    message: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// Prevent duplicate connection requests between the same pair
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
// Fast lookup for status checks
connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });

export const Connection = mongoose.model<IConnection>('Connection', connectionSchema);
