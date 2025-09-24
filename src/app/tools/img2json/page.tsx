'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ImportedImage = {
  src: string;
  width: number;
  height: number;
  name: string;
};

type Region = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  tags: string[];
};

type ExportJson = {
  image: { name: string; width: number; height: number; src: string };
  tileMinSize: number;
  regions: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    tags?: string[];
  }>;
  mergedRegions: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    sourceRegionIds: string[];
  }>;
};

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function snapToGrid(value: number, grid: number): number {
  if (grid <= 1) return Math.round(value);
  return Math.round(value / grid) * grid;
}

function rectsAdjacentOrTouching(a: Region, b: Region, gap: number = 0): boolean {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  const horizontalTouch = Math.abs(ax2 - b.x) <= gap || Math.abs(bx2 - a.x) <= gap;
  const verticalOverlap = !(ay2 < b.y || by2 < a.y);
  const verticalTouch = Math.abs(ay2 - b.y) <= gap || Math.abs(by2 - a.y) <= gap;
  const horizontalOverlap = !(ax2 < b.x || bx2 < a.x);
  return (horizontalTouch && verticalOverlap) || (verticalTouch && horizontalOverlap);
}

function mergeRegions(regions: Region[], minTile: number): Region[] {
  if (regions.length === 0) return [];
  const sorted = [...regions].sort((r1, r2) => r1.y - r2.y || r1.x - r2.x);
  const merged: Region[] = [];
  for (const r of sorted) {
    let mergedInThisPass = false;
    for (let i = 0; i < merged.length; i++) {
      const m = merged[i];
      if (rectsAdjacentOrTouching(m, r, 1)) {
        const nx = Math.min(m.x, r.x);
        const ny = Math.min(m.y, r.y);
        const nx2 = Math.max(m.x + m.width, r.x + r.width);
        const ny2 = Math.max(m.y + m.height, r.y + r.height);
        const newRect: Region = {
          ...m,
          x: nx,
          y: ny,
          width: nx2 - nx,
          height: ny2 - ny,
          name: m.name,
        };
        if (newRect.width >= minTile && newRect.height >= minTile) {
          merged[i] = newRect;
          mergedInThisPass = true;
          break;
        }
      }
    }
    if (!mergedInThisPass) merged.push({ ...r });
  }
  return merged;
}

