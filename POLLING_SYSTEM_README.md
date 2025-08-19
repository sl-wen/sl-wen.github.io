# 轮询系统实现文档

## 概述

本轮询系统专门为小说下载功能设计，确保只有在任务状态为 `completed` 时才会拉取结果文件。系统提供了完整的错误处理、进度跟踪和状态管理功能。

## 核心特性

### 1. 严格的状态检查
- **完成状态验证**: 只有当任务状态明确为 `completed` 或 `finished` 时才认为任务完成
- **失败状态检测**: 自动检测各种失败状态（fail, error, cancel, failed）
- **进度跟踪**: 实时更新下载进度和章节信息

### 2. 智能错误处理
- **连续错误计数**: 防止因网络问题导致的无限重试
- **指数退避**: 根据连续错误次数调整轮询间隔
- **超时控制**: 防止任务无限等待

### 3. 模块化设计
- **通用轮询工具**: `polling.ts` 提供可复用的轮询逻辑
- **React Hook**: `usePolling.ts` 提供 React 组件集成
- **下载管理器**: `NovelDownloadManager.tsx` 管理多个下载任务

## 文件结构

```
src/
├── utils/
│   ├── polling.ts              # 通用轮询工具函数
│   └── usePolling.ts           # React Hook 轮询管理
├── components/
│   ├── NovelDownloadManager.tsx    # 下载任务管理器
│   └── NovelDownloadExample.tsx    # 使用示例
└── app/
    └── novel/
        └── page.tsx            # 小说页面（已集成轮询）
```

## 核心接口

### PollingOptions
```typescript
interface PollingOptions {
  maxWaitMs?: number;           // 最大等待时间（毫秒）
  intervalMs?: number;          // 轮询间隔（毫秒）
  maxConsecutiveErrors?: number; // 最大连续错误次数
  onProgress?: (progress: any) => void; // 进度回调
  onError?: (error: Error) => void;     // 错误回调
}
```

### TaskStatus
```typescript
interface TaskStatus {
  status: string;               // 任务状态
  progress?: number;            // 进度百分比
  message?: string;             // 状态消息
  data?: any;                   // 额外数据
}
```

### PollingState
```typescript
interface PollingState {
  status: 'idle' | 'starting' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
  completedChapters?: number;
  totalChapters?: number;
}
```

## 使用方法

### 1. 基础轮询使用

```typescript
import { pollUntilCompleted } from '@/utils/polling';

// 定义状态检查函数
const checkStatus = async (taskId: string): Promise<TaskStatus> => {
  const response = await fetch(`/api/task/status?task_id=${taskId}`);
  const data = await response.json();
  
  return {
    status: data.status,
    progress: data.progress,
    message: data.message,
    data: data
  };
};

// 开始轮询
await pollUntilCompleted(taskId, checkStatus, {
  maxWaitMs: 15 * 60 * 1000,    // 15分钟超时
  intervalMs: 1200,             // 1.2秒轮询间隔
  maxConsecutiveErrors: 5,      // 最多5次连续错误
  onProgress: (progress) => {
    console.log('进度更新:', progress);
  },
  onError: (error) => {
    console.error('轮询错误:', error);
  }
});
```

### 2. 小说下载专用轮询

```typescript
import { pollNovelDownload } from '@/utils/polling';

await pollNovelDownload(
  taskId,
  'http://localhost:8000',
  (progress) => {
    console.log(`进度: ${progress.progress}%`);
    console.log(`章节: ${progress.completedChapters}/${progress.totalChapters}`);
  },
  {
    maxWaitMs: 15 * 60 * 1000,
    intervalMs: 1200
  }
);
```

### 3. React Hook 使用

```typescript
import { usePolling } from '@/utils/usePolling';

function MyComponent() {
  const { state, startPolling, stopPolling, reset, isPolling } = usePolling({
    maxWaitMs: 15 * 60 * 1000,
    intervalMs: 1200,
    onComplete: () => {
      console.log('轮询完成');
    },
    onFail: (error) => {
      console.error('轮询失败:', error);
    }
  });

  const handleStart = async () => {
    await startPolling('task-123', 'http://localhost:8000');
  };

  return (
    <div>
      <p>状态: {state.status}</p>
      <p>进度: {state.progress}%</p>
      {state.error && <p>错误: {state.error}</p>}
      
      <button onClick={handleStart} disabled={isPolling}>
        开始轮询
      </button>
      <button onClick={stopPolling} disabled={!isPolling}>
        停止轮询
      </button>
      <button onClick={reset}>
        重置
      </button>
    </div>
  );
}
```

### 4. 下载管理器使用

