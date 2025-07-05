#!/bin/bash

# SSH密钥配置脚本
# 用于配置GitHub Actions自动部署的SSH认证

echo "🔑 SSH密钥配置助手"
echo "=================="

# 检查是否已存在SSH密钥
if [ -f ~/.ssh/id_rsa ]; then
    echo "⚠️  SSH密钥已存在"
    read -p "是否要重新生成？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f ~/.ssh/id_rsa ~/.ssh/id_rsa.pub
        echo "🗑️  已删除旧密钥"
    else
        echo "📋 使用现有密钥"
    fi
fi

# 生成SSH密钥
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "🔐 生成SSH密钥..."
    read -p "请输入邮箱地址: " email
    ssh-keygen -t rsa -b 4096 -C "$email" -f ~/.ssh/id_rsa -N ""
    echo "✅ SSH密钥生成完成"
fi

# 配置authorized_keys
echo "🔧 配置authorized_keys..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ authorized_keys配置完成"

# 显示公钥
echo ""
echo "📋 公钥内容："
echo "=============="
cat ~/.ssh/id_rsa.pub
echo ""

# 显示私钥（用于GitHub Secrets）
echo "🔑 私钥内容（复制到GitHub Secrets的SERVER_KEY）："
echo "=================================================="
cat ~/.ssh/id_rsa
echo ""

# 测试SSH连接
echo "🧪 测试SSH连接..."
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 localhost "echo 'SSH连接测试成功'" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ SSH连接测试成功"
else
    echo "❌ SSH连接测试失败，请检查配置"
fi

# 配置说明
echo ""
echo "📝 配置说明："
echo "============"
echo "1. 复制上面的私钥内容到GitHub Secrets的 SERVER_KEY"
echo "2. 确保GitHub Secrets中的配置："
echo "   - SERVER_IP: $(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP')"
echo "   - SERVER_USER: $(whoami)"
echo "   - SERVER_KEY: [上面显示的私钥内容]"
echo ""
echo "3. 如果仍然无法连接，请检查SSH服务配置："
echo "   sudo vim /etc/ssh/sshd_config"
echo "   确保以下配置："
echo "   PubkeyAuthentication yes"
echo "   AuthorizedKeysFile .ssh/authorized_keys"
echo ""
echo "4. 重启SSH服务："
echo "   sudo systemctl restart sshd"
echo ""
echo "🎉 配置完成！现在可以使用GitHub Actions自动部署了。" 