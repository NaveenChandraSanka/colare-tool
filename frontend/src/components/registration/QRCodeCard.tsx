import { useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeCardProps {
  url: string;
  eventName: string;
}

export function QRCodeCard({ url, eventName }: QRCodeCardProps) {
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadQR = useCallback(() => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `${eventName}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }, [eventName]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registration QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div ref={svgRef} className="rounded-lg bg-white p-4">
          <QRCodeSVG value={url} size={180} />
        </div>
        <p className="max-w-[200px] break-all text-center text-xs text-muted-foreground">
          {url}
        </p>
        <Button variant="outline" size="sm" onClick={downloadQR}>
          <Download className="mr-2 h-4 w-4" />
          Download PNG
        </Button>
      </CardContent>
    </Card>
  );
}
