'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 多图集调试页面
 * 自动遍历farm-assets文件夹并可视化所有图集
 */
export default function MultiAtlasDebugPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedAtlas, setSelectedAtlas] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [selectedAreas, setSelectedAreas] = useState<Array<{ x: number; y: number; width: number; height: number }>>([]);
    const [spriteDefinitions, setSpriteDefinitions] = useState<Array<{ key: string, x: number, y: number, width: number, height: number }>>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [gridSize, setGridSize] = useState(16);
    const [atlasConfigs, setAtlasConfigs] = useState<Record<string, { name: string, path: string, defaultGridSize: number, description: string }>>({});
    const [loading, setLoading] = useState(true);

    // 自动扫描farm-assets文件夹
    useEffect(() => {
        const scanFarmAssets = async () => {
            try {
                const response = await fetch('/api/farm-assets');
                if (response.ok) {
                    const assets = await response.json();

                    const configs: Record<string, { name: string, path: string, defaultGridSize: number, description: string }> = {};

                    assets.forEach((asset: string) => {
                        const name = asset;
                        const key = `farm_${asset.replace('.png', '').toLowerCase()}`;

                        let defaultGridSize = 16;
                        let description = '通用素材';

                        if (asset.toLowerCase().includes('character')) {
                            defaultGridSize = 16;
                            description = '角色动画、NPC';
                        } else if (asset.toLowerCase().includes('plants')) {
                            defaultGridSize = 8;
                            description = '作物、植物、装饰';
                        } else if (asset.toLowerCase().includes('objects')) {
                            defaultGridSize = 16;
                            description = '工具、物品、建筑';
                        } else if (asset.toLowerCase().includes('overworld')) {
                            defaultGridSize = 32;
                            description = '地形、建筑、装饰';
                        } else if (asset.toLowerCase().includes('grass')) {
                            defaultGridSize = 32;
                            description = '地形、草地';
                        }

                        configs[key] = {
                            name,
                            path: `/assets/farm-assets/${asset}`,
                            defaultGridSize,
                            description
                        };
                    });

                    setAtlasConfigs(configs);

                    const firstKey = Object.keys(configs)[0];
                    if (firstKey) {
                        setSelectedAtlas(firstKey);
                        setGridSize(configs[firstKey].defaultGridSize);
                    }
                }
            } catch (error) {
                console.error('Failed to scan farm assets:', error);
            } finally {
                setLoading(false);
            }
        };

        scanFarmAssets();
    }, []);

    useEffect(() => {
        if (selectedAtlas && atlasConfigs[selectedAtlas]) {
            loadAtlasImage();
        }
    }, [selectedAtlas, atlasConfigs]);

    useEffect(() => {
        if (imageLoaded) {
            redrawMainCanvas();
            setShowPreview(selectedAreas.length > 0);
        }
    }, [selectedAreas, imageLoaded]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageLoaded) return;

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

            const gridX = Math.floor(x / gridSize) * gridSize;
            const gridY = Math.floor(y / gridSize) * gridSize;

            const newSelectedArea = { x: gridX, y: gridY, width: gridSize, height: gridSize };

            setSelectedAreas(prevAreas => {
                const isAlreadySelected = prevAreas.some(area =>
                    area.x === newSelectedArea.x && area.y === newSelectedArea.y
                );

                if (isAlreadySelected) {
                    const newAreas = prevAreas.filter(area =>
                        !(area.x === newSelectedArea.x && area.y === newSelectedArea.y)
                    );
                    setShowPreview(newAreas.length > 0);
                    return newAreas;
                } else {
                    const newAreas = [...prevAreas, newSelectedArea];
                    setShowPreview(true);
                    return newAreas;
                }
            });
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleMouseClick);

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleMouseClick);
        };
    }, [imageLoaded, gridSize]);

    const loadAtlasImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const config = atlasConfigs[selectedAtlas];
        if (!config) return;

        console.log('Loading image:', config.path);
        setImageLoaded(false);

        const img = new Image();
        img.onload = () => {
            console.log('Image loaded successfully:', img.width, 'x', img.height);

            canvas.width = img.width;
            canvas.height = img.height;
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            console.log('Image drawn to canvas');

            drawGrid(ctx, img.width, img.height, gridSize);
            console.log('Grid drawn');

            setImageLoaded(true);
        };
        img.onerror = (error) => {
            console.error('Failed to load image:', config.path, error);
            setImageLoaded(false);
        };

        img.crossOrigin = 'anonymous';
        img.src = config.path;
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        selectedAreas.forEach(area => {
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 3;
            ctx.strokeRect(area.x, area.y, area.width, area.height);

            ctx.fillStyle = 'rgba(74, 222, 128, 0.2)';
            ctx.fillRect(area.x, area.y, area.width, area.height);
        });
    };

    const addSpriteDefinition = () => {
        if (selectedAreas.length === 0) return;

        const key = prompt('请输入精灵键名:');
        if (!key) return;

        if (selectedAreas.length === 1) {
            const area = selectedAreas[0];
            const newSprite = {
                key: key,
                x: area.x,
                y: area.y,
                width: area.width,
                height: area.height
            };
            setSpriteDefinitions(prev => [...prev, newSprite]);
        } else {
            const minX = Math.min(...selectedAreas.map(area => area.x));
            const minY = Math.min(...selectedAreas.map(area => area.y));
            const maxX = Math.max(...selectedAreas.map(area => area.x + area.width));
            const maxY = Math.max(...selectedAreas.map(area => area.y + area.height));

            const mergedSprite = {
                key: key,
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
            setSpriteDefinitions(prev => [...prev, mergedSprite]);
        }

        setSelectedAreas([]);
    };

    const generateCode = () => {
        const config = atlasConfigs[selectedAtlas];
        const atlasKey = selectedAtlas;

        const code = `// ${config?.name} 精灵定义
const ${atlasKey}_sprites = [
${spriteDefinitions.map(sprite =>
            `  { key: '${sprite.key}', x: ${sprite.x}, y: ${sprite.y}, width: ${sprite.width}, height: ${sprite.height} }`
        ).join(',\n')}
];`;

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(code);
            alert('代码已复制到剪贴板！');
        } else {
            alert(`代码已生成，请手动复制：\n\n${code}`);
        }
    };

    const redrawMainCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const config = atlasConfigs[selectedAtlas];
        if (!config) return;

        console.log('Redrawing canvas...');

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            drawGrid(ctx, img.width, img.height, gridSize);
            console.log('Canvas redrawn with grid');
        };
        img.onerror = (error) => {
            console.error('Failed to redraw image:', config.path, error);
        };
        img.crossOrigin = 'anonymous';
        img.src = config.path;
    };

    const clearSelection = () => {
        setSelectedAreas([]);
        setShowPreview(false);
        if (imageLoaded) {
            redrawMainCanvas();
        }
    };

    const switchAtlas = (atlasKey: string) => {
        setSelectedAtlas(atlasKey);
        setSpriteDefinitions([]);
        setSelectedAreas([]);
        setShowPreview(false);
        setImageLoaded(false);
        const config = atlasConfigs[atlasKey];
        if (config) {
            setGridSize(config.defaultGridSize);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4">多图集调试工具</h1>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-xl">正在扫描farm-assets文件夹...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">多图集调试工具</h1>
                <p className="text-gray-400 mb-6">自动扫描farm-assets文件夹下的所有图集</p>

                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                    <h2 className="text-xl font-semibold mb-3">网格设置</h2>
                    <div className="flex items-center gap-4">
                        <label className="text-sm">
                            网格大小: {gridSize} x {gridSize}
                        </label>
                        <input
                            type="range"
                            min="8"
                            max="64"
                            step="8"
                            value={gridSize}
                            onChange={(e) => {
                                const newSize = parseInt(e.target.value);
                                setGridSize(newSize);
                                setSelectedAreas([]);
                                setShowPreview(false);
                                if (imageLoaded) {
                                    redrawMainCanvas();
                                }
                            }}
                            className="flex-1"
                        />
                        <div className="text-xs text-gray-400">
                            8px - 64px
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">选择图集 ({Object.keys(atlasConfigs).length} 个)</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Object.entries(atlasConfigs).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => switchAtlas(key)}
                                className={`p-4 rounded-lg border-2 transition-colors ${selectedAtlas === key
                                    ? 'border-blue-500 bg-blue-600'
                                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                                    }`}
                            >
                                <div className="font-semibold">{config.name}</div>
                                <div className="text-sm text-gray-300 mt-1">{config.description}</div>
                                <div className="text-xs text-gray-400 mt-1">默认网格: {config.defaultGridSize}x{config.defaultGridSize}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4">
                                {atlasConfigs[selectedAtlas]?.name} 预览
                            </h2>
                            <div className="overflow-auto border border-gray-600 rounded bg-gray-700 p-2">
                                {!imageLoaded && (
                                    <div className="flex items-center justify-center h-64 text-gray-400">
                                        <div>加载中...</div>
                                    </div>
                                )}
                                <canvas
                                    ref={canvasRef}
                                    className="block"
                                    style={{
                                        cursor: 'crosshair',
                                        maxWidth: '100%',
                                        height: 'auto',
                                        imageRendering: 'pixelated',
                                        display: imageLoaded ? 'block' : 'none'
                                    }}
                                />
                            </div>

                            <div className="mt-4 text-sm">
                                <p>鼠标位置: ({mousePos.x}, {mousePos.y})</p>
                                <p>网格坐标: ({Math.floor(mousePos.x / gridSize) * gridSize}, {Math.floor(mousePos.y / gridSize) * gridSize})</p>
                                {selectedAreas.length > 0 && (
                                    <p>已选中 {selectedAreas.length} 个区域</p>
                                )}
                            </div>

                            {showPreview && selectedAreas.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">
                                        {selectedAreas.length === 1 ? '选中区域预览' : '合并区域预览'}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedAreas.length === 1 ? (
                                            <div className="border border-gray-600 rounded p-2 bg-gray-700">
                                                <div className="text-xs text-gray-400 mb-1">单个区域</div>
                                                <div className="text-xs text-gray-400 mb-2">
                                                    ({selectedAreas[0].x}, {selectedAreas[0].y}) - {selectedAreas[0].width}x{selectedAreas[0].height}
                                                </div>
                                                <canvas
                                                    ref={(canvas) => {
                                                        if (canvas) {
                                                            const ctx = canvas.getContext('2d');
                                                            if (ctx && canvasRef.current) {
                                                                const mainCanvas = canvasRef.current;
                                                                const area = selectedAreas[0];
                                                                ctx.drawImage(mainCanvas, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
                                                            }
                                                        }
                                                    }}
                                                    width={selectedAreas[0].width}
                                                    height={selectedAreas[0].height}
                                                    style={{
                                                        border: '2px solid #4ade80',
                                                        imageRendering: 'pixelated'
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="border border-gray-600 rounded p-2 bg-gray-700">
                                                <div className="text-xs text-gray-400 mb-1">合并区域 ({selectedAreas.length} 个)</div>
                                                <canvas
                                                    ref={(canvas) => {
                                                        if (canvas) {
                                                            const ctx = canvas.getContext('2d');
                                                            if (ctx && canvasRef.current) {
                                                                const mainCanvas = canvasRef.current;

                                                                const minX = Math.min(...selectedAreas.map(area => area.x));
                                                                const minY = Math.min(...selectedAreas.map(area => area.y));
                                                                const maxX = Math.max(...selectedAreas.map(area => area.x + area.width));
                                                                const maxY = Math.max(...selectedAreas.map(area => area.y + area.height));

                                                                const mergedWidth = maxX - minX;
                                                                const mergedHeight = maxY - minY;

                                                                canvas.width = mergedWidth;
                                                                canvas.height = mergedHeight;

                                                                ctx.drawImage(mainCanvas, minX, minY, mergedWidth, mergedHeight, 0, 0, mergedWidth, mergedHeight);
                                                            }
                                                        }
                                                    }}
                                                    style={{
                                                        border: '2px solid #4ade80',
                                                        imageRendering: 'pixelated',
                                                        maxWidth: '100%',
                                                        height: 'auto'
                                                    }}
                                                />
                                                <div className="text-xs text-gray-400 mt-2">
                                                    合并尺寸: {Math.min(...selectedAreas.map(area => area.x))}x{Math.min(...selectedAreas.map(area => area.y))} - {Math.max(...selectedAreas.map(area => area.x + area.width)) - Math.min(...selectedAreas.map(area => area.x))}x{Math.max(...selectedAreas.map(area => area.y + area.height)) - Math.min(...selectedAreas.map(area => area.y))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">
                                        <p>网格大小: {gridSize} x {gridSize} 像素</p>
                                        <p>已选中 {selectedAreas.length} 个区域</p>
                                        {selectedAreas.length > 1 && (
                                            <p className="text-yellow-400">多个区域将合并为一个精灵定义</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 space-x-2">
                                <button
                                    onClick={addSpriteDefinition}
                                    disabled={selectedAreas.length === 0}
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

                        <div className="bg-gray-800 p-4 rounded-lg mt-4">
                            <h3 className="text-lg font-semibold mb-2">使用说明</h3>
                            <ul className="text-sm space-y-1 text-gray-300">
                                <li>• 自动扫描farm-assets文件夹</li>
                                <li>• 鼠标悬停查看坐标</li>
                                <li>• 点击选择网格区域（可多选）</li>
                                <li>• 单个区域：创建独立精灵</li>
                                <li>• 多个区域：自动合并为一个精灵</li>
                                <li>• 输入精灵键名添加定义</li>
                                <li>• 生成代码复制到SpriteAtlasManager</li>
                                <li>• 不同图集使用不同的网格大小</li>
                            </ul>
                        </div>

                        <div className="bg-gray-800 p-4 rounded-lg mt-4">
                            <h3 className="text-lg font-semibold mb-2">当前图集信息</h3>
                            <div className="text-sm text-gray-300">
                                <p><strong>名称:</strong> {atlasConfigs[selectedAtlas]?.name}</p>
                                <p><strong>描述:</strong> {atlasConfigs[selectedAtlas]?.description}</p>
                                <p><strong>当前网格:</strong> {gridSize}x{gridSize}</p>
                                <p><strong>默认网格:</strong> {atlasConfigs[selectedAtlas]?.defaultGridSize}x{atlasConfigs[selectedAtlas]?.defaultGridSize}</p>
                                <p><strong>键名:</strong> {selectedAtlas}</p>
                                <p><strong>总图集数:</strong> {Object.keys(atlasConfigs).length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
