import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem 1rem'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 600,
        marginBottom: '2rem',
        textAlign: 'center',
        color: 'var(--text-color)'
      }}>
        关于我
      </h1>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--text-color)'
          }}>
            个人简介
          </h2>
          <p style={{
            color: 'var(--text-color)',
            lineHeight: 1.8
          }}>
            我是一名全栈开发者，热衷于使用现代 JavaScript 技术栈构建 Web 应用。
            在这个博客中，我会分享技术心得、学习笔记和一些有趣的项目经验。
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--text-color)'
          }}>
            技术栈
          </h2>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
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
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: 'var(--text-color)'
                }}
              >
                {tech}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--text-color)'
          }}>
            博客介绍
          </h2>
          <p style={{
            color: 'var(--text-color)',
            lineHeight: 1.8
          }}>
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