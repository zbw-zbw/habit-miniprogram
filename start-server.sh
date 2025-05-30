#!/bin/bash

echo "正在启动习惯打卡小程序后端服务..."
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
  echo "错误: 未找到Node.js，请安装Node.js后再试。"
  exit 1
fi

# 检查服务器目录是否存在
if [ ! -d "server" ]; then
  echo "错误: 未找到服务器目录。"
  exit 1
fi

# 检查服务器启动脚本是否存在
if [ ! -f "server/start-server.js" ]; then
  echo "错误: 未找到服务器启动脚本。"
  exit 1
fi

# 检查是否已安装依赖
if [ ! -d "server/node_modules" ]; then
  echo "正在安装服务器依赖..."
  cd server
  npm install
  cd ..
fi

# 启动服务器
echo "正在启动服务器..."
node server/start-server.js 
