'use client';

import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';

function calcSimple(principal: number, annualRate: number, years: number) {
  const interest = principal * annualRate * years;
  return { interest, total: principal + interest };
}

function calcCompound(principal: number, annualRate: number, years: number, freq: number) {
  const total = principal * Math.pow(1 + annualRate / freq, freq * years);
  return { interest: total - principal, total };
}

export default function SavingsCalculatorPage() {
  const [principal, setPrincipal] = useState<number>(10000);
  const [rate, setRate] = useState<number>(0.025);
  const [years, setYears] = useState<number>(3);
  const [freq, setFreq] = useState<number>(12);
  const [isCompound, setIsCompound] = useState<boolean>(true);

  const result = useMemo(() => {
    return isCompound ? calcCompound(principal, rate, years, freq) : calcSimple(principal, rate, years);
  }, [freq, isCompound, principal, rate, years]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text白 mb-6">存款利率计算</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Input type="number" label="本金" value={principal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrincipal(Number(e.target.value))} />
            <Input type="number" step="0.001" label="年利率 (小数)" value={rate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRate(Number(e.target.value))} />
            <Input type="number" label="年限" value={years} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYears(Number(e.target.value))} />
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">复利频率</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg白 dark:bg-gray-900 px-3 py-2" value={freq} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFreq(Number(e.target.value))} disabled={!isCompound}>
                <option value={1}>每年</option>
                <option value={2}>每半年</option>
                <option value={4}>每季度</option>
                <option value={12}>每月</option>
                <option value={365}>每日</option>
              </select>
            </div>
          </div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isCompound} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsCompound(e.target.checked)} />
            <span className="text-sm text-gray-800 dark:text-gray-200">使用复利</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900 dark:text-white">
            <div>利息：<span className="font-semibold">{result.interest.toFixed(2)}</span></div>
            <div>本息合计：<span className="font-semibold">{result.total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