export default function Img2JsonPage() {
  const [imported, setImported] = useState<ImportedImage | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [tileMinSize, setTileMinSize] = useState<number>(16);
  const [defaultRegionName, setDefaultRegionName] = useState<string>('sprite');
  const [regions, setRegions] = useState<Region[]>([]);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ startX: number; startY: number; x: number; y: number; w: number; h: number; drawing: boolean } | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImported({ src: url, width: img.width, height: img.height, name: file.name });
      setRegions([]);
      setActiveRegionId(null);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, []);

  const handleUrlLoad = useCallback(async () => {
    if (!imageUrlInput) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImported({ src: imageUrlInput, width: img.width, height: img.height, name: imageUrlInput.split('/').pop() || 'image' });
      setRegions([]);
      setActiveRegionId(null);
    };
    img.src = imageUrlInput;
  }, [imageUrlInput]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // draw existing regions
    for (const r of regions) {
      ctx.save();
      ctx.strokeStyle = r.id === activeRegionId ? '#22c55e' : '#3b82f6';
      ctx.lineWidth = r.id === activeRegionId ? 3 : 2;
      ctx.strokeRect(r.x, r.y, r.width, r.height);
      ctx.fillStyle = 'rgba(59,130,246,0.12)';
      ctx.fillRect(r.x, r.y, r.width, r.height);
      ctx.restore();
    }

    // draw selection
    if (selection && selection.drawing) {
      const { x, y, w, h } = selection;
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }

    // grid
    if (tileMinSize >= 4) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 0; gx <= canvas.width; gx += tileMinSize) {
        ctx.moveTo(gx + 0.5, 0);
        ctx.lineTo(gx + 0.5, canvas.height);
      }
      for (let gy = 0; gy <= canvas.height; gy += tileMinSize) {
        ctx.moveTo(0, gy + 0.5);
        ctx.lineTo(canvas.width, gy + 0.5);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [regions, activeRegionId, selection, imported, tileMinSize]);

  const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const x = snapToGrid(sx, tileMinSize);
    const y = snapToGrid(sy, tileMinSize);
    setSelection({ startX: x, startY: y, x, y, w: 0, h: 0, drawing: true });
  }, [tileMinSize]);

  const handlePointerMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selection || !selection.drawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = snapToGrid(e.clientX - rect.left, tileMinSize);
    const my = snapToGrid(e.clientY - rect.top, tileMinSize);
    const x = Math.min(selection.startX, mx);
    const y = Math.min(selection.startY, my);
    const w = Math.max(tileMinSize, Math.abs(mx - selection.startX));
    const h = Math.max(tileMinSize, Math.abs(my - selection.startY));
    setSelection({ ...selection, x, y, w, h });
  }, [selection, tileMinSize]);

  const handlePointerUp = useCallback(() => {
    if (!selection || !selection.drawing) return;
    const w = Math.max(tileMinSize, selection.w);
    const h = Math.max(tileMinSize, selection.h);
    const region: Region = {
      id: generateId('r'),
      x: selection.x,
      y: selection.y,
      width: snapToGrid(w, tileMinSize),
      height: snapToGrid(h, tileMinSize),
      name: defaultRegionName,
      tags: [],
    };
    setRegions((prev) => [...prev, region]);
    setActiveRegionId(region.id);
    setSelection(null);
  }, [selection, tileMinSize, defaultRegionName]);

  const activeRegion = useMemo(() => regions.find((r) => r.id === activeRegionId) || null, [regions, activeRegionId]);

  const updateActiveRegion = useCallback((changes: Partial<Region>) => {
    if (!activeRegionId) return;
    setRegions((prev) => prev.map((r) => (r.id === activeRegionId ? { ...r, ...changes } : r)));
  }, [activeRegionId]);

  const removeActiveRegion = useCallback(() => {
    if (!activeRegionId) return;
    setRegions((prev) => prev.filter((r) => r.id !== activeRegionId));
    setActiveRegionId(null);
  }, [activeRegionId]);

  const handleExport = useCallback(() => {
    if (!imported) return;
    const merged = mergeRegions(regions, tileMinSize);
    const json: ExportJson = {
      image: { name: imported.name, width: imported.width, height: imported.height, src: imported.src },
      tileMinSize,
      regions: regions.map(({ id, name, x, y, width, height, tags }) => ({ id, name, x, y, width, height, tags })),
      mergedRegions: merged.map((m) => ({ id: generateId('m'), name: m.name, x: m.x, y: m.y, width: m.width, height: m.height, sourceRegionIds: [] })),
    };
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${imported.name.replace(/\.[^/.]+$/, '') || 'atlas'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  }, [regions, tileMinSize, imported]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const onImageUrlInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrlInput(e.target.value);
  }, []);

  const onTileMinSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTileMinSize(Math.max(1, Number(e.target.value) || 1));
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = regions.find((r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
    if (hit) setActiveRegionId(hit.id);
  }, [regions]);

  const previewSelection = useMemo(() => {
    if (!imported || !activeRegion) return null;
    return { ...activeRegion };
  }, [imported, activeRegion]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">图集转 JSON（img2json）</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">导入一张图集，框选子素材，配置属性并导出 JSON。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            {/* Import controls */}
            <div className="mb-4 flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileInputChange}
              />
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                选择图片
              </button>
              <div className="flex items-center gap-2">
                <input
                  value={imageUrlInput}
                  onChange={onImageUrlInputChange}
                  placeholder="或粘贴图片 URL"
                  className="w-72 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100"
                />
                <button className="px-3 py-2 rounded-lg bg-gray-700 text-white" onClick={handleUrlLoad}>加载</button>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-gray-600 dark:text-gray-300">最小瓦片</label>
                <input
                  type="number"
                  min={1}
                  value={tileMinSize}
                  onChange={onTileMinSizeChange}
                  className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Drop zone + canvas */}
            <div
              ref={containerRef}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`relative border-2 ${dragOver ? 'border-blue-500' : 'border-dashed border-gray-300 dark:border-gray-700'} rounded-xl p-2 bg-white dark:bg-gray-800`}
            >
              {!imported ? (
                <div className="flex flex-col items-center justify-center h-72 text-gray-500">
                  <div className="text-5xl mb-4">🖼️</div>
                  <div>拖拽图片到此处，或点击"选择图片"</div>
                </div>
              ) : (
                <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onClick={handleCanvasClick}
                    className="block max-w-full"
                  />
                </div>
              )}
            </div>

            {/* Regions list */}
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-3 flex items-center justify-between">
                <div className="font-medium text-gray-800 dark:text-gray-100">选区（{regions.length}）</div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">默认名称</label>
                  <input
                    value={defaultRegionName}
                    onChange={(e) => setDefaultRegionName(e.target.value)}
                    className="w-40 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  />
                  <button
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleExport}
                    disabled={!imported || regions.length === 0}
                  >导出 JSON</button>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-auto">
                {regions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRegionId(r.id)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between ${activeRegionId === r.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                  >
                    <div className="text-sm text-gray-700 dark:text-gray-200 truncate">{r.name} — x:{r.x} y:{r.y} w:{r.width} h:{r.height}</div>
                    <div className="text-xs text-gray-500">#{r.id.slice(-4)}</div>
                  </button>
                ))}
                {regions.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-gray-500">暂无选区，按网格拖拽创建选区</div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: properties and preview */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="font-medium text-gray-800 dark:text-gray-100 mb-3">属性</div>
              {activeRegion ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm text-gray-500">名称
                      <input
                        value={activeRegion.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateActiveRegion({ name: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    </label>
                    <label className="text-sm text-gray-500">标签（逗号分隔）
                      <input
                        value={activeRegion.tags?.join(',') || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateActiveRegion({ tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    </label>
                    <label className="text-sm text-gray-500">X
                      <input
                        type="number"
                        value={activeRegion.x}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateActiveRegion({ x: snapToGrid(Number(e.target.value) || 0, tileMinSize) })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    </label>
                    <label className="text-sm text-gray-500">Y
                      <input
                        type="number"
                        value={activeRegion.y}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateActiveRegion({ y: snapToGrid(Number(e.target.value) || 0, tileMinSize) })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    </label>
                    <label className="text-sm text-gray-500">宽度
                      <input
                        type="number"
                        value={activeRegion.width}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateActiveRegion({ width: Math.max(tileMinSize, snapToGrid(Number(e.target.value) || 0, tileMinSize)) })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    </label>
                    <label className="text-sm text-gray-500">高度
                      <input
                        type="number"
                        value={activeRegion.height}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateActiveRegion({ height: Math.max(tileMinSize, snapToGrid(Number(e.target.value) || 0, tileMinSize)) })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 rounded-lg bg-red-600 text-white" onClick={removeActiveRegion}>删除选区</button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">点击选区以查看和编辑属性</div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="font-medium text-gray-800 dark:text-gray-100 mb-3">预览</div>
              {!imported || !previewSelection ? (
                <div className="text-sm text-gray-500">选择一个选区以预览</div>
              ) : (
                <div className="inline-block p-2 rounded-lg bg-gray-100 dark:bg-gray-900">
                  <canvas
                    ref={(el: HTMLCanvasElement | null) => {
                      if (!el || !imgRef.current || !previewSelection) return;
                      const { x, y, width, height } = previewSelection;
                      el.width = width;
                      el.height = height;
                      const ctx = el.getContext('2d');
                      if (!ctx) return;
                      ctx.clearRect(0, 0, width, height);
                      ctx.drawImage(imgRef.current, x, y, width, height, 0, 0, width, height);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="font-medium text-gray-800 dark:text-gray-100 mb-2">聚合相邻瓦片</div>
              <p className="text-sm text-gray-500 mb-3">可将多个相邻或相接触的选区聚合为一个素材。</p>
              <button
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => setRegions((prev) => mergeRegions(prev, tileMinSize))}
                disabled={regions.length < 2}
              >执行聚合</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}