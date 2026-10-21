import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '小说聚合搜索',
  description: '聚合20+书源，一键搜索全网小说。支持书名、作者搜索，快速找到你想看的小说。',
  keywords: ['小说搜索', '小说聚合', '找书', '书源'],
};

export default function NovelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
