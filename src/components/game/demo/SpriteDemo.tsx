'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { ImprovedSpriteManager } from '../utils/ImprovedSpriteManager';

/**
 * 精灵演示组件
 * 展示如何使用分割后的农场精灵
 */
export const SpriteDemo: React.FC = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const [game, setGame] = useState<Phaser.Game | null>(null);
    const [spriteManager, setSpriteManager] = useState<ImprovedSpriteManager | null>(null);
    const [loadedCategories, setLoadedCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('terrain');

    useEffect(() => {
        if (!gameRef.current || game) return;

        // Phaser游戏配置
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameRef.current,
            backgroundColor: '#87CEEB',
            scene: {
                preload: preload,
                create: create
            }
        };

        const newGame = new Phaser.Game(config);
        setGame(newGame);

        let manager: ImprovedSpriteManager;

        function preload(this: Phaser.Scene) {
            // 创建精灵管理器
            manager = new ImprovedSpriteManager(this);
            setSpriteManager(manager);
        }

        async function create(this: Phaser.Scene) {
            // 加载精灵目录
            await manager.loadSpriteCatalog();
            
            // 预加载必需精灵
            await manager.preloadEssentialSprites();
            
            // 显示演示内容
            showDemoSprites(this, manager);
            
            // 添加说明文字
            this.add.text(10, 10, 'Farm Sprite Demo - 农场精灵演示', {
                fontSize: '24px',
                color: '#000000'
            });

            this.add.text(10, 40, '点击下方按钮加载不同分类的精灵', {
                fontSize: '16px',
                color: '#000000'
            });
        }

        return () => {
            if (newGame) {
                newGame.destroy(true);
            }
        };
    }, []);

    // 显示演示精灵
    const showDemoSprites = (scene: Phaser.Scene, manager: ImprovedSpriteManager) => {
        // 清除现有精灵
        scene.children.removeAll();

        // 重新添加标题
        scene.add.text(10, 10, 'Farm Sprite Demo - 农场精灵演示', {
            fontSize: '24px',
            color: '#000000'
        });

        scene.add.text(10, 40, '点击下方按钮加载不同分类的精灵', {
            fontSize: '16px',
            color: '#000000'
        });

        // 创建地形网格
        if (manager.isSpriteLoaded('grass_basic')) {
            for (let x = 0; x < 10; x++) {
                for (let y = 0; y < 8; y++) {
                    const sprite = manager.createImage(100 + x * 32, 100 + y * 32, 'grass_basic');
                    if (sprite) {
                        sprite.setDisplaySize(32, 32);
                    }
                }
            }
        }

        // 添加一些装饰
        if (manager.isSpriteLoaded('tree_oak')) {
            const tree = manager.createImage(150, 150, 'tree_oak');
            if (tree) tree.setDisplaySize(48, 64);
        }

        if (manager.isSpriteLoaded('house_small')) {
            const house = manager.createImage(300, 200, 'house_small');
            if (house) house.setDisplaySize(64, 64);
        }

        // 添加角色
        if (manager.isSpriteLoaded('player_down_idle')) {
            const player = manager.createSprite(400, 300, 'player_down_idle');
            if (player) {
                player.setDisplaySize(32, 32);
                // 播放行走动画（如果已创建）
                if (scene.anims.exists('player_walk_down')) {
                    player.play('player_walk_down');
                }
            }
        }

        // 添加作物
        const crops = ['wheat_stage_1', 'wheat_stage_2', 'wheat_stage_3', 'wheat_stage_4', 'wheat_harvest'];
        crops.forEach((crop, index) => {
            if (manager.isSpriteLoaded(crop)) {
                const cropSprite = manager.createImage(500 + index * 20, 400, crop);
                if (cropSprite) cropSprite.setDisplaySize(16, 16);
            }
        });
    };

    // 加载特定分类的精灵
    const loadCategory = async (category: string) => {
        if (!spriteManager || loadedCategories.includes(category)) {
            setSelectedCategory(category);
            return;
        }

        try {
            console.log(`加载 ${category} 分类精灵...`);
            const loaded = await spriteManager.loadSpritesByCategory(category as any);
            console.log(`已加载 ${loaded.length} 个 ${category} 精灵:`, loaded);
            
            setLoadedCategories(prev => [...prev, category]);
            setSelectedCategory(category);
            
            // 重新显示演示内容
            if (game) {
                const scene = game.scene.scenes[0];
                showDemoSprites(scene, spriteManager);
            }
        } catch (error) {
            console.error(`加载 ${category} 分类失败:`, error);
        }
    };

    const categories = [
        { key: 'terrain', name: '地形', description: '草地、泥土、石头等' },
        { key: 'buildings', name: '建筑', description: '房屋、谷仓、水井等' },
        { key: 'crops', name: '作物', description: '小麦、胡萝卜、土豆等' },
        { key: 'tools', name: '工具', description: '锄头、浇水壶、斧头等' },
        { key: 'decorations', name: '装饰', description: '树木、灌木、石头等' },
        { key: 'player', name: '角色', description: '玩家角色动画帧' },
        { key: 'ui', name: 'UI', description: '用户界面元素' }
    ];

    return (
        <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    🎮 农场精灵演示系统
                </h2>
                <p className="text-gray-600">
                    这个演示展示了如何使用分割后的农场精灵。总共生成了 <strong>182个</strong> 独立精灵文件。
                </p>
            </div>

            {/* 游戏画布 */}
            <div className="mb-6 border-2 border-gray-300 rounded-lg overflow-hidden">
                <div ref={gameRef} className="w-full" />
            </div>

            {/* 分类按钮 */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">精灵分类</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.map(category => (
                        <button
                            key={category.key}
                            onClick={() => loadCategory(category.key)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                selectedCategory === category.key
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                            } ${loadedCategories.includes(category.key) ? 'ring-2 ring-green-200' : ''}`}
                        >
                            <div className="font-medium">{category.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                            {loadedCategories.includes(category.key) && (
                                <div className="text-xs text-green-600 mt-1">✅ 已加载</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 使用说明 */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 使用说明</h3>
                <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>1. 精灵分割:</strong> 运行 `npm run split:assets` 来分割原始图集</p>
                    <p><strong>2. 精灵加载:</strong> 使用 `ImprovedSpriteManager.loadSpritesByCategory()` 按分类加载</p>
                    <p><strong>3. 精灵使用:</strong> 使用 `createSprite()` 或 `createImage()` 创建游戏对象</p>
                    <p><strong>4. 动画创建:</strong> 使用 `createAnimation()` 创建动画序列</p>
                    <p><strong>5. 类型支持:</strong> 查看 `src/types/sprites.ts` 获得完整的TypeScript类型支持</p>
                </div>
            </div>

            {/* 统计信息 */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">📊 分割统计</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="font-medium text-blue-700">地形精灵</div>
                        <div className="text-blue-600">31个 (来自 Overworld.png)</div>
                    </div>
                    <div>
                        <div className="font-medium text-blue-700">植物精灵</div>
                        <div className="text-blue-600">30个 (来自 Plants.png)</div>
                    </div>
                    <div>
                        <div className="font-medium text-blue-700">物品精灵</div>
                        <div className="text-blue-600">23个 (来自 objects.png)</div>
                    </div>
                    <div>
                        <div className="font-medium text-blue-700">角色精灵</div>
                        <div className="text-blue-600">20个 (来自 character.png)</div>
                    </div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                    另外还有 78个 UI精灵来自Premium包
                </div>
            </div>
        </div>
    );
};

export default SpriteDemo;