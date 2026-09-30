import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError: (error: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const [hasPermissionError, setHasPermissionError] = useState(false);
  
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-200">
        <p className="font-bold">Camera Unavailable</p>
        <p className="text-xs">Your browser blocked camera access. Please use localhost or HTTPS.</p>
      </div>
    );
  }

  if (hasPermissionError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-200">
        <p className="font-bold">Permission Denied</p>
        <p className="text-xs">Please allow camera permissions in your browser settings to scan QR codes.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <QrReader
        onResult={(result, error) => {
          if (result) {
            onScan(result.getText());
          }
          if (error) {
            if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
              setHasPermissionError(true);
            } else if (error.message !== 'No QR code found') {
              onError(error.message);
            }
          }
        }}
        constraints={{ facingMode: 'environment' }}
        className="w-full rounded-2xl overflow-hidden"
      />
    </div>
  );
};
