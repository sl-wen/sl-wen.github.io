#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// === 配置管理 ===
class Config {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || 'https://pcwbtcsigmjnrigkfixm.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!this.supabaseKey) {
      console.error('错误: 未设置 SUPABASE_ANON_KEY 环境变量');
      process.exit(1);
    }

    this.siteUrl = process.env.SITE_URL || 'https://slwen.cn';
    this.outputPath = process.env.SITEMAP_PATH || path.join(process.cwd(), 'public', 'sitemap.xml');
    this.maxUrls = parseInt(process.env.MAX_SITEMAP_URLS) || 50000; // 站点地图URL限制
    this.batchSize = parseInt(process.env.BATCH_SIZE) || 1000; // 批处理大小

    // 验证站点URL格式
    this.validateSiteUrl();
  }

  validateSiteUrl() {
    try {
      new URL(this.siteUrl);
    } catch (error) {
      console.error(`错误: 无效的站点URL格式: ${this.siteUrl}`);
      process.exit(1);
    }
  }

  getSupabaseClient() {
    return createClient(this.supabaseUrl, this.supabaseKey);
  }
}

// === 工具函数 ===
class Utils {
  static formatDate(dtStr) {
    if (!dtStr) return new Date().toISOString().split('T')[0];
    try {
      return new Date(dtStr).toISOString().split('T')[0];
    } catch (error) {
      console.warn(`警告: 无法解析日期 "${dtStr}", 使用当前日期`);
      return new Date().toISOString().split('T')[0];
    }
  }

  static escapeXml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static normalizeUrl(baseUrl, path) {
    const base = baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  }

  static validateUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  static ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// === 日志管理 ===
class Logger {
  static log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  static info(message) {
    this.log(message, 'INFO');
  }

  static warn(message) {
    this.log(message, 'WARN');
  }

  static error(message) {
    this.log(message, 'ERROR');
  }
}

// === 站点地图生成器 ===
class SitemapGenerator {
  constructor(config) {
    this.config = config;
    this.supabase = config.getSupabaseClient();
    this.logger = Logger;
  }

  async generate() {
    try {
      this.logger.info('开始生成站点地图...');

      // 获取所有URL数据
      const [baseUrls, postUrls, categoryUrls, tagUrls] = await Promise.all([
        this.generateBaseUrls(),
        this.generatePostUrls(),
        this.generateCategoryUrls(),
        this.generateTagUrls()
      ]);

      const allUrls = [...baseUrls, ...postUrls, ...categoryUrls, ...tagUrls];

      // 限制URL数量
      if (allUrls.length > this.config.maxUrls) {
        this.logger.warn(`URL数量(${allUrls.length})超过限制(${this.config.maxUrls})，截取前${this.config.maxUrls}个`);
        allUrls.splice(this.config.maxUrls);
      }

      // 生成XML
      const sitemap = this.generateXml(allUrls);

      // 写入文件
      await this.writeSitemap(sitemap);

      this.logger.info(`站点地图生成完成，共 ${allUrls.length} 个URL`);
      return { success: true, urlCount: allUrls.length };

    } catch (error) {
      this.logger.error(`站点地图生成失败: ${error.message}`);
      throw error;
    }
  }

  async generateBaseUrls() {
    const now = Utils.formatDate(new Date());
    const baseUrls = [
      {
        loc: this.config.siteUrl,
        lastmod: now,
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: Utils.normalizeUrl(this.config.siteUrl, '/article'),
        lastmod: now,
        changefreq: 'daily',
        priority: '0.8'
      },
      {
        loc: Utils.normalizeUrl(this.config.siteUrl, '/about'),
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.6'
      },
      {
        loc: Utils.normalizeUrl(this.config.siteUrl, '/privacy'),
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.3'
      },
      {
        loc: Utils.normalizeUrl(this.config.siteUrl, '/terms'),
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.3'
      }
    ];

    return baseUrls.filter(url => Utils.validateUrl(url.loc));
  }

