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

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--text-color)'
          }}>
            联系方式
          </h2>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <a
              href="https://github.com/your-username"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-color)',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease'
              }}
            >
              <svg height="24" width="24" viewBox="0 0 16 16">
                <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
              GitHub
            </a>
            <a
              href="mailto:your-email@example.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-color)',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease'
              }}
            >
              <svg height="24" width="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path>
              </svg>
              Email
            </a>
          </div>
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