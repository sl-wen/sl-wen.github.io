# Topdown 游戏开发指南

## 概述

本文档为 Topdown 游戏的开发者提供详细的代码结构说明、开发指南和最佳实践。所有核心代码文件已添加详细的中文注释，便于理解和维护。

## 项目结构

```
src/app/topdown/
├── page.tsx                    # Next.js 页面入口，处理 SSR
├── App.js                      # 游戏主应用组件（React + Phaser 集成）
├── App.css                     # 游戏样式文件
├── index.css                   # 基础样式
├── game/                       # 游戏核心代码目录
│   ├── scenes/                 # Phaser 游戏场景
│   │   ├── BootScene.js        # 启动场景（资源加载）
│   │   ├── MainMenuScene.js    # 主菜单场景
│   │   ├── GameScene.js        # 主游戏场景
│   │   └── GameOverScene.js    # 游戏结束场景
│   ├── farming/                # 农业系统
│   │   ├── FarmManager.js      # 农场管理器
│   │   └── Crop.js             # 作物类
│   ├── constants.js            # 游戏常量定义
│   ├── utils.js                # 工具函数
│   ├── InputManager.js         # 输入管理器
│   ├── MapLoader.js            # 地图加载器
│   ├── TimeWeatherManager.js   # 时间天气管理器
│   ├── VirtualJoystick.js      # 虚拟摇杆组件
│   ├── ActionButton.js         # 动作按钮组件
│   ├── DialogBox.js            # 对话框组件
│   ├── GameMenu.js             # 游戏菜单组件
│   ├── HUDBar.js               # HUD 状态栏组件
│   ├── InventoryModal.js       # 库存模态窗口
│   ├── SettingsModal.js        # 设置模态窗口
│   ├── CatCoin.js              # 金币显示组件
│   ├── Message.js              # 消息组件
│   ├── Quickbar.js             # 快捷栏组件
│   └── RadialMenu.js           # 径向菜单组件
└── fonts/                      # 字体文件
    └── PressStart2P-Regular.ttf
```

## 核心架构

### 1. React + Phaser 集成架构

游戏采用 React 作为 UI 层，Phaser.js 作为游戏引擎的混合架构：

- **React 层**：负责 UI 组件（对话框、菜单、HUD、设置等）
- **Phaser 层**：负责游戏逻辑（角色移动、碰撞检测、动画等）
- **事件总线**：通过 `window.dispatchEvent` 和 `window.addEventListener` 实现双向通信

### 2. 事件驱动通信

React 和 Phaser 通过自定义事件进行通信：

```javascript
// Phaser 向 React 发送事件
window.dispatchEvent(new CustomEvent('new-dialog', { 
  detail: { characterName: 'npc1' } 
}));

// React 监听事件
window.addEventListener('new-dialog', (event) => {
  // 处理对话显示
});
```

### 3. 主要事件类型

| 事件名称 | 方向 | 用途 |
|---------|------|------|
| `new-dialog` | Phaser → React | 显示对话框 |
| `{character}-dialog-finished` | React → Phaser | 对话完成 |
| `menu-items` | Phaser → React | 显示菜单 |
| `menu-item-selected` | React → Phaser | 菜单选择 |
| `cat-coin` | Phaser → React | 更新金币显示 |
| `action-context` | Phaser → React | 更新动作按钮 |
| `virtual-joystick-direction` | React → Phaser | 虚拟摇杆输入 |
| `action-button-pressed` | React → Phaser | 动作按钮按下 |
| `inventory-update` | Phaser → React | 背包更新 |
| `autosave-request` | Phaser → React | 自动保存请求 |

## 开发指南

### 1. 添加新的 UI 组件

创建新的 React 组件时，请遵循以下规范：

```javascript
/**
 * 组件功能描述
 * 
 * 详细的功能说明和使用方法
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.gameSize - 游戏尺寸对象，包含 multiplier
 * @returns {JSX.Element} 渲染的组件
 */
const NewComponent = ({ gameSize, ...otherProps }) => {
  const { multiplier } = gameSize;
  
  return (
    <StyledContainer multiplier={multiplier}>
      {/* 组件内容 */}
    </StyledContainer>
  );
};
```

#### 样式组件规范

使用 `@mui/material/styles` 的 `styled` 函数创建样式组件：

