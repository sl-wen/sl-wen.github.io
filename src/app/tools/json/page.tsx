'use client';
/**
 * JSON 工具页（/tools/json）
 *
 * 功能：
 * - 格式化（pretty print）
 * - 压缩（去掉空白）
 * - 校验合法性
 * - 一键复制与清空
 *
 * 说明：
 * - 依赖原生 JSON.parse / JSON.stringify，异常捕获后显示错误信息
 * - 输入/输出均使用同一组件 Textarea，便于统一样式与自动伸缩
 */

import React, { useCallback, useState } from 'react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export default function JsonToolPage() {
  // 输入文本、输出文本与错误提示
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | undefined>();

  // JSON 格式化
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

  // JSON 压缩（最小化）
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

  // JSON 校验（只给出结果，不修改输出）
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

  // 复制输出
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch {}
  }, [output]);

  // 清空全部
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

