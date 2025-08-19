# 小说下载页面 - 异步轮询机制

## 功能概述

这个页面实现了一个严格的异步下载流程，确保轮询进度结束后并且状态为 `completed` 才会调用拉取结果函数。

## 核心流程

### 1. 启动下载任务
- 用户点击下载按钮
- 发送 POST 请求到 `/api/optimized/download/start`
- 获取任务 ID (taskId)
- 状态变为 `starting` → `running`

### 2. 轮询进度阶段
- 状态变为 `polling`
- 每 1.2 秒查询一次 `/api/optimized/download/progress`
- **严格条件**：只有当状态为 `completed`、`finished`、`success` 或 `done` 时才结束轮询
- 进度达到 100% 但状态不是完成状态时，会继续等待状态更新
- 支持错误重试机制（最多连续 5 次错误）
- 超时控制：最长等待 15 分钟

### 3. 拉取结果阶段
- **只有轮询完成且状态为 completed 才会执行此阶段**
- 状态变为 `downloading`
- 调用 `/api/optimized/download/result` 获取文件
- 支持重试机制（最多 3 次）
- 验证文件完整性（非空文件）

### 4. 完成或失败
- 成功：状态变为 `completed`，触发文件下载
- 失败：状态变为 `failed`，显示错误信息

## 关键特性

### 严格的状态控制
```typescript
// 严格判断完成状态 - 只有状态明确为 completed 才认为完成
if (status === 'completed' || status === 'finished' || status === 'success' || status === 'done') {
  console.log(`任务 ${taskId} 轮询完成，状态: ${status}, 进度: ${lastProgress}%`);
  return; // 轮询结束，可以进行下一步
}
```

### 错误处理机制
- 网络错误重试
- 连续错误计数
- 超时控制
- 用户友好的错误提示

### 用户体验优化
- 实时进度显示
- 不同阶段的视觉反馈
- 取消下载功能
- 详细的状态信息

## 状态说明

| 状态 | 描述 | UI 显示 |
|------|------|---------|
| `idle` | 初始状态 | 下载按钮 |
| `starting` | 启动任务中 | ⏳ 启动任务中... |
| `running` | 任务运行中 | ⚙️ 任务运行中... |
| `polling` | 轮询进度中 | 🔄 轮询进度中: X% |
| `downloading` | 拉取文件中 | ⬇️ 拉取结果文件中... |
| `completed` | 下载完成 | ✓ 已完成 |
| `failed` | 下载失败 | ✗ 失败，重试 |
| `cancelled` | 用户取消 | ⏹️ 已取消 |

## API 接口

### 启动下载
```
POST /api/optimized/download/start
参数: url, sourceId, format
返回: { data: { task_id: string } }
```

### 查询进度
```
GET /api/optimized/download/progress?task_id=xxx
返回: { 
  data: { 
    status: string,
    progress: number,
    completed_chapters: number,
    total_chapters: number
  }
}
```

### 获取结果
```
GET /api/optimized/download/result?task_id=xxx
返回: 文件流
```

## 使用建议

1. **确保后端 API 返回准确的状态信息**
2. **状态值应该是明确的字符串**（如 'completed'、'failed' 等）
3. **避免使用模糊的状态值**（如数字代码）
4. **确保进度和状态的一致性**

## 错误排查

如果下载卡住或失败，检查：
1. 后端 API 是否返回正确的状态
2. 网络连接是否稳定
3. 任务是否在后端正常运行
4. 浏览器控制台是否有错误信息

## 技术栈

- React 19
- TypeScript
- TailwindCSS
- 原生 fetch API