```javascript
const StyledContainer = styled('div')(({ multiplier }) => ({
  // 所有尺寸都应该乘以 multiplier 以支持缩放
  fontSize: `${12 * multiplier}px`,
  padding: `${8 * multiplier}px`,
  // 像素风格组件使用像素化渲染
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
}));
```

### 2. 添加新的游戏场景

继承 Phaser 的 Scene 类创建新场景：

```javascript
/**
 * 新游戏场景
 * 
 * 场景功能描述和使用方法
 */
import { Scene } from 'phaser';

export default class NewGameScene extends Scene {
  constructor() {
    super('NewGameScene'); // 场景唯一标识符
  }

  /**
   * 场景初始化
   * @param {Object} data - 从其他场景传递的数据
   */
  init(data) {
    this.initData = data;
  }

  /**
   * 资源预加载
   */
  preload() {
    // 加载场景所需资源
  }

  /**
   * 场景创建
   */
  create() {
    // 创建游戏对象、设置事件监听等
  }

  /**
   * 每帧更新
   */
  update() {
    // 游戏逻辑更新
  }
}
```

### 3. 添加新的游戏机制

#### 3.1 创建新的管理器类

```javascript
/**
 * 新功能管理器
 * 
 * 管理器功能描述
 */
export default class NewFeatureManager {
  /**
   * 构造函数
   * @param {Phaser.Scene} scene - 游戏场景
   * @param {Object} options - 配置选项
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    // 初始化管理器状态
  }

  /**
   * 更新逻辑
   * @param {number} deltaMs - 时间增量（毫秒）
   */
  update(deltaMs) {
    // 每帧更新逻辑
  }

  /**
   * 序列化为 JSON（用于存档）
   * @returns {Object} 序列化数据
   */
  toJSON() {
    return {
      // 需要保存的状态
    };
  }

  /**
   * 从存档数据恢复
   * @param {Phaser.Scene} scene - 游戏场景
   * @param {Object} data - 存档数据
   * @param {Object} options - 配置选项
   * @returns {NewFeatureManager} 管理器实例
   */
  static fromSave(scene, data, options = {}) {
    const manager = new NewFeatureManager(scene, options);
    // 恢复状态
    return manager;
  }
}
```

#### 3.2 集成到主游戏场景

在 `GameScene.js` 的 `create()` 方法中集成新管理器：

```javascript
// 在 create() 方法中添加
this.newFeatureManager = new NewFeatureManager(this, { /* 配置 */ });

// 在 update() 方法中添加
if (this.newFeatureManager) {
  this.newFeatureManager.update(deltaMs);
}
```

### 4. 资源管理

#### 4.1 图片资源

所有图片资源放在 `public/game/assets/images/` 目录下：

```javascript
// 在 BootScene.js 中加载
this.load.image('resource-key', '/game/assets/images/resource.png');
```

#### 4.2 音频资源

音频文件放在 `public/game/assets/audio/` 目录下：

```javascript
// 加载音频
this.load.audio('sound-key', '/game/assets/audio/sound.mp3');

// 播放音频
this.sound.play('sound-key');
```

#### 4.3 图集资源

使用 TexturePacker 生成的图集：

```javascript
// 加载图集
this.load.atlas('atlas-key', 
  '/game/assets/sprites/atlas/atlas.png',
  '/game/assets/sprites/atlas/atlas.json'
);

// 使用图集帧
this.add.sprite(x, y, 'atlas-key', 'frame-name');
```

### 5. 地图编辑

#### 5.1 Tiled 地图规范

使用 Tiled 编辑器创建地图，遵循以下规范：

- **图层命名**：
  - `Collision` - 碰撞图层
  - `Water` - 水面图层（自动播放动画）
  - `Farmable` - 可耕种图层
  
- **对象层**：
  - `Player` - 包含所有交互对象
  
- **对象属性**：
  - `dialog: npc_name` - 对话触发器
  - `teleportTo: map_key:x,y` - 传送门
  - `itemData: type:config` - 物品
  - `npcData: key:movement;delay;area;direction` - NPC

#### 5.2 地图导出

使用脚本将 TMX 地图导出为 JSON：

```bash
npm run tmx:json:default
```

### 6. 输入处理

#### 6.1 键盘输入

通过 `InputManager` 统一处理：

