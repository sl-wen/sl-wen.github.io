'use client';
/**
 * SVG 蜡烛图组件（零依赖）
 *
 * - 自适应宽度（ResizeObserver）
 * - 成交量柱 + 蜡烛主体 + 最新价虚线
 * - 触摸/鼠标拖动显示十字光标和价格详情
 * - 红涨绿跌
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Candle } from '@/lib/okx';

interface Props {
  candles: Candle[];
  loading?: boolean;
}

const PAD = { top: 8, right: 58, bottom: 4, left: 4 };
const VOL_H = 44; // 成交量区高度

function fmtP(n: number): string {
  if (n >= 1000) return n.toFixed(0);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

function fmtTime(ts: number, bar: string): string {
  const d = new Date(ts);
  if (bar.endsWith('D')) return `${d.getMonth() + 1}/${d.getDate()}`;
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return bar.endsWith('H') || bar === '4H' || bar === '1H' ? `${d.getMonth() + 1}/${d.getDate()} ${hm}` : hm;
}

export default function CandleChart({ candles, loading }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(360);
  const [cursor, setCursor] = useState<{ x: number; idx: number } | null>(null);
  const H = 240;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(Math.max(280, e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geom = useMemo(() => {
    if (!candles.length) return null;
    const plotW = w - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom - VOL_H;
    let min = Infinity, max = -Infinity, maxVol = 0;
    for (const c of candles) {
      if (c.l < min) min = c.l;
      if (c.h > max) max = c.h;
      if (c.vol > maxVol) maxVol = c.vol;
    }
    const range = max - min || 1;
    const pad = range * 0.06;
    min -= pad; max += pad;
    const y = (p: number) => PAD.top + plotH - ((p - min) / (max - min)) * plotH;
    const step = plotW / candles.length;
    const cw = Math.max(2, Math.min(10, step * 0.66));
    const volTop = H - VOL_H;
    const vy = (v: number) => H - (v / (maxVol || 1)) * (VOL_H - 6);
    return { plotW, plotH, min, max, y, step, cw, volTop, vy };
  }, [candles, w]);

  const last = candles[candles.length - 1];
  const first = candles[0];
  const lastUp = last && first ? last.c >= first.o : true;
  const cur = cursor ? candles[cursor.idx] : last;

  const onMove = (clientX: number) => {
    if (!geom || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const idx = Math.max(0, Math.min(candles.length - 1, Math.floor((x - PAD.left) / geom.step)));
    setCursor({ x: PAD.left + idx * geom.step + geom.step / 2, idx });
  };

  const gridPrices = useMemo(() => {
    if (!geom) return [];
    const n = 4;
    const out: { p: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const p = geom.min + ((geom.max - geom.min) * i) / n;
      out.push({ p, y: geom.y(p) });
    }
    return out;
  }, [geom]);

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      {/* 当前/悬停价格信息条 */}
      <div className="flex items-baseline gap-3 px-1 pb-1 text-[11px] font-mono">
        {cur && (
          <>
            <span className={cur.c >= cur.o ? 'text-red-500' : 'text-green-500'}>
              O {fmtP(cur.o)} H {fmtP(cur.h)} L {fmtP(cur.l)} C {fmtP(cur.c)}
            </span>
            <span className="text-gray-400">{(cur.vol / 1000).toFixed(1)}K</span>
          </>
        )}
        {loading && <span className="text-gray-400">加载…</span>}
      </div>

      <svg
        width={w}
        height={H}
        onTouchStart={e => onMove(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={() => setCursor(null)}
        onMouseMove={e => onMove(e.clientX)}
        onMouseLeave={() => setCursor(null)}
        className="touch-pan-y"
      >
        {/* 网格 + 右侧价格刻度 */}
        {gridPrices.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={w - PAD.right} y1={g.y} y2={g.y} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,3" />
            <text x={w - PAD.right + 4} y={g.y + 3.5} className="fill-gray-400 text-[9px]" style={{ fontSize: 9 }}>{fmtP(g.p)}</text>
          </g>
        ))}

        {geom && candles.map((c, i) => {
          const up = c.c >= c.o;
          const color = up ? '#ef4444' : '#22c55e';
          const x = PAD.left + i * geom.step + geom.step / 2;
          const yO = geom.y(c.o), yC = geom.y(c.c);
          const top = Math.min(yO, yC);
          const bh = Math.max(1, Math.abs(yC - yO));
          return (
            <g key={c.ts}>
              {/* 影线 */}
              <line x1={x} x2={x} y1={geom.y(c.h)} y2={geom.y(c.l)} stroke={color} strokeWidth={1} />
              {/* 蜡烛 */}
              <rect x={x - geom.cw / 2} y={top} width={geom.cw} height={bh} fill={color} rx={geom.cw > 4 ? 1 : 0} />
              {/* 成交量 */}
              <rect x={x - geom.cw / 2} y={geom.vy(c.vol)} width={geom.cw} height={H - geom.vy(c.vol)} fill={color} opacity={0.32} />
            </g>
          );
        })}

        {/* 最新价虚线 + 标签 */}
        {geom && last && (
          <g>
            <line x1={PAD.left} x2={w - PAD.right} y1={geom.y(last.c)} y2={geom.y(last.c)} stroke={lastUp ? '#ef4444' : '#22c55e'} strokeWidth={0.8} strokeDasharray="4,3" className="animate-pulse" />
            <rect x={w - PAD.right + 1} y={geom.y(last.c) - 8} width={PAD.right - 4} height={16} rx={3} fill={lastUp ? '#ef4444' : '#22c55e'} />
            <text x={w - PAD.right + 4} y={geom.y(last.c) + 3.5} fill="#fff" style={{ fontSize: 9, fontFamily: 'monospace' }}>{fmtP(last.c)}</text>
          </g>
        )}

        {/* 十字光标 */}
        {cursor && geom && cur && (
          <g pointerEvents="none">
            <line x1={cursor.x} x2={cursor.x} y1={PAD.top} y2={H} stroke="currentColor" className="text-gray-400" strokeWidth={0.7} strokeDasharray="3,3" />
            <line x1={PAD.left} x2={w - PAD.right} y1={geom.y(cur.c)} y2={geom.y(cur.c)} stroke="currentColor" className="text-gray-400" strokeWidth={0.7} strokeDasharray="3,3" />
            <rect x={w - PAD.right + 1} y={geom.y(cur.c) - 8} width={PAD.right - 4} height={16} rx={3} fill="#6b7280" />
            <text x={w - PAD.right + 4} y={geom.y(cur.c) + 3.5} fill="#fff" style={{ fontSize: 9, fontFamily: 'monospace' }}>{fmtP(cur.c)}</text>
          </g>
        )}
      </svg>

      {/* 底部时间轴（首/中/尾） */}
      {candles.length > 0 && (
        <div className="flex justify-between px-1 text-[9px] text-gray-400 font-mono">
          <span>{fmtTime(candles[0].ts, '')}</span>
          <span>{fmtTime(candles[Math.floor(candles.length / 2)].ts, '')}</span>
          <span>{fmtTime(candles[candles.length - 1].ts, '')}</span>
        </div>
      )}
    </div>
  );
}
