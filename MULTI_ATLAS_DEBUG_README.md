# 多图集调试工具 (Multi-Atlas Debug Tool)

一个功能强大的图集精灵调试和编辑工具，支持区域选择、多选合并、TypeScript代码生成和实时预览。

## 🚀 新增功能

### 1. 区域网格选择功能
- **拖拽选择**: 在图集上拖拽鼠标创建矩形选择区域
- **网格对齐**: 选择区域自动对齐到指定的网格大小
- **可视化反馈**: 实时显示选择区域的边界和坐标信息

### 2. 多选合并功能
- **多选支持**: Ctrl+点击进行多选/取消选择
- **区域合并**: 将多个选择区域合并为一个大区域
- **批量操作**: 支持对多个选择区域进行批量删除、复制等操作

### 3. 精灵定义生成 TypeScript 代码功能
- **自动生成**: 根据选中区域自动生成TypeScript精灵定义
- **标准格式**: 生成符合Phaser.js规范的精灵配置代码
- **复制导出**: 一键复制生成的代码到剪贴板

### 4. 预览功能
- **实时预览**: 实时预览选中区域的精灵图像
- **独立显示**: 在侧边栏单独显示每个选中精灵的预览图
- **像素级精确**: 支持像素级精确的图像渲染

## 🎮 操作指南

### 基本操作
- **拖拽选择**: 在图集上拖拽鼠标创建选择区域
- **单击选择**: 点击已有选择区域进行单选
- **多选**: Ctrl+点击进行多选/取消选择
- **重命名**: 双击选择列表中的名称进行重命名

### 快捷键
| 快捷键 | 功能 |
|--------|------|
| `Delete`/`Backspace` | 删除选中的区域 |
| `Ctrl+M` | 合并选中的区域 |
| `Ctrl+G` | 生成TypeScript代码 |
| `Ctrl+P` | 切换预览模式 |
| `Ctrl+A` | 选择所有区域 |
| `Escape` | 取消所有选择 |
| `F1` | 显示/隐藏帮助 |

### 工具栏功能
1. **网格大小调整**: 设置选择区域的网格对齐大小 (1-128像素)
2. **删除选择**: 删除当前选中的所有区域
3. **合并选择**: 将多个选中区域合并为一个大区域
4. **生成代码**: 根据选中区域生成TypeScript精灵定义
5. **预览模式**: 开启/关闭精灵预览功能
6. **复制选择**: 复制选中区域到新位置
7. **导出JSON**: 导出选择区域配置到JSON文件
8. **帮助**: 显示详细的使用帮助

## 📋 生成的代码示例

```typescript
// Generated sprite definitions for character
// Generated on 2024-12-19T10:30:00.000Z
export interface SpriteFrame {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SpriteDefinition {
    name: string;
    frames: SpriteFrame[];
    frameWidth: number;
    frameHeight: number;
    totalFrames: number;
}

export const CHARACTER_SPRITES: Record<string, SpriteDefinition> = {
    player_idle: {
        name: 'player_idle',
        frames: [{
            x: 0,
            y: 0,
            width: 32,
            height: 32
        }],
        frameWidth: 16,
        frameHeight: 16,
        totalFrames: 4
    },
    player_walk: {
        name: 'player_walk',
        frames: [{
            x: 32,
            y: 0,
            width: 64,
            height: 32
        }],
        frameWidth: 16,
        frameHeight: 16,
        totalFrames: 8
    }
};

// Usage example:
// const spriteConfig = CHARACTER_SPRITES.player_idle;
// scene.add.sprite(x, y, 'character', spriteConfig.frames[0]);
```

## 🎯 使用场景

1. **游戏开发**: 为Phaser.js游戏项目快速生成精灵配置
2. **资源管理**: 可视化管理和组织图集资源
3. **动画制作**: 快速定义动画帧序列
4. **原型开发**: 快速测试和验证精灵资源

## 🔧 技术特性

- **TypeScript支持**: 完整的类型安全和代码提示
- **React 19**: 使用最新的React特性
- **Canvas绘制**: 高性能的Canvas 2D渲染
- **响应式设计**: 适配不同屏幕尺寸
- **键盘快捷键**: 提高操作效率
- **实时预览**: 所见即所得的编辑体验

## 📁 文件结构

```
src/app/game/multi-atlas-debug/
└── page.tsx                 # 主要组件文件
```

## 🚀 启动方式

1. 确保farm-assets文件夹中有图集文件
2. 访问 `/game/multi-atlas-debug` 页面
3. 选择要编辑的图集
4. 开始创建选择区域并生成代码

## 💡 提示和技巧

- 选择区域会自动对齐到网格，确保精确的像素对齐
- 可以同时选择多个区域进行批量操作
- 生成的代码可直接用于Phaser.js项目
- 切换图集时会清除所有选择，请注意保存工作
- 使用预览模式可以实时查看精灵效果
- 导出的JSON文件可以用于保存和分享选择配置

## 🔄 更新日志

### v2.0.0 (当前版本)
- ✨ 新增区域网格选择功能
- ✨ 新增多选合并功能
- ✨ 新增TypeScript代码生成功能
- ✨ 新增实时预览功能
- ✨ 新增完整的快捷键支持
- ✨ 新增选择区域重命名功能
- ✨ 新增导出JSON配置功能
- ✨ 新增复制选择功能
- ✨ 新增帮助系统
- 🎨 优化UI界面和用户体验

### v1.0.0
- 📱 基础图集显示功能
- 🎯 网格显示功能
- 📊 图集信息显示