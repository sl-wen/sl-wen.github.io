#!/bin/bash

# 快速部署脚本 - 适用于小更新
# 用法: ./quick-deploy.sh [branch]

set -e

# 配置
BRANCH=${1:-"react"}
SERVICE_NAME="blog"

echo "⚡ 快速部署开始..."
echo "🌿 分支: $BRANCH"

# 检查Git状态并清理
echo "🧹 清理Git工作区..."
git status
git reset --hard HEAD
git clean -fd

# 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# 显示更新内容
echo "📋 最新更新:"
git log --oneline -n 3

# 检查服务是否存在
if ! sudo systemctl list-units --full -all | grep -Fq "$SERVICE_NAME.service"; then
    echo "⚠️  服务不存在，请先运行 ./create-service.sh 创建服务"
    read -p "是否现在创建服务？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "create-service.sh" ]; then
            chmod +x create-service.sh
            ./create-service.sh
        else
            echo "❌ create-service.sh 文件不存在"
            exit 1
        fi
    else
        echo "❌ 无法继续，需要先创建服务"
        exit 1
    fi
fi

# 重启服务
echo "🔄 重启服务..."
sudo systemctl restart $SERVICE_NAME

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ 服务重启成功"
    
    # 等待应用完全启动
    sleep 10
    
    # 检查应用是否响应
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 应用响应正常"
        echo "🎉 快速部署完成！"
    else
        echo "❌ 应用无响应"
        echo "📋 服务状态:"
        sudo systemctl status $SERVICE_NAME --no-pager
        echo "📋 最近日志:"
        sudo journalctl -u $SERVICE_NAME --no-pager -n 10
        exit 1
    fi
else
    echo "❌ 服务启动失败"
    sudo systemctl status $SERVICE_NAME --no-pager
    echo "📋 最近日志:"
    sudo journalctl -u $SERVICE_NAME --no-pager -n 10
    exit 1
fi

echo "🔗 访问地址: http://localhost:3000"
echo "📝 当前版本: $(git log --oneline -n 1)"
echo ""
echo "📋 常用命令:"
echo "  查看状态: sudo systemctl status $SERVICE_NAME"
echo "  查看日志: sudo journalctl -u $SERVICE_NAME -f"
echo "  重启服务: sudo systemctl restart $SERVICE_NAME" 