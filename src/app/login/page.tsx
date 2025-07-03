import type { Metadata } from 'next';
import LoginPage from '@/pages/LoginPage';

export const metadata: Metadata = {
  title: '登录 - 鱼鱼的博客',
  description: '登录到鱼鱼的博客，管理您的账户和内容。',
};

export default function Page() {
  return <LoginPage />;
} 