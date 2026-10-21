'use client';
/**
 * OKX 交易面板（/tools/trading）
 *
 * 自用工具：行情 + 持仓资产 + 限价下单。
 * - 行情：公开接口经 proxy.slwen.cn，Worker 带 KV 缓存
 * - 交易：API key 存 localStorage（仅本机），签名浏览器完成，Worker 纯透传
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  OkxKeys, Ticker, BalanceData, PendingOrder, OrderResult, OrderHistoryItem, Candle,
  syncTime, okxRequest, okxPublic, fetchCandles, BAR_OPTIONS,
  getProxyKey, setProxyKey, hasProxyKey,
} from '@/lib/okx';
import CandleChart from './CandleChart';

const PROXY = 'https://proxy.slwen.cn/okx/api/v5';

/** 默认自选（localStorage 持久化） */
const DEFAULT_WATCH = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'BNB-USDT', 'OKB-USDT'];
const KEYS_STORAGE = 'okx-keys';

function fmtPrice(p: string): string {
  const n = parseFloat(p);
  if (n >= 1000) return n.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

function fmtVol(v: string): string {
  const n = parseFloat(v);
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
  if (n >= 1e4) return (n / 1e4).toFixed(1) + '万';
  return n.toFixed(0);
}

export default function TradingPage() {
  // 行情状态
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [watch, setWatch] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [err, setErr] = useState('');
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [paused, setPaused] = useState(false);
  const watchRef = useRef(watch);
  watchRef.current = watch;

  // 交易状态
  const [keys, setKeys] = useState<OkxKeys | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState<OkxKeys>({ key: '', secret: '', passphrase: '' });
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [selSym, setSelSym] = useState('BTC-USDT');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [px, setPx] = useState('');
  const [sz, setSz] = useState('');
  const [tradeMsg, setTradeMsg] = useState('');
  const [tab, setTab] = useState<'market' | 'trade'>('market');
  const timeSyncedRef = useRef(false);

  // K线状态
  const [chartSym, setChartSym] = useState('BTC-USDT');
  const [bar, setBar] = useState<string>('1H');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // 成交历史
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  // Proxy 口令
  const [proxyKeyInput, setProxyKeyInput] = useState('');
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyReady, setProxyReady] = useState(false);

  // 下单模式（限价/市价）+ 确认弹窗
  const [ordMode, setOrdMode] = useState<'limit' | 'market'>('market');
  const [buyAmt, setBuyAmt] = useState('');
  const [confirmDesc, setConfirmDesc] = useState<string | null>(null);
  const [showPwaHint, setShowPwaHint] = useState(false);

  // 初始化
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trading-watch');
      setWatch(saved ? JSON.parse(saved) : DEFAULT_WATCH);
      const k = localStorage.getItem(KEYS_STORAGE);
      if (k) setKeys(JSON.parse(k));
    } catch {
      setWatch(DEFAULT_WATCH);
    }
    setProxyReady(hasProxyKey());
    setProxyKeyInput(getProxyKey());
    // PWA：注册 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    // iPhone Safari 未添加到主屏幕时给个提示（仅提示一次）
    try {
      if (!localStorage.getItem('pwa-hint-dismissed') && !window.matchMedia('(display-mode: standalone)').matches && /iphone|ipad/i.test(navigator.userAgent)) {
        setShowPwaHint(true);
      }
    } catch {}
  }, []);

  const saveProxyKey = () => {
    setProxyKey(proxyKeyInput.trim());
    setProxyReady(proxyKeyInput.trim().length > 0);
    setShowProxyModal(false);
    fetchTickers(); // 立即用新口令重试
  };

  const persistWatch = (list: string[]) => {
    setWatch(list);
    try { localStorage.setItem('trading-watch', JSON.stringify(list)); } catch {}
  };

  const saveKeys = () => {
    if (!keyForm.key || !keyForm.secret || !keyForm.passphrase) {
      setTradeMsg('三项都不能为空');
      return;
    }
    localStorage.setItem(KEYS_STORAGE, JSON.stringify(keyForm));
    setKeys(keyForm);
    setShowKeyModal(false);
    setTradeMsg('');
  };

  const clearKeys = () => {
    localStorage.removeItem(KEYS_STORAGE);
    setKeys(null);
    setBalance(null);
    setOrders([]);
  };

  // 时钟校准（有 key 才做，进 trade tab 时一次）
  useEffect(() => {
    if (tab === 'trade' && keys && !timeSyncedRef.current) {
      timeSyncedRef.current = true;
      syncTime();
    }
  }, [tab, keys]);

  // 行情轮询
  const fetchTickers = useCallback(async () => {
    const list = watchRef.current;
    if (!list.length) return;
    try {
      const url = `${PROXY}/market/tickers?instType=SPOT`;
      const res = await fetch(url, { cache: 'no-store', headers: { 'X-Proxy-Key': getProxyKey() } });
      if (res.status === 429) throw new Error('限流中，稍候');
      if (res.status === 403) throw new Error('代理口令未配置（右上角设置）');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      if (d.code !== '0') throw new Error(d.msg || 'API error');
      const map: Record<string, Ticker> = {};
      for (const t of d.data as Ticker[]) map[t.instId] = t;
      setTickers(map);
      setLastUpdate(Date.now());
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : '网络错误');
    }
  }, []);

  useEffect(() => {
    if (paused || tab !== 'market') return;
    fetchTickers();
    const id = setInterval(fetchTickers, 5000);
    return () => clearInterval(id);
  }, [paused, fetchTickers, watch, tab]);

  // 拉资产+挂单
  const refreshAccount = useCallback(async () => {
    if (!keys) return;
    try {
      const bal = await okxRequest<BalanceData>('GET', '/api/v5/account/balance?ccy=BTC,ETH,SOL,BNB,OKB,USDT', keys);
      setBalance(bal[0]);
      const od = await okxRequest<PendingOrder>('GET', '/api/v5/trade/orders-pending?instType=SPOT', keys);
      setOrders(od);
    } catch (e) {
      setTradeMsg(e instanceof Error ? e.message : '资产拉取失败');
    }
  }, [keys]);

  useEffect(() => {
    if (tab === 'trade' && keys) refreshAccount();
  }, [tab, keys, refreshAccount]);

  // 下单（带确认弹窗）
  const submitOrder = () => {
    if (!keys) return;
    if (ordMode === 'market') {
      if (side === 'buy') {
        if (!buyAmt || parseFloat(buyAmt) <= 0) { setTradeMsg('❌ 填买入金额'); return; }
        setConfirmDesc(`市价买入 ${selSym.replace('-USDT', '')}，花费约 ${buyAmt} USDT`);
      } else {
        if (!sz || parseFloat(sz) <= 0) { setTradeMsg('❌ 填卖出数量'); return; }
        setConfirmDesc(`市价卖出 ${sz} ${selSym.replace('-USDT', '')}（约 ${(parseFloat(sz) * parseFloat(tickers[selSym]?.last || '0')).toFixed(2)} USDT）`);
      }
    } else {
      if (!px || !sz) { setTradeMsg('❌ 价格和数量都要填'); return; }
      setConfirmDesc(`限价${side === 'buy' ? '买入' : '卖出'} ${sz} ${selSym.replace('-USDT', '')} @ ${px} USDT`);
    }
  };

  const confirmOrder = async () => {
    if (!keys) return;
    setConfirmDesc(null);
    setTradeMsg('提交中…');
    try {
      let r: OrderResult[];
      if (ordMode === 'market') {
        r = side === 'buy'
          ? await okxRequest<OrderResult>('POST', '/api/v5/trade/order', keys, { instId: selSym, side: 'buy', ordType: 'market', sz: String(buyAmt), tgtCcy: 'quote_ccy' })
          : await okxRequest<OrderResult>('POST', '/api/v5/trade/order', keys, { instId: selSym, side: 'sell', ordType: 'market', sz: String(sz) });
      } else {
        r = await okxRequest<OrderResult>('POST', '/api/v5/trade/order', keys, { instId: selSym, side, ordType: 'limit', px: String(px), sz: String(sz) });
      }
      const o = r[0];
      if (o.sCode === '0') {
        setTradeMsg(`✅ 已提交 委托号 ${o.ordId}`);
        setPx(''); setSz(''); setBuyAmt('');
        setTimeout(refreshAccount, 800);
      } else {
        setTradeMsg(`❌ ${o.sMsg}`);
      }
    } catch (e) {
      setTradeMsg(`❌ ${e instanceof Error ? e.message : '下单失败'}`);
    }
  };

  const cancelOrder = async (ordId: string, instId: string) => {
    if (!keys) return;
    try {
      const r = await okxRequest<OrderResult>('POST', '/api/v5/trade/cancel-order', keys, { ordId, instId });
      setTradeMsg(r[0].sCode === '0' ? `已撤单 ${ordId}` : `撤单失败: ${r[0].sMsg}`);
      setTimeout(refreshAccount, 600);
    } catch (e) {
      setTradeMsg(`撤单失败: ${e instanceof Error ? e.message : ''}`);
    }
  };

  // K线加载
  const loadCandles = useCallback(async (sym: string, b: string) => {
    setChartLoading(true);
    try {
      const cs = await fetchCandles(sym, b);
      setCandles(cs);
    } catch {
      setCandles([]);
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showChart) loadCandles(chartSym, bar);
  }, [showChart, chartSym, bar, loadCandles]);

  // K线定时刷新（打开时每 30s）
  useEffect(() => {
    if (!showChart) return;
    const id = setInterval(() => loadCandles(chartSym, bar), 30000);
    return () => clearInterval(id);
  }, [showChart, chartSym, bar, loadCandles]);

  // 成交历史加载
  const loadHistory = useCallback(async () => {
    if (!keys) return;
    setHistLoading(true);
    try {
      const h = await okxRequest<OrderHistoryItem>('GET', '/api/v5/trade/orders-history?instType=SPOT&limit=50', keys);
      setHistory(h);
    } catch {
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  }, [keys]);

  const openChart = (sym: string) => {
    setChartSym(sym);
    setShowChart(true);
  };

  const addSymbol = () => {
    const s = newSymbol.trim().toUpperCase();
    if (!s) return;
    const full = s.includes('-') ? s : s + '-USDT';
    if (!watch.includes(full)) persistWatch([...watch, full]);
    setNewSymbol('');
  };

  const removeSymbol = (s: string) => persistWatch(watch.filter(x => x !== s));

  const usdt = balance?.details?.find(d => d.ccy === 'USDT');

  // 按当前币余额百分比填卖出数量
  const setSellPct = (p: number) => {
    const base = selSym.replace('-USDT', '');
    const d = balance?.details?.find(x => x.ccy === base);
    if (d && parseFloat(d.availBal) > 0) setSz((parseFloat(d.availBal) * p / 100).toPrecision(6));
  };

  // 行情页一键买卖：跳交易 tab 并预选方向/币种
  const quickTrade = (sym: string, s: 'buy' | 'sell') => {
    setSelSym(sym);
    setSide(s);
    setTab('trade');
    setOrdMode('market');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* iPhone 添加到主屏幕引导 */}
        {showPwaHint && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center gap-2">
            <span className="text-lg">📲</span>
            <p className="flex-1 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              把面板装到主屏幕：Safari 分享 <b>⬆︎</b> →「添加到主屏幕」，全屏运行像原生 app
            </p>
            <button
              onClick={() => { setShowPwaHint(false); try { localStorage.setItem('pwa-hint-dismissed', '1'); } catch {} }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800 text-blue-500 text-xs shrink-0"
              aria-label="关闭提示"
            >✕</button>
          </div>
        )}
        {/* Tab 切换 + 口令状态 */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setTab('market')} className={`px-4 py-1.5 text-sm rounded-lg font-medium ${tab === 'market' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>行情</button>
          <button onClick={() => setTab('trade')} className={`px-4 py-1.5 text-sm rounded-lg font-medium ${tab === 'trade' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>交易</button>
          <div className="flex-1" />
          <button
            onClick={() => setShowProxyModal(true)}
            className={`w-7 h-7 flex items-center justify-center rounded-full text-xs ${proxyReady ? 'bg-green-100 text-green-600 dark:bg-green-900/40' : 'bg-red-100 text-red-500 dark:bg-red-900/40 animate-pulse'}`}
            title={proxyReady ? '代理口令已配置' : '代理口令未配置，点此设置'}
            aria-label="代理口令设置"
          >
            {proxyReady ? '🔒' : '🔓'}
          </button>
        </div>

        {tab === 'market' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">行情面板</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lastUpdate ? `更新于 ${new Date(lastUpdate).toLocaleTimeString('zh-CN')}` : '加载中…'}
                  {err && <span className="text-red-500 ml-2">{err}</span>}
                </p>
              </div>
              <button onClick={() => setPaused(p => !p)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                {paused ? '▶ 继续' : '⏸ 暂停'}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
              {watch.map(sym => {
                const t = tickers[sym];
                const chg = t ? ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h)) * 100 : 0;
                const up = chg >= 0;
                return (
                  <div key={sym} className="flex items-center px-4 py-3 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700/50" onClick={() => openChart(sym)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{sym.replace('-USDT', '')}</span>
                        <span className="text-[10px] text-gray-400">/USDT</span>
                      </div>
                      {t && (
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          高 {fmtPrice(t.high24h)} · 低 {fmtPrice(t.low24h)} · 量 {fmtVol(t.volCcy24h)}U
                        </div>
                      )}
                    </div>
                    <div className="text-right mr-2">
                      <div className={`font-mono font-semibold text-sm ${up ? 'text-red-500' : 'text-green-500'}`}>
                        {t ? fmtPrice(t.last) : '—'}
                      </div>
                      {t && (
                        <div className={`text-[11px] font-mono ${up ? 'text-red-400' : 'text-green-400'}`}>
                          {up ? '+' : ''}{chg.toFixed(2)}%
                        </div>
                      )}
                    </div>
                    {keys && (
                      <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => quickTrade(sym, 'buy')} className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500 text-white active:scale-90 transition">买</button>
                        <button onClick={() => quickTrade(sym, 'sell')} className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-500 text-white active:scale-90 transition">卖</button>
                      </div>
                    )}
                    <span className={`ml-1 w-6 h-6 flex items-center justify-center text-gray-300 text-base ${keys ? 'hidden' : ''}`} aria-hidden>📈</span>
                  </div>
                );
              })}
              {!watch.length && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">列表空了，加一个币种吧</div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSymbol()}
                placeholder="币种，如 PEPE 或 DOGE"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={addSymbol} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition">
                添加
              </button>
            </div>

            <p className="mt-6 text-[11px] text-gray-400 text-center">
              数据源 OKX · 经 proxy.slwen.cn 中转 · 仅供个人参考，不构成投资建议
            </p>
          </>
        )}

        {tab === 'trade' && (
          <>
            {/* Key 管理 */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">交易</h1>
              {keys ? (
                <div className="flex gap-2">
                  <button onClick={() => setShowKeyModal(true)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">更换 Key</button>
                  <button onClick={clearKeys} className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-500 hover:bg-red-50 dark:border-red-800">清除</button>
                </div>
              ) : (
                <button onClick={() => setShowKeyModal(true)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  连接账户
                </button>
              )}
            </div>

            {!keys && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">连接 OKX API 后可查看资产和下单</p>
                <button onClick={() => setShowKeyModal(true)} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  添加 API Key
                </button>
                <p className="mt-4 text-[11px] text-gray-400">
                  建议：API key 只开「交易」权限，绑定 IP 可留空（经 CF 中转 IP 不定），密钥只存在你手机浏览器里
                </p>
              </div>
            )}

            {keys && (
              <>
                {/* 资产 */}
                {balance && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="text-xs text-gray-500">总权益</span>
                      <span className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                        ${fmtPrice(balance.totalEq)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      {balance.details?.filter(d => parseFloat(d.eq) > 0).map(d => (
                        <div key={d.ccy} className="flex justify-between">
                          <span className="text-gray-500">{d.ccy}</span>
                          <span className="font-mono text-gray-900 dark:text-gray-200">{fmtPrice(d.eq)}U</span>
                        </div>
                      ))}
                    </div>
                    {usdt && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs">
                        <span className="text-gray-500">USDT 可用</span>
                        <span className="font-mono text-gray-900 dark:text-gray-200">{usdt.availBal}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 下单表单 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setSide('buy')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${side === 'buy' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>买入</button>
                    <button onClick={() => setSide('sell')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${side === 'sell' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>卖出</button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <select value={selSym} onChange={e => setSelSym(e.target.value)} className="flex-1 px-2 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      {watch.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                      <button onClick={() => setOrdMode('market')} className={`px-3 py-2 text-xs font-medium ${ordMode === 'market' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>市价</button>
                      <button onClick={() => setOrdMode('limit')} className={`px-3 py-2 text-xs font-medium ${ordMode === 'limit' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>限价</button>
                    </div>
                  </div>

                  {ordMode === 'market' ? (
                    <div className="mb-3">
                      {side === 'buy' ? (
                        <>
                          <div className="flex items-center mb-2">
                            <input value={buyAmt} onChange={e => setBuyAmt(e.target.value)} inputMode="decimal" placeholder="买入金额" className="flex-1 px-3 py-2.5 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                            <span className="ml-2 text-xs text-gray-400">USDT</span>
                          </div>
                          <div className="flex gap-1.5">
                            {[25, 50, 75, 100].map(p => (
                              <button key={p} onClick={() => setBuyAmt(((parseFloat(usdt?.availBal || '0') * p) / 100).toFixed(2))}
                                className="flex-1 py-1.5 text-[11px] rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 active:scale-95 transition">
                                {p === 100 ? '全仓' : `${p}%`}
                              </button>
                            ))}
                          </div>
                          <p className="mt-1.5 text-[10px] text-gray-400">可用 {usdt?.availBal || '0'} USDT{tickers[selSym] ? ` · 约 ${buyAmt && parseFloat(buyAmt) > 0 ? (parseFloat(buyAmt) / parseFloat(tickers[selSym].last)).toPrecision(4) : '—'} ${selSym.replace('-USDT', '')}` : ''}</p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center mb-2">
                            <input value={sz} onChange={e => setSz(e.target.value)} inputMode="decimal" placeholder="卖出数量" className="flex-1 px-3 py-2.5 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                            <span className="ml-2 text-xs text-gray-400">{selSym.replace('-USDT', '')}</span>
                          </div>
                          <div className="flex gap-1.5">
                            {[25, 50, 75, 100].map(p => (
                              <button key={p} onClick={() => setSellPct(p)} className="flex-1 py-1.5 text-[11px] rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 active:scale-95 transition">
                                {p === 100 ? '全部' : `${p}%`}
                              </button>
                            ))}
                          </div>
                          <p className="mt-1.5 text-[10px] text-gray-400">按币种数量卖出{tickers[selSym] && sz && parseFloat(sz) > 0 ? ` · 约 ${(parseFloat(sz) * parseFloat(tickers[selSym].last)).toFixed(2)} USDT` : ''}</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-2">
                        <input value={px} onChange={e => setPx(e.target.value)} inputMode="decimal" placeholder="价格 USDT" className="flex-1 px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                        <button onClick={() => setPx(tickers[selSym]?.last || '')} className="px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500">现价</button>
                      </div>
                      <input value={sz} onChange={e => setSz(e.target.value)} inputMode="decimal" placeholder="数量" className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-3" />
                    </>
                  )}

                  <button onClick={submitOrder} className={`w-full py-2.5 text-sm font-bold text-white rounded-lg active:scale-[0.98] transition ${side === 'buy' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                    {side === 'buy' ? '买入' : '卖出'} {selSym.replace('-USDT', '')}
                  </button>
                  {tradeMsg && <p className={`mt-2 text-xs text-center ${tradeMsg.startsWith('✅') ? 'text-green-600' : tradeMsg.startsWith('❌') ? 'text-red-500' : 'text-gray-500'}`}>{tradeMsg}</p>}
                </div>

                {/* 当前挂单 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-4">
                  <div className="px-4 py-2.5 text-xs font-medium text-gray-500 border-b border-gray-100 dark:border-gray-700 flex justify-between">
                    <span>当前挂单</span>
                    <button onClick={refreshAccount} className="text-blue-500">刷新</button>
                  </div>
                  {orders.length ? orders.map(o => (
                    <div key={o.ordId} className="flex items-center px-4 py-2.5 text-xs border-b border-gray-50 dark:border-gray-700/50">
                      <span className={`font-medium ${o.side === 'buy' ? 'text-red-500' : 'text-green-500'}`}>{o.side === 'buy' ? '买' : '卖'}</span>
                      <span className="ml-2 flex-1 text-gray-900 dark:text-gray-200">{o.instId}</span>
                      <span className="font-mono text-gray-500">@ {fmtPrice(o.px)} × {o.sz}</span>
                      <button onClick={() => cancelOrder(o.ordId, o.instId)} className="ml-3 text-red-400 hover:text-red-600">撤</button>
                    </div>
                  )) : (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">无挂单</div>
                  )}
                </div>

                {/* 成交历史 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 text-xs font-medium text-gray-500 border-b border-gray-100 dark:border-gray-700 flex justify-between">
                    <span>成交历史</span>
                    <button onClick={loadHistory} className="text-blue-500">{histLoading ? '加载中…' : '刷新'}</button>
                  </div>
                  {history.length ? history.map(o => {
                    const filled = o.state === 'filled';
                    return (
                      <div key={o.ordId} className="px-4 py-2.5 text-xs border-b border-gray-50 dark:border-gray-700/50">
                        <div className="flex items-center">
                          <span className={`font-medium ${o.side === 'buy' ? 'text-red-500' : 'text-green-500'}`}>{o.side === 'buy' ? '买入' : '卖出'}</span>
                          <span className="ml-2 flex-1 text-gray-900 dark:text-gray-200">{o.instId}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${filled ? 'bg-red-50 text-red-500 dark:bg-red-900/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                            {filled ? '成交' : o.state === 'canceled' ? '已撤' : '部分成交'}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between text-gray-400 font-mono text-[11px]">
                          <span>{o.avgPx ? `均价 ${fmtPrice(o.avgPx)}` : `委托 ${fmtPrice(o.px)}`} × {o.accFillSz || o.sz}</span>
                          <span>{new Date(+o.uTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">{histLoading ? '加载中…' : '暂无记录，点刷新拉取'}</div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* K线弹层（底部抽屉） */}
        {showChart && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowChart(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-4 pb-8" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{chartSym}</h3>
                  {tickers[chartSym] && (
                    <span className={`text-sm font-mono ${parseFloat(tickers[chartSym].last) >= parseFloat(tickers[chartSym].open24h) ? 'text-red-500' : 'text-green-500'}`}>
                      {fmtPrice(tickers[chartSym].last)}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowChart(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 text-sm">✕</button>
              </div>
              <div className="flex gap-1.5 mb-2">
                {BAR_OPTIONS.map(b => (
                  <button key={b} onClick={() => setBar(b)} className={`px-2.5 py-1 text-[11px] rounded-md font-medium ${bar === b ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {b}
                  </button>
                ))}
                <div className="flex-1" />
                <select value={chartSym} onChange={e => setChartSym(e.target.value)} className="px-2 py-0.5 text-[11px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {watch.map(s => <option key={s} value={s}>{s.replace('-USDT', '')}</option>)}
                </select>
              </div>
              <CandleChart candles={candles} loading={chartLoading} />
              <p className="mt-2 text-center text-[10px] text-gray-400">拖动图表查看历史价格 · 30s 自动刷新</p>
            </div>
          </div>
        )}

        {/* 下单确认弹窗 */}
        {confirmDesc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDesc(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-xs" onClick={e => e.stopPropagation()}>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">确认下单</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{confirmDesc}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDesc(null)} className="flex-1 py-2.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">取消</button>
                <button onClick={confirmOrder} className={`flex-1 py-2.5 text-sm font-bold rounded-lg text-white ${side === 'buy' ? 'bg-red-500' : 'bg-green-500'}`}>
                  确认{side === 'buy' ? '买入' : '卖出'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 代理口令弹窗 */}
        {showProxyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowProxyModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">代理口令</h2>
              <p className="text-[11px] text-gray-400 mb-3">私人工具访问口令，保存在本机浏览器</p>
              <input
                value={proxyKeyInput}
                onChange={e => setProxyKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveProxyKey()}
                type="password"
                placeholder="X-Proxy-Key"
                className="w-full px-3 py-2 mb-3 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowProxyModal(false)} className="flex-1 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">取消</button>
                <button onClick={saveProxyKey} className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">保存</button>
              </div>
            </div>
          </div>
        )}

        {/* Key 弹窗 */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowKeyModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">OKX API Key</h2>
              <input value={keyForm.key} onChange={e => setKeyForm({ ...keyForm, key: e.target.value })} placeholder="API Key" className="w-full px-3 py-2 mb-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input value={keyForm.secret} onChange={e => setKeyForm({ ...keyForm, secret: e.target.value })} placeholder="Secret Key" type="password" className="w-full px-3 py-2 mb-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <input value={keyForm.passphrase} onChange={e => setKeyForm({ ...keyForm, passphrase: e.target.value })} placeholder="Passphrase" type="password" className="w-full px-3 py-2 mb-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <div className="flex gap-2">
                <button onClick={() => setShowKeyModal(false)} className="flex-1 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">取消</button>
                <button onClick={saveKeys} className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">保存</button>
              </div>
              <p className="mt-3 text-[10px] text-gray-400">只存本机浏览器（localStorage），签名在本地完成，请求经 proxy.slwen.cn 中转</p>
            </div>
          </div>
 )}
      </div>
    </div>
  );
}
