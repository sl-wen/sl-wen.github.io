'use client';
/**
 * 加密货币行情页（/tools/crypto）
 *
 * 功能：
 * - 从 Coingecko 公共 API 拉取 Top 市值加密货币行情
 * - 支持法币单位切换、关键词筛选与手动刷新
 *
 * 说明：
 * - 使用浏览器 fetch 并禁止缓存（cache: 'no-store'）以获取最新数据
 * - 通过 useEffect 在 vs（法币）变化后自动刷新
 * - 使用 useMemo 对筛选结果进行派生计算，避免不必要渲染
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Ticker = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
};

export default function CryptoPricesPage() {
  // 选中的法币、行情列表与筛选关键词
  const [vs, setVs] = useState<string>('usd');
  const [list, setList] = useState<Ticker[]>([]);
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  // 拉取价格列表
  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      // Coingecko free endpoint (no-key), CORS enabled
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${encodeURIComponent(vs)}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as any[];
      setList(
        data.map((d) => ({
          id: d.id,
          symbol: d.symbol,
          name: d.name,
          current_price: d.current_price,
          price_change_percentage_24h: d.price_change_percentage_24h || 0,
          market_cap: d.market_cap
        }))
      );
    } catch (e: any) {
      setError(e?.message || '获取价格失败');
    } finally {
      setLoading(false);
    }
  }, [vs]);

  // 货币单位变更后自动刷新
  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  // 关键词过滤（名称与代码，忽略大小写）
  const filtered = useMemo(
    () => list.filter((c) => (query ? (c.name + c.symbol).toLowerCase().includes(query.toLowerCase()) : true)),
    [list, query]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">实时加密货币价格</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={fetchPrices} isLoading={loading}>刷新</Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">法币单位</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                value={vs}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVs(e.target.value)}
              >
                {['usd', 'cny', 'eur', 'jpy', 'gbp', 'aud', 'hkd'].map((fiat) => (
                  <option key={fiat} value={fiat}>{fiat.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <Input label="筛选（名称/代码）" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} />
            </div>
          </div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900 dark:text-white">{c.name}</div>
                <div className={`text-sm ${c.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
              <div className="text-xs text-gray-500">{c.symbol.toUpperCase()}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {c.current_price.toLocaleString()} {vs.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">市值：{c.market_cap.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

