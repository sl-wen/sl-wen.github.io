import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于',
  description: '关于鱼鱼的博客 — 一个分享技术、记录生活、探索世界的个人博客。',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
