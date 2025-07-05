#!/bin/bash

# 创建systemd服务脚本
# 用法: ./create-service.sh [用户名]

USER_NAME=${1:-$(whoami)}
APP_DIR="/var/www/blog"

echo "🔧 创建blog systemd服务"
echo "======================"
echo "用户: $USER_NAME"
echo "应用目录: $APP_DIR"

# 检查应用目录
if [ ! -d "$APP_DIR" ]; then
    echo "❌ 应用目录不存在: $APP_DIR"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装"
    exit 1
fi

# 停止现有服务
echo "🛑 停止现有服务..."
sudo systemctl stop blog 2>/dev/null || echo "服务未运行"

# 创建服务文件
echo "📝 创建服务文件..."
sudo tee /etc/systemd/system/blog.service > /dev/null <<EOF
[Unit]
Description=Blog Next.js App
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "✅ 服务文件创建完成"

# 重新加载systemd
echo "🔄 重新加载systemd..."
sudo systemctl daemon-reload

# 启用服务
echo "🚀 启用服务..."
sudo systemctl enable blog

# 检查服务文件
echo "📋 服务文件内容:"
echo "================="
cat /etc/systemd/system/blog.service

# 测试服务
echo ""
echo "🧪 测试服务..."
sudo systemctl start blog

sleep 5

if sudo systemctl is-active --quiet blog; then
    echo "✅ 服务启动成功"
    sudo systemctl status blog --no-pager
    
    # 测试应用响应
    sleep 10
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 应用响应正常"
        echo "🔗 访问地址: http://localhost:3000"
    else
        echo "⚠️  应用可能还在启动中，请稍后检查"
    fi
else
    echo "❌ 服务启动失败"
    sudo systemctl status blog --no-pager
    echo ""
    echo "📋 查看日志:"
    sudo journalctl -u blog --no-pager -n 20
fi

echo ""
echo "📋 常用命令:"
echo "============"
echo "启动服务: sudo systemctl start blog"
echo "停止服务: sudo systemctl stop blog"
echo "重启服务: sudo systemctl restart blog"
echo "查看状态: sudo systemctl status blog"
echo "查看日志: sudo journalctl -u blog -f"
echo "禁用服务: sudo systemctl disable blog" 