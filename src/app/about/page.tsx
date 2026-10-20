import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于我们 - 鱼鱼的博客',
  description: '了解鱼鱼的博客，我们的故事和使命。'
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-3">
            关于我
          </h1>
        </div>

        <div className="space-y-8">
          {/* 个人简介 */}
          <section className="card">
            <div className="p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">个人简介</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                我是一名全栈开发者，热衷于使用现代 TypeScript 技术栈构建 Web 应用。
                在这个博客中，我会分享技术心得、学习笔记和一些有趣的项目经验。
              </p>
            </div>
          </section>

          {/* 技术栈 */}
          <section className="card">
            <div className="p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">技术栈</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  'JavaScript/TypeScript',
                  'React',
                  'Node.js',
                  'PostgreSQL',
                  'Supabase',
                  'Next.js',
                  'HTML5/CSS3',
                  'Git'
                ].map((tech) => (
                  <div
                    key={tech}
                    className="flex items-center px-3 py-2.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 min-w-0"
                  >
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 博客介绍 */}
          <section className="card">
            <div className="p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">博客介绍</h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>
                  这个博客使用{' '}
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    React + TypeScript
                  </span>{' '}
                  构建， 采用{' '}
                  <span className="font-medium text-blue-600 dark:text-blue-400">Supabase</span>{' '}
                  作为后端服务。
                </p>
                <p>
                  博客支持{' '}
                  <span className="font-medium text-blue-600 dark:text-blue-400">Markdown</span>{' '}
                  文章编写， 实时预览，文章分类，以及响应式设计。
                </p>
                <p>
                  如果你对本博客感兴趣，欢迎访问
                  <a
                    href="https://github.com/sl-wen/sl-wen.github.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-1"
                  >
                    GitHub 仓库
                  </a>
                  了解更多信息。
                </p>
              </div>
            </div>
          </section>

          {/* 联系方式 */}
          <section className="card">
            <div className="p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">联系方式</h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:sl-wen@outlook.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  邮箱联系
                </a>
                <a
                  href="https://github.com/sl-wen/sl-wen.github.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  GitHub
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
