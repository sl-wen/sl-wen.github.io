"""
小说异步下载API示例 - FastAPI实现
支持异步下载、进度轮询、结果获取的完整流程
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List
import asyncio
import uuid
import time
import os
import tempfile
import json
from enum import Enum
from dataclasses import dataclass, asdict
import logging
import urllib.parse

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="小说下载API", version="1.0.0")

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class DownloadTask:
    task_id: str
    url: str
    format: str
    status: TaskStatus
    progress: float = 0.0
    completed_chapters: int = 0
    total_chapters: int = 0
    error_message: Optional[str] = None
    file_path: Optional[str] = None
    created_at: float = 0.0
    started_at: Optional[float] = None
    completed_at: Optional[float] = None

# 全局任务存储
tasks: Dict[str, DownloadTask] = {}

class DownloadRequest(BaseModel):
    url: str
    sourceId: Optional[int] = None
    format: str = "txt"

class ProgressResponse(BaseModel):
    code: int = 200
    message: str = "success"
    data: Dict

@app.post("/api/novels/download/start")
async def start_download(request: DownloadRequest, background_tasks: BackgroundTasks):
    """启动异步下载任务"""
    try:
        task_id = str(uuid.uuid4())
        
        # URL解码处理 - 如果URL已经被编码，则解码
        decoded_url = urllib.parse.unquote(request.url)
        logger.info(f"原始URL: {request.url}")
        logger.info(f"解码后URL: {decoded_url}")
        
        # 创建任务记录
        task = DownloadTask(
            task_id=task_id,
            url=decoded_url,  # 使用解码后的URL
            format=request.format,
            status=TaskStatus.PENDING,
            created_at=time.time()
        )
        
        tasks[task_id] = task
        
        # 启动后台下载任务
        background_tasks.add_task(download_novel_task, task_id)
        
        logger.info(f"启动下载任务: {task_id}")
        
        return {
            "code": 200,
            "message": "下载任务已启动",
            "data": {
                "task_id": task_id,
                "status": task.status.value
            }
        }
        
    except Exception as e:
        logger.error(f"启动下载任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"启动下载任务失败: {str(e)}")

@app.get("/api/novels/download/progress/smart")
async def get_download_progress(task_id: str = Query(...), timeout: int = Query(120)):
    """获取下载进度（智能轮询）"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    task = tasks[task_id]
    
    # 如果任务已完成或失败，直接返回
    if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
        return ProgressResponse(
            data={
                "task_id": task_id,
                "status": task.status.value,
                "progress": task.progress,
                "progress_percentage": task.progress,
                "completed_chapters": task.completed_chapters,
                "total_chapters": task.total_chapters,
                "error": task.error_message
            }
        )
    
    # 对于正在运行的任务，等待状态更新或超时
    start_time = time.time()
    last_progress = task.progress
    
    while time.time() - start_time < min(timeout, 30):  # 最多等待30秒
        current_task = tasks.get(task_id)
        if not current_task:
            break
            
        # 检查状态是否有变化
        if (current_task.status != TaskStatus.RUNNING or 
            current_task.progress != last_progress or
            current_task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]):
            break
            
        await asyncio.sleep(0.5)  # 500ms检查一次
        
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    return ProgressResponse(
        data={
            "task_id": task_id,
            "status": task.status.value,
            "progress": task.progress,
            "progress_percentage": task.progress,
            "completed_chapters": task.completed_chapters,
            "total_chapters": task.total_chapters,
            "error": task.error_message
        }
    )

@app.get("/api/novels/download/result")
async def get_download_result(task_id: str = Query(...)):
    """获取下载结果文件"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    task = tasks[task_id]
    
    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="任务尚未完成")
    
    if not task.file_path or not os.path.exists(task.file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 获取文件名
    filename = os.path.basename(task.file_path)
    
    return FileResponse(
        task.file_path,
        filename=filename,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{filename}"
        }
    )

@app.post("/api/novels/download/cancel")
async def cancel_download(task_id: str = Query(...)):
    """取消下载任务"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    task = tasks[task_id]
    
    if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
        return {"code": 200, "message": "任务已结束"}
    
    # 标记为取消
    task.status = TaskStatus.CANCELLED
    task.error_message = "用户取消"
    
    logger.info(f"取消下载任务: {task_id}")
    
    return {"code": 200, "message": "任务已取消"}

@app.get("/api/novels/download/tasks")
async def list_download_tasks():
    """获取所有下载任务列表"""
    return {
        "code": 200,
        "data": [asdict(task) for task in tasks.values()]
    }

async def download_novel_task(task_id: str):
    """后台下载任务"""
    if task_id not in tasks:
        return
    
    task = tasks[task_id]
    
    try:
        # 更新状态为运行中
        task.status = TaskStatus.RUNNING
        task.started_at = time.time()
        task.progress = 0.0
        
        logger.info(f"开始下载任务: {task_id}")
        
        # 模拟小说下载过程
        await simulate_novel_download(task)
        
        # 下载完成
        task.status = TaskStatus.COMPLETED
        task.progress = 100.0
        task.completed_at = time.time()
        
        logger.info(f"下载任务完成: {task_id}")
        
    except asyncio.CancelledError:
        task.status = TaskStatus.CANCELLED
        task.error_message = "任务被取消"
        logger.info(f"下载任务被取消: {task_id}")
        
    except Exception as e:
        task.status = TaskStatus.FAILED
        task.error_message = str(e)
        logger.error(f"下载任务失败: {task_id}, 错误: {str(e)}")

async def simulate_novel_download(task: DownloadTask):
    """模拟小说下载过程"""
    # 模拟获取章节列表
    await asyncio.sleep(1)
    if task.status == TaskStatus.CANCELLED:
        raise asyncio.CancelledError()
    
    # 模拟总章节数
    task.total_chapters = 150  # 假设150章
    
    # 创建临时文件
    temp_dir = tempfile.gettempdir()
    filename = f"novel_{task.task_id}.{task.format}"
    file_path = os.path.join(temp_dir, filename)
    
    # 模拟逐章下载
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(f"小说下载开始 - 格式: {task.format}\n")
        f.write(f"下载时间: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 50 + "\n\n")
        
        for chapter in range(1, task.total_chapters + 1):
            if task.status == TaskStatus.CANCELLED:
                raise asyncio.CancelledError()
            
            # 模拟下载章节内容
            f.write(f"第{chapter}章 章节标题\n")
            f.write(f"这是第{chapter}章的内容...\n\n")
            
            # 更新进度
            task.completed_chapters = chapter
            task.progress = (chapter / task.total_chapters) * 100
            
            # 模拟下载时间（随机0.1-0.3秒）
            import random
            await asyncio.sleep(random.uniform(0.05, 0.15))
    
    task.file_path = file_path

@app.get("/api/novels/search")
async def search_novels(keyword: str = Query(...), maxResults: int = Query(30)):
    """搜索小说（示例接口）"""
    # 模拟搜索结果
    mock_novels = [
        {
            "title": f"搜索结果：{keyword}",
            "author": "示例作者",
            "source_name": "示例源站",
            "url": f"https://example.com/novel/{keyword}",
            "latest_chapter": "第100章",
            "update_time": "2024-01-01",
            "source_id": 1,
            "word_count": "100万字",
            "status": "连载中"
        }
    ]
    
    return {
        "code": 200,
        "data": mock_novels[:maxResults]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)