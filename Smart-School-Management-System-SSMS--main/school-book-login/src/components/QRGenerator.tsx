import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRGeneratorProps {
  value: string;
  size?: number;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ value, size = 128 }) => {
  return (
    <div className="p-2 bg-white rounded-lg inline-block">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
};
