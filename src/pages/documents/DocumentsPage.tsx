import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Search, Filter, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import DocumentRow from '../../components/documents/DocumentRow';
import UploadDocumentModal from '../../components/documents/UploadDocumentModal';
import DocumentViewerModal from '../../components/documents/DocumentViewerModal';
import SignaturePad from '../../components/documents/SignaturePad';
import { AppDocument } from '../../types';
import {
  uploadDocument,
  getDocuments,
  downloadDocument as downloadDoc,
  shareDocument,
  signDocument,
  deleteDocument,
} from '../../api/documentApi';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [activeDocument, setActiveDocument] = useState<AppDocument | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signingDocId, setSigningDocId] = useState<string>('');
  const [shareDocId, setShareDocId] = useState<string>('');
  const [shareUserId, setShareUserId] = useState('');
  const [showShareInput, setShowShareInput] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = async (formData: FormData) => {
    await uploadDocument(formData);
    toast.success('Document uploaded successfully');
    fetchDocs();
  };

  const handleView = (doc: AppDocument) => {
    setActiveDocument(doc);
    setShowViewer(true);
  };

  const handleDownload = async (doc: AppDocument) => {
    try {
      const response = await downloadDoc(doc._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download document');
    }
  };

  const handleShare = (doc: AppDocument) => {
    setShareDocId(doc._id);
    setShareUserId('');
    setShowShareInput(true);
  };

  const handleShareSubmit = async () => {
    if (!shareUserId.trim()) return;
    try {
      await shareDocument(shareDocId, shareUserId.trim());
      toast.success('Document shared');
      setShowShareInput(false);
      fetchDocs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to share document');
    }
  };

  const handleSign = (doc: AppDocument) => {
    setSigningDocId(doc._id);
    setShowSignature(true);
  };

  const handleSignatureSave = async (signatureBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('signature', signatureBlob, 'signature.png');
      await signDocument(signingDocId, formData);
      toast.success('Document signed successfully');
      fetchDocs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to sign document');
    }
  };

  const handleDelete = async (doc: AppDocument) => {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    try {
      await deleteDocument(doc._id);
      toast.success('Document deleted');
      fetchDocs();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.originalName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSize = documents.reduce((sum, d) => sum + d.size, 0);
  const maxStorage = 20 * 1024 * 1024 * 1024;
  const usedPercent = Math.min((totalSize / maxStorage) * 100, 100);

  const formatStorage = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage and sign your important documents</p>
        </div>
        <Button leftIcon={<Upload size={18} />} onClick={() => setShowUpload(true)}>
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <HardDrive size={20} className="text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{formatStorage(totalSize)} used</p>
                <p className="text-xs text-gray-500">of 20 GB</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-primary-600 rounded-full transition-all"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{documents.length} documents</span>
              <span>{formatStorage(maxStorage - totalSize)} free</span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
              <div className="space-y-1">
                {['all', 'active', 'draft', 'archived'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      statusFilter === s ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-48"
                  />
                </div>
                <Button variant="outline" size="sm" leftIcon={<Filter size={14} />}>
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileIcon className="mx-auto mb-3" />
                  <p className="text-sm">No documents found</p>
                  <p className="text-xs mt-1">Upload your first document to get started</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDocs.map((doc) => (
                    <DocumentRow
                      key={doc._id}
                      document={doc}
                      onView={handleView}
                      onDownload={handleDownload}
                      onShare={handleShare}
                      onSign={handleSign}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}

              {showShareInput && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Share Document</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter user ID to share with..."
                      value={shareUserId}
                      onChange={(e) => setShareUserId(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button size="sm" onClick={handleShareSubmit}>
                      Share
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowShareInput(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <UploadDocumentModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />

      <DocumentViewerModal
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        document={activeDocument}
      />

      <SignaturePad
        isOpen={showSignature}
        onClose={() => setShowSignature(false)}
        onSave={handleSignatureSave}
      />
    </div>
  );
};

const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export { DocumentsPage };
