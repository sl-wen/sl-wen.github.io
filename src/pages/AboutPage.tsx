import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 页面标题 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            关于我
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
        </div>

        <div className="space-y-12">
          {/* 个人简介 */}
          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">👋</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">个人简介</h2>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              我是一名全栈开发者，热衷于使用现代 JavaScript 技术栈构建 Web 应用。
              在这个博客中，我会分享技术心得、学习笔记和一些有趣的项目经验。
            </p>
          </section>

          {/* 技术栈 */}
          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">🛠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">技术栈</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: 'JavaScript/TypeScript', emoji: '⚡' },
                { name: 'React', emoji: '⚛️' },
                { name: 'Node.js', emoji: '🟢' },
                { name: 'PostgreSQL', emoji: '🐘' },
                { name: 'Supabase', emoji: '⚡' },
                { name: 'Webpack', emoji: '📦' },
                { name: 'HTML5/CSS3', emoji: '🎨' },
                { name: 'Git', emoji: '🔀' }
              ].map((tech, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <span className="text-xl">{tech.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {tech.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 博客介绍 */}
          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">📝</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">博客介绍</h2>
            </div>
            <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                这个博客使用 <span className="font-semibold text-blue-600 dark:text-blue-400">React + TypeScript</span> 构建，
                采用 <span className="font-semibold text-green-600 dark:text-green-400">Supabase</span> 作为后端服务。
              </p>
              <p>
                博客支持 <span className="font-semibold text-purple-600 dark:text-purple-400">Markdown</span> 文章编写，
                实时预览，文章分类，以及响应式设计。
              </p>
              <p>
                如果你对本博客感兴趣，欢迎访问 
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-1"
                >
                  GitHub 仓库
                </a> 
                了解更多信息。
              </p>
            </div>
          </section>

          {/* 联系方式 */}
          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">📬</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">联系方式</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <a 
                href="mailto:contact@example.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
              >
                <span>📧</span>
                <span>邮箱联系</span>
              </a>
              <a 
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span>🔗</span>
                <span>GitHub</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
