import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { AppDocument } from '../../types';
import { downloadDocument } from '../../api/documentApi';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument | null;
}

const getAuthHeaders = () => {
  try {
    const stored = localStorage.getItem('business_nexus_user');
    const token = stored ? JSON.parse(stored).token : '';
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
};

const DocumentViewerModal: React.FC<Props> = ({ isOpen, onClose, document: doc }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [docxHtml, setDocxHtml] = useState('');
  const [xlsxHtml, setXlsxHtml] = useState('');
  const [viewerType, setViewerType] = useState<'pdf' | 'docx' | 'xlsx' | 'image' | 'unsupported'>('unsupported');
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (!isOpen || !doc) return;

    setLoading(true);
    setError('');
    setBlobUrl('');
    setDocxHtml('');
    setXlsxHtml('');

    const mime = doc.mimeType;
    const url = `${import.meta.env.VITE_API_URL}/api/documents/${doc._id}/preview`;

    fetch(url, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(async (blob) => {
        const blobUrl_ = URL.createObjectURL(blob);

        if (mime === 'application/pdf') {
          setViewerType('pdf');
          setBlobUrl(blobUrl_);
        } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mime === 'application/msword') {
          setViewerType('docx');
          const buffer = await blob.arrayBuffer();
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          setDocxHtml(result.value);
          URL.revokeObjectURL(blobUrl_);
        } else if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mime === 'application/vnd.ms-excel') {
          setViewerType('xlsx');
          const buffer = await blob.arrayBuffer();
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
          let html = '';
          workbook.SheetNames.forEach((name: string) => {
            const sheet = workbook.Sheets[name];
            html += `<div class="mb-6"><h3 class="text-base font-semibold text-gray-800 mb-2 px-1">${name}</h3>${XLSX.utils.sheet_to_html(sheet, { id: '', editable: false })}</div>`;
          });
          setXlsxHtml(html);
          URL.revokeObjectURL(blobUrl_);
        } else if (mime.startsWith('image/')) {
          setViewerType('image');
          setBlobUrl(blobUrl_);
        } else {
          setViewerType('unsupported');
          URL.revokeObjectURL(blobUrl_);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load document');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, doc?._id]);

  if (!isOpen || !doc) return null;

  const handleDownload = async () => {
    try {
      const response = await downloadDocument(doc._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // fallback
    }
  };

  const changePage = (d: number) => setPageNumber((p) => Math.min(Math.max(p + d, 1), numPages));
  const changeZoom = (d: number) => setScale((s) => Math.min(Math.max(s + d, 0.5), 2.5));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fade-in">
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 truncate">{doc.originalName}</h2>
            <p className="text-xs text-gray-500">{doc.fileType}</p>
          </div>
          <div className="flex items-center gap-2">
            {(viewerType === 'pdf' || viewerType === 'image') && (
              <>
                <Button variant="ghost" size="sm" className="p-2" onClick={() => changeZoom(-0.25)}><ZoomOut size={18} /></Button>
                <span className="text-sm text-gray-600 w-12 text-center">{Math.round(scale * 100)}%</span>
                <Button variant="ghost" size="sm" className="p-2" onClick={() => changeZoom(0.25)}><ZoomIn size={18} /></Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="p-2" onClick={handleDownload}><Download size={18} /></Button>
            <Button variant="ghost" size="sm" className="p-2" onClick={onClose}><X size={20} /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
          {loading && <Spinner />}

          {error && <ErrorView message={error} onDownload={handleDownload} />}

          {!loading && !error && viewerType === 'pdf' && blobUrl && (
            <Document file={blobUrl} onLoadSuccess={({ numPages: n }) => { setNumPages(n); setPageNumber(1); }} onLoadError={(e) => setError(e.message)} loading={<Spinner />}>
              <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
          )}

          {!loading && !error && viewerType === 'docx' && docxHtml && (
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-sm p-8">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: docxHtml }} />
            </div>
          )}

          {!loading && !error && viewerType === 'xlsx' && xlsxHtml && (
            <div className="w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: `<style>table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #d1d5db;padding:6px 10px;text-align:left}th{background:#f3f4f6;font-weight:600}tr:nth-child(even){background:#f9fafb}</style>${xlsxHtml}` }} />
          )}

          {!loading && !error && viewerType === 'image' && blobUrl && (
            <img src={blobUrl} alt={doc.originalName} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} className="max-w-full rounded shadow-sm" />
          )}

          {!loading && !error && viewerType === 'unsupported' && <UnsupportedView fileType={doc.fileType} onDownload={handleDownload} />}
        </div>

        {!loading && !error && viewerType === 'pdf' && numPages > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <Button variant="outline" size="sm" disabled={pageNumber <= 1} onClick={() => changePage(-1)}><ChevronLeft size={16} className="mr-1" />Previous</Button>
            <span className="text-sm text-gray-600">Page {pageNumber} of {numPages}</span>
            <Button variant="outline" size="sm" disabled={pageNumber >= numPages} onClick={() => changePage(1)}>Next<ChevronRight size={16} className="ml-1" /></Button>
          </div>
        )}
      </div>
    </div>
  );
};

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
  </div>
);

const ErrorView: React.FC<{ message: string; onDownload: () => void }> = ({ message, onDownload }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
    <AlertTriangle size={48} className="text-error-500 mb-4" />
    <p className="text-sm font-medium text-gray-700">Failed to load document</p>
    <p className="text-xs text-gray-500 mt-1 max-w-md text-center">{message}</p>
    <Button variant="outline" size="sm" className="mt-4" onClick={onDownload}><Download size={16} className="mr-1" />Download instead</Button>
  </div>
);

const UnsupportedView: React.FC<{ fileType: string; onDownload: () => void }> = ({ fileType, onDownload }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
    <FileText size={48} className="text-gray-300 mb-4" />
    <p className="text-sm font-medium text-gray-700">Preview not available</p>
    <p className="text-xs text-gray-500 mt-1">This file type ({fileType}) cannot be previewed</p>
    <Button variant="outline" size="sm" className="mt-4" onClick={onDownload}><Download size={16} className="mr-1" />Download file</Button>
  </div>
);

export default DocumentViewerModal;
