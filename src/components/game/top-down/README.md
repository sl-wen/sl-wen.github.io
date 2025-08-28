# 俯视角RPG游戏

这是一个基于 [Phaser 3](https://phaser.io/) 和 React 的俯视角RPG游戏演示，参考了 [top-down-react-phaser-game](https://github.com/blopa/top-down-react-phaser-game) 项目的实现。

## 功能特性

### 核心功能
- **玩家移动**: 使用 WASD 或方向键控制角色移动
- **NPC交互**: 与NPC对话系统
- **地图系统**: 瓦片地图和碰撞检测
- **相机跟随**: 平滑的相机跟随系统
- **物理系统**: 基于Phaser Arcade物理引擎

### 游戏元素
- **玩家角色**: 绿色方块代表玩家
- **NPC角色**: 红色方块代表NPC
- **地图瓦片**: 
  - 浅绿色: 草地（可通行）
  - 棕色: 墙（不可通行）
  - 灰色: 建筑1
  - 蓝色: 建筑2

## 技术架构

### 文件结构
```
src/components/game/top-down/
├── TopDownGame.tsx          # 主游戏组件
├── TopDownGameEngine.ts     # 游戏引擎类
├── scenes/
│   └── TopDownGameScene.ts  # 游戏主场景
├── entities/
│   ├── Player.ts           # 玩家角色类
│   └── NPC.ts              # NPC类
├── systems/
│   └── WorldMap.ts         # 世界地图系统
└── README.md               # 说明文档
```

### 核心类说明

#### TopDownGameEngine
- 管理Phaser游戏实例
- 处理游戏生命周期
- 提供游戏控制接口

#### TopDownGameScene
- 游戏主场景
- 管理游戏对象
- 处理输入和更新循环

#### Player
- 玩家角色类
- 移动控制和动画
- 物理属性设置

#### NPC
- NPC角色类
- 对话系统
- 交互逻辑

#### WorldMap
- 地图生成和管理
- 碰撞检测设置
- 瓦片系统

## 控制说明

- **WASD / 方向键**: 移动角色
- **空格键**: 与NPC对话
- **ESC键**: 打开菜单（待实现）

## 开发说明

### 资源系统
当前使用简单的图形作为占位符：
- 玩家: 绿色方块
- NPC: 红色方块
- 地图瓦片: 不同颜色的方块

### 扩展功能
可以轻松添加的功能：
- 更丰富的精灵动画
- 音效和背景音乐
- 物品系统
- 任务系统
- 存档系统

## 参考项目

本项目参考了以下开源项目：
- [top-down-react-phaser-game](https://github.com/blopa/top-down-react-phaser-game) - 主要的参考实现
- [Phaser 3 官方文档](https://photonstorm.github.io/phaser3-docs/) - Phaser框架文档

## 致谢

感谢以下开源贡献者：
- photonstorm - 创建Phaser.io
- blopa - 参考项目的作者
- ArMM1998 - 角色精灵和瓦片集
- PixElthen - 海盗帽精灵
