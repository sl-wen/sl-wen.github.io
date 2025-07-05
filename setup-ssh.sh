#!/bin/bash

# SSH密钥配置脚本 - Ubuntu 24.04
# 用于配置GitHub Actions的SSH访问

set -e

echo "🔑 SSH密钥配置脚本 (Ubuntu 24.04)"
echo "==============================="

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  不建议使用root用户运行此脚本"
    echo "建议使用普通用户运行"
    read -p "是否继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 获取当前用户
CURRENT_USER=$(whoami)
SSH_DIR="$HOME/.ssh"
AUTHORIZED_KEYS="$SSH_DIR/authorized_keys"

echo "📋 当前用户: $CURRENT_USER"
echo "📁 SSH目录: $SSH_DIR"

# 创建SSH目录
echo "📁 创建SSH目录..."
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# 选择配置方式
echo ""
echo "请选择SSH配置方式:"
echo "1. 自动生成密钥对 (推荐)"
echo "2. 手动输入公钥"
echo "3. 配置密码认证"
echo "4. 显示现有配置"
echo ""

read -p "请选择 (1-4): " -n 1 -r
echo

case $REPLY in
    1)
        echo "🔐 自动生成SSH密钥对..."
        
        # 生成密钥对
        KEY_NAME="github_actions_$(date +%Y%m%d)"
        ssh-keygen -t rsa -b 4096 -f "$SSH_DIR/$KEY_NAME" -N "" -C "github-actions@$(hostname)"
        
        # 添加公钥到authorized_keys
        cat "$SSH_DIR/$KEY_NAME.pub" >> "$AUTHORIZED_KEYS"
        chmod 600 "$AUTHORIZED_KEYS"
        
        echo "✅ 密钥对生成完成"
        echo ""
        echo "🔑 私钥内容 (复制到GitHub Secrets的SERVER_KEY):"
        echo "================================================"
        cat "$SSH_DIR/$KEY_NAME"
        echo "================================================"
        echo ""
        echo "🔑 公钥内容 (已自动添加到authorized_keys):"
        echo "============================================="
        cat "$SSH_DIR/$KEY_NAME.pub"
        echo "============================================="
        ;;
        
    2)
        echo "🔐 手动输入公钥..."
        echo "请输入公钥内容 (以ssh-rsa或ssh-ed25519开头):"
        read -r PUBLIC_KEY
        
        if [[ -z "$PUBLIC_KEY" ]]; then
            echo "❌ 公钥不能为空"
            exit 1
        fi
        
        # 验证公钥格式
        if [[ ! "$PUBLIC_KEY" =~ ^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256) ]]; then
            echo "❌ 公钥格式不正确"
            exit 1
        fi
        
        # 添加公钥
        echo "$PUBLIC_KEY" >> "$AUTHORIZED_KEYS"
        chmod 600 "$AUTHORIZED_KEYS"
        
        echo "✅ 公钥添加完成"
        ;;
        
    3)
        echo "🔐 配置密码认证..."
        
        # 检查SSH配置
        SSHD_CONFIG="/etc/ssh/sshd_config"
        
        echo "📋 当前SSH配置:"
        grep -E "^(PasswordAuthentication|PubkeyAuthentication|PermitRootLogin)" "$SSHD_CONFIG" || echo "使用默认配置"
        
        echo ""
        echo "⚠️  启用密码认证存在安全风险，建议使用密钥认证"
        read -p "是否继续启用密码认证？(y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # 备份配置文件
            sudo cp "$SSHD_CONFIG" "$SSHD_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
            
            # 修改SSH配置
            sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' "$SSHD_CONFIG"
            sudo sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSHD_CONFIG"
            
            # 重启SSH服务
            sudo systemctl restart ssh
            
            echo "✅ 密码认证已启用"
            echo "🔑 GitHub Secrets配置:"
            echo "  SERVER_KEY: 用户密码"
        else
            echo "❌ 已取消配置"
            exit 1
        fi
        ;;
        
    4)
        echo "📋 显示现有配置..."
        
        echo "🔑 SSH密钥文件:"
        ls -la "$SSH_DIR"/ 2>/dev/null || echo "SSH目录不存在"
        
        echo ""
        echo "🔑 authorized_keys内容:"
        if [ -f "$AUTHORIZED_KEYS" ]; then
            cat "$AUTHORIZED_KEYS"
        else
            echo "authorized_keys文件不存在"
        fi
        
        echo ""
        echo "📋 SSH服务状态:"
        systemctl status ssh --no-pager
        
        echo ""
        echo "📋 SSH配置:"
        grep -E "^(PasswordAuthentication|PubkeyAuthentication|PermitRootLogin|Port)" /etc/ssh/sshd_config || echo "使用默认配置"
        
        exit 0
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

