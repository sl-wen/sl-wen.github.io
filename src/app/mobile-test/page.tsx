'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// 动态导入游戏组件
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

export default function MobileTestPage() {
    const [isMobile, setIsMobile] = useState(false);
    const [screenInfo, setScreenInfo] = useState({
        width: 0,
        height: 0,
        pixelRatio: 1
    });

    useEffect(() => {
        const checkDevice = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            setIsMobile(isMobileDevice || isTouchDevice);
            
            setScreenInfo({
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: window.devicePixelRatio || 1
            });
        };
        
        checkDevice();
        window.addEventListener('resize', checkDevice);
        
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 p-2">
            {/* 设备信息显示 */}
            <div className="bg-gray-800 rounded-lg p-3 mb-4 text-white text-sm">
                <h2 className="font-bold mb-2">设备信息</h2>
                <div className="grid grid-cols-2 gap-2">
                    <div>设备类型: {isMobile ? '移动端' : '桌面端'}</div>
                    <div>屏幕宽度: {screenInfo.width}px</div>
                    <div>屏幕高度: {screenInfo.height}px</div>
                    <div>像素比例: {screenInfo.pixelRatio}</div>
                </div>
            </div>

            {/* 游戏容器 */}
            <div className="flex justify-center">
                <div className="relative w-full max-w-2xl">
                    <TopDownGameWrapper 
                        width={isMobile ? 400 : 800} 
                        height={isMobile ? 600 : 600} 
                    />
                </div>
            </div>

            {/* 操作提示 */}
            <div className="mt-4 bg-blue-900/50 border border-blue-500 rounded-lg p-3 text-white text-center">
                <p className="text-sm">
                    {isMobile ? 
                        '📱 移动端测试：请点击游戏画面中的START按钮开始游戏' :
                        '🖥️ 桌面端测试：请点击游戏画面中的START按钮或按回车键开始游戏'
                    }
                </p>
            </div>
        </div>
    );
}