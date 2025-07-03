import type { Metadata } from 'next';
import AboutPage from '@/pages/AboutPage';

export const metadata: Metadata = {
  title: '关于我们 - 鱼鱼的博客',
  description: '了解鱼鱼的博客，我们的故事和使命。',
};

export default function Page() {
  return <AboutPage />;
} 