```javascript
// 检查按键状态
if (this.inputManager.isSpaceJustDown()) {
  // 空格键刚按下
}

if (this.inputManager.getCurrentDirection()) {
  // 获取当前方向输入
}
```

#### 6.2 触摸输入

虚拟摇杆和动作按钮自动处理触摸输入，通过事件与游戏逻辑通信。

### 7. 存档系统

#### 7.1 自动存档

游戏会在特定时机触发自动存档：

```javascript
// 触发自动存档
const triggerAutosave = () => {
  const evt = new CustomEvent('autosave-request');
  window.dispatchEvent(evt);
};
```

#### 7.2 手动存档

通过设置菜单可以手动保存：

```javascript
// 请求存档快照
window.addEventListener('request-save-snapshot', () => {
  const snapshot = {
    mapKey: this.currentMapKey,
    catStatus: { /* 角色状态 */ },
    farmSave: this.farmManager?.toJSON(),
    // 其他游戏状态
  };
  
  const evt = new CustomEvent('save-snapshot-ready', { detail: snapshot });
  window.dispatchEvent(evt);
});
```

## 最佳实践

### 1. 代码注释规范

- **文件级注释**：说明文件用途、主要功能、使用方法
- **类/函数级注释**：使用 JSDoc 格式，包含参数、返回值、使用示例
- **关键逻辑注释**：解释复杂算法、业务逻辑、注意事项

### 2. 性能优化

- **对象池**：频繁创建的对象使用对象池管理
- **事件清理**：组件销毁时清理事件监听器
- **资源预加载**：在 BootScene 中预加载所有资源
- **帧率控制**：避免在 update 循环中进行重计算

### 3. 错误处理

- **防御性编程**：检查对象是否存在再调用方法
- **异常捕获**：使用 try-catch 包装可能出错的代码
- **优雅降级**：资源加载失败时提供备选方案

### 4. 响应式设计

- **缩放支持**：所有尺寸使用 `multiplier` 进行缩放
- **设备适配**：根据设备类型显示不同的 UI 元素
- **触摸友好**：确保触摸目标足够大

## 调试指南

### 1. 开发者工具

- **浏览器控制台**：查看错误信息和调试输出
- **Phaser 调试**：开启物理引擎调试模式查看碰撞体
- **React DevTools**：检查组件状态和属性

### 2. 常见问题排查

#### 2.1 角色无法移动

- 检查 `InputManager` 是否正确初始化
- 确认 `GridEngine` 配置正确
- 验证地图碰撞设置

#### 2.2 资源加载失败

- 确认资源文件路径正确
- 检查服务器配置和文件权限
- 验证资源文件格式

#### 2.3 UI 显示异常

- 检查 `gameSize` 对象是否正确传递
- 确认样式组件的 `multiplier` 使用
- 验证事件监听器是否正确设置

### 3. 性能分析

使用浏览器性能分析工具：

1. 打开开发者工具的 Performance 面板
2. 录制游戏运行过程
3. 分析帧率、内存使用、函数调用等指标
4. 优化性能瓶颈

## 扩展开发

### 1. 添加新的作物类型

1. 在 `farmplants.json` 图集中添加新的帧
2. 在 `FarmManager.js` 中定义作物配置
3. 更新库存系统以支持新作物

### 2. 添加新的 NPC 类型

1. 创建 NPC 精灵图片
2. 在地图中添加 NPC 对象
3. 定义对话内容和行为逻辑

### 3. 添加音效和音乐

1. 准备音频文件（推荐 MP3/OGG 格式）
2. 在 `BootScene.js` 中预加载
3. 在适当时机播放音效

### 4. 添加新的游戏机制

1. 创建对应的管理器类
2. 集成到主游戏循环
3. 添加 UI 界面支持
4. 实现存档功能

## 部署注意事项

### 1. 生产环境配置

- 确保所有资源文件包含在构建中
- 优化图片和音频文件大小
- 启用资源缓存策略

### 2. 兼容性测试

- 测试不同浏览器的兼容性
- 验证移动设备的触摸操作
- 确认不同屏幕尺寸的显示效果

### 3. 性能监控

- 监控加载时间和帧率
- 分析内存使用情况
- 收集用户反馈和错误报告

---

通过遵循本指南，开发者可以有效地维护和扩展 Topdown 游戏。所有代码都已添加详细的中文注释，便于理解和修改。如有问题，请参考代码注释或联系开发团队。