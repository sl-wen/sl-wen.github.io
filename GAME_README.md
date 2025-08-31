# 🎮 Top-Down RPG Game

[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.88.2-green)](https://phaser.io/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)](https://tailwindcss.com/)

## 🚀 项目简介

这是一个基于React + TypeScript + Phaser 3开发的2D俯视角RPG游戏。项目完全迁移自 [top-down-react-phaser-game](https://github.com/blopa/top-down-react-phaser-game)，采用现代化的技术栈重新构建。

### ✨ 核心特性

- 🎮 **完整的游戏框架** - 包含所有必要的场景和组件
- 📱 **响应式设计** - 支持桌面端和移动端
- 🔒 **类型安全** - 完整的TypeScript类型定义
- 🧩 **模块化架构** - 清晰的代码组织结构
- 📡 **事件系统** - 组件间通信机制
- 🎨 **资源管理系统** - 完整的游戏资源加载和管理
- 🖥️ **UI组件系统** - 可复用的游戏UI组件
- 🎬 **场景管理系统** - 完整的游戏场景切换

## 🛠️ 技术栈

### 前端技术
- **框架**: React 19 + Next.js 14
- **语言**: TypeScript 5.8
- **游戏引擎**: Phaser 3.88.2
- **网格引擎**: GridEngine 2.48.0
- **样式**: TailwindCSS 3.4
- **状态管理**: React Hooks + Context

### 开发工具
- **代码质量**: ESLint + Prettier
- **类型检查**: TypeScript
- **构建工具**: Next.js
- **包管理**: npm

## 🎮 游戏功能

### ✅ 已完成功能
- **游戏场景系统**
  - BootScene - 游戏启动和资源加载
  - MainMenuScene - 主菜单界面
  - GameScene - 主游戏场景
  - GameOverScene - 游戏结束界面

- **UI组件系统**
  - DialogBox - 对话框组件（支持打字效果）
  - GameMenu - 游戏菜单组件（支持键盘导航）
  - HeroHealth - 角色血量显示
  - HeroCoin - 金币显示
  - Message - 消息组件

- **资源管理系统**
  - 精灵图集 (Atlas) 加载
  - 瓦片集 (Tileset) 管理
  - 图片资源加载
  - 动画系统

- **技术特性**
  - TypeScript类型安全
  - 响应式设计
  - 事件驱动架构
  - 模块化组件

### 🚧 开发中功能
- **游戏逻辑**
  - 角色移动系统
  - NPC对话系统
  - 物品收集系统
  - 碰撞检测
  - 游戏状态管理

- **高级功能**
  - 音效系统
  - 存档系统
  - 成就系统
  - 多人游戏支持

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd <project-directory>

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000/demo](http://localhost:3000/demo) 查看游戏演示。

### 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🎮 游戏控制

### 桌面端控制
- **方向键 / WASD** - 角色移动
- **空格键** - 交互/确认
- **ESC键** - 暂停菜单
- **鼠标点击** - 菜单选择

### 移动端控制
- **触摸屏幕** - 角色移动
- **点击NPC** - 对话交互
- **点击物品** - 收集
- **菜单按钮** - 游戏操作

## 📁 项目结构

```
src/
├── components/
│   └── game/
│       ├── types/              # TypeScript类型定义
│       ├── constants/          # 游戏常量配置
│       ├── utils/              # 工具函数
│       ├── scenes/             # 游戏场景
│       │   ├── BootScene.ts    # 启动场景
│       │   ├── MainMenuScene.ts # 主菜单场景
│       │   ├── GameScene.ts    # 主游戏场景
│       │   └── GameOverScene.ts # 游戏结束场景
│       ├── ui/                 # UI组件
│       │   ├── DialogBox.tsx   # 对话框
│       │   ├── GameMenu.tsx    # 游戏菜单
│       │   ├── HeroHealth.tsx  # 血量显示
│       │   ├── HeroCoin.tsx    # 金币显示
│       │   └── Message.tsx     # 消息组件
│       └── TopDownGame.tsx     # 主游戏组件
├── app/
│   ├── demo/                   # 游戏演示页面
│   └── top-down-game/          # 游戏页面
└── public/
    └── game/
        └── assets/             # 游戏资源
            ├── images/         # 图片资源
            ├── sprites/        # 精灵资源
            └── maps/           # 地图资源
```

## 🎯 开发进度

### Phase 1-6: 基础框架 ✅
- [x] 项目基础设置
- [x] 依赖和配置
- [x] 核心游戏组件
- [x] 游戏场景系统
- [x] UI组件系统
- [x] 游戏资源管理

### Phase 7-11: 游戏逻辑 🚧
- [ ] 角色移动系统
- [ ] NPC对话系统
- [ ] 物品收集系统
- [ ] 碰撞检测
- [ ] 游戏状态管理
- [ ] 音效系统
- [ ] 性能优化
- [ ] 移动端适配
- [ ] 最终测试和部署

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 [ISC License](LICENSE) 开源。

## 🙏 致谢

- 原项目: [top-down-react-phaser-game](https://github.com/blopa/top-down-react-phaser-game)
- 游戏引擎: [Phaser](https://phaser.io/)
- 网格引擎: [GridEngine](https://annoraaq.github.io/grid-engine/)

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-username/your-repo/issues)
- 邮箱: your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！