import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatusMessages from '@/components/StatusMessages';

const inter = Inter({ subsets: ['latin'] });

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
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '鱼鱼的博客',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': '鱼鱼的博客',
    'msapplication-TileColor': '#24292e',
    'application-name': '鱼鱼的博客',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#24292e',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        {/* PWA Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/masked-icon.svg" color="#24292e" />
        
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
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
        
        {/* PWA Installation Scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // PWA Installation Prompt
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                
                const installButton = document.createElement('button');
                installButton.textContent = '安装应用';
                installButton.className = 'fixed bottom-24 right-4 bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors duration-200 z-40 text-sm font-medium';
                
                installButton.addEventListener('click', () => {
                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                      console.log('用户接受了安装提示');
                      installButton.remove();
                    }
                    deferredPrompt = null;
                  });
                });
                
                document.body.appendChild(installButton);
                
                setTimeout(() => {
                  if (installButton.parentNode) {
                    installButton.style.opacity = '0';
                    setTimeout(() => installButton.remove(), 300);
                  }
                }, 10000);
              });

              // Dark Mode Support
              if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </body>
    </html>
  );
} 