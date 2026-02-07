# 安装 Nginx
sudo apt install nginx -y

# 启动 Nginx 并设置为开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 您可以检查 Nginx 状态来确认它是否正在运行
sudo systemctl status nginx



# 在服务器上执行

# 创建项目目录
sudo mkdir -p /var/www/novel
sudo chown $root:$root /var/www/novel  # 将所有权赋予当前用户以便操作
cd /var/www/novel

# 克隆您的后端仓库 (请替换为您的仓库地址)
git clone git@github.com:sl-wen/novel.git .


# 在服务器上执行，确保在 /var/www/novel 目录下

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt


sudo nano /etc/systemd/system/novel.service


# 在服务器上执行
sudo systemctl daemon-reload
sudo systemctl restart novel
sudo systemctl status novel


# 1. 在 sites-enabled 目录中创建一个指向配置文件的符号链接来启用它
sudo ln -s /etc/nginx/sites-available/slwen.cn /etc/nginx/sites-enabled/

# 2. 测试 Nginx 配置是否存在语法错误
sudo nginx -t

sudo apt update
sudo apt install certbot python3-certbot-nginx -y

sudo certbot --nginx -d slwen.cn -d www.slwen.cn