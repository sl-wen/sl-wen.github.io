'use client';

import React from 'react';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  isComingSoon?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
}

export default function ToolsPage() {
  const tools: Tool[] = [
    {
      id: 'img',
      title: '图片处理 (img)',
      description:
        '裁剪、分辨率/尺寸调整、压缩、格式转换、人物背景去/加、水印去除',
      icon: '🖼️',
      link: '/img',
      isFeatured: true,
      isNew: true
    },
    {
      id: 'novel',
      title: '小说搜索器',
      description: '小说聚合搜索与下载',
      icon: '📝',
      link: '/novel',
      isFeatured: true
    },
    {
      id: 'code-formatter',
      title: '代码格式化',
      description: '支持多种编程语言的代码格式化和美化工具',
      icon: '🎨',
      link: '/tools/formatter',
      isNew: true
    },
    {
      id: 'json-parser',
      title: 'JSON 解析器',
      description: '解析、验证和格式化 JSON 数据的在线工具',
      icon: '🔧',
      link: '/tools/json'
    },
    {
      id: 'img2json',
      title: '图集转JSON (img2json)',
      description: '拖拽图集、框选子素材并导出 JSON（含聚合）',
      icon: '🧩',
      link: '/img2json',
      isFeatured: true
    },
    {
      id: 'img2text',
      title: '图片转文字 (OCR)',
      description: '提取图片中的中文、英文或数字文本',
      icon: '🈶',
      link: '/tools/img2text',
      isNew: true
    },
    {
      id: 'color-picker',
      title: '颜色选择器',
      description: '专业的颜色选择工具，支持多种颜色格式转换',
      icon: '🎨',
      link: '/tools/color'
    },
    {
      id: 'base64-converter',
      title: 'Base64 转换',
      description: '文本和文件的 Base64 编码解码工具',
      icon: '🔄',
      link: '/tools/base64'
    },
    {
      id: 'qr-generator',
      title: '二维码生成器',
      description: '生成各种样式的二维码，支持 Logo 嵌入',
      icon: '📱',
      link: '/tools/qr',
      isNew: true
    },
    {
      id: 'password-generator',
      title: '密码生成器',
      description: '生成安全可靠的密码，支持自定义规则',
      icon: '🔐',
      link: '/tools/password'
    },
    {
      id: 'hash-calculator',
      title: 'Hash 计算器',
      description: '计算文本和文件的 MD5、SHA1、SHA256 等哈希值',
      icon: '🔒',
      link: '/tools/hash'
    },
    {
      id: 'timestamp-converter',
      title: '时间戳转换',
      description: '时间戳与日期时间格式的双向转换工具',
      icon: '⏰',
      link: '/tools/timestamp'
    },
    {
      id: 'diff-checker',
      title: '文本对比',
      description: '比较两个文本的差异，高亮显示变更内容',
      icon: '📊',
      link: '/tools/diff',
      isNew: true
    },
    {
      id: 'api-tester',
      title: 'API 测试',
      description: '构造请求、查看响应头与响应体，支持多种 HTTP 方法',
      icon: '🧪',
      link: '/tools/api',
      isNew: true
    }
  ];

  const handleToolClick = (tool: Tool) => {
    if (tool.isComingSoon) {
      return;
    }
    // 这里可以添加路由跳转或打开工具的逻辑
    console.log(`Opening tool: ${tool.title}`);
  };

  const getCardClasses = (tool: Tool) => {
    let baseClasses =
      'group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border border-gray-200 dark:border-gray-700';

    if (tool.isComingSoon) {
      baseClasses += ' opacity-60 cursor-not-allowed';
    } else {
      baseClasses += ' hover:-translate-y-2';
    }

    if (tool.isFeatured) {
      baseClasses += ' ring-2 ring-blue-500 ring-opacity-50';
    }

    return baseClasses;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            实用工具集
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">精选开发者工具，提升工作效率</p>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4"></div>
        </div>

        {/* 工具网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={getCardClasses(tool)}
              onClick={() => handleToolClick(tool)}
            >
              {/* 工具图标 */}
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {tool.icon}
              </div>

              {/* 标签 */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {tool.isFeatured && (
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full">
                    推荐
                  </span>
                )}
                {tool.isNew && (
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                    新品
                  </span>
                )}
                {tool.isComingSoon && (
                  <span className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs px-2 py-1 rounded-full">
                    即将上线
                  </span>
                )}
              </div>

              {/* 工具标题 */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {tool.title}
              </h3>

              {/* 工具描述 */}
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-grow">
                {tool.description}
              </p>

              {/* 工具链接 */}
              <div className="mt-auto">
                <a
                  href={tool.link}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${tool.isComingSoon
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white group-hover:bg-blue-700'
                    }`}
                  onClick={(e) => {
                    if (tool.isComingSoon) {
                      e.preventDefault();
                    }
                  }}
                  aria-disabled={tool.isComingSoon}
                >
                  {tool.isComingSoon ? '即将推出' : '使用工具'}
                  <span
                    className={`transition-transform ${tool.isComingSoon ? '' : 'group-hover:translate-x-1'
                      }`}
                  >
                    →
                  </span>
                </a>
              </div>

              {/* 悬浮效果 */}
              {!tool.isComingSoon && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
            </div>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-16 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            更多工具正在开发中
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            我们持续开发新的工具来帮助开发者提高效率。如果您有任何建议或需求，欢迎联系我们！
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:sl-wen@outlook.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              📧 联系我们
            </a>
            <a
              href="https://github.com/sl-wen/sl-wen.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              🔗 GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
