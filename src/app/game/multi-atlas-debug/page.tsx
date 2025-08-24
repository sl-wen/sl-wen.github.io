'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AtlasConfig {
    name: string;
    path: string;
    defaultGridSize: number;
    description: string;
}

interface SelectionRect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    gridX: number;
    gridY: number;
    gridWidth: number;
    gridHeight: number;
    name?: string;
}

interface SpriteDefinition {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    frameWidth?: number;
    frameHeight?: number;
    frames?: number;
}

export default function MultiAtlasDebugPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isClient, setIsClient] = useState(false);
    const [loading, setLoading] = useState(true);
    const [atlasConfigs, setAtlasConfigs] = useState<Record<string, AtlasConfig>>({});
    const [selectedAtlas, setSelectedAtlas] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [gridSize, setGridSize] = useState(16);
    const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
    
    // Selection states
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [currentSelection, setCurrentSelection] = useState<SelectionRect | null>(null);
    const [selections, setSelections] = useState<SelectionRect[]>([]);
    const [selectedSelections, setSelectedSelections] = useState<Set<string>>(new Set());
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    
    // Tool states
    const [showSpriteCode, setShowSpriteCode] = useState(false);
    const [spriteDefinitions, setSpriteDefinitions] = useState<SpriteDefinition[]>([]);
    const [previewMode, setPreviewMode] = useState(false);
    const [editingSelection, setEditingSelection] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [showHelp, setShowHelp] = useState(false);

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
            // Clear selections when switching atlas
            setSelections([]);
            setSelectedSelections(new Set());
            setCurrentSelection(null);
        }
    }, [selectedAtlas, atlasConfigs]);

    const loadAtlasImage = () => {
        if (!isClient) return;

        const canvas = canvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        if (!canvas || !overlayCanvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const config = atlasConfigs[selectedAtlas];
        if (!config) return;

        console.log('Loading image:', config.path);
        setImageLoaded(false);

        const img = new Image();
        img.onload = () => {
            console.log('Image loaded successfully:', img.width, 'x', img.height);

            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;
            overlayCanvas.width = img.width;
            overlayCanvas.height = img.height;
            
            // Set CSS styling
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            overlayCanvas.style.maxWidth = '100%';
            overlayCanvas.style.height = 'auto';

            // Clear and draw image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            console.log('Image drawn to canvas');

            drawGrid(ctx, img.width, img.height, gridSize);
            console.log('Grid drawn');

            setCurrentImage(img);
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

    const drawOverlay = useCallback(() => {
        const overlayCanvas = overlayCanvasRef.current;
        if (!overlayCanvas) return;

        const ctx = overlayCanvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        // Draw existing selections
        selections.forEach((selection) => {
            const isSelected = selectedSelections.has(selection.id);
            
            ctx.strokeStyle = isSelected ? '#3b82f6' : '#10b981';
            ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)';
            ctx.lineWidth = 2;
            
            ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
            ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
            
            // Draw selection info
            ctx.fillStyle = isSelected ? '#3b82f6' : '#10b981';
            ctx.font = '12px monospace';
            ctx.fillText(
                `${selection.gridX},${selection.gridY} (${selection.gridWidth}x${selection.gridHeight})`,
                selection.x + 2,
                selection.y - 4
            );
        });

        // Draw current selection
        if (currentSelection) {
            ctx.strokeStyle = '#ef4444';
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.lineWidth = 2;
            
            ctx.fillRect(currentSelection.x, currentSelection.y, currentSelection.width, currentSelection.height);
            ctx.strokeRect(currentSelection.x, currentSelection.y, currentSelection.width, currentSelection.height);
        }
    }, [selections, selectedSelections, currentSelection]);

    useEffect(() => {
        drawOverlay();
    }, [drawOverlay]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return; // Don't interfere with input fields
            
            switch (e.key.toLowerCase()) {
                case 'delete':
                case 'backspace':
                    if (selectedSelections.size > 0) {
                        deleteSelectedSelections();
                        e.preventDefault();
                    }
                    break;
                case 'm':
                    if (e.ctrlKey && selectedSelections.size >= 2) {
                        mergeSelectedSelections();
                        e.preventDefault();
                    }
                    break;
                case 'g':
                    if (e.ctrlKey && selectedSelections.size > 0) {
                        generateSpriteDefinitions();
                        e.preventDefault();
                    }
                    break;
                case 'p':
                    if (e.ctrlKey) {
                        setPreviewMode(!previewMode);
                        e.preventDefault();
                    }
                    break;
                case 'a':
                    if (e.ctrlKey) {
                        setSelectedSelections(new Set(selections.map(s => s.id)));
                        e.preventDefault();
                    }
                    break;
                case 'escape':
                    setSelectedSelections(new Set());
                    setCurrentSelection(null);
                    setIsSelecting(false);
                    break;
                case 'f1':
                    setShowHelp(!showHelp);
                    e.preventDefault();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSelections, selections, previewMode, showHelp]);

    useEffect(() => {
        drawOverlay();
    }, [drawOverlay]);

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = overlayCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const snapToGrid = (value: number, gridSize: number) => {
        return Math.floor(value / gridSize) * gridSize;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        const snappedX = snapToGrid(coords.x, gridSize);
        const snappedY = snapToGrid(coords.y, gridSize);

        // Check if clicking on existing selection
        const clickedSelection = selections.find(selection => 
            coords.x >= selection.x && coords.x <= selection.x + selection.width &&
            coords.y >= selection.y && coords.y <= selection.y + selection.height
        );

        if (clickedSelection) {
            if (e.ctrlKey || e.metaKey) {
                // Multi-select mode
                setSelectedSelections(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(clickedSelection.id)) {
                        newSet.delete(clickedSelection.id);
                    } else {
                        newSet.add(clickedSelection.id);
                    }
                    return newSet;
                });
            } else {
                // Single select
                setSelectedSelections(new Set([clickedSelection.id]));
            }
        } else {
            // Start new selection
            if (!e.ctrlKey && !e.metaKey) {
                setSelectedSelections(new Set());
            }
            setIsSelecting(true);
            setSelectionStart({ x: snappedX, y: snappedY });
            setCurrentSelection({
                id: '',
                x: snappedX,
                y: snappedY,
                width: gridSize,
                height: gridSize,
                gridX: snappedX / gridSize,
                gridY: snappedY / gridSize,
                gridWidth: 1,
                gridHeight: 1
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        setMousePos(coords);

        if (isSelecting && selectionStart && currentSelection) {
            const snappedX = snapToGrid(coords.x, gridSize);
            const snappedY = snapToGrid(coords.y, gridSize);

            const x = Math.min(selectionStart.x, snappedX);
            const y = Math.min(selectionStart.y, snappedY);
            const width = Math.abs(snappedX - selectionStart.x) + gridSize;
            const height = Math.abs(snappedY - selectionStart.y) + gridSize;

            setCurrentSelection({
                ...currentSelection,
                x,
                y,
                width,
                height,
                gridX: x / gridSize,
                gridY: y / gridSize,
                gridWidth: width / gridSize,
                gridHeight: height / gridSize
            });
        }
    };

    const handleMouseUp = () => {
        if (isSelecting && currentSelection) {
            const newSelection: SelectionRect = {
                ...currentSelection,
                id: Date.now().toString(),
                name: `sprite_${selections.length + 1}`
            };
            
            setSelections(prev => [...prev, newSelection]);
            setSelectedSelections(new Set([newSelection.id]));
        }
        
        setIsSelecting(false);
        setSelectionStart(null);
        setCurrentSelection(null);
    };

    const deleteSelectedSelections = () => {
        setSelections(prev => prev.filter(sel => !selectedSelections.has(sel.id)));
        setSelectedSelections(new Set());
    };

    const mergeSelectedSelections = () => {
        const selected = selections.filter(sel => selectedSelections.has(sel.id));
        if (selected.length < 2) return;

        const minX = Math.min(...selected.map(s => s.x));
        const minY = Math.min(...selected.map(s => s.y));
        const maxX = Math.max(...selected.map(s => s.x + s.width));
        const maxY = Math.max(...selected.map(s => s.y + s.height));

        const mergedSelection: SelectionRect = {
            id: Date.now().toString(),
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            gridX: minX / gridSize,
            gridY: minY / gridSize,
            gridWidth: (maxX - minX) / gridSize,
            gridHeight: (maxY - minY) / gridSize,
            name: `merged_sprite_${Date.now()}`
        };

        setSelections(prev => [
            ...prev.filter(sel => !selectedSelections.has(sel.id)),
            mergedSelection
        ]);
        setSelectedSelections(new Set([mergedSelection.id]));
    };

    const generateSpriteDefinitions = () => {
        const selected = selections.filter(sel => selectedSelections.has(sel.id));
        if (selected.length === 0) return;

        const definitions: SpriteDefinition[] = selected.map(sel => ({
            name: sel.name || `sprite_${sel.id}`,
            x: sel.x,
            y: sel.y,
            width: sel.width,
            height: sel.height,
            frameWidth: gridSize,
            frameHeight: gridSize,
            frames: (sel.width / gridSize) * (sel.height / gridSize)
        }));

        setSpriteDefinitions(definitions);
        setShowSpriteCode(true);
    };

    const updateSelectionName = (id: string, newName: string) => {
        setSelections(prev => prev.map(sel => 
            sel.id === id ? { ...sel, name: newName || `sprite_${id}` } : sel
        ));
        setEditingSelection(null);
        setEditingName('');
    };

    const duplicateSelections = () => {
        const selected = selections.filter(sel => selectedSelections.has(sel.id));
        const duplicated = selected.map(sel => ({
            ...sel,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            x: sel.x + gridSize,
            y: sel.y + gridSize,
            gridX: sel.gridX + 1,
            gridY: sel.gridY + 1,
            name: `${sel.name}_copy`
        }));
        
        setSelections(prev => [...prev, ...duplicated]);
        setSelectedSelections(new Set(duplicated.map(d => d.id)));
    };

    const exportSelections = () => {
        const selected = selections.filter(sel => selectedSelections.has(sel.id));
        const exportData = {
            atlas: selectedAtlas,
            gridSize,
            selections: selected,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedAtlas}_selections.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateTypeScriptCode = () => {
        const atlasName = selectedAtlas.replace('farm_', '');
        const code = `// Generated sprite definitions for ${atlasName}
// Generated on ${new Date().toISOString()}
export interface SpriteFrame {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SpriteDefinition {
    name: string;
    frames: SpriteFrame[];
    frameWidth: number;
    frameHeight: number;
    totalFrames: number;
}

export const ${atlasName.toUpperCase()}_SPRITES: Record<string, SpriteDefinition> = {
${spriteDefinitions.map(sprite => `    ${sprite.name}: {
        name: '${sprite.name}',
        frames: [{
            x: ${sprite.x},
            y: ${sprite.y},
            width: ${sprite.width},
            height: ${sprite.height}
        }],
        frameWidth: ${sprite.frameWidth || gridSize},
        frameHeight: ${sprite.frameHeight || gridSize},
        totalFrames: ${sprite.frames || 1}
    }`).join(',\n')}
};

// Usage example:
// const spriteConfig = ${atlasName.toUpperCase()}_SPRITES.${spriteDefinitions[0]?.name || 'sprite_name'};
// scene.add.sprite(x, y, '${atlasName}', spriteConfig.frames[0]);
`;
        return code;
    };

    const switchAtlas = (atlasKey: string) => {
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
                <p className="text-gray-400 mb-6">自动扫描farm-assets文件夹下的所有图集，支持区域选择和精灵定义生成</p>

                {/* Atlas Selection */}
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

                {/* Tools and Controls */}
                <div className="mb-6 bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">工具栏</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-sm">网格大小:</label>
                            <input
                                type="number"
                                value={gridSize}
                                onChange={(e) => setGridSize(parseInt(e.target.value) || 16)}
                                className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                                min="1"
                                max="128"
                            />
                        </div>
                        
                        <button
                            onClick={deleteSelectedSelections}
                            disabled={selectedSelections.size === 0}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
                        >
                            删除选择 ({selectedSelections.size})
                        </button>
                        
                        <button
                            onClick={mergeSelectedSelections}
                            disabled={selectedSelections.size < 2}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
                        >
                            合并选择 ({selectedSelections.size})
                        </button>
                        
                        <button
                            onClick={generateSpriteDefinitions}
                            disabled={selectedSelections.size === 0}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
                        >
                            生成代码 ({selectedSelections.size})
                        </button>
                        
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className={`px-3 py-1 rounded text-sm ${previewMode 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                        >
                            预览模式
                        </button>
                        
                        <button
                            onClick={duplicateSelections}
                            disabled={selectedSelections.size === 0}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
                        >
                            复制选择
                        </button>
                        
                        <button
                            onClick={exportSelections}
                            disabled={selectedSelections.size === 0}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm"
                        >
                            导出JSON
                        </button>
                        
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                        >
                            帮助 (F1)
                        </button>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-400">
                        <p>• 拖拽选择区域 • Ctrl+点击多选 • 双击重命名 • 总选择: {selections.length} 个</p>
                        <p>• 快捷键: Del删除 • Ctrl+M合并 • Ctrl+G生成代码 • Ctrl+P预览 • F1帮助</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Canvas Area */}
                    <div className="xl:col-span-3">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4">
                                {atlasConfigs[selectedAtlas]?.name} 预览
                            </h2>
                            <div className="overflow-auto border border-gray-600 rounded bg-gray-700 p-2 relative">
                                {!imageLoaded && (
                                    <div className="flex items-center justify-center h-64 text-gray-400">
                                        <div>加载中...</div>
                                    </div>
                                )}
                                <div className="relative inline-block">
                                    <canvas
                                        ref={canvasRef}
                                        className="block"
                                        style={{
                                            maxWidth: '100%',
                                            height: 'auto',
                                            imageRendering: 'pixelated',
                                            display: imageLoaded ? 'block' : 'none'
                                        }}
                                    />
                                    <canvas
                                        ref={overlayCanvasRef}
                                        className="absolute top-0 left-0 block"
                                        style={{
                                            cursor: 'crosshair',
                                            maxWidth: '100%',
                                            height: 'auto',
                                            display: imageLoaded ? 'block' : 'none'
                                        }}
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 text-sm">
                                <p>鼠标位置: ({Math.floor(mousePos.x)}, {Math.floor(mousePos.y)})</p>
                                <p>网格坐标: ({Math.floor(mousePos.x / gridSize)}, {Math.floor(mousePos.y / gridSize)})</p>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="xl:col-span-1 space-y-4">
                        {/* Atlas Info */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">当前图集信息</h3>
                            <div className="text-sm text-gray-300 space-y-1">
                                <p><strong>名称:</strong> {atlasConfigs[selectedAtlas]?.name}</p>
                                <p><strong>描述:</strong> {atlasConfigs[selectedAtlas]?.description}</p>
                                <p><strong>当前网格:</strong> {gridSize}x{gridSize}</p>
                                <p><strong>默认网格:</strong> {atlasConfigs[selectedAtlas]?.defaultGridSize}x{atlasConfigs[selectedAtlas]?.defaultGridSize}</p>
                                <p><strong>总图集数:</strong> {Object.keys(atlasConfigs).length}</p>
                            </div>
                        </div>

                        {/* Selection Info */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">选择信息</h3>
                            <div className="text-sm text-gray-300 space-y-1">
                                <p><strong>总选择:</strong> {selections.length} 个</p>
                                <p><strong>已选中:</strong> {selectedSelections.size} 个</p>
                            </div>
                            
                            {selections.length > 0 && (
                                <div className="mt-3 max-h-32 overflow-y-auto">
                                    <h4 className="text-sm font-medium mb-2">选择列表:</h4>
                                    {selections.map((selection, index) => (
                                        <div 
                                            key={selection.id}
                                            className={`text-xs p-2 mb-1 rounded cursor-pointer ${
                                                selectedSelections.has(selection.id) 
                                                    ? 'bg-blue-600' 
                                                    : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                            onClick={() => {
                                                setSelectedSelections(new Set([selection.id]));
                                            }}
                                        >
                                            <div className="font-mono">
                                                #{index + 1}: ({selection.gridX},{selection.gridY}) 
                                                {selection.gridWidth}x{selection.gridHeight}
                                            </div>
                                            {editingSelection === selection.id ? (
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onBlur={() => updateSelectionName(selection.id, editingName)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            updateSelectionName(selection.id, editingName);
                                                        } else if (e.key === 'Escape') {
                                                            setEditingSelection(null);
                                                            setEditingName('');
                                                        }
                                                    }}
                                                    className="w-full mt-1 px-1 py-0.5 bg-gray-600 border border-gray-500 rounded text-xs"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div 
                                                    className="text-gray-300 mt-1 cursor-pointer hover:text-white"
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingSelection(selection.id);
                                                        setEditingName(selection.name || `sprite_${selection.id}`);
                                                    }}
                                                >
                                                    {selection.name || `sprite_${selection.id}`}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Preview Panel */}
                        {previewMode && selectedSelections.size > 0 && currentImage && (
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">精灵预览</h3>
                                <div className="space-y-2">
                                    {selections
                                        .filter(sel => selectedSelections.has(sel.id))
                                        .map((selection) => (
                                            <div key={selection.id} className="border border-gray-600 rounded p-2">
                                                <div className="text-xs text-gray-400 mb-1">
                                                    {selection.name || `sprite_${selection.id}`}
                                                </div>
                                                <canvas
                                                    width={selection.width}
                                                    height={selection.height}
                                                    className="border border-gray-500 bg-gray-700"
                                                    style={{
                                                        imageRendering: 'pixelated',
                                                        maxWidth: '100%',
                                                        height: 'auto'
                                                    }}
                                                    ref={(canvas) => {
                                                        if (canvas && currentImage) {
                                                            const ctx = canvas.getContext('2d');
                                                            if (ctx) {
                                                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                                                ctx.drawImage(
                                                                    currentImage,
                                                                    selection.x, selection.y, selection.width, selection.height,
                                                                    0, 0, selection.width, selection.height
                                                                );
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {selection.width}x{selection.height}px
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Help Modal */}
                {showHelp && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                <h3 className="text-lg font-semibold">使用帮助</h3>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="p-4 overflow-auto max-h-[60vh]">
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <h4 className="font-semibold text-green-400 mb-2">基本操作</h4>
                                        <ul className="space-y-1 text-gray-300">
                                            <li>• <strong>拖拽选择:</strong> 在图集上拖拽鼠标创建选择区域</li>
                                            <li>• <strong>单击选择:</strong> 点击已有选择区域进行单选</li>
                                            <li>• <strong>多选:</strong> Ctrl+点击进行多选/取消选择</li>
                                            <li>• <strong>重命名:</strong> 双击选择列表中的名称进行重命名</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-blue-400 mb-2">快捷键</h4>
                                        <ul className="space-y-1 text-gray-300 font-mono text-xs">
                                            <li>• <strong>Delete/Backspace:</strong> 删除选中的区域</li>
                                            <li>• <strong>Ctrl+M:</strong> 合并选中的区域</li>
                                            <li>• <strong>Ctrl+G:</strong> 生成TypeScript代码</li>
                                            <li>• <strong>Ctrl+P:</strong> 切换预览模式</li>
                                            <li>• <strong>Ctrl+A:</strong> 选择所有区域</li>
                                            <li>• <strong>Escape:</strong> 取消所有选择</li>
                                            <li>• <strong>F1:</strong> 显示/隐藏帮助</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-purple-400 mb-2">功能说明</h4>
                                        <ul className="space-y-1 text-gray-300">
                                            <li>• <strong>网格大小:</strong> 调整选择区域的网格对齐大小</li>
                                            <li>• <strong>合并选择:</strong> 将多个选择区域合并为一个大区域</li>
                                            <li>• <strong>生成代码:</strong> 根据选择区域生成TypeScript精灵定义</li>
                                            <li>• <strong>预览模式:</strong> 实时预览选中区域的精灵图像</li>
                                            <li>• <strong>复制选择:</strong> 复制选中区域到新位置</li>
                                            <li>• <strong>导出JSON:</strong> 导出选择区域配置到JSON文件</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-yellow-400 mb-2">提示</h4>
                                        <ul className="space-y-1 text-gray-300">
                                            <li>• 选择区域会自动对齐到网格</li>
                                            <li>• 可以同时选择多个区域进行批量操作</li>
                                            <li>• 生成的代码可直接用于Phaser.js项目</li>
                                            <li>• 切换图集时会清除所有选择</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-700">
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                                >
                                    关闭
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TypeScript Code Modal */}
                {showSpriteCode && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                <h3 className="text-lg font-semibold">生成的 TypeScript 精灵定义</h3>
                                <button
                                    onClick={() => setShowSpriteCode(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="p-4 overflow-auto max-h-[60vh]">
                                <pre className="bg-gray-900 p-4 rounded text-sm overflow-x-auto">
                                    <code className="text-green-400">{generateTypeScriptCode()}</code>
                                </pre>
                            </div>
                            <div className="p-4 border-t border-gray-700 flex gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generateTypeScriptCode());
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                                >
                                    复制代码
                                </button>
                                <button
                                    onClick={() => setShowSpriteCode(false)}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
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
