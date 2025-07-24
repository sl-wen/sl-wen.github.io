const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// === Supabase 配置信息 ===
const supabaseUrl = 'https://pcwbtcsigmjnrigkfixm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjd2J0Y3NpZ21qbnJpZ2tmaXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NzE0MDMsImV4cCI6MjA2MzE0NzQwM30.J97Dt4tOwS0bM9vALgBTga-VyCLdHN6wfFrPse6dORg';  // 一键拷贝你的 anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// === 站点信息（请根据实际情况修改） ===
const SITE_LINK = 'https://slwen.cn';
const SITEMAP_PATH = '/var/www/blog/public/sitemap.xml';

function formatDate(dtStr) {
    return new Date(dtStr).toISOString().split('T')[0]; // 只取 YYYY-MM-DD
}

// === 主逻辑 ===
async function generateSitemap() {
    // 查询所有需要收录的页面
    const { data: posts, error } = await supabase
        .from('posts')
        .select('post_id, updated_at, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('查询出错:', error);
        return;
    }

    // 首页、文章列表页等常规页面也建议收录
    const now = new Date().toISOString().split('T')[0];
    const baseUrls = [
        { loc: SITE_LINK + '/', lastmod: now, changefreq: 'daily', priority: '1.0' },
        { loc: SITE_LINK + '/article', lastmod: now, changefreq: 'daily', priority: '0.8' }
    ];

    // 文章详情页
    const postUrls = posts.map(post => ({
        loc: SITE_LINK.replace(/\/$/, '') + `/article/${post.post_id}`,
        lastmod: formatDate(post.updated_at || post.created_at),
        changefreq: 'monthly',
        priority: '0.7'
    }));

    const allUrls = [...baseUrls, ...postUrls];

    // 拼接 XML
    const urlsXml = allUrls.map(url =>
        `<url>
            <loc>${url.loc}</loc>
            <lastmod>${url.lastmod}</lastmod>
            <changefreq>${url.changefreq}</changefreq>
            <priority>${url.priority}</priority>
         </url>`
    ).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urlsXml}
    </urlset>`;

    // 写入 sitemap.xml
    fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');
    const runtime = new Date().toISOString();
    console.log(`\n${runtime} sitemap.xml 文件已生成: ${SITEMAP_PATH}`);
}

generateSitemap();