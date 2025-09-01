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
                <div className="text-white text-xl">加载演示中...</div>
            </div>
        )
    }
);

export default function DemoPage() {
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
                <div className="text-white text-xl">初始化演示...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="container mx-auto px-4 py-4">
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold text-white mb-2">游戏演示</h1>
                    <p className="text-gray-300">体验 React + TypeScript + Phaser 构建的 2D 游戏</p>
                    <div className="mt-2">
                        <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm mr-2">React 19</span>
                        <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm mr-2">TypeScript</span>
                        <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm mr-2">Phaser 3</span>
                        <span className="inline-block bg-yellow-600 text-white px-3 py-1 rounded-full text-sm">GridEngine</span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="relative" style={{ minHeight: `${isMobile ? 600 : 600}px` }}>
                        <TopDownGameWrapper
                            width={isMobile ? 400 : 800}
                            height={isMobile ? 600 : 600}
                        />

                        {/* 演示特性说明 */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-800 rounded-lg text-white">
                                <h3 className="text-lg font-semibold mb-2">✨ 游戏特性</h3>
                                <ul className="text-sm space-y-1">
                                    <li>• 🎭 角色精灵和动画系统</li>
                                    <li>• 🏃 流畅的角色移动</li>
                                    <li>• 💬 NPC对话系统</li>
                                    <li>• 💰 物品收集机制</li>
                                    <li>• ⚡ 实时碰撞检测</li>
                                    <li>• 🎮 完整的游戏状态管理</li>
                                </ul>
                            </div>
                            
                            <div className="p-4 bg-gray-800 rounded-lg text-white">
                                <h3 className="text-lg font-semibold mb-2">🎮 控制说明</h3>
                                <ul className="text-sm space-y-1">
                                    <li>• 使用 WASD 或方向键移动</li>
                                    <li>• 空格键与NPC对话</li>
                                    <li>• ESC键打开/关闭菜单</li>
                                    <li>• 鼠标点击菜单选择</li>
                                    {isMobile && (
                                        <>
                                            <li>• 触摸屏幕移动角色</li>
                                            <li>• 点击交互元素</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* 技术栈信息 */}
                        <div className="mt-4 p-4 bg-gray-800 rounded-lg text-white">
                            <h3 className="text-lg font-semibold mb-2">🚀 技术栈</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                    <strong>前端框架:</strong><br/>
                                    React 19 + Next.js 14
                                </div>
                                <div>
                                    <strong>类型安全:</strong><br/>
                                    TypeScript
                                </div>
                                <div>
                                    <strong>游戏引擎:</strong><br/>
                                    Phaser 3 + GridEngine
                                </div>
                                <div>
                                    <strong>样式框架:</strong><br/>
                                    TailwindCSS 3
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}