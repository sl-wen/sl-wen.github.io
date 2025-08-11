#!/bin/bash

# 小说下载API启动脚本

echo "🚀 启动小说下载API服务..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3"
    exit 1
fi

# 安装依赖
echo "📦 安装Python依赖..."
pip3 install -r requirements.txt

# 启动API服务
echo "🌟 启动FastAPI服务 (端口: 8000)..."
echo "📖 API文档: http://localhost:8000/docs"
echo "🔄 健康检查: http://localhost:8000/api/novels/download/tasks"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

python3 src/app/api/novel-download-example.py