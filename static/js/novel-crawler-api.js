/**
 * 小说爬虫API接口说明
 * 
 * 本文档介绍如何使用autoapi-six.vercel.app提供的小说爬虫API接口
 * 
 * 基础URL: https://autoapi-six.vercel.app
 * 
 * === 获取小说信息 ===
 * 
 * 接口: /api/novel/info
 * 方法: POST
 * 请求体:
 * {
 *   "url": "https://www.xs5200.net/44_44108/" // 小说目录页的URL
 * }
 * 
 * 响应:
 * {
 *   "title": "小说标题",
 *   "author": "作者名称",
 *   "intro": "小说简介",
 *   "chapters": [
 *     {
 *       "id": 1,
 *       "title": "章节标题",
 *       "url": "章节URL"
 *     },
 *     // ...更多章节
 *   ]
 * }
 * 
 * === 获取章节内容 ===
 * 
 * 接口: /api/novel/chapter
 * 方法: POST
 * 请求体:
 * {
 *   "url": "https://www.xs5200.net/44_44108/123456.html" // 章节页的URL
 * }
 * 
 * 响应:
 * {
 *   "title": "章节标题",
 *   "content": "章节内容"
 * }
 * 
 * === 批量获取章节内容 ===
 * 
 * 接口: /api/novel/batch
 * 方法: POST
 * 请求体:
 * {
 *   "urls": [
 *     "https://www.xs5200.net/44_44108/123456.html",
 *     "https://www.xs5200.net/44_44108/123457.html"
 *     // ...更多章节URL
 *   ]
 * }
 * 
 * 响应:
 * {
 *   "chapters": [
 *     {
 *       "title": "章节1标题",
 *       "content": "章节1内容"
 *     },
 *     {
 *       "title": "章节2标题",
 *       "content": "章节2内容"
 *     },
 *     // ...更多章节
 *   ]
 * }
 * 
 * === 备注 ===
 * 
 * 1. 所有API请求必须包含正确的Content-Type头: 'Content-Type': 'application/json'
 * 2. 目前API仅支持xs5200.net网站的小说爬取
 * 3. 请注意合理控制请求频率，避免过度请求导致API被限制
 * 4. 批量接口每次最多请求10个章节，超过将返回错误
 */ 