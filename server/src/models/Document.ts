import mongoose, { Schema, Document, Types } from 'mongoose';

export type DocumentStatus = 'draft' | 'active' | 'archived';

export interface ISignature {
  imagePath: string;
  signedBy: Types.ObjectId;
  signedAt: Date;
}

export interface IDocument extends Document {
  name: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  size: number;
  filePath: string;
  uploadedBy: Types.ObjectId;
  sharedWith: Types.ObjectId[];
  version: number;
  status: DocumentStatus;
  signature?: ISignature;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const signatureSchema = new Schema<ISignature>(
  {
    imagePath: { type: String, required: true },
    signedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    signedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new Schema<IDocument>(
  {
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    filePath: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active',
    },
    signature: { type: signatureSchema, default: undefined },
    isShared: { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ sharedWith: 1 });
documentSchema.index({ status: 1 });

export const Doc = mongoose.model<IDocument>('Document', documentSchema);
