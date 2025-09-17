'use client';

import React, { useCallback, useState } from 'react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export default function JsonToolPage() {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | undefined>();

  const formatJson = useCallback(() => {
    try {
      setError(undefined);
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj, null, 2));
    } catch (e: any) {
      setError(e?.message || 'JSON 解析失败');
      setOutput('');
    }
  }, [input]);

  const minifyJson = useCallback(() => {
    try {
      setError(undefined);
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj));
    } catch (e: any) {
      setError(e?.message || 'JSON 解析失败');
      setOutput('');
    }
  }, [input]);

  const validateJson = useCallback(() => {
    try {
      JSON.parse(input);
      setError(undefined);
      setOutput('有效 JSON');
    } catch (e: any) {
      setError(e?.message || 'JSON 无效');
      setOutput('');
    }
  }, [input]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch {}
  }, [output]);

  const clearAll = useCallback(() => {
    setInput('');
    setOutput('');
    setError(undefined);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">JSON 解析器</h1>
          <div className="flex gap-2">
            <Button onClick={formatJson}>格式化</Button>
            <Button variant="secondary" onClick={minifyJson}>压缩</Button>
            <Button variant="secondary" onClick={validateJson}>校验</Button>
            <Button variant="secondary" onClick={copy} disabled={!output}>复制结果</Button>
            <Button variant="ghost" onClick={clearAll}>清空</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">输入</h2>
            <Textarea
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              inputSize="lg"
              fullWidth
              autoResize
              placeholder="粘贴 JSON 文本"
              className="h-[360px]"
            />
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">输出</h2>
            <Textarea
              value={output}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOutput(e.target.value)}
              inputSize="lg"
              fullWidth
              autoResize
              placeholder="格式化/压缩/校验结果"
              className="h-[360px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

