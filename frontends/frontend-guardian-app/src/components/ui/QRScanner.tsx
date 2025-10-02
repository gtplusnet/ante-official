'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = () => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };

    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      config,
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        console.log('QR Code scanned:', decodedText);
        onScan(decodedText);
        stopScanner();
        onClose();
      },
      (errorMessage) => {
        // Ignore continuous scanning errors
        if (!errorMessage.includes('NotFoundException')) {
          console.error('QR Scan error:', errorMessage);
        }
      }
    );
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(error => {
        console.error('Failed to clear scanner', error);
      });
      scannerRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95">
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black via-black/70 to-transparent pb-20">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-white text-lg font-semibold">Scan QR Code</h2>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          <p className="text-white/80 text-center px-4 mt-2">
            Position the QR code within the frame
          </p>
        </div>

        {/* Scanner Container */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div id="qr-reader" className="w-full max-w-md rounded-lg overflow-hidden"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm text-white p-4 rounded-lg flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};