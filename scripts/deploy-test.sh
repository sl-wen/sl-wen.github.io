#!/bin/bash

# 部署测试脚本
# 用于测试服务器上的应用状态

echo "=== 部署状态检查 ==="
echo "时间: $(date)"

# 检查服务状态
echo -e "\n1. 检查服务状态:"
if systemctl is-active --quiet blog; then
    echo "✅ blog服务运行正常"
    echo "   状态: $(systemctl is-active blog)"
    echo "   启动时间: $(systemctl show blog --property=ActiveEnterTimestamp --value)"
else
    echo "❌ blog服务未运行"
    echo "   状态: $(systemctl is-active blog)"
    systemctl status blog --no-pager
fi

# 检查端口
echo -e "\n2. 检查端口监听:"
if netstat -tlnp | grep -q ":3000"; then
    echo "✅ 端口3000正在监听"
    netstat -tlnp | grep ":3000"
else
    echo "❌ 端口3000未监听"
fi

# 检查应用响应
echo -e "\n3. 检查应用响应:"
if curl -f --connect-timeout 10 http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 应用响应正常"
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000)
    echo "   响应时间: ${RESPONSE_TIME}s"
else
    echo "❌ 应用无响应"
fi

# 检查磁盘空间
echo -e "\n4. 检查磁盘空间:"
df -h | grep -E "(Filesystem|/dev/)"

# 检查内存使用
echo -e "\n5. 检查内存使用:"
free -h

# 检查进程
echo -e "\n6. 检查相关进程:"
ps aux | grep -E "(node|npm)" | grep -v grep || echo "无Node.js进程运行"

# 检查最近的日志
echo -e "\n7. 最近的应用日志:"
journalctl -u blog --no-pager -n 5 2>/dev/null || echo "无法获取日志"

# 检查Nginx状态（如果存在）
echo -e "\n8. 检查Nginx状态:"
if command -v nginx > /dev/null 2>&1; then
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx运行正常"
    else
        echo "❌ Nginx未运行"
    fi
else
    echo "ℹ️ Nginx未安装"
fi

# 检查Git状态
echo -e "\n9. 检查代码状态:"
if [ -d "/var/www/blog/.git" ]; then
    cd /var/www/blog
    echo "当前分支: $(git branch --show-current)"
    echo "最新提交: $(git log --oneline -n 1)"
    echo "远程仓库: $(git remote get-url origin)"
else
    echo "未找到Git仓库"
fi

echo -e "\n=== 检查完成 ===" 