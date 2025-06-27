import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div>
      <h1>关于我</h1>
      <div>
        <section>
          <h2>个人简介</h2>
          <p>
            我是一名全栈开发者，热衷于使用现代 JavaScript 技术栈构建 Web 应用。
            在这个博客中，我会分享技术心得、学习笔记和一些有趣的项目经验。
          </p>
        </section>

        <section>
          <h2>
            技术栈
          </h2>
          <ul>
            {[
              'JavaScript/TypeScript',
              'React',
              'Node.js',
              'PostgreSQL',
              'Supabase',
              'Webpack',
              'HTML5/CSS3',
              'Git'
            ].map((tech, index) => (
              <li
                key={index}
              >
                {tech}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>博客介绍</h2>
          <p>
            这个博客使用 React + TypeScript 构建，采用 Supabase 作为后端服务。
            博客支持 Markdown 文章编写，实时预览，文章分类，以及响应式设计。
            如果你对本博客感兴趣，欢迎访问 GitHub 仓库了解更多信息。
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;