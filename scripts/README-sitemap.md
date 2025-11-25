# 站点地图生成器

这个脚本用于生成符合标准的XML站点地图，支持文章、分类、标签等内容的自动收录。

## 功能特性

- ✅ **环境变量配置**: 支持通过环境变量灵活配置
- ✅ **多类型URL支持**: 支持文章、分类、标签、基础页面
- ✅ **错误处理**: 完善的错误处理和日志记录
- ✅ **数据验证**: URL格式验证和数据完整性检查
- ✅ **XML转义**: 自动转义XML特殊字符
- ✅ **性能优化**: 批处理和内存限制
- ✅ **模块化设计**: 清晰的代码结构和可扩展性

## 安装和配置

### 1. 环境变量配置

复制环境变量模板文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的实际配置：
```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# 站点配置
SITE_URL=https://your-domain.com

# 输出配置
SITEMAP_PATH=public/sitemap.xml

# 性能配置
MAX_SITEMAP_URLS=50000
BATCH_SIZE=1000
```

### 2. 数据库表结构要求

确保你的Supabase数据库包含以下表：

- `posts`: 文章表
  - `post_id` (必需)
  - `title` (可选)
  - `updated_at` (可选)
  - `created_at` (必需)
  - `status` (必需，建议值为 'published')

- `categories`: 分类表
  - `id` (必需)
  - `name` (必需)
  - `updated_at` (可选)

- `tags`: 标签表
  - `id` (必需)
  - `name` (必需)
  - `updated_at` (可选)

## 使用方法

### 命令行运行

```bash
# 基本运行
node scripts/sitemap.js

# 或者直接运行
./scripts/sitemap.js
```

### 在Node.js中调用

```javascript
const { SitemapGenerator, Config } = require('./scripts/sitemap');

async function generateSitemap() {
  const config = new Config();
  const generator = new SitemapGenerator(config);
  const result = await generator.generate();

  if (result.success) {
    console.log(`生成成功，共 ${result.urlCount} 个URL`);
  }
}

generateSitemap();
```

### 集成到构建流程

可以将其集成到CI/CD流程中：

```yaml
# GitHub Actions 示例
- name: Generate Sitemap
  run: node scripts/sitemap.js
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SITE_URL: https://your-domain.com
```

## 输出格式

生成的站点地图符合[sitemap.org](http://www.sitemaps.org/)标准：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://your-domain.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://your-domain.com/article/123</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

## 优先级说明

- **1.0**: 首页
- **0.8**: 文章列表页
- **0.7**: 文章详情页
- **0.6**: 分类页、关于页
- **0.5**: 标签页
- **0.3**: 隐私政策、服务条款

## 变更频率说明

- **daily**: 首页、文章列表（每天变化）
- **weekly**: 分类页、标签页（每周变化）
- **monthly**: 文章详情页（每月变化）

## 错误处理

脚本包含完善的错误处理：

1. **配置验证**: 启动时验证环境变量和URL格式
2. **数据库错误**: 数据库查询失败时记录警告并继续
3. **文件写入错误**: 写入失败时抛出错误并退出
4. **数据验证**: 过滤无效数据，确保URL格式正确

## 日志输出

脚本提供结构化的日志输出：

```
[2024-01-01T12:00:00.000Z] [INFO] 开始生成站点地图...
[2024-01-01T12:00:01.000Z] [INFO] 未找到已发布的文章
[2024-01-01T12:00:01.000Z] [WARN] 查询分类数据失败: relation "categories" does not exist
[2024-01-01T12:00:01.000Z] [INFO] 站点地图生成完成，共 5 个URL
```

## 故障排除

### 常见问题

1. **环境变量未设置**
   ```
   错误: 未设置 SUPABASE_ANON_KEY 环境变量
   ```
   解决: 检查 `.env` 文件或环境变量设置

2. **数据库表不存在**
   ```
   查询分类数据失败: relation "categories" does not exist
   ```
   解决: 检查数据库表结构，脚本会自动跳过不存在的表

3. **URL格式错误**
   ```
   错误: 无效的站点URL格式: invalid-url
   ```
   解决: 检查 `SITE_URL` 环境变量格式

### 调试模式

可以通过设置环境变量启用更多调试信息：
```env
DEBUG=sitemap:*
```

## 性能调优

### 内存优化
- 默认批处理大小为1000，适合大多数场景
- 最大URL限制为50000，符合站点地图标准

### 数据库优化
- 建议为常用查询字段添加索引
- 定期清理无效或过期的文章数据

## 扩展开发

### 添加新的URL类型

1. 在 `SitemapGenerator` 类中添加新方法：
```javascript
async generateCustomUrls() {
  // 实现你的URL生成逻辑
  return urls;
}
```

2. 在 `generate()` 方法中调用：
```javascript
const customUrls = await this.generateCustomUrls();
const allUrls = [...baseUrls, ...postUrls, ...categoryUrls, ...tagUrls, ...customUrls];
```

### 自定义优先级和频率

可以修改各个 `generate*Urls` 方法中的优先级和变更频率设置。

## 许可证

请参考项目根目录的LICENSE文件。