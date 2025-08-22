# PWA 实现文档

## 概述

本项目已完全配置为 Progressive Web App (PWA)，特别针对移动设备（尤其是 iOS）进行了优化。

## 已实现的功能

### 1. Service Worker 配置
- ✅ 使用 `next-pwa` 自动生成 Service Worker
- ✅ 网络优先缓存策略
- ✅ 离线页面支持
- ✅ 自动更新机制

### 2. Web App Manifest
- ✅ 完整的 `manifest.json` 配置
- ✅ 多种尺寸的应用图标
- ✅ iOS 兼容的图标配置
- ✅ 应用快捷方式
- ✅ 截图支持

### 3. iOS 特定优化
- ✅ Apple Touch Icon (多种尺寸)
- ✅ iOS 启动画面
- ✅ 状态栏样式配置
- ✅ 安全区域适配
- ✅ 触摸优化

### 4. 移动端体验
- ✅ 安装提示组件
- ✅ PWA 状态指示器
- ✅ 离线检测
- ✅ 网络状态监控

## 文件结构

```
public/
├── manifest.json                 # PWA 清单文件
├── sw.js                        # 生成的 Service Worker
├── workbox-*.js                 # Workbox 运行时
├── apple-touch-icon*.png        # iOS 图标 (多种尺寸)
├── apple-splash-*.png           # iOS 启动画面
├── pwa-192x192.png             # PWA 图标
└── pwa-512x512.png             # PWA 图标

src/
├── components/
│   ├── ServiceWorkerRegistration.tsx  # SW 注册组件
│   ├── InstallPrompt.tsx              # 安装提示
│   └── PWAStatus.tsx                  # PWA 状态显示
├── hooks/
│   └── usePWA.ts                      # PWA 状态管理 Hook
└── app/
    ├── layout.tsx                     # 主布局 (包含 PWA meta 标签)
    └── offline/page.tsx               # 离线页面
```

## 移动端安装指南

### iOS 设备
1. 在 Safari 中打开网站
2. 点击底部的分享按钮 📤
3. 向下滚动找到"添加到主屏幕"
4. 点击"添加"完成安装

### Android 设备
1. 在 Chrome 中打开网站
2. 点击浏览器菜单 ⋮
3. 选择"安装应用"或"添加到主屏幕"
4. 确认安装

## 技术特性

### 缓存策略
- **NetworkFirst**: 优先使用网络，失败时使用缓存
- **离线支持**: 自动缓存关键资源
- **更新机制**: 自动检测并提示更新

### iOS 兼容性
- **状态栏适配**: 支持刘海屏和安全区域
- **触摸优化**: 禁用长按菜单和选择
- **启动画面**: 多种设备尺寸的启动画面
- **图标适配**: 完整的 iOS 图标尺寸支持

### 性能优化
- **代码分割**: 自动分割 JavaScript 包
- **资源预加载**: 关键资源预加载
- **图片优化**: WebP 和 AVIF 格式支持
- **字体优化**: 字体交换和预加载

## 开发命令

```bash
# 开发环境 (PWA 功能禁用)
npm run dev

# 生产构建 (包含 PWA)
npm run build

# 启动生产服务器
npm start
```

## PWA 验证

### 1. Chrome DevTools
1. 打开 Chrome DevTools
2. 转到 "Application" 标签
3. 检查 "Manifest" 和 "Service Workers"

### 2. Lighthouse
1. 在 Chrome DevTools 中打开 "Lighthouse"
2. 运行 PWA 审计
3. 检查 PWA 评分和建议

### 3. 移动端测试
1. 在移动设备上访问网站
2. 检查安装提示是否显示
3. 测试离线功能
4. 验证安装后的体验

## 注意事项

### iOS 限制
- iOS Safari 对 PWA 有一些限制
- 需要用户手动添加到主屏幕
- 某些 Web API 可能不可用

### 缓存管理
- Service Worker 会缓存所有静态资源
- 动态内容使用网络优先策略
- 缓存会自动清理过期内容

### 更新机制
- 应用会自动检测更新
- 用户可选择立即更新或稍后更新
- 更新时会重新加载页面

## 故障排除

### 常见问题

1. **Service Worker 未注册**
   - 检查 HTTPS 连接
   - 确保 `sw.js` 文件存在
   - 查看浏览器控制台错误

2. **iOS 安装选项不显示**
   - 确保使用 Safari 浏览器
   - 检查网站是否满足 PWA 要求
   - 验证 manifest.json 配置

3. **离线功能不工作**
   - 检查 Service Worker 状态
   - 验证缓存策略配置
   - 确保网络拦截正常工作

### 调试工具
- Chrome DevTools Application 面板
- Safari Web Inspector (iOS)
- PWA Builder 验证工具

## 更新日志

- ✅ 配置 next-pwa 自动生成 Service Worker
- ✅ 优化 manifest.json 支持 iOS
- ✅ 添加完整的 iOS meta 标签
- ✅ 实现安装提示组件
- ✅ 创建离线页面
- ✅ 添加 PWA 状态组件
- ✅ 移动端触摸优化
- ✅ iOS 安全区域适配