# 🐱 小猫农场游戏 - 增强版

## 概述

这是一个现代化的 2D 农场模拟游戏，采用 React 19 + Phaser 3 技术栈构建。游戏参考了 [top-down-react-phaser-game](https://github.com/blopa/top-down-react-phaser-game) 的优秀架构设计，提供了完整的农场经营体验。玩家扮演可爱的小猫，在四季轮回的农场中种植作物、照料农场、与NPC互动、烹饪美食。

### 🚀 最新更新 (v2.0)

- ✨ **全新架构**：基于现代化系统管理器架构重构
- 🎮 **增强交互**：丰富的NPC系统和任务系统
- 🌤️ **动态天气**：完整的时间天气循环系统
- 🎵 **分层音频**：专业的音频管理和氛围营造
- 📱 **性能优化**：自适应性能管理，支持各种设备
- 💾 **完善存档**：多存档槽位和自动保存功能
- 🎨 **现代界面**：基于 Tailwind CSS 的响应式设计

## 功能特性

### 🐾 核心游戏功能
- **小猫角色**: 可爱的小猫角色，具有独特的动画和表情
- **农场种植**: 种植多种作物，包括胡萝卜、番茄、小麦、玉米等
- **作物护理**: 浇水、施肥系统，影响作物生长速度和品质
- **收获系统**: 作物成熟后可以收获，获得不同品质的农产品
- **烹饪系统**: 将收获的作物制作成各种美味料理
- **属性系统**: 健康值、能量值、幸福度的完整属性系统

### 🌱 种植系统
- **多样作物**: 8种不同作物，各有独特的生长周期
  - 🥕 胡萝卜 (45秒成熟)
  - 🍅 番茄 (60秒成熟)
  - 🌾 小麦 (30秒成熟)
  - 🌽 玉米 (90秒成熟)
  - 🍓 草莓 (75秒成熟)
  - 🥬 生菜 (25秒成熟)
  - 🥔 土豆 (50秒成熟)
  - 🎃 南瓜 (120秒成熟)

- **生长阶段**: 每种作物都有完整的生长过程
  - 种子阶段 → 发芽阶段 → 成长阶段 → 成熟阶段
  - 缺水会导致作物枯萎

- **品质系统**: 根据护理程度决定收获品质
  - 优秀品质：充足浇水 + 施肥
  - 良好品质：正常护理
  - 一般品质：护理不当

### 🧰 工具系统
- **锄头**: 耕地，为种植做准备
- **水壶**: 给作物浇水，维持水分
- **肥料**: 施肥加速作物生长
- **种子袋**: 存放各种作物种子

### 🍳 烹饪系统
- **8种料理配方**:
  - 🍲 胡萝卜汤 (胡萝卜×3 + 水×1)
  - 🥗 番茄沙拉 (番茄×2 + 生菜×1)
  - 🍞 小麦面包 (小麦×4)
  - 🍲 玉米汤 (玉米×2 + 水×1)
  - 🍰 草莓蛋糕 (草莓×5 + 小麦×2)
  - 🍲 土豆炖菜 (土豆×3 + 胡萝卜×1 + 水×1)
  - 🥧 南瓜派 (南瓜×1 + 小麦×2)
  - 🥗 混合沙拉 (生菜×2 + 番茄×1 + 胡萝卜×1)

- **烹饪效果**: 每种料理都能恢复小猫的能量和幸福度

### 🌤️ 时间天气系统 (v2.0 新增)
- **完整时间循环**: 年、季、日、时、分的完整时间系统
- **四季轮回**: 春、夏、秋、冬四季，每季30天
- **昼夜循环**: 真实的日出日落和光照变化
- **动态天气**: 晴天、多云、雨天、暴风雨、雪天、大风
- **天气影响**: 天气对作物生长和游戏体验的实际影响
- **视觉效果**: 粒子天气效果和动态光照系统

### 👥 智能NPC系统 (v2.0 新增)
- **多种NPC类型**:
  - 👨‍🌾 农夫：提供种植建议和农业任务
  - 🛒 商人：买卖种子、工具和农产品
  - 👨‍🍳 厨师：教授烹饪技巧和新配方
  - 🐄 农场动物：可爱的动物伙伴
  - 🏘️ 村民：友好的邻居和朋友

- **智能行为系统**:
  - 📅 时间表：NPC根据时间执行不同活动
  - 💭 对话系统：丰富的对话选项和分支
  - 🎯 任务系统：各种农场任务和奖励
  - 💰 商店系统：动态价格和库存管理
  - ❤️ 情感系统：友好度和心情变化

### 🌱 增强农业系统 (v2.0 新增)
- **作物品质系统**:
  - 🥉 普通品质：基础产量和价格
  - 🥈 良好品质：+50% 产量和价格
  - 🥇 优秀品质：+100% 产量和价格
  - 💎 传奇品质：+200% 产量和价格

- **土壤管理**:
  - 🏖️ 沙土：排水好，适合根茎类作物
  - 🌱 壤土：平衡性好，适合大多数作物
  - 🧱 粘土：保水性强，适合需水作物
  - 🌿 肥沃土壤：最佳土质，适合所有作物

- **轮作系统**: 不同作物轮作带来产量奖励
- **技能系统**: 农业技能等级和经验值系统
- **工具耐久度**: 工具使用的磨损和维修机制

### 📱 移动端支持
- **触摸控制**: 点击屏幕移动小猫
- **虚拟摇杆**: 移动设备上的虚拟摇杆控制器
- **工具按钮**: 便捷的工具选择按钮
- **响应式设计**: 自适应不同屏幕尺寸

### 🎨 视觉效果
- **像素艺术风格**: 温馨的农场像素艺术风格
- **粒子效果**: 浇水、施肥、收获等操作的粒子效果
- **动画系统**: 小猫的各种动作动画
- **UI 系统**: 完整的农场界面，包括背包、烹饪界面等

## 🏗️ 技术架构

### 核心技术栈
- **React 19**: 现代化UI框架，支持并发特性
- **Phaser 3.90**: 强大的2D游戏引擎
- **TypeScript**: 类型安全的开发体验
- **Tailwind CSS 3**: 实用优先的样式框架
- **Next.js 14**: 全栈React框架

### 系统管理器架构 (v2.0)
```
src/components/game/
├── systems/                    # 🏗️ 核心系统管理器
│   ├── GameManager.ts         # 🎮 游戏状态管理
│   ├── InputManager.ts        # ⌨️ 输入处理系统
│   ├── AudioManager.ts        # 🎵 音频管理系统
│   ├── AnimationManager.ts    # 🎬 动画管理系统
│   ├── SaveSystem.ts          # 💾 存档系统
│   ├── TimeWeatherSystem.ts   # 🌤️ 时间天气系统
│   ├── EnhancedFarmingSystem.ts # 🌱 增强农业系统
│   └── PerformanceOptimizer.ts # ⚡ 性能优化器
├── entities/                   # 🎯 游戏实体
│   ├── Player.ts              # 🐱 小猫角色
│   ├── EnhancedNPC.ts         # 👥 智能NPC系统
│   ├── Crop.ts                # 🌾 作物实体
│   ├── FarmPlot.ts            # 🟫 农田地块
│   ├── CookingStation.ts      # 🍳 烹饪台
│   └── InventoryManager.ts    # 🎒 背包管理
├── scenes/                     # 🎭 游戏场景
│   ├── PreloadScene.ts        # 📦 资源加载
│   ├── GameScene.ts           # 🎮 主游戏场景
│   └── UIScene.ts             # 🖼️ UI界面场景
└── types/                      # 📝 类型定义
    └── GameTypes.ts           # 🔧 游戏类型
```

### 架构特点
- **🔧 模块化设计**: 每个系统独立管理，易于维护和扩展
- **📡 事件驱动**: 统一的事件系统，降低模块间耦合
- **🎯 单例模式**: 核心管理器采用单例，确保状态一致性
- **🔄 自适应优化**: 根据设备性能自动调整游戏设置
- **📱 跨平台兼容**: 同时支持桌面端和移动端

## 游戏控制

### 桌面端控制
| 按键 | 功能 |
|------|------|
| W/↑ | 向上移动 |
| S/↓ | 向下移动 |
| A/← | 向左移动 |
| D/→ | 向右移动 |
| Space | 交互/确认 |
| I | 打开背包 |
| C | 打开烹饪界面 |
| 1 | 选择锄头 |
| 2 | 选择水壶 |
| 3 | 选择肥料 |
| 4 | 选择种子 |

### 移动端控制
- **虚拟摇杆**: 使用屏幕左下角的虚拟摇杆移动小猫
- **工具按钮**: 屏幕右侧的工具选择按钮
- **交互按钮**: 屏幕右下角的爪子按钮进行交互
- **点击交互**: 直接点击农田地块或烹饪台进行交互

## 游戏元素

### 小猫属性系统
- **健康值**: 小猫的健康状态 ❤️
- **能量值**: 用于各种农场活动 ⚡
- **幸福度**: 影响工作效率 😸
- **等级系统**: 通过经验值提升小猫等级
- **属性成长**: 升级时提升各项最大值

### 农场环境
- **农田地块**: 可耕种的土地区域
- **装饰建筑**: 农舍、谷仓、水井等
- **自然景观**: 树木、花朵、风车等装饰
- **石径小路**: 连接各个区域的小径

### 互动系统
- **种植流程**: 耕地 → 播种 → 浇水/施肥 → 收获
- **烹饪流程**: 收集食材 → 选择配方 → 制作料理
- **背包系统**: 存储工具、种子、作物和料理
- **成长系统**: 通过各种活动获得经验值

## 扩展性

游戏框架设计具有良好的扩展性，可以轻松添加：

- **新作物**: 更多种类的农作物
- **季节系统**: 不同季节种植不同作物
- **天气系统**: 雨天自动浇水，晴天快速生长
- **宠物系统**: 其他农场动物伙伴
- **装饰系统**: 更多农场装饰品
- **交易系统**: 与NPC交易农产品
- **成就系统**: 各种农场成就奖励

## 开发说明

### 添加新作物
```typescript
// 在 CropType 枚举中添加新作物类型
export enum CropType {
  // 现有作物...
  NEW_CROP = 'new_crop'
}

// 在 Crop 类中添加生长时间和产量配置
private getMaxGrowthTime(cropType: CropType): number {
  const growthTimes = {
    // 现有配置...
    [CropType.NEW_CROP]: 45000 // 45秒
  };
  return growthTimes[cropType];
}
```

### 添加新料理
```typescript
// 在 CookingStation 的 initializeRecipes 方法中添加
{
  id: 'new_dish',
  name: '新料理',
  description: '美味的新料理',
  ingredients: [
    { itemId: 'ingredient1', quantity: 2 },
    { itemId: 'ingredient2', quantity: 1 }
  ],
  result: { itemId: 'new_dish', quantity: 1 },
  cookingTime: 5000,
  happinessBonus: 20,
  energyBonus: 30
}
```

### 修改农场布局
在 `PreloadScene.ts` 中修改 `createFarmTilemapData` 方法中的 `mapData` 数组来改变农场布局。

## ⚡ 性能优化 (v2.0 大幅增强)

### 自适应性能管理
- **🔄 实时监控**: FPS、帧时间、内存使用等关键指标
- **📊 智能调节**: 根据设备性能自动升降级画质
- **📱 设备识别**: 自动检测移动端和桌面端设备
- **🎯 分级优化**: 高、中、低、超低四档性能等级

### 核心优化策略
- **🔄 对象池**: 重复使用游戏对象减少内存分配
- **📡 事件驱动**: 使用事件系统减少不必要的更新
- **💾 资源管理**: 智能的资源加载和卸载
- **✨ 粒子优化**: 动态调整粒子数量和生命周期
- **🎮 LOD系统**: 基于距离的细节层次优化
- **🖼️ 批处理渲染**: 减少绘制调用次数
- **👁️ 视距裁剪**: 只渲染可见区域的对象

### 移动端专项优化
- **🔋 电池友好**: 降低CPU和GPU使用率
- **📱 触摸优化**: 优化触摸响应和手势识别
- **💾 内存管控**: 更激进的内存清理策略
- **📶 网络优化**: 减少不必要的网络请求

## 🎮 游戏体验

### 多版本支持
- **🎮 经典版**: 访问 `/game` - 原版游戏体验
- **✨ 增强版**: 访问 `/game/enhanced` - 完整新功能体验
- **📱 移动版**: 自动适配移动设备的优化体验

### 存档系统
- **💾 多存档槽**: 支持3个独立的存档槽位
- **🔄 自动保存**: 可配置的自动保存间隔
- **📤 导入导出**: 支持存档的备份和恢复
- **✅ 数据验证**: 存档完整性检查和版本兼容

## 🚀 快速开始

### 环境要求
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 安装运行
```bash
# 克隆项目
git clone <repository-url>
cd farm-game

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问游戏
# 经典版：http://localhost:3000/game
# 增强版：http://localhost:3000/game/enhanced
```

### 构建部署
```bash
# 生产构建
npm run build

# 启动生产服务器
npm run start

# 静态导出（可选）
npm run export
```

## 🛠️ 开发指南

### 系统架构说明
游戏采用模块化的系统管理器架构，每个系统负责特定的功能：

```typescript
// 获取游戏管理器实例
const gameManager = GameManager.getInstance();

// 监听游戏事件
gameManager.on('player-level-up', (data) => {
  console.log(`玩家升级到 ${data.level} 级！`);
});

// 发送游戏事件
gameManager.emit('crop-harvested', {
  cropType: 'carrot',
  quantity: 3,
  quality: 'excellent'
});
```

### 添加新作物
```typescript
// 1. 在 GameTypes.ts 中添加作物类型
export enum CropType {
  // ... 现有作物
  NEW_CROP = 'new_crop'
}

// 2. 在 EnhancedFarmingSystem.ts 中添加作物信息
{
  type: CropType.NEW_CROP,
  name: '新作物',
  description: '这是一个新的作物品种',
  growthTime: 60000, // 60秒
  waterNeed: 70,
  fertilizerBonus: 1.3,
  seasonPreference: [SeasonType.SPRING],
  sellPrice: 25,
  experienceReward: 15,
  harvestCount: { min: 2, max: 4 },
  rarity: 0.2,
  unlockLevel: 3
}
```

### 创建新NPC
```typescript
// 创建NPC实例
const farmer = new EnhancedNPC(
  scene,           // 游戏场景
  200, 300,        // 位置坐标
  NPCType.FARMER,  // NPC类型
  '老农夫'         // NPC名称
);

// 添加到场景
scene.add.existing(farmer);
```

### 性能优化建议
```typescript
// 使用性能优化器
const optimizer = new PerformanceOptimizer(scene);

// 手动设置性能等级
optimizer.setPerformanceLevel(PerformanceLevel.MEDIUM);

// 获取性能指标
const metrics = optimizer.getPerformanceMetrics();
console.log(`当前FPS: ${metrics.fps}`);
```

## 🐛 故障排除

### 常见问题

#### 1. 游戏无法加载
**症状**: 页面显示"游戏初始化失败"
**解决方案**:
```bash
# 检查控制台错误信息
# 常见原因：
# - 资源文件缺失
# - 浏览器不支持WebGL
# - 内存不足

# 解决步骤：
1. 刷新页面重试
2. 清除浏览器缓存
3. 检查浏览器控制台错误
4. 尝试降低游戏画质设置
```

#### 2. 性能问题
**症状**: 游戏卡顿、FPS过低
**解决方案**:
```javascript
// 手动降低性能等级
const gameManager = GameManager.getInstance();
gameManager.emit('set-performance-level', 'low');

// 或在游戏设置中调整：
// - 降低音效音量
// - 关闭粒子效果
// - 减少游戏对象数量
```

#### 3. 移动端问题
**症状**: 触摸控制不响应
**解决方案**:
```css
/* 确保触摸事件正常 */
.game-container {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

#### 4. 存档问题
**症状**: 存档无法保存或加载
**解决方案**:
```javascript
// 检查本地存储
console.log('存储空间:', localStorage.length);

// 清除损坏的存档
localStorage.removeItem('cat-farm-game-save');

// 手动保存
const gameManager = GameManager.getInstance();
gameManager.saveGame();
```

### 调试工具

#### 开启调试模式
```javascript
// 在浏览器控制台中执行
window.DEBUG_MODE = true;

// 显示性能监控
window.SHOW_PERFORMANCE = true;

// 显示碰撞边界
window.SHOW_PHYSICS_DEBUG = true;
```

#### 性能分析
```javascript
// 获取详细性能报告
const optimizer = scene.performanceOptimizer;
const report = optimizer.getPerformanceHistory();
console.table(report.fps.slice(-10)); // 最近10帧的FPS
```

## 🤝 贡献指南

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 为新功能添加详细的中文注释
- 编写单元测试（如适用）

### 提交规范
```bash
# 功能开发
git commit -m "feat: 添加新的作物品种系统"

# 问题修复
git commit -m "fix: 修复移动端触摸控制问题"

# 性能优化
git commit -m "perf: 优化粒子系统性能"

# 文档更新
git commit -m "docs: 更新游戏开发指南"
```

### 开发流程
1. Fork 项目并创建功能分支
2. 本地开发和测试
3. 确保代码通过 lint 检查
4. 提交 Pull Request
5. 代码审查和合并

## 📊 性能基准

### 目标性能指标
| 设备类型 | 目标FPS | 内存使用 | 加载时间 |
|----------|---------|----------|----------|
| 高端桌面 | 60 FPS | < 100MB | < 3s |
| 中端桌面 | 45 FPS | < 80MB | < 5s |
| 高端移动 | 30 FPS | < 60MB | < 8s |
| 中端移动 | 20 FPS | < 40MB | < 12s |

### 优化里程碑
- ✅ v1.0: 基础游戏功能，平均45FPS
- ✅ v2.0: 系统重构，性能提升20%，平均55FPS
- 🔄 v2.1: 进一步优化，目标60FPS稳定运行
- 📋 v3.0: WebGPU支持，大幅性能提升

## 🔮 未来规划

### 短期目标 (v2.1-2.5)
- [ ] 🌾 更多作物品种和季节性作物
- [ ] 🐄 农场动物系统（鸡、牛、羊等）
- [ ] 🏪 市场交易系统和经济模拟
- [ ] 🎨 农场装饰和升级系统
- [ ] 🏆 成就和收集系统
- [ ] 🎵 完整的音效和背景音乐

### 中期目标 (v3.0-3.5)
- [ ] 👥 多人合作农场模式
- [ ] ☁️ 云存档同步功能
- [ ] 🌐 国际化多语言支持
- [ ] 📱 原生移动应用版本
- [ ] 🎮 手柄控制器支持
- [ ] 🔄 模组系统和社区内容

### 长期愿景 (v4.0+)
- [ ] 🥽 VR/AR 虚拟现实体验
- [ ] 🤖 AI驱动的智能NPC
- [ ] 🌍 开放世界和探索系统
- [ ] ⚡ WebGPU 渲染引擎
- [ ] 🎯 电竞模式和竞技系统
- [ ] 🏗️ 用户生成内容平台

---

## 📄 许可证

本项目采用 ISC 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- 感谢 [top-down-react-phaser-game](https://github.com/blopa/top-down-react-phaser-game) 项目提供的优秀架构参考
- 感谢 Phaser.js 社区提供的强大游戏引擎
- 感谢所有贡献者和测试用户的反馈和建议

---

**🐱 小猫农场游戏** - 在温馨治愈的农场世界中，体验现代化的农场经营乐趣！

*最后更新：2024年12月 | 版本：v2.0 增强版*