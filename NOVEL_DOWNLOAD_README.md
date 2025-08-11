# 小说异步下载系统

这是一个完整的小说异步下载系统，支持轮询检查下载状态，只有在下载完成后才能获取下载好的文件。

## 🌟 核心特性

### 前端功能
- ✅ **异步下载**: 支持TXT和EPUB格式
- ✅ **智能轮询**: 动态调整轮询间隔，根据进度优化性能
- ✅ **队列管理**: 支持并发下载限制和队列排队
- ✅ **批量下载**: 一键下载多本小说
- ✅ **实时进度**: 显示章节进度、百分比和耗时
- ✅ **错误重试**: 智能错误处理和重试机制
- ✅ **取消功能**: 支持取消正在下载或队列中的任务

### 后端功能
- ✅ **任务管理**: 完整的异步任务生命周期管理
- ✅ **进度跟踪**: 实时更新下载进度和章节信息
- ✅ **文件管理**: 安全的文件存储和下载
- ✅ **并发控制**: 支持多任务并发下载
- ✅ **API文档**: 自动生成的API文档

## 🚀 快速开始

### 1. 启动后端API服务

```bash
# 方法一：使用启动脚本（推荐）
./start-novel-api.sh

# 方法二：手动启动
pip3 install -r requirements.txt
python3 src/app/api/novel-download-example.py
```

### 2. 启动前端服务

```bash
npm run dev
```

### 3. 访问应用

- 前端界面: http://localhost:3000/novel
- API文档: http://localhost:8000/docs
- 任务列表: http://localhost:8000/api/novels/download/tasks

## 📋 API接口说明

### 启动下载任务
```http
POST /api/novels/download/start
Content-Type: application/json

{
  "url": "https://example.com/novel/123",
  "sourceId": 1,
  "format": "txt"
}
```

### 查询下载进度
```http
GET /api/novels/download/progress/smart?task_id={task_id}&timeout=120
```

### 获取下载结果
```http
GET /api/novels/download/result?task_id={task_id}
```

### 取消下载任务
```http
POST /api/novels/download/cancel?task_id={task_id}
```

## 🔄 下载流程

1. **启动任务**: 调用 `/start` 接口获取 `task_id`
2. **轮询进度**: 使用 `task_id` 轮询 `/progress/smart` 接口
3. **检查完成**: 当状态为 `completed` 时，进度达到100%
4. **获取文件**: 调用 `/result` 接口下载文件

## 💡 核心优化

### 智能轮询策略
- **初期 (0-10%)**: 800ms间隔，快速响应
- **中期 (10-50%)**: 1500ms间隔，平衡性能
- **后期 (50-100%)**: 2000ms间隔，减少服务器压力
- **错误处理**: 连续错误时指数退避，最多重试3次

### 队列管理
- **并发限制**: 最多2个同时下载任务
- **自动调度**: 任务完成后自动处理队列
- **状态跟踪**: 完整的任务状态管理

### 用户体验
- **实时反馈**: 显示章节进度和耗时
- **一键操作**: 支持批量下载和取消
- **错误提示**: 详细的错误信息和重试建议

## 🛠️ 技术栈

### 前端
- **Next.js 14**: React框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 现代UI设计

### 后端
- **FastAPI**: 高性能异步API框架
- **Python 3.8+**: 现代Python特性
- **异步任务**: asyncio + BackgroundTasks

## 📝 使用示例

### 基本下载
```javascript
// 1. 启动下载
const response = await fetch('/api/novels/download/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/novel/123',
    format: 'txt'
  })
});
const { data: { task_id } } = await response.json();

// 2. 轮询进度
const pollProgress = async () => {
  while (true) {
    const resp = await fetch(`/api/novels/download/progress/smart?task_id=${task_id}`);
    const { data } = await resp.json();
    
    console.log(`进度: ${data.progress}%`);
    
    if (data.status === 'completed') {
      break;
    } else if (data.status === 'failed') {
      throw new Error(data.error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// 3. 下载文件
const fileResp = await fetch(`/api/novels/download/result?task_id=${task_id}`);
const blob = await fileResp.blob();
// 触发浏览器下载...
```

## 🔧 配置选项

### 环境变量
- `NEXT_PUBLIC_NOVEL_API_BASE`: API服务地址 (默认: http://localhost:8000)

### 前端配置
- `maxConcurrentDownloads`: 最大并发下载数 (默认: 2)
- `maxWaitMs`: 最大等待时间 (默认: 15分钟)

## 🚨 注意事项

1. **网络稳定性**: 长时间下载需要稳定的网络连接
2. **存储空间**: 确保有足够的临时存储空间
3. **并发限制**: 避免过多并发请求影响服务器性能
4. **文件清理**: 系统会自动清理临时文件

## 🐛 故障排除

### 常见问题
1. **下载超时**: 增加 `maxWaitMs` 或检查网络连接
2. **进度卡住**: 检查后端服务状态，重新启动任务
3. **文件损坏**: 重新下载或检查源站链接有效性

### 调试方法
1. 查看浏览器控制台日志
2. 检查API服务日志
3. 访问 `/api/novels/download/tasks` 查看任务状态

## 📈 性能优化建议

1. **合理设置并发数**: 根据服务器性能调整
2. **监控内存使用**: 大文件下载时注意内存消耗
3. **网络优化**: 使用CDN或缓存提高下载速度
4. **定期清理**: 清理过期的临时文件

---

这个系统提供了完整的异步下载解决方案，确保用户只有在文件完全下载完成后才能获取到文件，同时提供了良好的用户体验和错误处理机制。