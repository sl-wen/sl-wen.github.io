'use client';

import React, { useCallback, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export default function Base64ToolPage() {
  const [text, setText] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [fileB64, setFileB64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const encodeText = useCallback(() => {
    try {
      setResult(btoa(unescape(encodeURIComponent(text))));
    } catch (e) {
      setResult('');
    }
  }, [text]);

  const decodeText = useCallback(() => {
    try {
      setResult(decodeURIComponent(escape(atob(text))));
    } catch (e) {
      setResult('');
    }
  }, [text]);

  const pickFile = useCallback(() => fileInputRef.current?.click(), []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const base64 = dataUrl.split(',')[1] || '';
      setFileB64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const downloadDecoded = useCallback(() => {
    if (!fileB64) return;
    const byteChars = atob(fileB64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNumbers)]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'decoded.bin'; a.click();
    URL.revokeObjectURL(url);
  }, [fileB64]);

  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(result || fileB64); } catch {}
  }, [result, fileB64]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Base64 转换</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copy} disabled={!result && !fileB64}>复制</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">文本</h2>
            <div className="flex gap-2 mb-2">
              <Button onClick={encodeText}>文本 → Base64</Button>
              <Button variant="secondary" onClick={decodeText}>Base64 → 文本</Button>
            </div>
            <Textarea value={text} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)} inputSize="lg" fullWidth autoResize placeholder="输入文本或Base64" className="h-[280px]" />
            <h3 className="text-sm font-medium mt-3 text-gray-700 dark:text-gray-300">结果</h3>
            <Textarea value={result} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResult(e.target.value)} inputSize="md" fullWidth autoResize className="h-[200px]" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">文件</h2>
            <div className="flex gap-2 mb-2">
              <Button onClick={pickFile}>选择文件并编码</Button>
              <Button variant="secondary" onClick={downloadDecoded} disabled={!fileB64}>下载解码文件</Button>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />
            <Textarea value={fileB64} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFileB64(e.target.value)} inputSize="lg" fullWidth autoResize placeholder="文件的 Base64 内容" className="h-[360px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

