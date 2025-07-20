#!/bin/bash

# 全栈应用systemd服务配置脚本
# 用于设置前端和后端API的systemd服务

echo "=== 配置全栈应用systemd服务 ==="

# 创建前端服务配置
echo "创建前端服务配置..."
sudo tee /etc/systemd/system/blog.service << 'EOF'
[Unit]
Description=Blog Frontend Application
After=network.target
Wants=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/blog
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=blog

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/blog

[Install]
WantedBy=multi-user.target
EOF

# 创建后端API服务配置
echo "创建后端API服务配置..."
sudo tee /etc/systemd/system/novel-api.service << 'EOF'
[Unit]
Description=Novel Backend API Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/novel
Environment=PATH=/var/www/novel/venv/bin
ExecStart=/var/www/novel/venv/bin/python app.py
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=novel-api

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/novel

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd配置
echo "重新加载systemd配置..."
sudo systemctl daemon-reload

# 启用服务
echo "启用服务..."
sudo systemctl enable blog
sudo systemctl enable novel-api

# 设置目录权限
echo "设置目录权限..."
sudo chown -R www-data:www-data /var/www/blog
sudo chown -R www-data:www-data /var/www/novel
sudo chmod -R 755 /var/www/blog
sudo chmod -R 755 /var/www/novel

# 创建日志目录
echo "创建日志目录..."
sudo mkdir -p /var/log/blog
sudo mkdir -p /var/log/novel-api
sudo chown www-data:www-data /var/log/blog
sudo chown www-data:www-data /var/log/novel-api

echo "=== systemd服务配置完成 ==="
echo "前端服务: blog"
echo "后端API服务: novel-api"
echo ""
echo "服务管理命令:"
echo "  启动服务: sudo systemctl start blog novel-api"
echo "  停止服务: sudo systemctl stop blog novel-api"
echo "  重启服务: sudo systemctl restart blog novel-api"
echo "  查看状态: sudo systemctl status blog novel-api"
echo "  查看日志: sudo journalctl -u blog -f"
echo "            sudo journalctl -u novel-api -f" 