import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';
import { AuthProvider } from '@/utils/auth-context';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import NetworkStatus from '@/components/NetworkStatus';
import ResourcePreloader from '@/components/ResourcePreloader';
import InstallPrompt from '@/components/InstallPrompt';
import PWAStatus from '@/components/PWAStatus';

// 优化字体加载
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter',
  adjustFontFallback: false,
});

// 动态导入组件以优化加载
const Header = dynamic(() => import('@/components/Header'), {
  ssr: true,
  loading: () => <div className="h-16 bg-white dark:bg-gray-800 animate-pulse" />
});

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: true,
  loading: () => <div className="h-32 bg-gray-100 dark:bg-gray-900 animate-pulse" />
});

const StatusMessages = dynamic(() => import('@/components/StatusMessages'), {
  ssr: false,
  loading: () => null
});

export const metadata: Metadata = {
  title: '鱼鱼的博客',
  description: '一个现代化的个人博客网站',
  keywords: ['博客', '技术', '编程', '生活'],
  authors: [{ name: '鱼鱼' }],
  creator: '鱼鱼',
  publisher: '鱼鱼的博客',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Icons */}
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
        
        {/* iOS PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="鱼鱼博客" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* PWA Theme Colors */}
        <meta name="theme-color" content="#24292e" />
        <meta name="msapplication-navbutton-color" content="#24292e" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* PWA Display Mode */}
        <meta name="display-mode" content="standalone" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1668-2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/pwa-512x512.png" />
        
        {/* Additional iOS Meta Tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="email=no" />
        <meta name="format-detection" content="address=no" />
        
        {/* Mobile Optimization */}
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="320" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Touch Icons for Android */}
        <link rel="icon" sizes="192x192" href="/pwa-192x192.png" />
        <link rel="icon" sizes="512x512" href="/pwa-512x512.png" />

        {/* 预连接关键域名 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="preconnect" href="https://ui-avatars.com" />
        <link rel="preconnect" href="https://pcwbtcsigmjnrigkfixm.supabase.co" />

        {/* 预加载关键资源 */}
        <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" as="style" />

        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />

        {/* DNS 预取 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="//ui-avatars.com" />
        <link rel="dns-prefetch" href="//pcwbtcsigmjnrigkfixm.supabase.co" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mobile-content">
              {children}
            </main>

            {/* Footer */}
            <Footer />

            {/* Status Messages */}
            <StatusMessages />
          </div>
        </AuthProvider>

        {/* Service Worker Registration */}
        <ServiceWorkerRegistration />

        {/* Performance Monitor */}
        <PerformanceMonitor />

        {/* Network Status */}
        <NetworkStatus />

        {/* Resource Preloader */}
        <ResourcePreloader />

        {/* PWA Install Prompt */}
        <InstallPrompt />

        {/* PWA Status */}
        <PWAStatus />

        {/* Dark Mode Script */}
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
