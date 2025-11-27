'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { removeBackground } from '@imgly/background-removal';

type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

type BrushMode = 'none' | 'erase' | 'restore' | 'blur' | 'clone';

export default function ImgToolPage() {
  const [fileName, setFileName] = useState<string>('image');
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<ImageFormat>('image/png');
  const [quality, setQuality] = useState<number>(0.92);
  const [targetWidth, setTargetWidth] = useState<number | ''>('');
  const [targetHeight, setTargetHeight] = useState<number | ''>('');
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDraggingSel, setIsDraggingSel] = useState<boolean>(false);
  const [brushMode, setBrushMode] = useState<BrushMode>('none');
  const [brushSize, setBrushSize] = useState<number>(24);
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // If background image is set, draw it behind with cover behavior
    if (bgImage) {
      const off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      const octx = off.getContext('2d');
      if (octx) {
        // draw bg to cover canvas
        const scale = Math.max(canvas.width / bgImage.width, canvas.height / bgImage.height);
        const dw = bgImage.width * scale;
        const dh = bgImage.height * scale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;
        octx.drawImage(bgImage, dx, dy, dw, dh);
        // draw current image on top already drawn by ctx above
        // merge
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(off, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    // selection rectangle
    if (selection) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeRect(selection.x + 0.5, selection.y + 0.5, selection.w, selection.h);
      ctx.restore();
    }

    // overlay drawing for brush previews
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.width = canvas.width;
      overlay.height = canvas.height;
    }
  }, [image, bgImage, selection]);

  useEffect(() => {
    draw();
  }, [draw]);

  const loadImageFromFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setLoadedUrl(url);
      setFileName(file.name.replace(/\.[^.]+$/, ''));
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.crossOrigin = 'anonymous';
    img.src = url;
  }, []);

  const loadBgFromFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBgImage(img);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.crossOrigin = 'anonymous';
    img.src = url;
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (brushMode === 'none') {
      setSelection({ x, y, w: 0, h: 0 });
      setIsDraggingSel(true);
    } else if (brushMode === 'clone' && e.altKey) {
      setCloneSource({ x, y });
    } else {
      paintAt(x, y, e.buttons === 1);
    }
  }, [brushMode]);

  const handlePointerMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // brush preview circle
    const octx = overlay.getContext('2d');
    if (octx) {
      overlay.width = overlay.width; // clear
      if (brushMode !== 'none') {
        octx.beginPath();
        octx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        octx.strokeStyle = 'rgba(59,130,246,0.9)';
        octx.lineWidth = 1.5;
        octx.setLineDash([4, 4]);
        octx.stroke();
      }
    }

    if (isDraggingSel && selection) {
      const nx = Math.min(selection.x, x);
      const ny = Math.min(selection.y, y);
      const nw = Math.abs(x - selection.x);
      const nh = Math.abs(y - selection.y);
      setSelection({ x: nx, y: ny, w: nw, h: nh });
    }

    if (brushMode !== 'none' && e.buttons === 1) {
      paintAt(x, y, true);
    }
  }, [brushMode, brushSize, isDraggingSel, selection]);

  const handlePointerUp = useCallback(() => {
    setIsDraggingSel(false);
  }, []);

  const paintAt = useCallback((x: number, y: number, apply: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const r = Math.max(2, Math.floor(brushSize / 2));

    if (!apply) return;

    if (brushMode === 'blur') {
      // simple stack blur approximation by repeated drawImage scale trick
      const sx = Math.max(0, x - r);
      const sy = Math.max(0, y - r);
      const sw = Math.min(canvas.width - sx, r * 2);
      const sh = Math.min(canvas.height - sy, r * 2);
      if (sw <= 0 || sh <= 0) return;
      const off = document.createElement('canvas');
      off.width = sw;
      off.height = sh;
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      // downscale then upscale for blur
      const k = 0.25;
      const dw = Math.max(1, Math.floor(sw * k));
      const dh = Math.max(1, Math.floor(sh * k));
      const tiny = document.createElement('canvas');
      tiny.width = dw;
      tiny.height = dh;
      const tctx = tiny.getContext('2d');
      if (!tctx) return;
      tctx.imageSmoothingEnabled = true;
      tctx.drawImage(off, 0, 0, dw, dh);
      octx.clearRect(0, 0, sw, sh);
      octx.imageSmoothingEnabled = true;
      octx.drawImage(tiny, 0, 0, sw, sh);
      ctx.drawImage(off, sx, sy);
    } else if (brushMode === 'erase' || brushMode === 'restore') {
      // erase: make area transparent; restore: undo erase from loaded original
      const sx = Math.max(0, x - r);
      const sy = Math.max(0, y - r);
      const sw = Math.min(canvas.width - sx, r * 2);
      const sh = Math.min(canvas.height - sy, r * 2);
      const path = new Path2D();
      path.arc(x, y, r, 0, Math.PI * 2);
      ctx.save();
      ctx.clip(path);
      if (brushMode === 'erase') {
        ctx.clearRect(sx, sy, sw, sh);
      } else if (brushMode === 'restore' && image) {
        ctx.drawImage(image, sx, sy, sw, sh, sx, sy, sw, sh);
      }
      ctx.restore();
    } else if (brushMode === 'clone') {
      if (!cloneSource) return;
      const dx = x - cloneSource.x;
      const dy = y - cloneSource.y;
      const srcX = Math.max(0, x - r - dx);
      const srcY = Math.max(0, y - r - dy);
      const sw = Math.min(canvas.width - srcX, r * 2);
      const sh = Math.min(canvas.height - srcY, r * 2);
      if (sw <= 0 || sh <= 0) return;
      const off = document.createElement('canvas');
      off.width = sw;
      off.height = sh;
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.drawImage(canvas, srcX, srcY, sw, sh, 0, 0, sw, sh);
      ctx.save();
      const path = new Path2D();
      path.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip(path);
      ctx.drawImage(off, x - r, y - r);
      ctx.restore();
    }
  }, [brushMode, brushSize, cloneSource, image]);

  const cropToSelection = useCallback(() => {
    if (!canvasRef.current || !selection) return;
    const { x, y, w, h } = selection;
    const src = canvasRef.current;
    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.floor(w));
    off.height = Math.max(1, Math.floor(h));
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.drawImage(src, x, y, w, h, 0, 0, off.width, off.height);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setSelection(null);
    };
    img.src = off.toDataURL('image/png');
  }, [selection]);

  const applyResize = useCallback(() => {
    if (!canvasRef.current) return;
    const src = canvasRef.current;
    let newW = typeof targetWidth === 'number' ? targetWidth : src.width;
    let newH = typeof targetHeight === 'number' ? targetHeight : src.height;
    if (keepAspect) {
      const aspect = src.width / src.height;
      if (typeof targetWidth === 'number' && (targetHeight === '' || targetHeight === 0)) {
        newH = Math.round(targetWidth / aspect);
      } else if (typeof targetHeight === 'number' && (targetWidth === '' || targetWidth === 0)) {
        newW = Math.round(targetHeight * aspect);
      }
    }
    if (!newW || !newH) return;
    const off = document.createElement('canvas');
    off.width = newW;
    off.height = newH;
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(src, 0, 0, newW, newH);
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = off.toDataURL('image/png');
  }, [targetWidth, targetHeight, keepAspect]);

  const doRemoveBackground = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      setIsProcessing(true);
      const blob = await new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, 'image/png'));
      if (!blob) return;
      const file = new File([blob], 'input.png', { type: 'image/png' });
      const output = await removeBackground(file);
      const url = URL.createObjectURL(output);
      const img = new Image();
      img.onload = () => {
        setImage(img);
      };
      img.src = url;
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL(format, quality);
    const a = document.createElement('a');
    a.href = dataUrl;
    const ext = format.split('/')[1] || 'png';
    a.download = `${fileName || 'image'}.${ext}`;
    a.click();
  }, [format, quality, fileName]);

  const disabled = useMemo(() => !image, [image]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">图片处理（img）</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            裁剪、调整分辨率/尺寸、压缩、格式转换、背景去除/添加、水印去除
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) loadImageFromFile(f);
                  }}
                />
                <Button onClick={() => fileInputRef.current?.click()}>选择图片</Button>
                <Input
                  placeholder="文件名（导出用）"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  inputSize="sm"
                  className="w-48"
                />

                <div className="ml-auto flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">格式</label>
                  <select
                    className="px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ImageFormat)}
                  >
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/webp">WEBP</option>
                    <option value="image/avif">AVIF</option>
                  </select>
                  <label className="text-sm text-gray-600 dark:text-gray-300">质量</label>
                  <input
                    type="number"
                    step={0.01}
                    min={0.1}
                    max={1}
                    value={quality}
                    onChange={(e) => setQuality(Math.max(0.1, Math.min(1, Number(e.target.value) || 0.92)))}
                    className="w-24 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <Button onClick={exportImage} disabled={disabled}>
                    导出
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">宽</span>
                  <Input
                    inputSize="sm"
                    type="number"
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-28"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">高</span>
                  <Input
                    inputSize="sm"
                    type="number"
                    value={targetHeight}
                    onChange={(e) => setTargetHeight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-28"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 ml-2">
                    <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} />
                    保持比例
                  </label>
                </div>
                <Button variant="secondary" onClick={applyResize} disabled={disabled}>
                  调整尺寸/分辨率
                </Button>
                <Button variant="secondary" onClick={cropToSelection} disabled={disabled || !selection}>
                  裁剪选区
                </Button>
              </div>
            </Card>

            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">画笔</span>
                  <select
                    className="px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    value={brushMode}
                    onChange={(e) => setBrushMode(e.target.value as BrushMode)}
                  >
                    <option value="none">无</option>
                    <option value="erase">去背景（擦除）</option>
                    <option value="restore">还原原图</option>
                    <option value="blur">模糊（去水印）</option>
                    <option value="clone">克隆（去水印）</option>
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-300">大小</span>
                  <input
                    type="range"
                    min={6}
                    max={128}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                  />
                  {brushMode === 'clone' && (
                    <span className="text-xs text-gray-500">按住 Alt 点击设置克隆源</span>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="warning" onClick={doRemoveBackground} disabled={disabled || isProcessing} isLoading={isProcessing}>
                    一键人物去背景
                  </Button>
                  <input
                    ref={bgFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) loadBgFromFile(f);
                    }}
                  />
                  <Button variant="secondary" onClick={() => bgFileInputRef.current?.click()} disabled={disabled}>
                    添加背景图
                  </Button>
                  <Button variant="ghost" onClick={() => setBgImage(null)} disabled={!bgImage}>
                    移除背景图
                  </Button>
                </div>
              </div>
            </Card>

            <div className="relative overflow-auto" style={{ maxHeight: '70vh' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                className="block max-w-full rounded-lg bg-white"
              />
              <canvas ref={overlayRef} className="pointer-events-none absolute inset-0" />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <Card>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                <div>1. 选择图片后，画布将按原始分辨率显示。</div>
                <div>2. 拖拽画布创建裁剪选区，然后点击裁剪选区。</div>
                <div>3. 设置宽高并调整尺寸/分辨率。</div>
                <div>4. 选择画笔：擦除/还原/模糊/克隆，用于背景与水印处理。</div>
                <div>5. 一键人物去背景将自动抠图，可再用画笔微调。</div>
                <div>6. 可添加背景图，导出时与前景合成。</div>
                <div>7. 选择导出格式与质量，点击导出。</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}