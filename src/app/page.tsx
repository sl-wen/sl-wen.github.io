import type { Metadata } from 'next';
import HomePage from '@/pages/HomePage';

export const metadata: Metadata = {
  title: '首页 - 鱼鱼的博客',
  description: '欢迎来到鱼鱼的博客，这里分享技术文章、生活感悟和各种有趣的内容。',
};

export default function Page() {
  return <HomePage />;
} 