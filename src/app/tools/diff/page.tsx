'use client';

import React, { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

type DiffChange = {
  added?: boolean;
  removed?: boolean;
  value: string;
};

// 轻量文本差异算法（逐行对比），避免新增依赖
function computeSimpleDiff(oldText: string, newText: string): DiffChange[] {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);
  const maxLen = Math.max(oldLines.length, newLines.length);
  const result: DiffChange[] = [];
  for (let i = 0; i < maxLen; i++) {
    const a = oldLines[i] ?? '';
    const b = newLines[i] ?? '';
    if (a === b) {
      result.push({ value: a });
    } else {
      if (a !== '') result.push({ removed: true, value: a });
      if (b !== '') result.push({ added: true, value: b });
    }
  }
  return result;
}

export default function DiffPage() {
  const [left, setLeft] = useState<string>('');
  const [right, setRight] = useState<string>('');
  const diff = useMemo(() => computeSimpleDiff(left, right), [left, right]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">文本对比</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setLeft(''); setRight(''); }}>清空</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">原文本</h2>
            <Textarea value={left} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLeft(e.target.value)} inputSize="lg" fullWidth autoResize placeholder="在此粘贴原文本" className="h-[360px]" />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">新文本</h2>
            <Textarea value={right} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRight(e.target.value)} inputSize="lg" fullWidth autoResize placeholder="在此粘贴新文本" className="h-[360px]" />
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
            预览差异（逐行）：绿色为新增，红色为删除，相同为普通行
          </div>
          <div className="p-4 overflow-auto">
            <pre className="text-sm leading-6 whitespace-pre-wrap">
              {diff.map((c: DiffChange, idx: number) => (
                <div
                  key={idx}
                  className={
                    c.added
                      ? 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200 px-2 rounded'
                      : c.removed
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 px-2 rounded'
                        : 'text-gray-800 dark:text-gray-100'
                  }
                >
                  {c.added ? '+ ' : c.removed ? '- ' : '  '}
                  {c.value || '\u00A0'}
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

