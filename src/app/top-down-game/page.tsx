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

export default function TopDownGamePage() {
    const [isGameReady, setIsGameReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);
    const [skipCompatibility, setSkipCompatibility] = useState(false);

    const addDebugInfo = (info: string) => {
        console.log(`[TopDownGame Debug] ${info}`);
        setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
    };

    useEffect(() => {
        addDebugInfo('页面组件开始初始化');

        // 检测移动设备
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const mobile = isMobileDevice || isTouchDevice;
            setIsMobile(mobile);
            addDebugInfo(`设备检测: ${mobile ? '移动端' : '桌面端'}`);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        // 确保在客户端渲染
        addDebugInfo('设置游戏就绪状态');
        setIsGameReady(true);

        return () => {
            window.removeEventListener('resize', checkMobile);
            addDebugInfo('页面组件卸载');
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
            <div className="container mx-auto px-2 py-2 md:px-4 md:py-4">
                <div className="text-center mb-2 md:mb-4">
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">游戏</h1>

                    {/* 跳过兼容性检查按钮 */}
                    <div className="mb-4 space-x-2">
                        <button
                            onClick={() => setSkipCompatibility(true)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            跳过兼容性检查
                        </button>
                        <a
                            href="/top-down-game/test"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
                        >
                            运行诊断测试
                        </a>
                        <a
                            href="/top-down-game/debug"
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
                        >
                            游戏调试测试
                        </a>
                        <a
                            href="/top-down-game/simple-test"
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
                        >
                            简单游戏测试
                        </a>
                    </div>

                    {isMobile && (
                        <div className="mt-2 md:mt-3 p-2 md:p-3 bg-blue-900/50 border border-blue-500 rounded-lg">
                            <p className="text-blue-200 text-xs md:text-sm">
                                📱 移动端优化：点击"START"按钮开始游戏
                            </p>
                        </div>
                    )}
                </div>

                {/* 调试信息面板 */}
                <div className="mb-4 p-3 bg-gray-800 rounded-lg text-white">
                    <h3 className="text-sm font-semibold mb-2">调试信息：</h3>
                    <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                        {debugInfo.map((info, index) => (
                            <div key={index} className="text-gray-300">{info}</div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="relative w-full">
                        {/* 增加游戏画面大小，特别是在移动设备上 */}
                        <TopDownGameWrapper
                            width={isMobile ? 400 : 1280}
                            height={isMobile ? 600 : 900}
                            skipCompatibility={skipCompatibility}
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
