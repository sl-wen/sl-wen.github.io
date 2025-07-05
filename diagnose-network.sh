#!/bin/bash

# 网络诊断脚本 - Ubuntu 24.04
# 用于排查外部访问问题

set -e

echo "🔍 网络访问诊断脚本"
echo "=================="

# 基本信息
echo "📋 基本信息:"
echo "  - 当前时间: $(date)"
echo "  - 服务器IP: $(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo '无法获取')"
echo "  - 内网IP: $(hostname -I | awk '{print $1}')"
echo ""

# 检查服务状态
echo "🔍 检查服务状态:"
echo "  - blog服务: $(systemctl is-active blog 2>/dev/null || echo 'inactive')"
echo "  - nginx服务: $(systemctl is-active nginx 2>/dev/null || echo 'inactive')"
echo ""

# 检查端口监听
echo "🔍 检查端口监听:"
echo "端口3000 (Next.js):"
netstat -tlnp | grep :3000 || echo "  ❌ 端口3000未监听"

echo ""
echo "端口80 (Nginx):"
netstat -tlnp | grep :80 || echo "  ❌ 端口80未监听"

echo ""
echo "所有监听端口:"
netstat -tlnp | grep LISTEN

echo ""

# 检查防火墙状态
echo "🔥 检查防火墙状态:"
if command -v ufw >/dev/null 2>&1; then
    echo "UFW状态:"
    ufw status verbose
else
    echo "  UFW未安装"
fi

echo ""

# 检查iptables规则
echo "🔍 检查iptables规则:"
if command -v iptables >/dev/null 2>&1; then
    echo "INPUT链规则:"
    iptables -L INPUT -n --line-numbers | head -20
    echo ""
    echo "FORWARD链规则:"
    iptables -L FORWARD -n --line-numbers | head -10
else
    echo "  iptables未安装"
fi

echo ""

# 测试本地连接
echo "🧪 测试本地连接:"
echo "测试localhost:3000:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "  ✅ localhost:3000 响应正常"
else
    echo "  ❌ localhost:3000 无响应"
fi

echo ""
echo "测试localhost:80:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    echo "  ✅ localhost:80 响应正常"
else
    echo "  ❌ localhost:80 无响应"
fi

echo ""

# 测试外部连接
echo "🌐 测试外部连接:"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null)
if [ ! -z "$SERVER_IP" ]; then
    echo "测试 $SERVER_IP:80:"
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://$SERVER_IP | grep -q "200"; then
        echo "  ✅ 外部访问正常"
    else
        echo "  ❌ 外部访问失败"
    fi
else
    echo "  ❌ 无法获取服务器IP"
fi

echo ""

# 检查Nginx配置
echo "🌐 检查Nginx配置:"
if nginx -t 2>&1; then
    echo "  ✅ Nginx配置语法正确"
else
    echo "  ❌ Nginx配置有错误"
fi

echo ""
echo "Nginx站点配置:"
if [ -f "/etc/nginx/sites-enabled/blog" ]; then
    echo "  ✅ blog站点已启用"
    echo "  配置文件: /etc/nginx/sites-available/blog"
else
    echo "  ❌ blog站点未启用"
fi

if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "  ⚠️  default站点仍启用 (可能冲突)"
else
    echo "  ✅ default站点已禁用"
fi

echo ""

# 检查进程
echo "🔍 检查相关进程:"
echo "Node.js进程:"
ps aux | grep -E "(node|npm)" | grep -v grep || echo "  ❌ 没有Node.js进程"

echo ""
echo "Nginx进程:"
ps aux | grep nginx | grep -v grep || echo "  ❌ 没有Nginx进程"

echo ""

# 检查日志
echo "📋 检查最近日志:"
echo "blog服务日志 (最近5行):"
journalctl -u blog -n 5 --no-pager 2>/dev/null || echo "  无法获取blog日志"

echo ""
echo "Nginx错误日志 (最近5行):"
if [ -f "/var/log/nginx/error.log" ]; then
    tail -5 /var/log/nginx/error.log 2>/dev/null || echo "  无错误日志"
else
    echo "  错误日志文件不存在"
fi

echo ""

# 云服务器安全组检查提示
echo "☁️  云服务器安全组检查:"
echo "=============================="
echo "如果本地测试正常但外部无法访问，请检查云服务器安全组:"
echo ""
echo "🔧 阿里云ECS安全组配置:"
echo "  1. 登录阿里云控制台"
echo "  2. 进入ECS实例管理"
echo "  3. 点击实例ID进入详情页"
echo "  4. 点击'安全组'标签"
echo "  5. 点击安全组ID进入安全组规则"
echo "  6. 添加入方向规则:"
echo "     - 协议类型: HTTP(80)"
echo "     - 端口范围: 80/80"
echo "     - 授权对象: 0.0.0.0/0"
echo "     - 描述: 允许HTTP访问"
echo ""
echo "🔧 其他云服务商:"
echo "  - 腾讯云: 安全组规则"
echo "  - 华为云: 安全组规则"
echo "  - AWS: Security Groups"
echo "  - Azure: Network Security Groups"
echo ""
echo "📋 需要开放的端口:"
echo "  - 22 (SSH)"
echo "  - 80 (HTTP)"
echo "  - 443 (HTTPS) - 如果配置了SSL"
echo ""

# 快速修复建议
echo "🔧 快速修复建议:"
echo "================"
echo "1. 检查云服务器安全组是否开放80端口"
echo "2. 重启服务:"
echo "   sudo systemctl restart nginx"
echo "   sudo systemctl restart blog"
echo ""
echo "3. 检查防火墙:"
echo "   sudo ufw status"
echo "   sudo ufw allow 80/tcp"
echo ""
echo "4. 检查Nginx配置:"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "5. 查看详细日志:"
echo "   sudo journalctl -u nginx -f"
echo "   sudo journalctl -u blog -f"

echo ""
echo "�� 诊断完成！请根据上述信息排查问题。" 