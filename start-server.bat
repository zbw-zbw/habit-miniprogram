@echo off
echo 正在启动习惯打卡小程序后端服务...
echo.

REM 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo 错误: 未找到Node.js，请安装Node.js后再试。
  pause
  exit /b 1
)

REM 检查服务器目录是否存在
if not exist "server" (
  echo 错误: 未找到服务器目录。
  pause
  exit /b 1
)

REM 检查服务器启动脚本是否存在
if not exist "server\start-server.js" (
  echo 错误: 未找到服务器启动脚本。
  pause
  exit /b 1
)

REM 检查是否已安装依赖
if not exist "server\node_modules" (
  echo 正在安装服务器依赖...
  cd server
  npm install
  cd ..
)

REM 启动服务器
echo 正在启动服务器...
node server/start-server.js

pause 
