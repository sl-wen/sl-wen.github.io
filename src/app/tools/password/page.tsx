'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function getRandomInt(max: number) { return crypto.getRandomValues(new Uint32Array(1))[0] % max; }

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState<number>(16);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useDigits, setUseDigits] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');

  const pools = useMemo(() => ({
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>/?'
  }), []);

  const strength = useMemo(() => {
    let score = 0;
    if (useLower) score += 1; if (useUpper) score += 1; if (useDigits) score += 1; if (useSymbols) score += 1;
    score += Math.min(4, Math.floor(length / 4));
    return ['弱','较弱','一般','较强','强','非常强'][Math.min(5, score)];
  }, [length, useDigits, useLower, useSymbols, useUpper]);

  const generate = useCallback(() => {
    const activePools: string[] = [];
    if (useLower) activePools.push(pools.lower);
    if (useUpper) activePools.push(pools.upper);
    if (useDigits) activePools.push(pools.digits);
    if (useSymbols) activePools.push(pools.symbols);
    if (!activePools.length) return setPassword('');

    const all = activePools.join('');
    const result: string[] = [];

    activePools.forEach((pool) => { result.push(pool[getRandomInt(pool.length)]); });
    for (let i = result.length; i < length; i++) result.push(all[getRandomInt(all.length)]);
    for (let i = result.length - 1; i > 0; i--) { const j = getRandomInt(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
    setPassword(result.join(''));
  }, [length, pools.digits, pools.lower, pools.symbols, pools.upper, useDigits, useLower, useSymbols, useUpper]);

  const copy = useCallback(async () => { try { await navigator.clipboard.writeText(password); } catch {} }, [password]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">密码生成器</h1>
          <div className="flex gap-2">
            <Button onClick={generate}>生成</Button>
            <Button variant="secondary" onClick={copy} disabled={!password}>复制</Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="长度" value={length} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLength(Math.max(4, Number(e.target.value)))} />
            <div className="flex items-end gap-4">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useLower} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseLower(e.target.checked)} />小写</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useUpper} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseUpper(e.target.checked)} />大写</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useDigits} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseDigits(e.target.checked)} />数字</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useSymbols} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseSymbols(e.target.checked)} />符号</label>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300">强度：{strength}</div>

          <div className="p-3 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 select-all font-mono break-all">
            {password || '点击“生成”获取密码'}
          </div>
        </div>
      </div>
    </div>
  );
}

