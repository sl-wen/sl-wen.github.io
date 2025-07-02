import React from 'react';
import '../styles/ToolsPage.css';

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

const ToolsPage: React.FC = () => {
  const tools: Tool[] = [
    {
      id: 'markdown-editor',
      title: 'Markdown 编辑器',
      description: '实时预览的在线 Markdown 编辑器，支持语法高亮和导出功能',
      icon: '📝',
      link: '#',
      isFeatured: true
    },
    {
      id: 'code-formatter',
      title: '代码格式化',
      description: '支持多种编程语言的代码格式化和美化工具',
      icon: '🎨',
      link: '#',
      isNew: true
    },
    {
      id: 'json-parser',
      title: 'JSON 解析器',
      description: '解析、验证和格式化 JSON 数据的在线工具',
      icon: '🔧',
      link: '#'
    },
    {
      id: 'url-shortener',
      title: 'URL 短链接',
      description: '生成短链接，支持访问统计和自定义域名',
      icon: '🔗',
      link: '#'
    },
    {
      id: 'color-picker',
      title: '颜色选择器',
      description: '专业的颜色选择工具，支持多种颜色格式转换',
      icon: '🎨',
      link: '#'
    },
    {
      id: 'base64-converter',
      title: 'Base64 转换',
      description: '文本和文件的 Base64 编码解码工具',
      icon: '🔄',
      link: '#'
    },
    {
      id: 'qr-generator',
      title: '二维码生成器',
      description: '生成各种样式的二维码，支持 Logo 嵌入',
      icon: '📱',
      link: '#',
      isComingSoon: true
    },
    {
      id: 'image-compressor',
      title: '图片压缩',
      description: '在线图片压缩工具，保持质量的同时减小文件大小',
      icon: '🖼️',
      link: '#',
      isComingSoon: true
    },
    {
      id: 'password-generator',
      title: '密码生成器',
      description: '生成安全可靠的密码，支持自定义规则',
      icon: '🔐',
      link: '#'
    },
    {
      id: 'hash-calculator',
      title: 'Hash 计算器',
      description: '计算文本和文件的 MD5、SHA1、SHA256 等哈希值',
      icon: '🔒',
      link: '#'
    },
    {
      id: 'timestamp-converter',
      title: '时间戳转换',
      description: '时间戳与日期时间格式的双向转换工具',
      icon: '⏰',
      link: '#'
    },
    {
      id: 'diff-checker',
      title: '文本对比',
      description: '比较两个文本的差异，高亮显示变更内容',
      icon: '📊',
      link: '#',
      isComingSoon: true
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
    let classes = 'toolCard';
    if (tool.isComingSoon) classes += ' comingSoon';
    if (tool.isFeatured) classes += ' featured';
    if (tool.isNew) classes += ' new';
    return classes;
  };

  return (
    <div className="toolsPage">
      <div className="toolsContainer">
        <h1 className="pageTitle">实用工具集</h1>
        
        <div className="toolsGrid">
          {tools.map((tool) => (
            <div 
              key={tool.id} 
              className={getCardClasses(tool)}
              onClick={() => handleToolClick(tool)}
            >
              <div className="toolIcon" role="img" aria-label={tool.title}>
                {tool.icon}
              </div>
              <h3 className="toolTitle">{tool.title}</h3>
              <p className="toolDescription">{tool.description}</p>
              <a 
                href={tool.link}
                className="toolLink"
                onClick={(e) => {
                  if (tool.isComingSoon) {
                    e.preventDefault();
                  }
                }}
                aria-disabled={tool.isComingSoon}
              >
                {tool.isComingSoon ? '即将推出' : '使用工具'}
                <span>→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