```typescript
import { NovelDownloadManager } from '@/components/NovelDownloadManager';

function NovelPage() {
  const {
    downloadTasks,
    downloadingIds,
    startDownload,
    cancelDownload,
    retryDownload,
    isDownloading
  } = NovelDownloadManager({
    apiBase: 'http://localhost:8000',
    onDownloadComplete: (taskId, novel, format) => {
      console.log(`下载完成: ${novel.title} (${format})`);
    },
    onDownloadError: (taskId, error) => {
      console.error(`下载失败: ${taskId}`, error);
    }
  });

  const handleDownload = (novel, format) => {
    startDownload(novel, format);
  };

  return (
    <div>
      {/* 小说列表和下载按钮 */}
      {novels.map(novel => (
        <div key={novel.title}>
          <h3>{novel.title}</h3>
          <button onClick={() => handleDownload(novel, 'txt')}>
            下载 TXT
          </button>
          <button onClick={() => handleDownload(novel, 'epub')}>
            下载 EPUB
          </button>
        </div>
      ))}

      {/* 下载任务列表 */}
      {downloadTasks.map(task => (
        <div key={task.id}>
          <p>{task.novel.title} - {task.format}</p>
          <p>状态: {task.state.status}</p>
          <p>进度: {task.state.progress}%</p>
          {task.state.status === 'failed' && (
            <button onClick={() => retryDownload(task.id)}>
              重试
            </button>
          )}
          <button onClick={() => cancelDownload(task.id)}>
            取消
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 轮询流程

### 1. 任务启动
```typescript
// 1. 调用启动接口
const startResp = await fetch('/api/optimized/download/start', {
  method: 'POST',
  body: JSON.stringify({ url, sourceId, format })
});
const { task_id } = await startResp.json();
```

### 2. 轮询进度
```typescript
// 2. 轮询直到完成
await pollNovelDownload(task_id, apiBase, onProgress);
```

### 3. 拉取结果
```typescript
// 3. 只有在任务完成时才拉取结果
const response = await fetch(`/api/optimized/download/result?task_id=${task_id}`);
const blob = await response.blob();
downloadFile(blob, filename);
```

## 状态判断逻辑

### 完成状态
```typescript
// 严格判断完成状态
if (status.toLowerCase() === 'completed' || status.toLowerCase() === 'finished') {
  return; // 任务完成，退出轮询
}
```

### 失败状态
```typescript
// 判断失败状态
if (/fail|error|cancel|failed/i.test(status) || (json?.code && json.code >= 400)) {
  throw new Error(`下载任务失败，状态: ${status}`);
}
```

### 进行中状态
```typescript
// 继续轮询的状态
if (/pending|in_progress|processing|running/i.test(status)) {
  console.log(`任务进行中，状态: ${status}`);
  // 继续轮询
}
```

## 错误处理策略

### 1. 连续错误处理
```typescript
let consecutiveErrors = 0;
const maxConsecutiveErrors = 5;

try {
  // 轮询逻辑
  consecutiveErrors = 0; // 成功时重置计数
} catch (error) {
  consecutiveErrors++;
  if (consecutiveErrors >= maxConsecutiveErrors) {
    throw new Error(`连续 ${maxConsecutiveErrors} 次查询失败`);
  }
}
```

### 2. 指数退避
```typescript
const waitTime = consecutiveErrors > 0 
  ? Math.min(intervalMs * (1 + consecutiveErrors), 10000) 
  : intervalMs;
await new Promise(resolve => setTimeout(resolve, waitTime));
```

### 3. 超时控制
```typescript
const startTime = Date.now();
const maxWaitMs = 15 * 60 * 1000; // 15分钟

if (Date.now() - startTime > maxWaitMs) {
  throw new Error('下载任务超时');
}
```

## 配置选项

### 默认配置
```typescript
const defaultOptions = {
  maxWaitMs: 15 * 60 * 1000,    // 15分钟超时
  intervalMs: 1200,             // 1.2秒轮询间隔
  maxConsecutiveErrors: 5,      // 最多5次连续错误
};
```

### 自定义配置
```typescript
const customOptions = {
  maxWaitMs: 30 * 60 * 1000,    // 30分钟超时
  intervalMs: 2000,             // 2秒轮询间隔
  maxConsecutiveErrors: 10,     // 最多10次连续错误
};
```

## 最佳实践

### 1. 状态管理
- 使用 React Hook 管理轮询状态
- 提供清晰的状态反馈给用户
- 支持取消和重试操作

### 2. 错误处理
- 区分网络错误和业务错误
- 提供有意义的错误消息
- 支持自动重试机制

### 3. 性能优化
- 合理设置轮询间隔
- 避免过度的状态更新
- 及时清理资源

### 4. 用户体验
- 显示实时进度
- 提供取消选项
- 支持批量操作

## 注意事项

1. **状态严格性**: 只有明确的状态为 `completed` 或 `finished` 时才认为任务完成
2. **错误恢复**: 系统会自动处理网络错误，但业务错误需要用户干预
3. **资源清理**: 组件卸载时会自动清理轮询任务
4. **并发控制**: 支持多个下载任务同时进行
5. **浏览器兼容**: 支持 Safari 等特殊浏览器的文件下载

## 扩展功能

### 可扩展的轮询类型
- 文件上传进度
- 数据处理任务
- 系统维护任务
- 批量操作任务

### 可扩展的监控功能
- 任务队列管理
- 性能监控
- 错误统计
- 用户行为分析