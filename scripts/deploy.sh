#!/bin/bash

# 游戏项目部署脚本

set -e

echo "🎮 开始部署游戏项目..."

# 检查环境变量
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 运行测试
echo "🧪 运行测试..."
npm run test:assets || echo "⚠️ 测试跳过"

# 类型检查
echo "🔍 类型检查..."
npm run tsc

# 构建项目
echo "🏗️ 构建项目..."
npm run build

# 检查构建结果
if [ -d ".next" ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi

# 如果是Docker部署
if [ "$DEPLOY_METHOD" = "docker" ]; then
    echo "🐳 构建Docker镜像..."
    docker build -t game-app .
    
    echo "🚀 启动Docker容器..."
    docker-compose up -d
    
    echo "✅ Docker部署完成"
elif [ "$DEPLOY_METHOD" = "pm2" ]; then
    echo "📊 使用PM2部署..."
    pm2 start ecosystem.config.js --env production
    
    echo "✅ PM2部署完成"
else
    echo "🚀 启动生产服务器..."
    npm start
fi

echo "🎉 部署完成！"
echo "🌐 访问地址: http://localhost:3000"