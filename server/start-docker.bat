@echo off
echo 正在启动习惯打卡小程序服务端...

REM 确保上传目录存在
mkdir uploads\avatars uploads\checkins uploads\posts 2>nul

REM 启动Docker容器
docker-compose up -d

echo.
echo 习惯打卡小程序服务端已启动
echo API服务地址: http://localhost:3001
echo MongoDB地址: localhost:27018
echo. 
