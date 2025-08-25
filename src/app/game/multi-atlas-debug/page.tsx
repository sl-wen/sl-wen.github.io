'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface GridSelection {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface AtlasConfig {
    name: string;
    path: string;
    defaultGridSize: number;
    description: string;
}

export default function MultiAtlasDebugPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isClient, setIsClient] = useState(false);
    const [loading, setLoading] = useState(true);
    const [atlasConfigs, setAtlasConfigs] = useState<Record<string, AtlasConfig>>({});
    const [selectedAtlas, setSelectedAtlas] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [gridSize, setGridSize] = useState(16);
    
    // 多选相关状态
    const [selectedGrids, setSelectedGrids] = useState<GridSelection[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [currentSelection, setCurrentSelection] = useState<GridSelection | null>(null);
    const [selectionMode, setSelectionMode] = useState<'single' | 'multi'>('multi');
    
    // 导出相关状态
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState<'code' | 'json'>('code');
    
    // 撤销/重做状态
    const [selectionHistory, setSelectionHistory] = useState<GridSelection[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

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

                    const configs: Record<string, AtlasConfig> = {};
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
    };

    // 绘制选中的网格
    const drawSelectedGrids = (ctx: CanvasRenderingContext2D) => {
        selectedGrids.forEach((selection, index) => {
            ctx.fillStyle = `rgba(0, 123, 255, 0.3)`;
            ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
            
            ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
            
            // 绘制选择编号
            ctx.fillStyle = 'rgba(0, 123, 255, 0.9)';
            ctx.font = '12px Arial';
            ctx.fillText(`${index + 1}`, selection.x + 4, selection.y + 16);
        });
    };

    // 绘制当前选择框
    const drawCurrentSelection = (ctx: CanvasRenderingContext2D) => {
        if (currentSelection) {
            ctx.fillStyle = 'rgba(255, 193, 7, 0.2)';
            ctx.fillRect(currentSelection.x, currentSelection.y, currentSelection.width, currentSelection.height);
            
            ctx.strokeStyle = 'rgba(255, 193, 7, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(currentSelection.x, currentSelection.y, currentSelection.width, currentSelection.height);
            ctx.setLineDash([]);
        }
    };

    // 获取画布相对坐标
    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: Math.floor(((e.clientX - rect.left) * scaleX) / gridSize) * gridSize,
            y: Math.floor(((e.clientY - rect.top) * scaleY) / gridSize) * gridSize
        };
    };

    // 鼠标按下事件
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        setIsSelecting(true);
        setSelectionStart(coords);
        setCurrentSelection({
            x: coords.x,
            y: coords.y,
            width: gridSize,
            height: gridSize
        });
    }, [gridSize]);

    // 鼠标移动事件
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        setMousePos(coords);
        
        if (isSelecting && selectionStart) {
            const width = Math.abs(coords.x - selectionStart.x) + gridSize;
            const height = Math.abs(coords.y - selectionStart.y) + gridSize;
            const x = Math.min(coords.x, selectionStart.x);
            const y = Math.min(coords.y, selectionStart.y);
            
            setCurrentSelection({ x, y, width, height });
        }
    }, [isSelecting, selectionStart, gridSize]);

    // 鼠标抬起事件
    const handleMouseUp = useCallback(() => {
        if (isSelecting && currentSelection) {
            let newSelections: GridSelection[];
            if (selectionMode === 'single') {
                newSelections = [currentSelection];
            } else {
                newSelections = [...selectedGrids, currentSelection];
            }
            addToHistory(newSelections);
            setSelectedGrids(newSelections);
        }
        setIsSelecting(false);
        setCurrentSelection(null);
    }, [isSelecting, currentSelection, selectionMode, selectedGrids]);

    // 重绘画布
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageLoaded) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const config = atlasConfigs[selectedAtlas];
        if (!config) return;

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            drawGrid(ctx, img.width, img.height, gridSize);
            drawSelectedGrids(ctx);
            drawCurrentSelection(ctx);
        };
        img.crossOrigin = 'anonymous';
        img.src = config.path;
    }, [imageLoaded, selectedAtlas, atlasConfigs, gridSize, selectedGrids, currentSelection]);

    // 当选择改变时重绘
    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    const switchAtlas = (atlasKey: string) => {
        setSelectedAtlas(atlasKey);
        setImageLoaded(false);
        setSelectedGrids([]); // 切换图集时清除选择
        const config = atlasConfigs[atlasKey];
        if (config) {
            setGridSize(config.defaultGridSize);
        }
    };

    // 生成代码
    const generateCode = () => {
        const config = atlasConfigs[selectedAtlas];
        if (!config || selectedGrids.length === 0) return '';

        const frames = selectedGrids.map((selection, index) => ({
            name: `frame_${index + 1}`,
            x: selection.x,
            y: selection.y,
            width: selection.width,
            height: selection.height
        }));

        return `// ${config.name} - 选中的帧配置
const atlasConfig = {
    key: '${selectedAtlas}',
    path: '${config.path}',
    frames: [
${frames.map(frame => 
        `        {
            name: '${frame.name}',
            x: ${frame.x},
            y: ${frame.y},
            width: ${frame.width},
            height: ${frame.height}
        }`
    ).join(',\n')}
    ]
};

// Phaser 3 加载配置
this.load.atlas('${selectedAtlas}', '${config.path}', null, atlasConfig.frames);

// 使用示例
${frames.map(frame => 
        `this.add.image(x, y, '${selectedAtlas}', '${frame.name}');`
    ).join('\n')}`;
    };

    // 导出合并图片（水平排列）
    const exportMergedImageHorizontal = async () => {
        const canvas = canvasRef.current;
        if (!canvas || selectedGrids.length === 0) return;

        const sourceCtx = canvas.getContext('2d');
        if (!sourceCtx) return;

        // 计算合并后的尺寸
        const totalWidth = selectedGrids.reduce((sum, selection) => sum + selection.width, 0);
        const maxHeight = Math.max(...selectedGrids.map(selection => selection.height));

        // 创建新画布用于合并
        const mergedCanvas = document.createElement('canvas');
        mergedCanvas.width = totalWidth;
        mergedCanvas.height = maxHeight;
        const mergedCtx = mergedCanvas.getContext('2d');
        
        if (!mergedCtx) return;

        // 复制选中的区域到新画布
        let currentX = 0;
        selectedGrids.forEach(selection => {
            const imageData = sourceCtx.getImageData(
                selection.x, 
                selection.y, 
                selection.width, 
                selection.height
            );
            mergedCtx.putImageData(imageData, currentX, 0);
            currentX += selection.width;
        });

        // 下载图片
        mergedCanvas.toBlob(blob => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedAtlas}_horizontal_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    };

    // 导出合并图片（垂直排列）
    const exportMergedImageVertical = async () => {
        const canvas = canvasRef.current;
        if (!canvas || selectedGrids.length === 0) return;

        const sourceCtx = canvas.getContext('2d');
        if (!sourceCtx) return;

        // 计算合并后的尺寸
        const maxWidth = Math.max(...selectedGrids.map(selection => selection.width));
        const totalHeight = selectedGrids.reduce((sum, selection) => sum + selection.height, 0);

        // 创建新画布用于合并
        const mergedCanvas = document.createElement('canvas');
        mergedCanvas.width = maxWidth;
        mergedCanvas.height = totalHeight;
        const mergedCtx = mergedCanvas.getContext('2d');
        
        if (!mergedCtx) return;

        // 复制选中的区域到新画布
        let currentY = 0;
        selectedGrids.forEach(selection => {
            const imageData = sourceCtx.getImageData(
                selection.x, 
                selection.y, 
                selection.width, 
                selection.height
            );
            mergedCtx.putImageData(imageData, 0, currentY);
            currentY += selection.height;
        });

        // 下载图片
        mergedCanvas.toBlob(blob => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedAtlas}_vertical_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    };

    // 导出网格排列图片
    const exportMergedImageGrid = async (cols: number = 4) => {
        const canvas = canvasRef.current;
        if (!canvas || selectedGrids.length === 0) return;

        const sourceCtx = canvas.getContext('2d');
        if (!sourceCtx) return;

        const maxWidth = Math.max(...selectedGrids.map(selection => selection.width));
        const maxHeight = Math.max(...selectedGrids.map(selection => selection.height));
        const rows = Math.ceil(selectedGrids.length / cols);

        // 创建新画布用于合并
        const mergedCanvas = document.createElement('canvas');
        mergedCanvas.width = maxWidth * cols;
        mergedCanvas.height = maxHeight * rows;
        const mergedCtx = mergedCanvas.getContext('2d');
        
        if (!mergedCtx) return;

        // 复制选中的区域到新画布
        selectedGrids.forEach((selection, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = col * maxWidth;
            const y = row * maxHeight;

            const imageData = sourceCtx.getImageData(
                selection.x, 
                selection.y, 
                selection.width, 
                selection.height
            );
            mergedCtx.putImageData(imageData, x, y);
        });

        // 下载图片
        mergedCanvas.toBlob(blob => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedAtlas}_grid_${cols}x${rows}_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    };

    // 生成JSON配置
    const generateJSONConfig = () => {
        const config = atlasConfigs[selectedAtlas];
        if (!config || selectedGrids.length === 0) return '';

        const frames = selectedGrids.map((selection, index) => ({
            name: `frame_${index + 1}`,
            x: selection.x,
            y: selection.y,
            width: selection.width,
            height: selection.height,
            sourceX: selection.x,
            sourceY: selection.y,
            sourceWidth: selection.width,
            sourceHeight: selection.height
        }));

        return JSON.stringify({
            atlas: {
                key: selectedAtlas,
                path: config.path,
                description: config.description,
                gridSize: gridSize,
                totalFrames: frames.length
            },
            frames: frames
        }, null, 2);
    };

    // 导出JSON配置
    const exportJSONConfig = () => {
        const jsonConfig = generateJSONConfig();
        if (!jsonConfig) return;

        const blob = new Blob([jsonConfig], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedAtlas}_config_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 复制代码到剪贴板
    const copyCodeToClipboard = async () => {
        const code = generateCode();
        if (code) {
            try {
                await navigator.clipboard.writeText(code);
                alert('代码已复制到剪贴板！');
            } catch (err) {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            }
        }
    };

    // 添加到历史记录
    const addToHistory = (newSelections: GridSelection[]) => {
        setSelectionHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push([...newSelections]);
            return newHistory.slice(-20); // 只保留最近20个历史记录
        });
        setHistoryIndex(prev => Math.min(prev + 1, 19));
    };

    // 撤销
    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setSelectedGrids([...selectionHistory[historyIndex - 1]]);
        }
    };

    // 重做
    const redo = () => {
        if (historyIndex < selectionHistory.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setSelectedGrids([...selectionHistory[historyIndex + 1]]);
        }
    };

    // 全选（选择所有可见网格）
    const selectAll = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const grids: GridSelection[] = [];
        const cols = Math.floor(canvas.width / gridSize);
        const rows = Math.floor(canvas.height / gridSize);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                grids.push({
                    x: col * gridSize,
                    y: row * gridSize,
                    width: gridSize,
                    height: gridSize
                });
            }
        }

        addToHistory(grids);
        setSelectedGrids(grids);
    };

    // 键盘事件处理
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 防止在输入框中触发
            if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'a':
                        e.preventDefault();
                        selectAll();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            redo();
                        } else {
                            undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        redo();
                        break;
                    case 'c':
                        e.preventDefault();
                        if (selectedGrids.length > 0) {
                            copyCodeToClipboard();
                        }
                        break;
                }
            } else {
                switch (e.key) {
                    case 'Delete':
                    case 'Backspace':
                        e.preventDefault();
                        if (selectedGrids.length > 0) {
                            addToHistory([]);
                            clearSelections();
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        setCurrentSelection(null);
                        setIsSelecting(false);
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedGrids, historyIndex, selectionHistory]);

    // 修改清除选择函数以支持历史记录
    const clearSelections = () => {
        if (selectedGrids.length > 0) {
            addToHistory([]);
        }
        setSelectedGrids([]);
        setCurrentSelection(null);
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
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">多图集调试工具 🎨</h1>
                    <p className="text-gray-400 mb-2">自动扫描farm-assets文件夹下的所有图集</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className="px-2 py-1 bg-blue-600 rounded">多选网格</span>
                        <span className="px-2 py-1 bg-green-600 rounded">智能导出</span>
                        <span className="px-2 py-1 bg-purple-600 rounded">快捷键支持</span>
                        <span className="px-2 py-1 bg-orange-600 rounded">撤销/重做</span>
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

                {/* 控制面板 */}
                <div className="mb-6 bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">控制面板</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">选择模式</label>
                            <select
                                value={selectionMode}
                                onChange={(e) => setSelectionMode(e.target.value as 'single' | 'multi')}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                            >
                                <option value="single">单选模式</option>
                                <option value="multi">多选模式</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">网格大小</label>
                            <input
                                type="number"
                                value={gridSize}
                                onChange={(e) => setGridSize(parseInt(e.target.value) || 16)}
                                min="8"
                                max="64"
                                step="8"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">已选择</label>
                            <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-blue-400">
                                {selectedGrids.length} 个区域
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">撤销/重做</label>
                            <div className="flex gap-1">
                                <button
                                    onClick={undo}
                                    disabled={historyIndex <= 0}
                                    className="flex-1 px-2 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded text-white transition-colors text-sm"
                                    title="撤销 (Ctrl+Z)"
                                >
                                    ↶
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={historyIndex >= selectionHistory.length - 1}
                                    className="flex-1 px-2 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded text-white transition-colors text-sm"
                                    title="重做 (Ctrl+Y)"
                                >
                                    ↷
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">快速选择</label>
                            <button
                                onClick={selectAll}
                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors text-sm"
                                title="全选 (Ctrl+A)"
                            >
                                全选
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">清除</label>
                            <button
                                onClick={clearSelections}
                                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors text-sm"
                                title="清除选择 (Delete)"
                            >
                                清除选择
                            </button>
                        </div>
                    </div>
                    
                    {/* 快捷键提示 */}
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2 text-gray-300">键盘快捷键:</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-400">
                            <div><kbd className="bg-gray-600 px-1 rounded">Ctrl+A</kbd> 全选</div>
                            <div><kbd className="bg-gray-600 px-1 rounded">Ctrl+Z</kbd> 撤销</div>
                            <div><kbd className="bg-gray-600 px-1 rounded">Ctrl+Y</kbd> 重做</div>
                            <div><kbd className="bg-gray-600 px-1 rounded">Ctrl+C</kbd> 复制代码</div>
                            <div><kbd className="bg-gray-600 px-1 rounded">Delete</kbd> 清除选择</div>
                            <div><kbd className="bg-gray-600 px-1 rounded">Esc</kbd> 取消当前选择</div>
                        </div>
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
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                />
                            </div>

                            <div className="mt-4 text-sm grid grid-cols-2 gap-4">
                                <div>
                                    <p>鼠标位置: ({mousePos.x}, {mousePos.y})</p>
                                    <p>网格坐标: ({Math.floor(mousePos.x / gridSize) * gridSize}, {Math.floor(mousePos.y / gridSize) * gridSize})</p>
                                </div>
                                <div>
                                    <p>选择模式: {selectionMode === 'single' ? '单选' : '多选'}</p>
                                    <p>已选区域: {selectedGrids.length} 个</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">当前图集信息</h3>
                            <div className="text-sm text-gray-300 space-y-1">
                                <p><strong>名称:</strong> {atlasConfigs[selectedAtlas]?.name}</p>
                                <p><strong>描述:</strong> {atlasConfigs[selectedAtlas]?.description}</p>
                                <p><strong>当前网格:</strong> {gridSize}x{gridSize}</p>
                                <p><strong>默认网格:</strong> {atlasConfigs[selectedAtlas]?.defaultGridSize}x{atlasConfigs[selectedAtlas]?.defaultGridSize}</p>
                                <p><strong>键名:</strong> {selectedAtlas}</p>
                                <p><strong>总图集数:</strong> {Object.keys(atlasConfigs).length}</p>
                            </div>
                        </div>

                        {/* 选中区域列表 */}
                        {selectedGrids.length > 0 && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">选中区域</h3>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {selectedGrids.map((selection, index) => (
                                        <div key={index} className="text-xs bg-gray-700 p-2 rounded">
                                            <span className="text-blue-400">#{index + 1}</span> 
                                            {' '}({selection.x}, {selection.y}) 
                                            {' '}{selection.width}×{selection.height}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 导出功能 */}
                        {selectedGrids.length > 0 && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3">导出选中区域 ({selectedGrids.length}个)</h3>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={copyCodeToClipboard}
                                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors text-sm flex items-center justify-center gap-1"
                                            title="复制Phaser配置代码"
                                        >
                                            📋 代码
                                        </button>
                                        <button
                                            onClick={exportJSONConfig}
                                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white transition-colors text-sm flex items-center justify-center gap-1"
                                            title="导出JSON配置文件"
                                        >
                                            📄 JSON
                                        </button>
                                    </div>
                                    
                                    <div className="border-t border-gray-600 pt-2">
                                        <p className="text-xs text-gray-400 mb-2">图片导出:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={exportMergedImageHorizontal}
                                                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors text-sm flex items-center justify-center gap-1"
                                                title="水平排列导出"
                                            >
                                                ↔️ 水平
                                            </button>
                                            <button
                                                onClick={exportMergedImageVertical}
                                                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors text-sm flex items-center justify-center gap-1"
                                                title="垂直排列导出"
                                            >
                                                ↕️ 垂直
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <button
                                                onClick={() => exportMergedImageGrid(4)}
                                                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors text-sm flex items-center justify-center gap-1"
                                                title="4列网格排列"
                                            >
                                                🔲 4列
                                            </button>
                                            <button
                                                onClick={() => exportMergedImageGrid(8)}
                                                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors text-sm flex items-center justify-center gap-1"
                                                title="8列网格排列"
                                            >
                                                🔲 8列
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => setShowExportModal(true)}
                                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        👁️ 预览代码
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 导出模态框 */}
                {showExportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                            <div className="p-4 border-b border-gray-600 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-semibold">代码预览</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setExportFormat('code')}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                                exportFormat === 'code' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                            }`}
                                        >
                                            Phaser代码
                                        </button>
                                        <button
                                            onClick={() => setExportFormat('json')}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                                exportFormat === 'json' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                            }`}
                                        >
                                            JSON配置
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="text-gray-400 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto">
                                <pre className="bg-gray-900 p-4 rounded text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">
                                    {exportFormat === 'code' ? generateCode() : generateJSONConfig()}
                                </pre>
                            </div>
                            <div className="p-4 border-t border-gray-600 flex gap-2">
                                <button
                                    onClick={exportFormat === 'code' ? copyCodeToClipboard : () => {
                                        const json = generateJSONConfig();
                                        if (json) {
                                            navigator.clipboard.writeText(json).then(() => {
                                                alert('JSON配置已复制到剪贴板！');
                                            });
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                                >
                                    复制{exportFormat === 'code' ? '代码' : 'JSON'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (exportFormat === 'code') {
                                            const code = generateCode();
                                            const blob = new Blob([code], { type: 'text/javascript' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${selectedAtlas}_code_${Date.now()}.js`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        } else {
                                            exportJSONConfig();
                                        }
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
                                >
                                    下载{exportFormat === 'code' ? '代码' : 'JSON'}文件
                                </button>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
                                >
                                    关闭
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
