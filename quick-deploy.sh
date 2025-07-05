#!/bin/bash

# 快速部署脚本 - Ubuntu 24.04
# 用于小更新的快速部署，跳过完整的CI/CD流程

set -e

echo "🚀 快速部署脚本 (Ubuntu 24.04)"
echo "=========================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查Git仓库状态
echo "📋 检查Git仓库状态..."
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ 当前目录不是Git仓库"
    exit 1
fi

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 当前分支: $CURRENT_BRANCH"

# 检查是否有未提交的更改
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  发现未提交的更改，正在清理..."
    git stash push -u -m "Auto stash before deployment $(date)"
    echo "✅ 更改已暂存"
fi

# 强制重置到HEAD
echo "🔄 重置Git状态..."
git reset --hard HEAD

# 清理未跟踪的文件
echo "🧹 清理未跟踪的文件..."
git clean -fd

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin $CURRENT_BRANCH

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node --version
npm --version

# 清理依赖缓存
echo "🧹 清理依赖缓存..."
rm -rf node_modules/.cache
rm -rf .next

# 安装依赖（使用缓存）
echo "📦 安装依赖..."
npm ci

# 构建应用
echo "🔨 构建应用..."
npm run build

# 检查服务是否存在
echo "🔍 检查服务状态..."
if systemctl list-unit-files | grep -q "blog.service"; then
    echo "✅ blog.service 存在"
    
    # 检查服务是否运行
    if systemctl is-active --quiet blog; then
        echo "🔄 重启blog服务..."
        sudo systemctl restart blog
    else
        echo "🚀 启动blog服务..."
        sudo systemctl start blog
    fi
else
    echo "❌ blog.service 不存在，正在创建..."
    
    # 创建服务文件
    sudo tee /etc/systemd/system/blog.service > /dev/null <<EOF
[Unit]
Description=Blog Next.js App
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载systemd并启动服务
    sudo systemctl daemon-reload
    sudo systemctl enable blog
    sudo systemctl start blog
    echo "✅ blog服务已创建并启动"
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
if systemctl is-active --quiet blog; then
    echo "✅ blog服务运行正常"
else
    echo "❌ blog服务启动失败"
    echo "📋 服务状态:"
    systemctl status blog --no-pager
    echo "📋 最近日志:"
    journalctl -u blog -n 20 --no-pager
    exit 1
fi

# 检查Nginx状态
echo "🔍 检查Nginx状态..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx服务运行正常"
else
    echo "⚠️  Nginx服务未运行，正在启动..."
    sudo systemctl start nginx
fi

# 测试应用响应
echo "🧪 测试应用响应..."
sleep 5

# 测试本地端口
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 应用端口3000响应正常"
else
    echo "❌ 应用端口3000无响应"
    echo "📋 进程信息:"
    ps aux | grep -E "(node|npm)" | grep -v grep
    echo "📋 端口占用:"
    netstat -tlnp | grep :3000 || echo "端口3000未被占用"
    exit 1
fi

# 测试Nginx代理
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Nginx代理响应正常"
else
    echo "⚠️  Nginx代理可能有问题"
    echo "📋 Nginx状态:"
    sudo nginx -t
    systemctl status nginx --no-pager
fi

# 获取服务器信息
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "无法获取公网IP")
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")

echo ""
echo "🎉 部署完成！"
echo "============"
echo "📊 部署信息:"
echo "  - 时间: $(date)"
echo "  - 分支: $CURRENT_BRANCH"
echo "  - 提交: $COMMIT_HASH"
echo "  - 消息: $COMMIT_MESSAGE"
echo ""
echo "🔗 访问地址:"
echo "  - 本地: http://localhost"
echo "  - 外部: http://$SERVER_IP"
echo ""
echo "📋 服务状态:"
echo "  - blog服务: $(systemctl is-active blog)"
echo "  - nginx服务: $(systemctl is-active nginx)"
echo ""
echo "📝 常用命令:"
echo "  查看服务状态: systemctl status blog"
echo "  查看实时日志: journalctl -u blog -f"
echo "  重启服务: sudo systemctl restart blog"
echo ""
echo "🔧 故障排除:"
echo "  如果服务无法启动，检查:"
echo "  1. 环境变量: cat .env.local"
echo "  2. 端口占用: netstat -tlnp | grep :3000"
echo "  3. 服务日志: journalctl -u blog -n 50"
echo "  4. 构建输出: npm run build" 