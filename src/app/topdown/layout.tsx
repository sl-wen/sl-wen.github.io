import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tiny Defense — 3D塔防',
  description: '用低多边形几何体搭建的3D塔防游戏。选择塔类型，点击地块放置，抵御8波敌人的进攻！',
};

export default function TopdownLayout({ children }: { children: React.ReactNode }) {
  return children;
}
