# 🗺️ 灵活瓦片管理系统

这是一个为 Sprout Lands 游戏设计的灵活瓦片管理系统，允许您自由定义地图布局，支持草地、水域、栅栏、道路等多种地形类型。

## ✨ 主要特性

- 🎨 **可视化编辑器** - 直观的瓦片编辑界面
- 🎯 **多种瓦片类型** - 支持草地、水域、道路、栅栏、土壤、沙地、灌木等
- 💾 **保存/加载** - 支持地图数据的本地存储和文件导入导出
- 🔄 **模板系统** - 预设多种地图模板（农场、村庄、迷宫等）
- 🎮 **游戏集成** - 无缝集成到现有游戏系统
- ⚡ **性能优化** - 高效的渲染和碰撞检测
- 🔧 **适配器模式** - 兼容现有的 TileMapManager 接口

## 📁 文件结构

```
src/components/game/
├── TileEditor.tsx              # 瓦片编辑器组件
├── FlexibleTileManager.ts      # 灵活瓦片管理器核心
├── MapLayoutDesigner.tsx       # 地图布局设计器
├── GameTileIntegration.tsx     # 游戏集成组件
└── examples/
    └── TileSystemUsage.tsx     # 使用示例

src/app/
└── tile-editor/
    └── page.tsx               # 瓦片编辑器页面
```

## 🚀 快速开始

### 1. 访问瓦片编辑器

访问 `/tile-editor` 路由打开瓦片编辑器：

```
http://localhost:3000/tile-editor
```

### 2. 创建新地图

1. 设置地图尺寸（宽度 × 高度）
2. 选择地图模板：
   - **空白地图** - 全草地的基础模板
   - **农场布局** - 包含房屋区、农田区、水源的传统农场
   - **村庄布局** - 道路网络和建筑区域的村庄风格
   - **迷宫布局** - 适合探索游戏的迷宫风格
3. 点击"创建并编辑地图"

### 3. 编辑地图

在编辑器中，您可以：

- **选择工具**：
  - 🖌️ 绘制 - 放置选中的瓦片
  - 🧽 擦除 - 移除瓦片（恢复为草地）
  - 🪣 填充 - 洪水填充算法快速填充区域

- **选择瓦片类型**：
  - 🌱 草地 - 基础地形，可行走可种植
  - 💧 水域 - 水体，不可通行，提供水源
  - 🛤️ 道路 - 石头路径，可快速行走
  - 🚧 栅栏 - 石头栅栏，阻挡通行
  - 🌾 土壤 - 肥沃土壤，适合种植
  - 🏖️ 沙地 - 沙质地面，可行走
  - 🌿 灌木 - 装饰性植物，阻挡通行

### 4. 保存和加载

- **保存地图** - 自动保存到浏览器本地存储
- **导出地图** - 下载为 JSON 文件
- **导入地图** - 从 JSON 文件加载地图
- **删除地图** - 从本地存储中移除

## 🛠️ 在游戏中使用

### 基础集成

```tsx
import { useGameTileIntegration } from './GameTileIntegration';
import { FlexibleMapData } from './FlexibleTileManager';

function GameScene() {
  const scene = useRef<Phaser.Scene>(null);
  const {
    tileManager,
    isReady,
    loadMap,
    createDefaultMap,
    isWalkable,
    isFarmable,
    isWaterSource
  } = useGameTileIntegration(scene.current);

  useEffect(() => {
    if (isReady) {
      // 创建默认地图
      const mapData = createDefaultMap(32, 24);
      
      // 或加载自定义地图
      // loadMap(customMapData);
    }
  }, [isReady]);

  // 在游戏逻辑中使用
  const handlePlayerMove = (x: number, y: number) => {
    if (isWalkable(x, y)) {
      // 玩家可以移动到这个位置
    }
  };
}
```

### 适配器模式集成

```tsx
import { TileManagerAdapter } from './GameTileIntegration';

class GameScene extends Phaser.Scene {
  private tileAdapter: TileManagerAdapter;

  create() {
    const flexibleTileManager = new FlexibleTileManager(this);
    this.tileAdapter = new TileManagerAdapter(this, flexibleTileManager);
    
    // 使用适配器方法，兼容现有代码
    const canMove = !this.tileAdapter.checkCollision(x, y, width, height);
    const canPlant = this.tileAdapter.canPlantAt(x, y);
    const nearWater = this.tileAdapter.isNearWater(x, y, 50);
  }
}
```

## 📊 瓦片类型定义

| ID | 类型 | 名称 | 可行走 | 可种植 | 水源 | 描述 |
|----|------|------|--------|--------|------|------|
| 0  | GRASS | 草地 | ✅ | ✅ | ❌ | 基础草地地形 |
| 1  | WATER | 水域 | ❌ | ❌ | ✅ | 水体，不可通行 |
| 2  | PATH | 道路 | ✅ | ❌ | ❌ | 石头铺成的道路 |
| 3  | STONE | 栅栏 | ❌ | ❌ | ❌ | 阻挡通行的障碍物 |
| 4  | SOIL | 土壤 | ✅ | ✅ | ❌ | 适合种植的土壤 |
| 5  | TILLED_DIRT | 耕地 | ✅ | ✅ | ❌ | 已耕作的土地 |
| 6  | SAND | 沙地 | ✅ | ❌ | ❌ | 沙质地面 |
| 7  | BUSH | 灌木 | ❌ | ❌ | ❌ | 装饰性灌木 |

## 🎮 地图数据格式

### FlexibleMapData 结构

