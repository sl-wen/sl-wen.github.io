import type { Metadata } from 'next';
import SearchPage from '@/pages/SearchPage';

export const metadata: Metadata = {
  title: '搜索 - 鱼鱼的博客',
  description: '搜索博客文章和内容，快速找到您需要的信息。',
};

export default function Page() {
  return <SearchPage />;
} 