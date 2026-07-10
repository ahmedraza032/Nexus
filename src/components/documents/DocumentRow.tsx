import React from 'react';
import { FileText, Download, Share2, PenTool, Trash2, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AppDocument } from '../../types';

interface DocumentRowProps {
  document: AppDocument;
  onView: (doc: AppDocument) => void;
  onDownload: (doc: AppDocument) => void;
  onShare: (doc: AppDocument) => void;
  onSign: (doc: AppDocument) => void;
  onDelete: (doc: AppDocument) => void;
}

const fileTypeIcons: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  DOCX: 'bg-blue-50 text-blue-600',
  DOC: 'bg-blue-50 text-blue-600',
  XLSX: 'bg-green-50 text-green-600',
  XLS: 'bg-green-50 text-green-600',
  PNG: 'bg-purple-50 text-purple-600',
  JPG: 'bg-purple-50 text-purple-600',
  JPEG: 'bg-purple-50 text-purple-600',
};

const statusColors: Record<string, 'secondary' | 'success' | 'warning' | 'error'> = {
  draft: 'warning',
  active: 'success',
  archived: 'secondary',
};

const DocumentRow: React.FC<DocumentRowProps> = ({
  document: doc,
  onView,
  onDownload,
  onShare,
  onSign,
  onDelete,
}) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPDF = doc.mimeType === 'application/pdf';
  const iconColor = fileTypeIcons[doc.fileType] || 'bg-gray-50 text-gray-600';

  return (
    <div className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 group">
      <div className={`p-2 rounded-lg mr-4 ${iconColor}`}>
        <FileText size={24} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(doc)}
            className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors text-left"
          >
            {doc.name}
          </button>
          {doc.isShared && <Badge variant="secondary" size="sm">Shared</Badge>}
          {doc.signature && <Badge variant="success" size="sm">Signed</Badge>}
          <Badge variant={statusColors[doc.status]} size="sm">
            {doc.status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          <span>{doc.fileType}</span>
          <span>{formatSize(doc.size)}</span>
          <span>v{doc.version}</span>
          <span>by {doc.uploadedBy?.name || 'Unknown'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="p-2" aria-label="View" onClick={() => onView(doc)}>
          <Eye size={18} />
        </Button>

        <Button variant="ghost" size="sm" className="p-2" aria-label="Share" onClick={() => onShare(doc)}>
          <Share2 size={18} />
        </Button>

        {!doc.signature && (
          <Button variant="ghost" size="sm" className="p-2" aria-label="Sign" onClick={() => onSign(doc)}>
            <PenTool size={18} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-error-600 hover:text-error-700"
          aria-label="Delete"
          onClick={() => onDelete(doc)}
        >
          <Trash2 size={18} />
        </Button>
      </div>
    </div>
  );
};

export default DocumentRow;
