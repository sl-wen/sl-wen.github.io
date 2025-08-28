'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// 动态导入游戏组件，避免SSR问题
const TopDownGameWrapper = dynamic(
    () => import('@/components/game/top-down/TopDownGame').then(mod => ({ default: mod.TopDownGame })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-white text-xl">加载游戏中...</div>
            </div>
        )
    }
);

export default function TopDownGamePage() {
    const [isGameReady, setIsGameReady] = useState(false);

    useEffect(() => {
        // 确保在客户端渲染
        setIsGameReady(true);
    }, []);

    if (!isGameReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-white text-xl">初始化游戏...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">俯视角RPG游戏</h1>
                    <p className="text-gray-300 text-lg">
                        基于Phaser 3 + React的俯视角游戏演示
                    </p>
                </div>

                <div className="flex justify-center">
                    <div className="relative">
                        <TopDownGameWrapper />

                        {/* 游戏控制说明 */}
                        <div className="mt-4 p-4 bg-gray-800 rounded-lg text-white">
                            <h3 className="text-lg font-semibold mb-2">游戏控制：</h3>
                            <ul className="text-sm space-y-1">
                                <li>• 使用 WASD 或方向键移动角色</li>
                                <li>• 空格键与NPC对话</li>
                                <li>• ESC键打开菜单</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
