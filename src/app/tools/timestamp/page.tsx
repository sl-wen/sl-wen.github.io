'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function formatDate(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function TimestampConverterPage() {
  const [now, setNow] = useState<number>(Date.now());
  const [inputTs, setInputTs] = useState<string>(String(Math.floor(Date.now() / 1000)));
  const [inputDate, setInputDate] = useState<string>(formatDate(Date.now()));
  const [msMode, setMsMode] = useState<boolean>(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowSeconds = useMemo(() => Math.floor(now / 1000), [now]);

  const tsToDate = useCallback(() => {
    const n = Number(inputTs);
    if (!Number.isFinite(n)) return;
    const ts = msMode ? n : n * 1000;
    setInputDate(formatDate(ts));
  }, [inputTs, msMode]);

  const dateToTs = useCallback(() => {
    const d = new Date(inputDate.replace(/-/g, '/'));
    const ts = d.getTime();
    setInputTs(String(msMode ? ts : Math.floor(ts / 1000)));
  }, [inputDate, msMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">时间戳转换</h1>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">当前：{now} ms ｜ {nowSeconds} s ｜ {formatDate(now)}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">模式：{msMode ? '毫秒(ms)' : '秒(s)'}</div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={msMode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMsMode(e.target.checked)} />
              <span>使用毫秒</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="时间戳" value={inputTs} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputTs(e.target.value)} />
              <Button className="mt-2" onClick={tsToDate}>转为日期</Button>
            </div>
            <div>
              <Input label="日期时间 (YYYY-MM-DD HH:mm:ss)" value={inputDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputDate(e.target.value)} />
              <Button className="mt-2" variant="secondary" onClick={dateToTs}>转为时间戳</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

