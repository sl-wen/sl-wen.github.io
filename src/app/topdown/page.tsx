'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAuth } from '@/utils/auth-context';
import { getFarmData } from '@/utils/farmdataService';

// 动态导入游戏组件，避免 SSR 问题
const TopDownGame = dynamic(() => import('./App'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-lg">Loading game...</p>
      </div>
    </div>
  ),
});

export default function TopDownPage() {
  const [isClient, setIsClient] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 将保存的 farmdata 注入到 window，供 MainMenuScene 读取
  useEffect(() => {
    const inject = async () => {
      if (!userProfile?.user_id) return;
      const data = await getFarmData(userProfile.user_id);
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window.__farmdata = data || null;
      }
    };
    inject();
  }, [userProfile]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <TopDownGame />
    </div>
  );
}