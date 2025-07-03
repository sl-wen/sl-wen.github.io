import type { Metadata } from 'next';
import CategoryPage from '@/pages/CategoryPage';

export const metadata: Metadata = {
  title: '分类 - 鱼鱼的博客',
  description: '浏览博客文章分类，找到您感兴趣的内容。',
};

export default function Page() {
  return <CategoryPage />;
} 