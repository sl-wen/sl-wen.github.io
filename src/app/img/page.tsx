'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { removeBackground } from '@imgly/background-removal';

type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

type ImgItem = {
  id: string;
  name: string;
  originalUrl: string; // object URL of original upload
  editedUrl: string | null; // data URL or object URL of current edits
  bgUrl: string | null; // object URL of background image if any
};

type BrushMode = 'none' | 'erase' | 'restore' | 'blur' | 'clone';

export default function ImgToolPage() {
  const [items, setItems] = useState<ImgItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
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

  const currentItem = useMemo(() => (currentIndex >= 0 ? items[currentIndex] : null), [items, currentIndex]);

  const loadHtmlImage = useCallback((src: string, cb: (img: HTMLImageElement) => void) => {
    const img = new Image();
    img.onload = () => cb(img);
    img.onerror = () => {
      // noop
    };
    img.crossOrigin = 'anonymous';
    img.src = src;
  }, []);

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

  const commitCanvasToCurrentItem = useCallback((): void => {
    if (!canvasRef.current || currentIndex < 0) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setItems((prev: ImgItem[]) => {
        const next = [...prev];
        const cur = next[currentIndex];
        if (cur) {
          next[currentIndex] = { ...cur, editedUrl: dataUrl };
        }
        return next;
      });
    } catch (e) {
      // ignore
    }
  }, [currentIndex]);

  const addFiles = useCallback((files: FileList | File[]): void => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const newItems: ImgItem[] = arr.map((f) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: f.name.replace(/\.[^.]+$/, ''),
      originalUrl: URL.createObjectURL(f),
      editedUrl: null,
      bgUrl: null,
    }));
    setItems((prev: ImgItem[]) => {
      const next = [...prev, ...newItems];
      // If nothing selected before, select first of new batch
      return next;
    });
    // Select first newly added if none selected
    setCurrentIndex((idx: number) => {
      if (idx >= 0) return idx;
      return 0;
    });
  }, []);

  const loadBgFromFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    loadHtmlImage(url, setBgImage);
    if (currentIndex >= 0) {
      setItems((prev: ImgItem[]) => {
        const next = [...prev];
        const cur = next[currentIndex];
        if (cur) next[currentIndex] = { ...cur, bgUrl: url };
        return next;
      });
    }
  }, [currentIndex, loadHtmlImage]);

  const selectItem = useCallback((index: number) => {
    if (index === currentIndex) return;
    // commit current canvas before switching
    if (currentIndex >= 0) commitCanvasToCurrentItem();
    setCurrentIndex(index);
  }, [currentIndex, commitCanvasToCurrentItem]);

  // Load image and bg for current item when currentIndex or items change
  useEffect(() => {
    if (currentIndex < 0 || !items[currentIndex]) return;
    const it = items[currentIndex];
    const imgSrc = it.editedUrl || it.originalUrl;
    loadHtmlImage(imgSrc, setImage);
    if (it.bgUrl) {
      loadHtmlImage(it.bgUrl, setBgImage);
    } else {
      setBgImage(null);
    }
  }, [items, currentIndex, loadHtmlImage]);

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
    // If painting, persist edits to current item
    if (brushMode !== 'none') {
      commitCanvasToCurrentItem();
    }
  }, [brushMode, commitCanvasToCurrentItem]);

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
    const dataUrl = off.toDataURL('image/png');
    loadHtmlImage(dataUrl, (img: HTMLImageElement) => {
      setImage(img);
      setSelection(null);
      // persist
      setItems((prev: ImgItem[]) => {
        if (currentIndex < 0) return prev;
        const next = [...prev];
        const cur = next[currentIndex];
        if (cur) next[currentIndex] = { ...cur, editedUrl: dataUrl };
        return next;
      });
    });
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
    const dataUrl = off.toDataURL('image/png');
    loadHtmlImage(dataUrl, (img: HTMLImageElement) => setImage(img));
    setItems((prev: ImgItem[]) => {
      if (currentIndex < 0) return prev;
      const next = [...prev];
      const cur = next[currentIndex];
      if (cur) next[currentIndex] = { ...cur, editedUrl: dataUrl };
      return next;
    });
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
      loadHtmlImage(url, (img: HTMLImageElement) => setImage(img));
      // store as edited for current item
      setItems((prev: ImgItem[]) => {
        if (currentIndex < 0) return prev;
        const next = [...prev];
        const cur = next[currentIndex];
        if (cur) next[currentIndex] = { ...cur, editedUrl: url };
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }, [currentIndex, loadHtmlImage]);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentIndex < 0 || !currentItem) return;
    const dataUrl = canvas.toDataURL(format, quality);
    const a = document.createElement('a');
    a.href = dataUrl;
    const ext = format.split('/')[1] || 'png';
    a.download = `${currentItem.name || 'image'}.${ext}`;
    a.click();
  }, [format, quality, currentIndex, currentItem]);

  const exportAll = useCallback(async () => {
    // Ensure current edits are saved
    commitCanvasToCurrentItem();
    const ext = format.split('/')[1] || 'png';
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it) continue;
      // render offscreen
      const baseUrl = it.editedUrl || it.originalUrl;
      const off = document.createElement('canvas');
      const baseImg = await new Promise<HTMLImageElement>((resolve) => loadHtmlImage(baseUrl, resolve));
      off.width = baseImg.naturalWidth;
      off.height = baseImg.naturalHeight;
      const ctx = off.getContext('2d');
      if (!ctx) continue;
      ctx.clearRect(0, 0, off.width, off.height);
      ctx.drawImage(baseImg, 0, 0);
      if (it.bgUrl) {
        const bgImg = await new Promise<HTMLImageElement>((resolve) => loadHtmlImage(it.bgUrl as string, resolve));
        const scale = Math.max(off.width / bgImg.width, off.height / bgImg.height);
        const dw = bgImg.width * scale;
        const dh = bgImg.height * scale;
        const dx = (off.width - dw) / 2;
        const dy = (off.height - dh) / 2;
        const under = document.createElement('canvas');
        under.width = off.width;
        under.height = off.height;
        const uctx = under.getContext('2d');
        if (uctx) {
          uctx.drawImage(bgImg, dx, dy, dw, dh);
          ctx.globalCompositeOperation = 'destination-over';
          ctx.drawImage(under, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      const dataUrl = off.toDataURL(format, quality);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${it.name || 'image'}.${ext}`;
      a.click();
    }
  }, [items, format, quality, commitCanvasToCurrentItem, loadHtmlImage]);

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
                  multiple
                  className="hidden"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files.length > 0) {
                      addFiles(e.target.files);
                    }
                    // reset to allow re-upload same files
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                <Button onClick={() => fileInputRef.current?.click()}>选择图片（可多选）</Button>
                <Input
                  placeholder="文件名（导出用）"
                  value={currentItem?.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const name = e.target.value;
                    setItems((prev: ImgItem[]) => {
                      if (currentIndex < 0) return prev;
                      const next = [...prev];
                      const cur = next[currentIndex];
                      if (cur) next[currentIndex] = { ...cur, name };
                      return next;
                    });
                  }}
                  inputSize="sm"
                  className="w-48"
                />

                <div className="ml-auto flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">格式</label>
                  <select
                    className="px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    value={format}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormat(e.target.value as ImageFormat)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuality(Math.max(0.1, Math.min(1, Number(e.target.value) || 0.92)))}
                    className="w-24 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  <Button onClick={exportImage} disabled={disabled}>
                    导出
                  </Button>
                  <Button variant="secondary" onClick={exportAll} disabled={items.length === 0}>
                    导出全部
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 overflow-x-auto">
                {items.map((it: ImgItem, idx: number) => (
                  <div
                    key={it.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded border ${idx === currentIndex ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}`}
                  >
                    <button
                      className="text-sm text-gray-800 dark:text-gray-100 hover:underline"
                      onClick={() => selectItem(idx)}
                    >
                      {it.name}
                    </button>
                    <button
                      className="text-xs text-red-500 ml-1"
                      onClick={() => {
                        // if removing current, adjust selection
                        setItems((prev: ImgItem[]) => {
                          const next = prev.filter((x: ImgItem) => x.id !== it.id);
                          return next;
                        });
                        setCurrentIndex((prevIdx: number) => {
                          if (prevIdx === idx) {
                            const remain = items.length - 1;
                            if (remain <= 0) return -1;
                            return Math.min(idx, remain - 1);
                          } else if (prevIdx > idx) {
                            return prevIdx - 1;
                          }
                          return prevIdx;
                        });
                      }}
                      title="移除"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-sm text-gray-500">未选择图片，点击“选择图片（可多选）”导入</div>
                )}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetWidth(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-28"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">高</span>
                  <Input
                    inputSize="sm"
                    type="number"
                    value={targetHeight}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetHeight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-28"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 ml-2">
                    <input type="checkbox" checked={keepAspect} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeepAspect(e.target.checked)} />
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBrushMode(e.target.value as BrushMode)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrushSize(Number(e.target.value))}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const f = e.target.files?.[0];
                      if (f) loadBgFromFile(f);
                    }}
                  />
                  <Button variant="secondary" onClick={() => bgFileInputRef.current?.click()} disabled={disabled || currentIndex < 0}>
                    添加背景图
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setBgImage(null);
                      if (currentIndex >= 0) {
                        setItems((prev: ImgItem[]) => {
                          const next = [...prev];
                          const cur = next[currentIndex];
                          if (cur) next[currentIndex] = { ...cur, bgUrl: null };
                          return next;
                        });
                      }
                    }}
                    disabled={currentIndex < 0 || (!bgImage && !currentItem?.bgUrl)}
                  >
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
                <div>2. 拖拽画布创建裁剪选区，然后点击“裁剪选区”。</div>
                <div>3. 设置宽高并“调整尺寸/分辨率”。</div>
                <div>4. 选择画笔：擦除/还原/模糊/克隆，用于背景与水印处理。</div>
                <div>5. “一键人物去背景”将自动抠图，可再用画笔微调。</div>
                <div>6. 可添加背景图，导出时与前景合成。</div>
                <div>7. 选择导出格式与质量，点击“导出”。</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

