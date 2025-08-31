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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // 检测移动设备
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsMobile(isMobileDevice || isTouchDevice);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        // 确保在客户端渲染
        setIsGameReady(true);

        return () => window.removeEventListener('resize', checkMobile);
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
            <div className="container mx-auto px-2 py-2 md:px-4 md:py-4">
                <div className="text-center mb-2 md:mb-4">
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">RPG游戏</h1>
                    <p className="text-gray-300 text-sm md:text-lg">
                        基于Phaser 3 + React的俯视角游戏演示
                    </p>
                    {isMobile && (
                        <div className="mt-2 md:mt-3 p-2 md:p-3 bg-blue-900/50 border border-blue-500 rounded-lg">
                            <p className="text-blue-200 text-xs md:text-sm">
                                📱 移动端优化：点击"START"按钮开始游戏
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <div className="relative w-full">
                        {/* 增加游戏画面大小，特别是在移动设备上 */}
                        <TopDownGameWrapper
                            width={isMobile ? 400 : 800}
                            height={isMobile ? 600 : 600}
                        />

                        {/* 游戏控制说明 - 移到游戏画面下方 */}
                        <div className="mt-2 md:mt-3 p-2 md:p-3 bg-gray-800 rounded-lg text-white">
                            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">游戏控制：</h3>
                            <ul className="text-xs md:text-sm space-y-1">
                                {isMobile ? (
                                    <>
                                        <li>• 点击"START"按钮开始游戏</li>
                                        <li>• 触摸屏幕进行交互</li>
                                        <li>• 支持触摸操作和手势</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• 点击"START"按钮开始游戏</li>
                                        <li>• 使用 WASD 或方向键移动角色</li>
                                        <li>• 空格键与NPC对话</li>
                                        <li>• ESC键打开菜单</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* 游戏状态信息 - 移到游戏画面下方 */}
                        <div className="mt-2 md:mt-3 p-2 md:p-3 bg-gray-800 rounded-lg text-white">
                            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">游戏状态：</h3>
                            <ul className="text-xs md:text-sm space-y-1">
                                <li>• 游戏引擎：Phaser 3</li>
                                <li>• 地图系统：GridEngine</li>
                                <li>• 设备类型：{isMobile ? '移动端' : '桌面端'}</li>
                                <li>• 渲染模式：像素艺术风格</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
