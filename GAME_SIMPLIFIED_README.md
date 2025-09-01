# Top-Down 游戏简化版本

## 项目状态

这是一个从 [top-down-react-phaser-game](https://github.com/sl-wen/top-down-react-phaser-game) 移植过来的简化版本，保留了最核心的功能，确保项目能够正常运行。

## 核心功能

### ✅ 已实现的功能

1. **基础游戏框架**
   - Phaser 3 游戏引擎集成
   - GridEngine 地图系统
   - React 19 + TypeScript 支持

2. **游戏场景**
   - BootScene: 资源加载和初始化
   - MainMenuScene: 主菜单界面
   - GameScene: 主游戏场景

3. **角色系统**
   - 玩家角色精灵
   - 基础移动动画（上下左右）
   - 键盘控制（WASD + 方向键）

4. **地图系统**
   - Tiled 地图支持
   - 瓦片集渲染
   - 基础碰撞检测

5. **UI 系统**
   - 响应式设计
   - 移动端适配
   - 加载状态显示

### 🎮 游戏控制

- **移动**: WASD 键或方向键
- **开始游戏**: 点击 "START GAME" 按钮
- **设备支持**: 桌面端和移动端

### 📁 项目结构

```
src/
├── app/
│   └── game/
│       └── page.tsx              # 游戏主页面
├── components/
│   └── game/
│       ├── TopDownGame.tsx       # 主游戏组件
│       └── scenes/
│           ├── BootScene.ts      # 启动场景
│           ├── MainMenuScene.ts  # 主菜单场景
│           └── GameScene.ts      # 游戏场景
public/
└── game/
    └── assets/
        ├── sprites/
        │   └── atlas/            # 角色精灵图集
        └── maps/                 # 地图文件
```

## 运行项目

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问游戏
http://localhost:3000/game
```

### 生产构建

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 技术栈

- **前端框架**: React 19 + TypeScript
- **游戏引擎**: Phaser 3
- **地图系统**: GridEngine
- **样式**: TailwindCSS 3
- **构建工具**: Next.js 15

## 简化说明

相比原版本，本简化版本移除了以下复杂功能：

- ❌ 复杂的 UI 组件（对话框、菜单、血量显示等）
- ❌ NPC 系统
- ❌ 物品收集系统
- ❌ 对话系统
- ❌ 性能监控
- ❌ 浏览器兼容性检查
- ❌ 虚拟摇杆
- ❌ 复杂的游戏状态管理

保留了最核心的游戏功能，确保项目能够稳定运行。

## 下一步开发

如果需要添加更多功能，可以考虑：

1. **NPC 系统**: 添加 NPC 角色和对话
2. **物品系统**: 实现物品收集和背包
3. **地图扩展**: 添加更多地图和场景
4. **音效系统**: 添加背景音乐和音效
5. **存档系统**: 实现游戏进度保存

## 问题排查

如果遇到问题：

1. 确保所有依赖已正确安装
2. 检查浏览器控制台是否有错误信息
3. 确认游戏资源文件路径正确
4. 验证 Phaser 和 GridEngine 版本兼容性

## 许可证

本项目基于原项目的许可证，请参考原项目许可证信息。