# 设置正确的权限
echo "🔐 设置SSH权限..."
chmod 700 "$SSH_DIR"
chmod 600 "$AUTHORIZED_KEYS" 2>/dev/null || true
chown -R "$CURRENT_USER:$CURRENT_USER" "$SSH_DIR"

# 检查SSH服务状态
echo "🔍 检查SSH服务状态..."
if systemctl is-active --quiet ssh; then
    echo "✅ SSH服务运行正常"
else
    echo "❌ SSH服务未运行"
    echo "正在启动SSH服务..."
    sudo systemctl start ssh
    sudo systemctl enable ssh
fi

# 检查防火墙设置
echo "🔍 检查防火墙设置..."
if command -v ufw >/dev/null 2>&1; then
    if ufw status | grep -q "Status: active"; then
        if ufw status | grep -q "22/tcp"; then
            echo "✅ SSH端口已在防火墙中开放"
        else
            echo "⚠️  SSH端口未在防火墙中开放"
            read -p "是否开放SSH端口？(y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sudo ufw allow ssh
                echo "✅ SSH端口已开放"
            fi
        fi
    else
        echo "📋 防火墙未启用"
    fi
else
    echo "📋 未安装ufw防火墙"
fi

# 测试SSH连接
echo "🧪 测试SSH连接..."
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "无法获取公网IP")
SSH_PORT=$(grep -E "^Port" /etc/ssh/sshd_config | awk '{print $2}' || echo "22")

echo ""
echo "🎉 SSH配置完成！"
echo "==============="
echo "📊 配置信息:"
echo "  - 用户: $CURRENT_USER"
echo "  - 服务器IP: $SERVER_IP"
echo "  - SSH端口: $SSH_PORT"
echo "  - SSH服务状态: $(systemctl is-active ssh)"
echo ""
echo "🔧 GitHub Secrets配置:"
echo "  SERVER_IP: $SERVER_IP"
echo "  SERVER_USER: $CURRENT_USER"
echo "  SERVER_KEY: (上面显示的私钥内容或密码)"
echo ""
echo "🧪 测试连接命令:"
echo "  ssh $CURRENT_USER@$SERVER_IP -p $SSH_PORT"
echo ""
echo "📋 常用命令:"
echo "  查看SSH状态: systemctl status ssh"
echo "  查看SSH日志: journalctl -u ssh -f"
echo "  重启SSH服务: sudo systemctl restart ssh"
echo "  查看authorized_keys: cat ~/.ssh/authorized_keys"
echo ""
echo "🔧 故障排除:"
echo "  1. 检查SSH配置: sudo sshd -t"
echo "  2. 检查防火墙: sudo ufw status"
echo "  3. 检查SSH日志: sudo journalctl -u ssh -n 50"
echo "  4. 检查权限: ls -la ~/.ssh/"
echo ""
echo "⚠️  安全建议:"
echo "  1. 定期更换SSH密钥"
echo "  2. 禁用密码认证（使用密钥认证）"
echo "  3. 更改默认SSH端口"
echo "  4. 配置fail2ban防护" 