  async generatePostUrls() {
    try {
      const { data: posts, error } = await this.supabase
        .from('posts')
        .select('post_id, title, updated_at, created_at, status')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(this.config.batchSize);

      if (error) {
        this.logger.error(`查询文章数据失败: ${error.message}`);
        return [];
      }

      if (!posts || posts.length === 0) {
        this.logger.info('未找到已发布的文章');
        return [];
      }

      return posts
        .filter(post => post.post_id && (post.updated_at || post.created_at))
        .map(post => ({
          loc: Utils.normalizeUrl(this.config.siteUrl, `/article/${post.post_id}`),
          lastmod: Utils.formatDate(post.updated_at || post.created_at),
          changefreq: 'monthly',
          priority: '0.7'
        }))
        .filter(url => Utils.validateUrl(url.loc));

    } catch (error) {
      this.logger.error(`生成文章URL失败: ${error.message}`);
      return [];
    }
  }

  async generateCategoryUrls() {
    try {
      const { data: categories, error } = await this.supabase
        .from('categories')
        .select('id, name, updated_at')
        .order('name');

      if (error) {
        this.logger.warn(`查询分类数据失败: ${error.message}`);
        return [];
      }

      if (!categories || categories.length === 0) {
        return [];
      }

      return categories
        .filter(cat => cat.id && cat.name)
        .map(category => ({
          loc: Utils.normalizeUrl(this.config.siteUrl, `/category/${encodeURIComponent(category.name)}`),
          lastmod: Utils.formatDate(category.updated_at),
          changefreq: 'weekly',
          priority: '0.6'
        }))
        .filter(url => Utils.validateUrl(url.loc));

    } catch (error) {
      this.logger.warn(`生成分类URL失败: ${error.message}`);
      return [];
    }
  }

  async generateTagUrls() {
    try {
      const { data: tags, error } = await this.supabase
        .from('tags')
        .select('id, name, updated_at')
        .order('name');

      if (error) {
        this.logger.warn(`查询标签数据失败: ${error.message}`);
        return [];
      }

      if (!tags || tags.length === 0) {
        return [];
      }

      return tags
        .filter(tag => tag.id && tag.name)
        .map(tag => ({
          loc: Utils.normalizeUrl(this.config.siteUrl, `/tag/${encodeURIComponent(tag.name)}`),
          lastmod: Utils.formatDate(tag.updated_at),
          changefreq: 'weekly',
          priority: '0.5'
        }))
        .filter(url => Utils.validateUrl(url.loc));

    } catch (error) {
      this.logger.warn(`生成标签URL失败: ${error.message}`);
      return [];
    }
  }

  generateXml(urls) {
    const urlsXml = urls
      .map(url => {
        const escapedLoc = Utils.escapeXml(url.loc);
        const escapedLastmod = Utils.escapeXml(url.lastmod);
        const escapedChangefreq = Utils.escapeXml(url.changefreq);
        const escapedPriority = Utils.escapeXml(url.priority);

        return `    <url>
      <loc>${escapedLoc}</loc>
      <lastmod>${escapedLastmod}</lastmod>
      <changefreq>${escapedChangefreq}</changefreq>
      <priority>${escapedPriority}</priority>
    </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlsXml}
</urlset>`;
  }

  async writeSitemap(sitemap) {
    try {
      Utils.ensureDirectoryExists(this.config.outputPath);
      fs.writeFileSync(this.config.outputPath, sitemap, 'utf8');
      this.logger.info(`站点地图已写入: ${this.config.outputPath}`);
    } catch (error) {
      throw new Error(`写入站点地图文件失败: ${error.message}`);
    }
  }
}

// === 主函数 ===
async function main() {
  try {
    const config = new Config();
    const generator = new SitemapGenerator(config);
    const result = await generator.generate();

    if (result.success) {
      Logger.info('站点地图生成任务完成');
      process.exit(0);
    }
  } catch (error) {
    Logger.error(`站点地图生成失败: ${error.message}`);
    process.exit(1);
  }
}

// === 执行主函数 ===
if (require.main === module) {
  main();
}

module.exports = { SitemapGenerator, Config, Utils, Logger };
