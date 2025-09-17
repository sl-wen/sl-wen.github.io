'use client';
/**
 * 房贷计算器页（/tools/mortgage）
 *
 * 功能：
 * - 等额本息还款：根据本金、年利率、年限计算每月还款/总利息/总还款
 *
 * 说明：
 * - 月利率 r = 年利率 / 12；若 r=0 则每月还款=本金/月数
 * - 公式：m = r*(1+r)^n / ((1+r)^n - 1)
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';

// 计算等额本息每月还款
function calcMonthlyPayment(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  const m = r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  return principal * m;
}

export default function MortgageCalculatorPage() {
  // 输入：本金、年利率、年限
  const [principal, setPrincipal] = useState<number>(1000000);
  const [rate, setRate] = useState<number>(0.045);
  const [years, setYears] = useState<number>(30);

  // 派生：总月数、每月还款、总还款与总利息
  const months = useMemo(() => years * 12, [years]);
  const monthly = useMemo(() => calcMonthlyPayment(principal, rate, months), [months, principal, rate]);
  const total = useMemo(() => monthly * months, [monthly, months]);
  const interest = useMemo(() => total - principal, [total, principal]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">房贷计算器</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input type="number" label="贷款本金" value={principal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrincipal(Number(e.target.value))} />
            <Input type="number" step="0.001" label="年利率 (小数)" value={rate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRate(Number(e.target.value))} />
            <Input type="number" label="年限" value={years} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYears(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-900 dark:text-white">
            <div>每月还款：<span className="font-semibold">{monthly.toFixed(2)}</span></div>
            <div>总利息：<span className="font-semibold">{interest.toFixed(2)}</span></div>
            <div>总还款：<span className="font-semibold">{total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

