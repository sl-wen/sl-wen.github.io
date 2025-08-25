import { Metadata } from 'next';
import { SpriteDemo } from '@/components/game/demo/SpriteDemo';

export const metadata: Metadata = {
    title: '农场精灵演示 - Farm Sprite Demo',
    description: '展示分割后的农场精灵资源和使用方法',
};

/**
 * 农场精灵演示页面
 */
export default function SpriteDemoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 py-8">
            <div className="container mx-auto px-4">
                <SpriteDemo />
                
                {/* 代码示例 */}
                <div className="max-w-6xl mx-auto mt-8">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">💻 代码示例</h3>
                        
                        <div className="space-y-6">
                            {/* 基础使用 */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">1. 基础精灵管理器使用</h4>
                                <pre className="bg-gray-100 rounded p-4 text-sm overflow-x-auto">
{`// 创建精灵管理器
const spriteManager = new ImprovedSpriteManager(scene);

// 加载精灵目录
await spriteManager.loadSpriteCatalog();

// 按分类加载精灵
const terrainSprites = await spriteManager.loadSpritesByCategory('terrain');
const cropSprites = await spriteManager.loadSpritesByCategory('crops');

// 创建精灵
const grass = spriteManager.createImage(x, y, 'grass_basic');
const player = spriteManager.createSprite(x, y, 'player_down_idle');`}
                                </pre>
                            </div>

                            {/* 动画示例 */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">2. 创建动画</h4>
                                <pre className="bg-gray-100 rounded p-4 text-sm overflow-x-auto">
{`// 创建作物生长动画
const wheatFrames = [
    'wheat_stage_1',
    'wheat_stage_2', 
    'wheat_stage_3',
    'wheat_stage_4',
    'wheat_harvest'
];

spriteManager.createAnimation('wheat_growth', wheatFrames, 2, 0);

// 播放动画
const wheatSprite = spriteManager.createSprite(x, y, 'wheat_stage_1');
wheatSprite.play('wheat_growth');`}
                                </pre>
                            </div>

                            {/* 批量加载示例 */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">3. 批量加载和预加载</h4>
                                <pre className="bg-gray-100 rounded p-4 text-sm overflow-x-auto">
{`// 预加载必需精灵
await spriteManager.preloadEssentialSprites();

// 批量加载特定精灵
const spriteNames = ['hoe', 'watering_can', 'seeds_wheat'];
const loadedSprites = await spriteManager.loadSprites(spriteNames);

// 获取精灵信息
const spriteInfo = spriteManager.getSpriteInfo('grass_basic');
console.log(spriteInfo); // { file, atlas, x, y, width, height, category }`}
                                </pre>
                            </div>

                            {/* TypeScript支持 */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">4. TypeScript类型支持</h4>
                                <pre className="bg-gray-100 rounded p-4 text-sm overflow-x-auto">
{`import { SpriteName, SpriteCategory, SpriteInfo } from '@/types/sprites';

// 类型安全的精灵名称
const spriteName: SpriteName = 'grass_basic'; // 自动补全和类型检查

// 类型安全的分类
const category: SpriteCategory = 'terrain';

// 获取分类中的所有精灵
const terrainSprites = spriteManager.getSpritesByCategory('terrain');`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 文件结构说明 */}
                <div className="max-w-6xl mx-auto mt-8">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">📁 文件结构</h3>
                        
                        <div className="bg-gray-100 rounded p-4 text-sm font-mono">
                            <div>📦 public/assets/sprites/</div>
                            <div>├── 🗂️ overworld/          # 地形、建筑、装饰精灵 (31个)</div>
                            <div>├── 🗂️ plants/            # 作物、花朵、树木精灵 (30个)</div>
                            <div>├── 🗂️ objects/           # 工具、物品、存储精灵 (23个)</div>
                            <div>├── 🗂️ characters/        # 角色动画帧 (20个)</div>
                            <div>├── 🗂️ ui/                # UI界面元素 (78个)</div>
                            <div>├── 🗂️ animals/           # 动物精灵</div>
                            <div>└── 🗂️ tilesets/          # 瓦片集</div>
                            <div className="mt-2"></div>
                            <div>📄 asset-catalog.json      # 精灵目录文件</div>
                            <div>📄 src/types/sprites.ts    # TypeScript类型定义</div>
                        </div>
                    </div>
                </div>

                {/* 下一步建议 */}
                <div className="max-w-6xl mx-auto mt-8">
                    <div className="bg-green-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-green-800 mb-4">🚀 下一步建议</h3>
                        <div className="space-y-3 text-green-700">
                            <div className="flex items-start space-x-2">
                                <span className="text-green-500 mt-1">✅</span>
                                <div>
                                    <strong>集成到现有游戏:</strong> 
                                    将 ImprovedSpriteManager 替换到现有的 SpriteAtlasManager
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className="text-green-500 mt-1">✅</span>
                                <div>
                                    <strong>优化加载性能:</strong> 
                                    实现精灵的懒加载和缓存机制
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className="text-green-500 mt-1">✅</span>
                                <div>
                                    <strong>添加更多动画:</strong> 
                                    为动物、工具使用等创建更多动画序列
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className="text-green-500 mt-1">✅</span>
                                <div>
                                    <strong>自定义精灵坐标:</strong> 
                                    根据实际图集内容调整精灵的提取坐标
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}