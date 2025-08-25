# 🎮 农场资产分割系统 Farm Assets Splitter

这个系统帮助你将大型精灵图集（sprite atlases）自动分割成独立的精灵文件，让游戏开发更加灵活和高效。

## 📋 功能特性

- ✅ **自动分割**: 将大型图集分割成独立的PNG文件
- ✅ **智能分类**: 按照terrain、crops、tools等分类组织精灵
- ✅ **TypeScript支持**: 自动生成类型定义文件
- ✅ **精灵目录**: 生成完整的精灵目录和元数据
- ✅ **动画支持**: 支持创建动画序列
- ✅ **按需加载**: 支持按分类或单独加载精灵
- ✅ **Phaser.js集成**: 专为Phaser游戏引擎优化

## 🚀 快速开始

### 1. 运行资产分割器

```bash
# 分割所有农场资产
npm run split:assets

# 或者直接运行脚本
node scripts/run-asset-splitter.js
```

### 2. 查看生成的文件

分割完成后，你会得到：

```
📦 public/assets/sprites/
├── 🗂️ overworld/          # 31个地形、建筑、装饰精灵
├── 🗂️ plants/            # 30个作物、花朵、树木精灵  
├── 🗂️ objects/           # 23个工具、物品、存储精灵
├── 🗂️ characters/        # 20个角色动画帧
├── 🗂️ ui/                # 78个UI界面元素
├── 🗂️ animals/           # 动物精灵
└── 🗂️ tilesets/          # 瓦片集

📄 asset-catalog.json      # 精灵目录文件 (182个精灵)
📄 src/types/sprites.ts    # TypeScript类型定义
```

### 3. 在游戏中使用

```typescript
import { ImprovedSpriteManager } from '@/components/game/utils/ImprovedSpriteManager';

// 在Phaser场景中
const spriteManager = new ImprovedSpriteManager(this);

// 加载精灵目录
await spriteManager.loadSpriteCatalog();

// 按分类加载精灵
const terrainSprites = await spriteManager.loadSpritesByCategory('terrain');

// 创建精灵
const grass = spriteManager.createImage(x, y, 'grass_basic');
const player = spriteManager.createSprite(x, y, 'player_down_idle');
```

## 📚 详细文档

### 精灵分类

| 分类 | 描述 | 数量 | 来源 |
|------|------|------|------|
| `terrain` | 草地、泥土、石头等地形 | 6个 | Overworld.png |
| `buildings` | 房屋、谷仓、水井等建筑 | 3个 | Overworld.png |
| `decorations` | 树木、灌木、石头等装饰 | 5个 | Overworld.png |
| `fences` | 围栏系统 | 6个 | Overworld.png |
| `roads` | 道路系统 | 11个 | Overworld.png |
| `crops` | 小麦、胡萝卜、土豆等作物 | 15个 | Plants.png |
| `flowers` | 各色花朵 | 8个 | Plants.png |
| `trees` | 树苗、幼树、成熟树 | 3个 | Plants.png |
| `wild` | 野草、蘑菇、浆果等 | 4个 | Plants.png |
| `tools` | 锄头、浇水壶、斧头等工具 | 6个 | objects.png |
| `seeds` | 各种种子包 | 4个 | objects.png |
| `storage` | 箱子、桶、袋子等存储 | 5个 | objects.png |
| `food` | 面包、牛奶、奶酪等食物 | 4个 | objects.png |
| `player` | 玩家角色各方向动画帧 | 16个 | character.png |
| `actions` | 动作动画帧 | 4个 | character.png |
| `ui` | 用户界面元素 | 78个 | Premium UI Pack |

### 核心API

#### ImprovedSpriteManager

