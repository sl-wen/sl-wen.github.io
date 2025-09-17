'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export default function QrGeneratorPage() {
  const [text, setText] = useState<string>('https://example.com');
  const [size, setSize] = useState<number>(256);
  const [foreground, setForeground] = useState<string>('#000000');
  const [background, setBackground] = useState<string>('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderQR = useCallback(async () => {
    const QRCode = (await import('qrcode')).default;
    const canvas = canvasRef.current;
    if (!canvas) return;
    await QRCode.toCanvas(canvas, text, {
      width: size,
      color: { dark: foreground, light: background }
    } as any);
  }, [background, foreground, size, text]);

  useEffect(() => { renderQR(); }, [renderQR]);

  const download = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'qr.png'; a.click();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">二维码生成器</h1>
          <div className="flex gap-2">
            <Button onClick={renderQR}>生成</Button>
            <Button variant="secondary" onClick={download}>下载</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <Textarea value={text} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)} inputSize="lg" fullWidth autoResize className="h-[240px]" />

            <div className="mt-4 grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">尺寸</label>
                <input type="number" className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" value={size} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSize(Math.max(64, Math.min(1024, Number(e.target.value))))} />
              </div>
              <div className="flex gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">前景</label>
                  <input type="color" className="mt-1 block w-12 h-10" value={foreground} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForeground(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">背景</label>
                  <input type="color" className="mt-1 block w-12 h-10" value={background} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBackground(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center justify-center">
            <canvas ref={canvasRef} width={size} height={size} className="rounded border" />
          </div>
        </div>
      </div>
    </div>
  );
}

