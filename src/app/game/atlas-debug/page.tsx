'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 图集调试页面
 * 用于可视化Overworld.png图集并确定精灵坐标
 */
export default function AtlasDebugPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [selectedArea, setSelectedArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [spriteDefinitions, setSpriteDefinitions] = useState<Array<{ key: string, x: number, y: number, width: number, height: number }>>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 加载Overworld.png图片
        const img = new Image();
        img.onload = () => {
            // 设置画布尺寸
            canvas.width = img.width;
            canvas.height = img.height;

            // 绘制图片
            ctx.drawImage(img, 0, 0);

            // 绘制网格
            drawGrid(ctx, img.width, img.height, 32);

            setImageLoaded(true);
        };
        img.src = '/assets/farm-assets/Overworld.png';

        // 鼠标事件处理
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setMousePos({ x, y });
        };

        const handleMouseClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 计算网格坐标
            const gridX = Math.floor(x / 32) * 32;
            const gridY = Math.floor(y / 32) * 32;

            setSelectedArea({ x: gridX, y: gridY, width: 32, height: 32 });
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleMouseClick);

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleMouseClick);
        };
    }, []);

    // 绘制网格
    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        // 绘制垂直线
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    };

    // 添加精灵定义
    const addSpriteDefinition = () => {
        if (!selectedArea) return;

        const key = prompt('请输入精灵键名:');
        if (!key) return;

        const newSprite = {
            key,
            x: selectedArea.x,
            y: selectedArea.y,
            width: selectedArea.width,
            height: selectedArea.height
        };

        setSpriteDefinitions([...spriteDefinitions, newSprite]);
        setSelectedArea(null);
    };

    // 生成代码
    const generateCode = () => {
        const code = `const farmSprites = [
${spriteDefinitions.map(sprite =>
            `  { key: '${sprite.key}', x: ${sprite.x}, y: ${sprite.y}, width: ${sprite.width}, height: ${sprite.height} }`
        ).join(',\n')}
];`;

        navigator.clipboard.writeText(code);
        alert('代码已复制到剪贴板！');
    };

    // 清除选择
    const clearSelection = () => {
        setSelectedArea(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Overworld.png 图集调试工具</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* 图集显示区域 */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4">图集预览</h2>
                            <div className="overflow-auto border border-gray-600 rounded">
                                <canvas
                                    ref={canvasRef}
                                    className="block"
                                    style={{
                                        cursor: 'crosshair',
                                        maxWidth: '100%',
                                        height: 'auto'
                                    }}
                                />
                            </div>

                            {/* 鼠标位置信息 */}
                            <div className="mt-4 text-sm">
                                <p>鼠标位置: ({mousePos.x}, {mousePos.y})</p>
                                <p>网格坐标: ({Math.floor(mousePos.x / 32) * 32}, {Math.floor(mousePos.y / 32) * 32})</p>
                                {selectedArea && (
                                    <p>选中区域: ({selectedArea.x}, {selectedArea.y}) - {selectedArea.width}x{selectedArea.height}</p>
                                )}
                            </div>

                            {/* 操作按钮 */}
                            <div className="mt-4 space-x-2">
                                <button
                                    onClick={addSpriteDefinition}
                                    disabled={!selectedArea}
                                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    添加精灵定义
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="px-4 py-2 bg-gray-600 text-white rounded"
                                >
                                    清除选择
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 控制面板 */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4">精灵定义</h2>

                            {spriteDefinitions.length === 0 ? (
                                <p className="text-gray-400">点击图集中的区域来添加精灵定义</p>
                            ) : (
                                <div className="space-y-2">
                                    {spriteDefinitions.map((sprite, index) => (
                                        <div key={index} className="bg-gray-700 p-2 rounded text-sm">
                                            <div className="font-mono">
                                                <div>{sprite.key}</div>
                                                <div className="text-gray-400">
                                                    ({sprite.x}, {sprite.y}) - {sprite.width}x{sprite.height}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newDefs = spriteDefinitions.filter((_, i) => i !== index);
                                                    setSpriteDefinitions(newDefs);
                                                }}
                                                className="mt-1 px-2 py-1 bg-red-600 text-white rounded text-xs"
                                            >
                                                删除
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={generateCode}
                                        className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded"
                                    >
                                        生成代码
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 使用说明 */}
                        <div className="bg-gray-800 p-4 rounded-lg mt-4">
                            <h3 className="text-lg font-semibold mb-2">使用说明</h3>
                            <ul className="text-sm space-y-1 text-gray-300">
                                <li>• 鼠标悬停查看坐标</li>
                                <li>• 点击选择32x32网格区域</li>
                                <li>• 输入精灵键名添加定义</li>
                                <li>• 生成代码复制到SpriteAtlasManager</li>
                                <li>• 网格大小: 32x32像素</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
