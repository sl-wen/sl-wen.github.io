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


# 在服务器上执行
sudo systemctl daemon-reload
sudo systemctl restart novel
sudo systemctl status novel


# 1. 在 sites-enabled 目录中创建一个指向配置文件的符号链接来启用它
sudo ln -s /etc/nginx/sites-available/slwen.cn /etc/nginx/sites-enabled/

slwen.cn：
server {
    server_name slwen.cn www.slwen.cn;

    # (Certbot 添加的 listen 443 ssl 和 ssl_certificate 等配置...)
    listen 443 ssl; 
    ssl_certificate /etc/letsencrypt/live/slwen.cn/fullchain.pem; 
    ssl_certificate_key /etc/letsencrypt/live/slwen.cn/privkey.pem; 
    # ... 其他 SSL 配置

    # API 后端服务的反向代理 (这部分保持不变)
    location /api/optimized/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 前端服务的反向代理 (这是需要修改的部分)
    location / {
        proxy_pass http://127.0.0.1:3000; # 代理到 Next.js 服务
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # (Certbot 添加的 HTTP 到 HTTPS 重定向 server 块...)
}

blog.service
[Unit]
Description=Blog Frontend Service (Next.js)
# 确保在网络和后端服务都启动后再启动
After=network.target novel.service

[Service]
# 您指定使用 root 用户
User=root
Group=www-data

# 前端项目的根目录
WorkingDirectory=/var/www/blog

# 为 Next.js 设置生产环境
Environment=NODE_ENV=production

# 启动命令
ExecStart=/bin/bash /var/www/blog/start-blog.sh


# 重启前等待10秒
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target


sudo nano /etc/systemd/system/novel.service
novel.service
[Unit]
Description=Novel Backend API Service (FastAPI) 
After=network.target [Service]
# 确保这里的 User 是您的部署用户，例如 deploy
[Service]
User=root
Group=www-data
# 工作目录
WorkingDirectory=/var/www/novel
# 环境变量可以放在这里 (如果需要) Environment="PYTHONPATH=/var/www/novel" 启动命令，使用 uvicorn
ExecStart=/var/www/novel/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 
Restart=always 
RestartSec=10
[Install]
WantedBy=multi-user.target



# 2. 测试 Nginx 配置是否存在语法错误
sudo nginx -t    # 检查配置
sudo systemctl reload nginx