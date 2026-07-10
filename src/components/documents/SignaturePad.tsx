import React, { useRef, useState } from 'react';
import { SignatureCanvas } from 'react-signature-canvas';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureBlob: Blob) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ isOpen, onClose, onSave }) => {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  if (!isOpen) return null;

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;

    const dataUrl = sigRef.current.toDataURL('image/png');
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    onSave(blob);
    sigRef.current.clear();
    setIsEmpty(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Draw Your Signature</h2>
          <Button variant="ghost" size="sm" className="p-2" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 200,
                className: 'w-full',
                style: { width: '100%', height: '200px' },
              }}
              onBegin={() => setIsEmpty(false)}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">Draw your signature above using mouse or touch</p>

          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="sm" onClick={handleClear}>
              <RotateCcw size={16} className="mr-1" /> Clear
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isEmpty}>
                Save Signature
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
