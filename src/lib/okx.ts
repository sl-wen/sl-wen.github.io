/**
 * OKX v5 API 客户端（浏览器端）
 *
 * 架构：签名在浏览器完成（HMAC-SHA256 via Web Crypto），请求经
 * proxy.slwen.cn（Cloudflare Worker 反代）透传给 OKX。API key 不出本机。
 *
 * 注意：
 * - 签名用的路径必须是 OKX 侧路径（/api/v5/... 含 query），不是 proxy 路径
 * - 时间戳用 OKX 服务器时间校准过的 ISO 8601（偏差 >30s 会报 50113）
 */

const PROXY = 'https://proxy.slwen.cn/okx';

export interface OkxKeys {
  key: string;
  secret: string;
  passphrase: string;
}

// ---------- Proxy 访问口令（与 OKX key 分开管理） ----------

const PROXY_KEY_STORAGE = 'proxy-key';

export function getProxyKey(): string {
  try { return localStorage.getItem(PROXY_KEY_STORAGE) || ''; } catch { return ''; }
}

export function setProxyKey(k: string): void {
  try { localStorage.setItem(PROXY_KEY_STORAGE, k); } catch {}
}

export function hasProxyKey(): boolean {
  return getProxyKey().length > 0;
}

/** 未配置口令时弹提示（不阻塞，让用户看到错误信息） */
function proxyHeaders(): Record<string, string> {
  const k = getProxyKey();
  return k ? { 'X-Proxy-Key': k } : {};
}

let timeOffset = 0;

/** 校准本地时钟与 OKX 服务器偏差 */
export async function syncTime(): Promise<void> {
  try {
    const res = await fetch(`${PROXY}/public/time`, { cache: 'no-store', headers: proxyHeaders() });
    const d = await res.json();
    if (d.code === '0' && d.data?.[0]?.ts) {
      timeOffset = Number(d.data[0].ts) - Date.now();
    }
  } catch {
    // 校准失败不阻塞——大多数情况本地时钟是准的
  }
}

export function getTimeOffset(): number {
  return timeOffset;
}

function b64encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

async function hmacSha256Base64(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return b64encode(sig);
}

/** 签名（导出供测试） */
export async function makeSign(secret: string, timestamp: string, method: string, path: string, body: string): Promise<string> {
  return hmacSha256Base64(secret, timestamp + method + path + body);
}

interface OkxResponse {
  code: string;
  msg: string;
  data: any[];
}

/** 带签名的 OKX 请求 */
export async function okxRequest<T = any>(
  method: 'GET' | 'POST',
  okxPath: string,
  keys: OkxKeys,
  body?: object,
): Promise<T[]> {
  const ts = new Date(Date.now() + timeOffset).toISOString();
  const bodyStr = body ? JSON.stringify(body) : '';
  const sign = await hmacSha256Base64(keys.secret, ts + method + okxPath + bodyStr);

  const res = await fetch(PROXY + okxPath, {
    method,
    headers: {
      'OK-ACCESS-KEY': keys.key,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': ts,
      'OK-ACCESS-PASSPHRASE': keys.passphrase,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...proxyHeaders(),
    },
    body: bodyStr || undefined,
    cache: 'no-store',
  });

  if (res.status === 429) throw new Error('限流中，稍等几秒再试');
  if (res.status === 403) throw new Error('代理口令未配置或无效（右上角设置）');
  const d: OkxResponse = await res.json();
  if (d.code !== '0') {
    const detail = d.data?.[0]?.sMsg ? ` (${d.data[0].sMsg})` : '';
    throw new Error(`[${d.code}] ${d.msg || '请求失败'}${detail}`);
  }
  return d.data as T[];
}

/** 公开接口（无签名，但要 proxy 口令） */
export async function okxPublic<T = any>(okxPath: string): Promise<T[]> {
  const res = await fetch(PROXY + okxPath, { cache: 'no-store', headers: proxyHeaders() });
  if (res.status === 429) throw new Error('限流中，稍等几秒再试');
  if (res.status === 403) throw new Error('代理口令未配置或无效（右上角设置）');
  const d: OkxResponse = await res.json();
  if (d.code !== '0') throw new Error(`[${d.code}] ${d.msg || '请求失败'}`);
  return d.data as T[];
}

// ---------- 数据类型 ----------

export interface Ticker {
  instId: string;
  last: string;
  open24h: string;
  high24h: string;
  low24h: string;
  vol24h: string;
  volCcy24h: string;
  ts: string;
}

export interface BalanceDetail {
  ccy: string;
  eq: string; // 币种折合 USD
  cashBal: string; // 现金余额
  availBal: string; // 可用
  frozenBal: string;
}

export interface BalanceData {
  totalEq: string; // 总权益折合 USD
  details: BalanceDetail[];
}

export interface PendingOrder {
  instId: string;
  ordId: string;
  side: 'buy' | 'sell';
  ordType: string;
  px: string; // 委托价
  sz: string; // 委托量
  accFillSz: string; // 已成交
  cTime: string;
  state: string;
}

export interface OrderResult {
  ordId: string;
  sCode: string;
  sMsg: string;
}

export interface OrderHistoryItem {
  instId: string;
  ordId: string;
  side: 'buy' | 'sell';
  px: string;
  sz: string;
  avgPx?: string;
  accFillSz: string;
  state: string; // filled | canceled | partially_filled
  fee?: string;
  feeCcy?: string;
  cTime: string;
  uTime: string;
}

export interface Candle {
  ts: number;
  o: number;
  h: number;
  l: number;
  c: number;
  vol: number;
}

/** K线（公开接口，Worker 缓存 5s） */
export async function fetchCandles(instId: string, bar: string): Promise<Candle[]> {
  const rows = await okxPublic<any>(`/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=100`);
  // OKX 返回最新在前，反转成时间升序
  return rows
    .map((r: any[]) => ({ ts: +r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], vol: +r[5] }))
    .reverse();
}

export const BAR_OPTIONS = ['15m', '1H', '4H', '1D'] as const;
