@echo off
echo 设置脚本执行权限...

REM 在Windows上，我们只需要确保文件存在
echo 脚本文件已准备就绪：
echo - scripts/init-server-fullstack.sh
echo - scripts/setup-systemd-services.sh
echo.
echo 注意：这些脚本需要在Linux服务器上运行
echo 在服务器上运行以下命令来设置权限：
echo   chmod +x scripts/init-server-fullstack.sh
echo   chmod +x scripts/setup-systemd-services.sh
echo.
pause 