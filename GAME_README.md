# React + TypeScript 游戏移植项目

## 项目概述

这是一个基于原项目 https://github.com/blopa/top-down-react-phaser-game 的React + TypeScript移植版本。游戏是一个经典的俯视角RPG游戏，使用Phaser 3游戏引擎和GridEngine插件实现。

## 技术栈

- **React 19** - 前端框架
- **TypeScript** - 类型安全
- **Phaser 3** - 游戏引擎
- **GridEngine** - 网格移动系统
- **TailwindCSS 3** - 样式框架
- **Next.js 14** - 全栈框架

## 游戏特性

### 核心功能
- ✅ 完整的游戏场景系统（启动、主菜单、游戏、结束）
- ✅ 角色移动和动画系统
- ✅ NPC对话系统
- ✅ 物品收集系统
- ✅ 游戏状态管理
- ✅ 响应式UI设计
- ✅ 移动端适配

### 游戏场景
1. **BootScene** - 游戏启动和资源加载
2. **MainMenuScene** - 主菜单界面
3. **GameScene** - 主游戏场景
4. **GameOverScene** - 游戏结束界面

### UI组件
- **DialogBox** - 对话框系统
- **GameMenu** - 游戏菜单
- **HeroHealth** - 角色血量显示
- **HeroCoin** - 金币显示
- **Message** - 消息提示

## 游戏控制

### 桌面端
- **WASD** 或 **方向键** - 角色移动
- **空格键** - 与NPC对话/收集物品
- **ESC键** - 打开/关闭菜单

### 移动端
- **触摸控制** - 支持触摸操作
- **虚拟按钮** - 移动端优化的控制界面

## 游戏玩法

1. **开始游戏** - 在主菜单点击"START"开始游戏
2. **探索世界** - 使用方向键或WASD移动角色
3. **与NPC对话** - 靠近NPC按空格键进行对话
4. **收集物品** - 靠近物品按空格键收集
5. **管理状态** - 查看血量和金币状态

## 项目结构

```
src/components/game/
├── types/           # TypeScript类型定义
├── constants/       # 游戏常量配置
├── utils/          # 工具函数
├── scenes/         # 游戏场景
├── ui/             # UI组件
└── TopDownGame.tsx # 主游戏组件
```

## 开发状态

### 已完成 ✅
- [x] 项目基础设置
- [x] 依赖和配置
- [x] 核心游戏组件
- [x] 游戏场景系统
- [x] UI组件系统
- [x] 游戏逻辑框架

### 进行中 🔄
- [ ] 游戏资源文件
- [ ] 地图和瓦片集
- [ ] 精灵动画

### 待完成 ⏳
- [ ] 完整游戏资源
- [ ] 音效系统
- [ ] 存档系统
- [ ] 更多游戏内容

## 运行项目

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 访问游戏

启动开发服务器后，访问：
- 游戏页面：`http://localhost:3000/top-down-game`

## 开发说明

### 添加新功能
1. 在相应的场景文件中添加游戏逻辑
2. 在UI组件中添加界面元素
3. 在类型定义中添加新的接口
4. 在常量文件中添加配置

### 自定义游戏
- 修改 `constants/gameConstants.ts` 中的游戏配置
- 在 `scenes/` 目录中添加新场景
- 在 `ui/` 目录中添加新UI组件

## 贡献

欢迎提交Issue和Pull Request来改进游戏！

## 许可证

本项目基于原项目的MIT许可证。

## 致谢

- 原项目作者：blopa
- Phaser.js 团队
- GridEngine 插件作者
- 所有贡献者