'use client';

import { useEffect, useRef, useState } from 'react';

export default function MultiAtlasDebugPage() {
    const canvasRef = useRef(null);
    const [isClient, setIsClient] = useState(false);
    const [loading, setLoading] = useState(true);
    const [atlasConfigs, setAtlasConfigs] = useState({});
    const [selectedAtlas, setSelectedAtlas] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [gridSize, setGridSize] = useState(16);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const scanFarmAssets = async () => {
            try {
                const response = await fetch('/api/farm-assets');
                if (response.ok) {
                    const assets = await response.json();
                    console.log('Found assets:', assets);

                    const configs = {};
                    assets.forEach((asset) => {
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
    }, [isClient]);

    useEffect(() => {
        if (selectedAtlas && atlasConfigs[selectedAtlas]) {
            loadAtlasImage();
        }
    }, [selectedAtlas, atlasConfigs]);

    const loadAtlasImage = () => {
        if (!isClient) return;

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

    const drawGrid = (ctx, width, height, gridSize) => {
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
    };

    const switchAtlas = (atlasKey) => {
        setSelectedAtlas(atlasKey);
        setImageLoaded(false);
        const config = atlasConfigs[atlasKey];
        if (config) {
            setGridSize(config.defaultGridSize);
        }
    };

    if (!isClient) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4">多图集调试工具</h1>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-xl">正在初始化...</div>
                    </div>
                </div>
            </div>
        );
    }

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
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 p-4 rounded-lg">
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
