'use client';
/**
 * 颜色选择器页（/tools/color）
 *
 * 功能：
 * - 在 HEX / RGB / HSL 三种颜色模型之间联动转换
 * - 支持拾色器与数值输入；展示不同透明度的色块与文本预览
 *
 * 说明：
 * - 通过 useEffect 监听 HEX 与 RGB 的变更，以保持三种模型始终同步
 * - HSL 的修改通过 onHslChange 统一转换为 RGB，再回写 HEX/HSL
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// 将数值限制在 [min, max] 范围内
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function hexToRgb(hex: string) {
  const m = hex.replace('#','').trim();
  const s = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r,g,b].map((x) => clamp(x,0,255).toString(16).padStart(2,'0')).join('');
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}
function hslToRgb(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) };
}

export default function ColorPickerPage() {
  // 当前的 HEX/RGB/HSL 值
  const [hex, setHex] = useState<string>('#409eff');
  const [r, setR] = useState<number>(64);
  const [g, setG] = useState<number>(158);
  const [b, setB] = useState<number>(255);
  const [h, setH] = useState<number>(204);
  const [s, setS] = useState<number>(100);
  const [l, setL] = useState<number>(63);

  // 当 HEX 改变时，同步更新 RGB 和 HSL
  useEffect(() => {
    try {
      const { r, g, b } = hexToRgb(hex);
      setR(r); setG(g); setB(b);
      const { h, s, l } = rgbToHsl(r, g, b);
      setH(h); setS(s); setL(l);
    } catch {}
  }, [hex]);

  // 当 RGB 改变时，回写 HEX 和 HSL，保持一致
  useEffect(() => {
    const hx = rgbToHex(r, g, b);
    setHex(hx);
    const { h, s, l } = rgbToHsl(r, g, b);
    setH(h); setS(s); setL(l);
  }, [r, g, b]);

  // 修改 HSL 时，统一转为 RGB，再回写 HEX/HSL
  const onHslChange = useCallback((nh: number, ns: number, nl: number) => {
    const { r, g, b } = hslToRgb(nh, ns, nl);
    setR(r); setG(g); setB(b);
    setHex(rgbToHex(r, g, b));
    setH(nh); setS(ns); setL(nl);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">颜色选择器</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="flex items-center gap-4">
              <input type="color" value={hex} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHex(e.target.value)} className="w-16 h-16 rounded border" />
              <div className="flex-1 grid grid-cols-3 gap-3">
                <Input label="HEX" value={hex} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHex(e.target.value)} />
                <Input label="R" type="number" value={r} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setR(Number(e.target.value))} />
                <Input label="G" type="number" value={g} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setG(Number(e.target.value))} />
                <Input label="B" type="number" value={b} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setB(Number(e.target.value))} />
                <Input label="H" type="number" value={h} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHslChange(clamp(Number(e.target.value),0,360), s, l)} />
                <Input label="S%" type="number" value={s} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHslChange(h, clamp(Number(e.target.value),0,100), l)} />
                <Input label="L%" type="number" value={l} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHslChange(h, s, clamp(Number(e.target.value),0,100))} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-6 gap-2">
              {[0.9,0.75,0.6,0.45,0.3,0.15].map((alpha, i) => (
                <div key={i} className="h-12 rounded" style={{ backgroundColor: hex, opacity: alpha }} />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">预览</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg h-24 shadow" style={{ backgroundColor: hex }} />
              <div className="rounded-lg h-24 shadow border flex items-center justify-center" style={{ color: hex }}>
                <span className="font-semibold">示例文本</span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              <div>HEX: {hex}</div>
              <div>RGB: rgb({r}, {g}, {b})</div>
              <div>HSL: hsl({h}, {s}%, {l}%)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

