#!/bin/bash

# 快速部署脚本 - 适用于小更新
# 用法: ./quick-deploy.sh [branch]

set -e

# 配置
BRANCH=${1:-"react"}
SERVICE_NAME="blog"

echo "⚡ 快速部署开始..."
echo "🌿 分支: $BRANCH"

# 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# 显示更新内容
echo "📋 最新更新:"
git log --oneline -n 3

# 重启服务
echo "🔄 重启服务..."
sudo systemctl restart $SERVICE_NAME

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ 服务重启成功"
    
    # 检查应用是否响应
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 应用响应正常"
        echo "🎉 快速部署完成！"
    else
        echo "❌ 应用无响应"
        sudo systemctl status $SERVICE_NAME
        exit 1
    fi
else
    echo "❌ 服务启动失败"
    sudo systemctl status $SERVICE_NAME
    exit 1
fi

echo "🔗 访问地址: http://localhost:3000"
echo "📝 当前版本: $(git log --oneline -n 1)" 