```typescript
// 创建管理器
const manager = new ImprovedSpriteManager(scene);

// 加载精灵目录
await manager.loadSpriteCatalog();

// 加载方法
await manager.loadSprite(spriteName);                    // 加载单个精灵
await manager.loadSprites(spriteNames);                  // 批量加载精灵
await manager.loadSpritesByCategory(category);           // 按分类加载
await manager.preloadEssentialSprites();                 // 预加载必需精灵

// 创建游戏对象
manager.createSprite(x, y, spriteName);                  // 创建精灵对象
manager.createImage(x, y, spriteName);                   // 创建图像对象

// 动画创建
manager.createAnimation(key, spriteNames, frameRate);    // 创建动画
manager.createWalkingAnimations();                       // 创建行走动画
manager.createCropGrowthAnimations();                    // 创建作物生长动画

// 查询方法
manager.getSpriteInfo(spriteName);                       // 获取精灵信息
manager.getSpritesByCategory(category);                  // 获取分类中的精灵
manager.isSpriteLoaded(spriteName);                      // 检查是否已加载
manager.getLoadedSprites();                              // 获取已加载列表
```

### 动画示例

```typescript
// 创建角色行走动画
manager.createWalkingAnimations('player');
// 生成: player_walk_down, player_walk_up, player_walk_left, player_walk_right

// 创建作物生长动画
manager.createCropGrowthAnimations();
// 生成: wheat_growth, carrot_growth, potato_growth

// 自定义动画
const frames = ['wheat_stage_1', 'wheat_stage_2', 'wheat_stage_3'];
manager.createAnimation('wheat_growing', frames, 4, -1);

// 播放动画
const sprite = manager.createSprite(x, y, 'wheat_stage_1');
sprite.play('wheat_growing');
```

## 🔧 自定义配置

### 修改精灵坐标

编辑 `scripts/asset-splitter.js` 中的精灵定义：

```javascript
const overworldSprites = [
    { name: 'grass_basic', x: 0, y: 0, width: 32, height: 32, category: 'terrain' },
    { name: 'custom_sprite', x: 64, y: 0, width: 32, height: 32, category: 'terrain' },
    // 添加更多精灵定义...
];
```

### 添加新的图集

```javascript
async splitCustomAtlas() {
    const atlasPath = path.join(this.inputDir, 'custom.png');
    const image = await loadImage(atlasPath);
    
    const customSprites = [
        { name: 'custom_1', x: 0, y: 0, width: 16, height: 16, category: 'custom' },
        // 定义精灵...
    ];
    
    await this.extractSprites(image, customSprites, 'custom', 'custom.png');
}
```

## 📊 性能优化

### 按需加载策略

```typescript
// 游戏启动时只加载必需精灵
await spriteManager.preloadEssentialSprites();

// 进入农场场景时加载农场相关精灵
await spriteManager.loadSpritesByCategory('crops');
await spriteManager.loadSpritesByCategory('tools');

// 进入建造模式时加载建筑精灵
await spriteManager.loadSpritesByCategory('buildings');
```

### 内存管理

```typescript
// 清理不需要的精灵
spriteManager.cleanup();

// 或者在场景切换时清理
scene.events.on('shutdown', () => {
    spriteManager.cleanup();
});
```

## 🎯 演示页面

访问演示页面查看实际效果：
```
http://localhost:3000/game/sprite-demo
```

演示包含：
- 📱 交互式精灵查看器
- 🎮 实时游戏场景演示
- 💻 代码使用示例
- 📊 分割统计信息

## 🛠️ 故障排除

### Canvas依赖问题

如果遇到Canvas模块错误：

```bash
npm install canvas
```

### 图集文件不存在

确保以下文件存在于 `public/assets/farm-assets/` 目录：
- Overworld.png
- Plants.png
- objects.png
- character.png

### TypeScript类型错误

重新运行资产分割器以更新类型定义：

```bash
npm run split:assets
```

## 📝 更新日志

### v1.0.0 (2024-12-25)
- ✅ 初始版本发布
- ✅ 支持4个主要图集的自动分割
- ✅ 生成182个独立精灵文件
- ✅ 完整的TypeScript类型支持
- ✅ Phaser.js集成和演示

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个系统！

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

🎮 **Happy Game Development!** 

如果这个系统对你有帮助，别忘了给项目加星 ⭐