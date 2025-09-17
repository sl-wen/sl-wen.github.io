'use client';
/**
 * 实时汇率页（/tools/rates）
 *
 * 功能：
 * - 基于 exchangerate.host 获取最新法币汇率
 * - 支持选择基准货币、输入金额、筛选目标货币并刷新
 *
 * 说明：
 * - 通过 useEffect 在基准货币变更时自动刷新
 * - `amount * rate` 即当前金额折算为目标货币的数值
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type RatesResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

const COMMONS = ['USD', 'EUR', 'CNY', 'JPY', 'GBP', 'AUD', 'CAD', 'HKD', 'TWD', 'KRW'];

export default function ExchangeRatesPage() {
  // 基准货币、金额、汇率表、日期、筛选与状态
  const [base, setBase] = useState<string>('USD');
  const [amount, setAmount] = useState<number>(1);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [date, setDate] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  // 拉取汇率
  const fetchRates = useCallback(async (selectedBase: string) => {
    setLoading(true);
    setError(undefined);
    try {
      // exchangerate.host is free and supports CORS
      const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(selectedBase)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RatesResponse = await res.json();
      setRates(data.rates || {});
      setDate(data.date || '');
    } catch (e: any) {
      setError(e?.message || '获取汇率失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 基准货币变化自动刷新
  useEffect(() => { fetchRates(base); }, [base, fetchRates]);

  // 货币列表与筛选
  const currencies = useMemo(() => Object.keys(rates).sort(), [rates]);
  const filtered = useMemo(
    () => currencies.filter((c) => (query ? c.toLowerCase().includes(query.toLowerCase()) : true)),
    [currencies, query]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">实时汇率</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => fetchRates(base)} isLoading={loading}>刷新</Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">基准货币</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                value={base}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBase(e.target.value)}
              >
                {[...new Set([...COMMONS, ...currencies])].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Input type="number" label="金额" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))} />
            </div>
            <div className="md:col-span-2">
              <Input label="筛选货币（如 USD/EUR/CNY）" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">更新日期：{date || '—'}</div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((c) => (
            <div key={c} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">{base} → {c}</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {(amount * (rates[c] || 0)).toFixed(4)}
              </div>
              <div className="text-xs text-gray-500">1 {base} = {(rates[c] || 0).toFixed(6)} {c}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

