import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';
import { AuthProvider } from '@/utils/auth-context';
// import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import NetworkStatus from '@/components/NetworkStatus';
import ResourcePreloader from '@/components/ResourcePreloader';

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
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'light'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        {/* Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

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
        {/* <ServiceWorkerRegistration /> */}

        {/* Performance Monitor */}
        <PerformanceMonitor />

        {/* Network Status */}
        <NetworkStatus />

        {/* Resource Preloader */}
        <ResourcePreloader />

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
