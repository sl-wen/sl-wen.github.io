'use client';

import { RPGGame } from '@/components/game/RPGGame';
import { useEffect, useRef } from 'react';

/**
 * 布局测试页面
 * 用于验证农场布局是否正确显示，特别是在开发者工具打开的情况下
 */
export default function LayoutTestPage() {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<RPGGame | null>(null);

    useEffect(() => {
        if (gameContainerRef.current && !gameRef.current) {
            // 创建游戏实例
            gameRef.current = new RPGGame(gameContainerRef.current);

            // 添加布局信息显示
            const layoutInfo = document.createElement('div');
            layoutInfo.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 1000;
        max-width: 300px;
      `;

            const updateLayoutInfo = () => {
                const isDevelopment = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.port !== '';

                layoutInfo.innerHTML = `
          <div><strong>布局测试信息</strong></div>
          <div>屏幕宽度: ${window.innerWidth}px</div>
          <div>屏幕高度: ${window.innerHeight}px</div>
          <div>开发环境: ${isDevelopment ? '是' : '否'}</div>
          <div>右侧预留: ${isDevelopment ? '450px' : '50px'}</div>
          <div>可用宽度: ${window.innerWidth - (isDevelopment ? 500 : 100)}px</div>
          <br>
          <div><strong>布局区域:</strong></div>
          <div>• 房子: 左侧40%</div>
          <div>• 道路: 中间20%</div>
          <div>• 池塘: 右侧40% (上半)</div>
          <div>• 农场: 右侧40% (下半)</div>
          <br>
          <div><em>提示: 打开开发者工具测试布局适配</em></div>
        `;
            };

            updateLayoutInfo();
            document.body.appendChild(layoutInfo);

            // 监听窗口大小变化
            window.addEventListener('resize', updateLayoutInfo);

            // 清理函数
            return () => {
                window.removeEventListener('resize', updateLayoutInfo);
                if (layoutInfo.parentNode) {
                    layoutInfo.parentNode.removeChild(layoutInfo);
                }
                if (gameRef.current) {
                    gameRef.current.destroy();
                    gameRef.current = null;
                }
            };
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <div className="bg-blue-600 text-white p-4 text-center">
                <h1 className="text-2xl font-bold">农场布局测试</h1>
                <p className="text-sm mt-2">
                    测试农场布局在不同屏幕尺寸和开发者工具状态下的显示效果
                </p>
            </div>

            <div
                ref={gameContainerRef}
                className="flex-1 w-full"
                style={{ minHeight: '600px' }}
            />

            <div className="bg-gray-800 text-white p-4 text-center text-sm">
                <p>使用 WASD 键移动，空格键交互 | 打开开发者工具测试布局适配</p>
            </div>
        </div>
    );
}
