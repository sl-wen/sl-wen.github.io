import ConditionalFooter from '@/components/ConditionalFooter';
import ResourcePreloader from '@/components/ResourcePreloader';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { AuthProvider } from '@/utils/auth-context';
import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import './globals.css';

// 优化字体加载 - 配置Inter字体，提升加载性能
const inter = Inter({
  subsets: ['latin'], // 字体子集，只加载拉丁字符
  display: 'swap', // 字体显示策略，在字体加载时使用系统字体
  preload: true, // 预加载字体文件
  fallback: ['system-ui', 'arial'], // 字体加载失败时的回退字体
  variable: '--font-inter', // CSS变量名
  adjustFontFallback: false, // 禁用字体回退调整
});

// 动态导入组件以优化加载 - 使用代码分割减少初始包大小
const Header = dynamic(() => import('@/components/Header'), {
  ssr: true, // 启用服务端渲染
  loading: () => <div className="h-16 bg-white dark:bg-gray-800 animate-pulse" /> // 加载时显示的占位符
});

// Footer现在通过ConditionalFooter组件按需加载

// 使用客户端组件包装StatusMessages，避免在Server Component中使用ssr: false
const StatusMessages = dynamic(() => import('@/components/ClientStatusMessages'), {
  ssr: true, // 在Server Component中启用SSR
  loading: () => null // 加载时不显示任何内容
});

// SEO元数据配置 - 定义网站的基本信息用于搜索引擎优化
export const metadata: Metadata = {
  title: '鱼鱼的博客', // 网站标题
  description: '一个现代化的个人博客网站', // 网站描述
  keywords: ['博客', '技术', '编程', '生活'], // 关键词
  authors: [{ name: '鱼鱼' }], // 作者信息
  creator: '鱼鱼', // 创建者
  publisher: '鱼鱼的博客', // 发布者
  formatDetection: {
    email: false, // 禁用邮箱自动检测
    address: false, // 禁用地址自动检测
    telephone: false // 禁用电话自动检测
  }
};

// 视口配置 - 控制页面在移动设备上的显示方式
export const viewport: Viewport = {
  width: 'device-width', // 宽度适配设备宽度
  initialScale: 1, // 初始缩放比例
  maximumScale: 5, // 最大缩放比例
  userScalable: true, // 允许用户缩放
  colorScheme: 'light dark', // 支持浅色和深色主题
  viewportFit: 'cover' // 视口适配方式
};

// 根布局组件 - 定义整个应用的基础HTML结构
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        {/* PWA清单文件 - 定义渐进式Web应用的配置 */}
        <link rel="manifest" href="/manifest.json" />

        {/* 网站图标配置 - 为不同设备和场景提供合适的图标 */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-touch-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* iOS PWA元标签 - 配置iOS设备上的PWA行为 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="鱼鱼博客" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* PWA主题颜色配置 - 定义应用的主题色 */}
        <meta name="theme-color" content="#24292e" />
        <meta name="msapplication-navbutton-color" content="#24292e" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* PWA显示模式 - 设置应用的显示方式 */}
        <meta name="display-mode" content="standalone" />

        {/* iOS启动画面配置 - 为不同iOS设备提供启动画面 */}
        <link rel="apple-touch-startup-image" href="/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1668-2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/pwa-512x512.png" />

        {/* 移动设备优化元标签 - 禁用自动格式检测和优化移动体验 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="email=no" />
        <meta name="format-detection" content="address=no" />

        {/* 移动设备兼容性配置 */}
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="320" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Android设备触摸图标 */}
        <link rel="icon" sizes="192x192" href="/pwa-192x192.png" />
        <link rel="icon" sizes="512x512" href="/pwa-512x512.png" />

        {/* 预连接关键域名 - 提前建立与重要服务的连接以提升性能 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="preconnect" href="https://ui-avatars.com" />
        <link rel="preconnect" href="https://pcwbtcsigmjnrigkfixm.supabase.co" />

        {/* 预加载关键资源 - 提前加载重要的CSS文件 */}
        <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" as="style" />

        {/* Font Awesome图标库 - 提供丰富的图标资源 */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />

        {/* DNS预取 - 提前解析域名以减少延迟 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="//ui-avatars.com" />
        <link rel="dns-prefetch" href="//pcwbtcsigmjnrigkfixm.supabase.co" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* 认证提供者 - 为整个应用提供用户认证上下文 */}
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            {/* 页面头部导航 */}
            <Header />

            {/* 主要内容区域 - 页面内容将在这里渲染 */}
            <main className="flex-1 w-full max-w-7xl mx-auto h-full my-auto mobile-content">
              {children}
            </main>

            {/* 页面底部 - 全屏模式下隐藏 */}
            <ConditionalFooter />

            {/* 状态消息组件 - 显示全局状态和通知 */}
            <StatusMessages />
          </div>
        </AuthProvider>

        {/* Service Worker注册 - 启用离线功能和缓存 */}
        <ServiceWorkerRegistration />


        {/* 资源预加载器 - 预加载重要资源以提升性能 */}
        <ResourcePreloader />


        {/* 深色模式脚本 - 根据系统偏好设置初始主题 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                }
              }
            `
          }}
        />
      </body>
    </html>
  );
}
