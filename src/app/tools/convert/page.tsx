'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';

type UnitCategory = 'length' | 'mass' | 'temp' | 'area' | 'volume';

const UNITS: Record<UnitCategory, { key: string; label: string; toSI: (v: number) => number; fromSI: (v: number) => number }[]> = {
  length: [
    { key: 'm', label: '米 (m)', toSI: (v) => v, fromSI: (v) => v },
    { key: 'km', label: '千米 (km)', toSI: (v) => v * 1000, fromSI: (v) => v / 1000 },
    { key: 'cm', label: '厘米 (cm)', toSI: (v) => v / 100, fromSI: (v) => v * 100 },
    { key: 'mm', label: '毫米 (mm)', toSI: (v) => v / 1000, fromSI: (v) => v * 1000 },
    { key: 'in', label: '英寸 (in)', toSI: (v) => v * 0.0254, fromSI: (v) => v / 0.0254 },
    { key: 'ft', label: '英尺 (ft)', toSI: (v) => v * 0.3048, fromSI: (v) => v / 0.3048 }
  ],
  mass: [
    { key: 'kg', label: '千克 (kg)', toSI: (v) => v, fromSI: (v) => v },
    { key: 'g', label: '克 (g)', toSI: (v) => v / 1000, fromSI: (v) => v * 1000 },
    { key: 'lb', label: '磅 (lb)', toSI: (v) => v * 0.45359237, fromSI: (v) => v / 0.45359237 }
  ],
  temp: [
    { key: 'C', label: '摄氏度 (°C)', toSI: (v) => v + 273.15, fromSI: (v) => v - 273.15 },
    { key: 'F', label: '华氏度 (°F)', toSI: (v) => ((v - 32) * 5) / 9 + 273.15, fromSI: (v) => ((v - 273.15) * 9) / 5 + 32 },
    { key: 'K', label: '开尔文 (K)', toSI: (v) => v, fromSI: (v) => v }
  ],
  area: [
    { key: 'm2', label: '平方米 (m²)', toSI: (v) => v, fromSI: (v) => v },
    { key: 'km2', label: '平方千米 (km²)', toSI: (v) => v * 1e6, fromSI: (v) => v / 1e6 },
    { key: 'ft2', label: '平方英尺 (ft²)', toSI: (v) => v * 0.09290304, fromSI: (v) => v / 0.09290304 }
  ],
  volume: [
    { key: 'm3', label: '立方米 (m³)', toSI: (v) => v, fromSI: (v) => v },
    { key: 'L', label: '升 (L)', toSI: (v) => v / 1000, fromSI: (v) => v * 1000 },
    { key: 'gal', label: '加仑 (gal)', toSI: (v) => v * 0.003785411784, fromSI: (v) => v / 0.003785411784 }
  ]
};

export default function UnitConverterPage() {
  const [cat, setCat] = useState<UnitCategory>('length');
  const [from, setFrom] = useState<string>('m');
  const [to, setTo] = useState<string>('km');
  const [value, setValue] = useState<number>(1);

  const units = useMemo(() => UNITS[cat], [cat]);

  const converted = useMemo(() => {
    const fromU = units.find((u) => u.key === from);
    const toU = units.find((u) => u.key === to);
    if (!fromU || !toU) return 0;
    const si = fromU.toSI(value);
    return toU.fromSI(si);
  }, [from, to, units, value]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">单位换算</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">类别</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" value={cat} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const v = e.target.value as UnitCategory; setCat(v); const first = UNITS[v][0].key; setFrom(first); setTo(UNITS[v][1]?.key || first);
              }}>
                {Object.keys(UNITS).map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">从</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" value={from} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFrom(e.target.value)}>
                {units.map((u) => (<option key={u.key} value={u.key}>{u.label}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">到</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" value={to} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTo(e.target.value)}>
                {units.map((u) => (<option key={u.key} value={u.key}>{u.label}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Input type="number" label="数值" value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(Number(e.target.value))} />
            <div className="text-xl font-semibold text-gray-900 dark:text-white">结果：{Number.isFinite(converted) ? converted : '-'} <span className="text-sm">{to}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