```typescript
interface FlexibleMapData {
  config: {
    width: number;          // 地图宽度（瓦片数量）
    height: number;         // 地图高度（瓦片数量）
    tileWidth: number;      // 瓦片宽度（像素）
    tileHeight: number;     // 瓦片高度（像素）
    layers: [
      {
        name: string;       // 图层名称
        tiles: number[][];  // 二维瓦片数组
        depth: number;      // 渲染深度
        visible: boolean;   // 是否可见
        opacity: number;    // 透明度
      }
    ];
  };
  metadata: {
    name: string;           // 地图名称
    description: string;    // 地图描述
    version: string;        // 版本号
    createdAt: string;      // 创建时间
    modifiedAt: string;     // 修改时间
    author?: string;        // 作者（可选）
  };
}
```

### 示例地图数据

```json
{
  "config": {
    "width": 10,
    "height": 10,
    "tileWidth": 16,
    "tileHeight": 16,
    "layers": [
      {
        "name": "terrain",
        "tiles": [
          [3,3,3,3,3,3,3,3,3,3],
          [3,0,0,0,2,2,0,0,0,3],
          [3,0,1,1,2,2,1,1,0,3],
          [3,0,1,1,2,2,1,1,0,3],
          [3,2,2,2,2,2,2,2,2,3],
          [3,2,2,2,2,2,2,2,2,3],
          [3,0,4,4,2,2,4,4,0,3],
          [3,0,4,4,2,2,4,4,0,3],
          [3,0,0,0,2,2,0,0,0,3],
          [3,3,3,3,3,3,3,3,3,3]
        ],
        "depth": 1,
        "visible": true,
        "opacity": 1.0
      }
    ]
  },
  "metadata": {
    "name": "示例农场",
    "description": "一个包含水源、道路和农田的小型农场",
    "version": "1.0.0",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "modifiedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔧 API 参考

### FlexibleTileManager

主要的瓦片管理器类，负责地图渲染和逻辑处理。

#### 方法

- `loadMap(mapData: FlexibleMapData)` - 加载地图数据
- `createDefaultMap(width: number, height: number)` - 创建默认地图
- `getTilePropertiesAt(x: number, y: number)` - 获取指定位置的瓦片属性
- `isWalkable(x: number, y: number)` - 检查位置是否可行走
- `isFarmable(x: number, y: number)` - 检查位置是否可种植
- `isWaterSource(x: number, y: number)` - 检查位置是否是水源
- `setTile(tileX: number, tileY: number, tileId: number)` - 设置瓦片
- `getMapBounds()` - 获取地图边界
- `exportMapData()` - 导出地图数据
- `destroy()` - 销毁管理器

### TileManagerAdapter

适配器类，提供与现有 TileMapManager 兼容的接口。

#### 方法

- `checkCollision(x: number, y: number, width: number, height: number)` - 碰撞检测
- `canPlantAt(x: number, y: number)` - 检查是否可种植
- `isNearWater(x: number, y: number, radius: number)` - 检查是否靠近水源
- `createTileParticles(x: number, y: number, particleKey: string)` - 创建粒子效果
- `getTileCenterAt(x: number, y: number)` - 获取瓦片中心位置

### useGameTileIntegration Hook

React Hook，简化在组件中使用瓦片系统。

```typescript
const {
  tileManager,      // FlexibleTileManager 实例
  currentMapData,   // 当前地图数据
  isReady,          // 是否准备就绪
  loadMap,          // 加载地图函数
  createDefaultMap, // 创建默认地图函数
  getTilePropertiesAt, // 获取瓦片属性函数
  isWalkable,       // 检查可行走函数
  isFarmable,       // 检查可种植函数
  isWaterSource,    // 检查水源函数
  setTile,          // 设置瓦片函数
  getMapBounds      // 获取地图边界函数
} = useGameTileIntegration(scene);
```

## 🎨 自定义瓦片类型

您可以扩展瓦片类型定义：

```typescript
// 添加新的瓦片类型
const customTileDefinition: FlexibleTileDefinition = {
  id: 8,
  type: 'custom_type' as TileType,
  textureKey: 'custom_texture',
  name: '自定义瓦片',
  description: '这是一个自定义瓦片类型',
  properties: {
    type: 'custom_type' as TileType,
    walkable: true,
    farmable: false,
    waterSource: false,
    textureKey: 'custom_texture'
  },
  variations: ['custom_texture_1', 'custom_texture_2']
};

// 在管理器中注册新类型
FLEXIBLE_TILE_DEFINITIONS.push(customTileDefinition);
```

## 🔄 从现有系统迁移

如果您有现有的 FarmLayoutManager 数据，可以使用转换工具：

```typescript
import { MapDataConverter } from './GameTileIntegration';

// 转换现有农场布局
const farmAreas = [/* 现有的农场区域数据 */];
const flexibleMapData = MapDataConverter.convertFromFarmLayout(farmAreas);

// 加载转换后的地图
tileManager.loadMap(flexibleMapData);
```

## 🐛 故障排除

### 常见问题

1. **纹理未加载**
   - 确保所有瓦片纹理文件存在于正确路径
   - 检查 PreloadScene 是否正确加载了纹理资源

2. **性能问题**
   - 对于大型地图，考虑启用瓦片剔除
   - 使用适当的渲染深度避免过度绘制

3. **碰撞检测不准确**
   - 确认瓦片尺寸配置正确（默认 16x16 像素）
   - 检查碰撞边界框是否与精灵尺寸匹配

### 调试模式

启用调试模式查看详细信息：

```typescript
tileManager.setDebugMode(true);

// 或在浏览器控制台中：
localStorage.setItem('tileDebug', '1');
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个瓦片管理系统！

## 📄 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

---

**🎮 享受创建您的自定义农场布局吧！**