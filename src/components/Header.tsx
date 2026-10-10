'use client';

import { useAuth } from '@/utils/auth-context';
import { incrementVisitCount } from '@/utils/stats';
import { supabase } from '@/utils/supabase-config';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

// Header组件 - 网站顶部导航栏，包含logo、导航菜单和用户功能
const Header: React.FC = () => {
  // 获取用户认证信息
  const { userProfile } = useAuth();
  // 移动端菜单展开状态
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 用户下拉菜单展开状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // 组件挂载状态，用于避免SSR和客户端不一致问题
  const [mounted, setMounted] = useState(false);
  // 下拉菜单DOM引用，用于点击外部关闭功能
  const dropdownRef = useRef<HTMLDivElement>(null);
  // 路由导航钩子
  const router = useRouter();
  // 当前路径钩子
  const pathname = usePathname();
  // 页面滚动状态 - 滚动后导航栏加阴影收窄
  const [scrolled, setScrolled] = useState(false);
  // 默认logo图片URL
  const defaultLogoUrl =
    'https://gss0.bdstatic.com/6LZ1dD3d1sgCo2Kml5_Y_D3/sys/portrait/item/tb.1.7e293cdd.cfUL8Z5IOqpEDaQ0zOUSZg';

  // 确保组件已挂载，避免SSR/Client不一致 - 解决水合问题
  useEffect(() => {
    setMounted(true);
    // 增加访问统计（每个会话仅一次）
    if (typeof window !== 'undefined') {
      const flagKey = 'visitCountIncremented';
      if (!sessionStorage.getItem(flagKey)) {
        incrementVisitCount();
        sessionStorage.setItem(flagKey, '1');
      }
    }
  }, []);

  // 滚动感知 - IntersectionObserver 哨兵方案，替代 scroll 事件监听
  useEffect(() => {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:9px;width:1px;pointer-events:none;visibility:hidden;';
    document.body.prepend(sentinel);
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: '0px' }
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  // 点击外部关闭下拉菜单的事件监听
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 用户登出处理函数 - 清除认证状态并跳转到登录页
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userSession');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 判断当前路径是否为活跃状态 - 用于高亮当前页面导航
  const isActive = (path: string) => {
    // 处理根路径的特殊情况
    if (path === '/') {
      return pathname === '/';
    }
    // 对于其他路径，检查是否以该路径开头
    return pathname.startsWith(path);
  };

  // 基础导航项配置 - 所有用户都可见的导航选项（纯文字，不用 emoji 图标）
  const baseNavItems = [
    { href: '/', label: '首页' },
    { href: '/category', label: '分类' },
    { href: '/search', label: '搜索' },
    { href: '/about', label: '关于' },
    { href: '/tools', label: '工具' }
  ];

  // 用户专属导航项 - 仅登录用户可见的功能
  const userNavItems = [
    { href: '/post', label: '发布' }
  ];

  // 根据用户状态动态组合导航项
  const navItems =
    mounted && userProfile ? [...baseNavItems, ...userNavItems] : baseNavItems;

  const headerCls = `sticky top-0 z-40 w-full border-b backdrop-blur transition-all duration-300 pwa-safe-header supports-[backdrop-filter]:bg-white/60 ${
    scrolled
      ? 'border-gray-200/80 dark:border-gray-700/80 bg-white/85 dark:bg-gray-900/85 shadow-sm'
      : 'border-transparent bg-white/60 dark:bg-gray-900/60'
  }`;
  // 在组件挂载之前返回占位内容 - 避免布局偏移
  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo区域 */}
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="relative h-8 w-8 rounded-full overflow-hidden">
                <Image src={defaultLogoUrl} alt="Logo" fill className="object-cover" />
              </div>
              <span className="text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-white">鱼鱼的博客</span>
            </Link>

            {/* 桌面端导航菜单 */}
            <nav className="hidden md:flex items-center space-x-4">
              {baseNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 登录按钮占位符 */}
            <div className="flex items-center space-x-4">
              <Link href="/login" className="btn-primary">
                登录
              </Link>
              <button className="md:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <span className="sr-only">打开菜单</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* 桌面端头部导航 */}
      <header className={headerCls}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between pwa-header-content transition-all duration-300 ${scrolled ? 'h-13' : 'h-16'}`}>
            {/* Logo和网站标题 */}
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="relative h-8 w-8 rounded-full overflow-hidden">
                <Image
                  src={
                    userProfile && userProfile.avatar_url ? userProfile.avatar_url : defaultLogoUrl
                  }
                  alt="Logo"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // 图片加载失败时使用默认图片
                    const target = e.target as HTMLImageElement;
                    target.src = defaultLogoUrl;
                  }}
                />
              </div>
              <span className="text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-white">鱼鱼的博客</span>
            </Link>

            {/* 桌面端导航菜单 */}
            <nav className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 用户菜单或登录按钮区域 */}
            <div className="flex items-center space-x-4">
              {userProfile ? (
                // 已登录用户的下拉菜单
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span>欢迎 {userProfile?.username}</span>
                    <svg
                      className={`h-4 w-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* 用户下拉菜单内容 */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 py-1.5 shadow-lg ring-1 ring-gray-200/80 dark:ring-gray-700 focus:outline-none">
                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        个人中心
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        设置
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        登出
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // 未登录用户的登录按钮
                <Link href="/login" className="btn-primary">
                  登录
                </Link>
              )}

              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="sr-only">打开菜单</span>
                {/* 汉堡菜单图标 */}
                <svg
                  className={`h-6 w-6 ${isMenuOpen ? 'hidden' : 'block'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* 关闭菜单图标 */}
                <svg
                  className={`h-6 w-6 ${isMenuOpen ? 'block' : 'hidden'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 移动端展开菜单 */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="space-y-1 px-4 pb-3 pt-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium rounded-lg ${isActive(item.href)
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>


    </>
  );
};

export default Header;
