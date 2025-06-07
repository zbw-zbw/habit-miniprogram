#!/bin/bash

# 确保上传目录存在
mkdir -p uploads/avatars uploads/checkins uploads/posts

# 启动Docker容器
docker-compose up -d

echo "习惯打卡小程序服务端已启动"
echo "API服务地址: http://localhost:3001"
echo "MongoDB地址: localhost:27018" 
