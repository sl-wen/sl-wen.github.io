'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// 动态导入游戏组件，避免SSR问题
const TopDownGameWrapper = dynamic(
    () => import('@/components/game/TopDownGame').then(mod => ({ default: mod.TopDownGame })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-white text-xl">加载游戏中...</div>
            </div>
        )
    }
);

export default function GamePage() {
    const [isGameReady, setIsGameReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // 检测移动设备
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const mobile = isMobileDevice || isTouchDevice;
            setIsMobile(mobile);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        // 确保在客户端渲染
        setIsGameReady(true);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
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
            <div className="container mx-auto px-4 py-4">
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold text-white mb-2">Top-Down 游戏</h1>
                    <p className="text-gray-300">一个简单的 2D 角色扮演游戏</p>
                </div>

                <div className="flex justify-center">
                    <div className="relative" style={{ minHeight: `${isMobile ? 600 : 600}px` }}>
                        <TopDownGameWrapper
                            width={isMobile ? 400 : 800}
                            height={isMobile ? 600 : 600}
                        />

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