import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Doc } from '../models/Document';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const formatDoc = (doc: any) => ({
  _id: doc._id,
  name: doc.name,
  originalName: doc.originalName,
  fileType: doc.fileType,
  mimeType: doc.mimeType,
  size: doc.size,
  uploadedBy: doc.uploadedBy,
  sharedWith: doc.sharedWith,
  version: doc.version,
  status: doc.status,
  signature: doc.signature
    ? {
        imageUrl: `/uploads/${path.basename(doc.signature.imagePath)}`,
        signedBy: doc.signature.signedBy,
        signedAt: doc.signature.signedAt,
      }
    : undefined,
  isShared: doc.isShared,
  downloadUrl: `/api/documents/${doc._id}/download`,
  previewUrl: `/uploads/${path.basename(doc.filePath)}`,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { name } = req.body;
    const docName = name || req.file.originalname;

    const document = await Doc.create({
      name: docName,
      originalName: req.file.originalname,
      fileType: path.extname(req.file.originalname).replace('.', '').toUpperCase(),
      mimeType: req.file.mimetype,
      size: req.file.size,
      filePath: req.file.path,
      uploadedBy: req.user!._id,
      sharedWith: [],
      version: 1,
      status: 'active',
      isShared: false,
    });

    const populated = await document.populate([
      { path: 'uploadedBy', select: 'name avatarUrl email role' },
      { path: 'sharedWith', select: 'name avatarUrl email role' },
    ]);

    res.status(201).json(formatDoc(populated));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get all documents for current user (own + shared)
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status } = req.query;

    const query: Record<string, unknown> = {
      $or: [{ uploadedBy: userId }, { sharedWith: userId }],
    };
    if (status) query.status = status;

    const documents = await Doc.find(query)
      .populate('uploadedBy', 'name avatarUrl email role')
      .populate('sharedWith', 'name avatarUrl email role')
      .sort({ createdAt: -1 });

    res.status(200).json(documents.map(formatDoc));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get a single document by ID
// @route   GET /api/documents/:id
// @access  Private
export const getDocumentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await Doc.findById(req.params.id)
      .populate('uploadedBy', 'name avatarUrl email role')
      .populate('sharedWith', 'name avatarUrl email role');

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isOwner = document.uploadedBy._id.toString() === userId;
    const isShared = document.sharedWith.some((u: any) => u._id.toString() === userId);

    if (!isOwner && !isShared) {
      res.status(403).json({ message: 'Not authorized to view this document' });
      return;
    }

    res.status(200).json(formatDoc(document));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Download a document
// @route   GET /api/documents/:id/download
// @access  Private
export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await Doc.findById(req.params.id);

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isOwner = document.uploadedBy.toString() === userId;
    const isShared = document.sharedWith.some((id: any) => id.toString() === userId);

    if (!isOwner && !isShared) {
      res.status(403).json({ message: 'Not authorized to download this document' });
      return;
    }

    if (!fs.existsSync(document.filePath)) {
      res.status(404).json({ message: 'File not found on server' });
      return;
    }

    res.download(document.filePath, document.originalName);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Preview a document (serve inline for browser rendering)
// @route   GET /api/documents/:id/preview
// @access  Private
export const previewDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await Doc.findById(req.params.id);

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isOwner = document.uploadedBy.toString() === userId;
    const isShared = document.sharedWith.some((id: any) => id.toString() === userId);

    if (!isOwner && !isShared) {
      res.status(403).json({ message: 'Not authorized to preview this document' });
      return;
    }

    if (!fs.existsSync(document.filePath)) {
      res.status(404).json({ message: 'File not found on server' });
      return;
    }

    res.setHeader('Content-Type', document.mimeType);
    res.sendFile(document.filePath);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Share document with a user
// @route   PUT /api/documents/:id/share
// @access  Private
export const shareDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await Doc.findById(req.params.id);

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (document.uploadedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Only the owner can share this document' });
      return;
    }

    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const userToShare = await User.findById(userId);
    if (!userToShare) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (document.sharedWith.some((id: any) => id.toString() === userId)) {
      res.status(400).json({ message: 'Document is already shared with this user' });
      return;
    }

    document.sharedWith.push(userId as any);
    document.isShared = true;
    await document.save();

    const populated = await document.populate([
      { path: 'uploadedBy', select: 'name avatarUrl email role' },
      { path: 'sharedWith', select: 'name avatarUrl email role' },
    ]);

    res.status(200).json(formatDoc(populated));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Sign a document with a signature image
// @route   PUT /api/documents/:id/sign
// @access  Private
export const signDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await Doc.findById(req.params.id);

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isOwner = document.uploadedBy.toString() === userId;
    const isShared = document.sharedWith.some((id: any) => id.toString() === userId);

    if (!isOwner && !isShared) {
      res.status(403).json({ message: 'Not authorized to sign this document' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No signature image uploaded' });
      return;
    }

    document.signature = {
      imagePath: req.file.path,
      signedBy: req.user!._id as any,
      signedAt: new Date(),
    };

    document.status = 'active';
    await document.save();

    const populated = await document.populate([
      { path: 'uploadedBy', select: 'name avatarUrl email role' },
      { path: 'sharedWith', select: 'name avatarUrl email role' },
    ]);

    res.status(200).json(formatDoc(populated));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Update document status
// @route   PUT /api/documents/:id/status
// @access  Private
export const updateDocumentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await Doc.findById(req.params.id);

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (document.uploadedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Only the owner can update this document' });
      return;
    }

    const { status } = req.body;
    if (!['draft', 'active', 'archived'].includes(status)) {
      res.status(400).json({ message: 'Invalid status. Must be draft, active, or archived' });
      return;
    }

    document.status = status;
    await document.save();

    const populated = await document.populate([
      { path: 'uploadedBy', select: 'name avatarUrl email role' },
      { path: 'sharedWith', select: 'name avatarUrl email role' },
    ]);

    res.status(200).json(formatDoc(populated));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await Doc.findById(req.params.id);

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (document.uploadedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Only the owner can delete this document' });
      return;
    }

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    if (document.signature?.imagePath && fs.existsSync(document.signature.imagePath)) {
      fs.unlinkSync(document.signature.imagePath);
    }

    await Doc.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
