#!/bin/bash
# 习惯打卡小程序服务器部署脚本

# 确保脚本在错误时退出
set -e

echo "开始部署习惯打卡小程序服务器..."

# 检查是否安装了必要的工具
command -v node >/dev/null 2>&1 || { echo "需要安装Node.js"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "需要安装npm"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "正在安装PM2..."; npm install -g pm2; }

# 安装依赖
echo "安装依赖..."
npm install --production

# 检查环境变量文件
if [ ! -f .env ]; then
  echo "警告: 未找到.env文件，请确保已正确配置环境变量"
  exit 1
fi

# 创建必要的目录
mkdir -p uploads
chmod 777 uploads

# 启动应用（使用正确的启动脚本）
echo "启动应用..."
pm2 delete habit-tracker-api 2>/dev/null || true
pm2 start start-server.js --name habit-tracker-api

# 设置PM2开机自启
echo "设置PM2开机自启..."
pm2 startup
pm2 save

echo "部署完成！应用已通过PM2启动"
echo "可以使用以下命令查看日志："
echo "  pm2 logs habit-tracker-api"
echo "可以使用以下命令查看应用状态："
echo "  pm2 status" 
