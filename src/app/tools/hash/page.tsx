'use client';

import React, { useCallback, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import SparkMD5 from 'spark-md5';

async function digest(alg: 'SHA-1' | 'SHA-256', text: string) {
  const enc = new TextEncoder();
  const ab = enc.encode(text);
  const buf = await crypto.subtle.digest(alg, ab);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function HashCalculatorPage() {
  const [text, setText] = useState<string>('');
  const [md5, setMd5] = useState<string>('');
  const [sha1, setSha1] = useState<string>('');
  const [sha256, setSha256] = useState<string>('');
  const [fileResult, setFileResult] = useState<{ name: string; md5?: string; sha1?: string; sha256?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calcText = useCallback(async () => {
    setMd5(SparkMD5.hash(text));
    setSha1(await digest('SHA-1', text));
    setSha256(await digest('SHA-256', text));
  }, [text]);

  const pickFile = useCallback(() => fileInputRef.current?.click(), []);

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      const md5 = SparkMD5.ArrayBuffer.hash(buffer);
      const sha1 = await crypto.subtle.digest('SHA-1', buffer);
      const sha256 = await crypto.subtle.digest('SHA-256', buffer);
      const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      setFileResult({ name: file.name, md5, sha1: toHex(sha1), sha256: toHex(sha256) });
    };
    reader.readAsArrayBuffer(file);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hash 计算器</h1>
          <div className="flex gap-2">
            <Button onClick={calcText}>计算文本</Button>
            <Button variant="secondary" onClick={pickFile}>选择文件计算</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">文本</h2>
            <Textarea value={text} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)} inputSize="lg" fullWidth autoResize placeholder="输入文本" className="h-[240px]" />
            <div className="mt-3 space-y-2 text-sm">
              <div className="font-mono break-all"><span className="font-semibold">MD5:</span> {md5}</div>
              <div className="font-mono break-all"><span className="font-semibold">SHA1:</span> {sha1}</div>
              <div className="font-mono break-all"><span className="font-semibold">SHA256:</span> {sha256}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">文件</h2>
            <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />
            {fileResult ? (
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold">文件:</span> {fileResult.name}</div>
                <div className="font-mono break-all"><span className="font-semibold">MD5:</span> {fileResult.md5}</div>
                <div className="font-mono break-all"><span className="font-semibold">SHA1:</span> {fileResult.sha1}</div>
                <div className="font-mono break-all"><span className="font-semibold">SHA256:</span> {fileResult.sha256}</div>
              </div>
            ) : (
              <div className="text-gray-500">点击“选择文件计算”以开始</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

