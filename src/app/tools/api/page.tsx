'use client';
/**
 * API 测试页（/tools/api）
 *
 * 功能：
 * - 构造 HTTP 请求：方法、URL、请求头、请求体
 * - 显示响应状态、响应头与响应体（自动尝试 JSON 格式化）
 *
 * 说明：
 * - 解析请求头时按每行 `Key: Value` 解析，忽略空行
 * - 对于 JSON 响应尝试 pretty print，其他类型原样展示
 */

import React, { useCallback, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export default function ApiTesterPage() {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState<string>('');
  const [headers, setHeaders] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusLine, setStatusLine] = useState<string>('');
  const [responseHeaders, setResponseHeaders] = useState<string>('');
  const [responseBody, setResponseBody] = useState<string>('');
  const [error, setError] = useState<string | undefined>();

  const methods: HttpMethod[] = useMemo(
    () => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    []
  );

  // 将多行请求头字符串解析为对象
  const parseHeaders = useCallback((raw: string): Record<string, string> => {
    const result: Record<string, string> = {};
    raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const idx = line.indexOf(':');
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const value = line.slice(idx + 1).trim();
          if (key) result[key] = value;
        }
      });
    return result;
  }, []);

  // 若为 JSON 字符串，则返回格式化后的字符串
  const tryPretty = useCallback((text: string): string => {
    try {
      const obj = JSON.parse(text);
      return JSON.stringify(obj, null, 2);
    } catch {
      return text;
    }
  }, []);

  // 发送 HTTP 请求并渲染响应
  const sendRequest = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setStatusLine('');
    setResponseHeaders('');
    setResponseBody('');
    try {
      const init: RequestInit = {
        method,
        headers: parseHeaders(headers)
      };
      if (method !== 'GET' && method !== 'HEAD' && body) {
        init.body = body;
      }
      const startedAt = performance.now();
      const res = await fetch(url, init as any);
      const elapsed = Math.round(performance.now() - startedAt);

      setStatusLine(`${res.status} ${res.statusText} • ${elapsed}ms`);
      const rh: string[] = [];
      res.headers.forEach((v, k) => rh.push(`${k}: ${v}`));
      setResponseHeaders(rh.join('\n'));

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (contentType.includes('application/json')) {
        setResponseBody(tryPretty(text));
      } else {
        setResponseBody(text);
      }
    } catch (e: any) {
      setError(e?.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [body, headers, method, parseHeaders, tryPretty, url]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API 测试</h1>
          <div className="flex gap-2">
            <Button onClick={sendRequest} isLoading={loading}>发送</Button>
            <Button variant="secondary" onClick={() => { setUrl(''); setHeaders(''); setBody(''); }}>清空</Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Method</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                value={method}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value as HttpMethod)}
              >
                {methods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-5">
              <Input
                label="URL"
                placeholder="https://api.example.com/v1/users"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                fullWidth
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Textarea
                label="请求头（每行一个：Key: Value）"
                placeholder="Content-Type: application/json\nAuthorization: Bearer token"
                value={headers}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHeaders(e.target.value)}
                inputSize="md"
                fullWidth
                autoResize
              />
            </div>
            <div>
              <Textarea
                label="请求体（原始文本/JSON）"
                placeholder='{"name": "John"}'
                value={body}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                inputSize="md"
                fullWidth
                autoResize
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">状态</div>
            <div className="text-base font-medium text-gray-900 dark:text-white min-h-6">
              {statusLine || '—'}
            </div>
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
            <div className="mt-4">
              <Textarea
                label="响应头"
                value={responseHeaders}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseHeaders(e.target.value)}
                inputSize="md"
                fullWidth
                autoResize
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <Textarea
              label="响应体"
              value={responseBody}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseBody(e.target.value)}
              inputSize="lg"
              fullWidth
              autoResize
              className="min-h-[360px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

