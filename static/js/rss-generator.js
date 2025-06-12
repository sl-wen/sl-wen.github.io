// rss-generator.js

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';  // 导入 Markdown 解析器

// === Supabase 配置信息 ===
const supabaseUrl = 'https://pcwbtcsigmjnrigkfixm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjd2J0Y3NpZ21qbnJpZ2tmaXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NzE0MDMsImV4cCI6MjA2MzE0NzQwM30.J97Dt4tOwS0bM9vALgBTga-VyCLdHN6wfFrPse6dORg';  // 使用环境变量或替换为你的 anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// === 站点信息（请根据需要修改） ===
const SITE_TITLE = 'slwen blog';
const SITE_LINK = 'http://121.40.215.235';
const SITE_DESCRIPTION = '鱼鱼的博客';
const SITE_GENERATOR = 'Node+Supabase RSS自生成';
const RSS_PATH = '/usr/share/nginx/html/static/xml/rss.xml';

// === 工具：XML 转义（防止乱码、XSS等）===
function escapeXml(unsafe) {
    return unsafe
        ? unsafe.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
        : '';
}

// === 主逻辑 ===
async function generateRSS() {
    // 1. 查询最新N条文章
    const { data: posts, error } = await supabase
        .from('posts')
        .select('post_id, title, content, author, tags, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('查询出错:', error);
        return;
    }
    if (!posts.length) {
        console.warn('没有获取到文章内容');
        return;
    }

    // 2. 拼装 RSS 的每项
    const items = posts.map(post => {
        const postUrl = SITE_LINK.replace(/\/$/, '') + `/pages/article.html?id=${post.post_id}`; // 你也可以用post.post_id
        const pubDate = new Date(post.created_at).toUTCString();
        const updateDate = new Date(post.updated_at).toUTCString();
        // 将 Markdown 内容转换为 HTML
        const summary = marked.parse(post.content || '');

        return `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <link>${postUrl}</link>
            <description><![CDATA[${summary}]]></description>
            <author>${escapeXml(post.author) || ''}</author>
            ${post.tags && Array.isArray(post.tags) && post.tags.length > 0 ? 
              post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n') : ''}
            <pubDate>${pubDate}</pubDate>
            <guid isPermaLink="false">${postUrl}</guid>
            <lastBuildDate>${updateDate}</lastBuildDate>
        </item>`;
    }).join('\n');

    // 3. 拼接RSS文件头
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
                     <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
                        <channel>
                            <title>${escapeXml(SITE_TITLE)}</title>
                            <link>${SITE_LINK}</link>
                            <description>${escapeXml(SITE_DESCRIPTION)}</description>
                            <language>zh-cn</language>
                            <generator>${escapeXml(SITE_GENERATOR)}</generator>
                            <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
                                ${items}
                        </channel>
                     </rss>`;

    // 4. 写入本地文件
    fs.writeFileSync(RSS_PATH, rssFeed, 'utf8');
    const runtime = new Date().toISOString();
    console.log(`\n ${runtime} RSS文件已生成：${RSS_PATH}`);
}

// === 执行 ===
generateRSS();