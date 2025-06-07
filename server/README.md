# 习惯打卡小程序后端服务

这是习惯打卡小程序的后端服务，提供API接口供小程序前端调用。

## 功能特点

- 用户系统：注册、登录、个人资料管理
- 习惯管理：创建、编辑、删除、归档习惯
- 打卡记录：记录习惯完成情况，支持文字、图片、视频等多种打卡形式
- 数据分析：习惯完成率、连续打卡记录、趋势分析等
- 社区互动：分享打卡记录，点赞、评论功能
- 通知系统：用户交互通知、系统通知等
- 用户设置：主题、语言、通知设置等个性化配置

## 技术栈

- Node.js
- Express
- MongoDB
- JWT认证
- RESTful API

## 目录结构

```
server/
├── src/ # 源代码目录
│ ├── app.js # 应用入口文件
│ ├── config.js # 配置文件
│ ├── controllers/ # 控制器
│ ├── middlewares/ # 中间件
│ ├── models/ # 数据模型
│ └── routes/ # 路由
├── uploads/ # 上传文件存储目录
├── Dockerfile # Docker构建文件
├── .dockerignore # Docker忽略文件
├── deploy.sh # 部署脚本
├── start-prod.js # 生产环境启动脚本
├── .env # 环境变量配置
├── .env.example # 环境变量示例
├── package.json # 项目依赖
└── README.md # 项目说明
```


## 安装与运行

### 前提条件

- Node.js >= 14.0.0
- MongoDB >= 4.0.0

### 本地开发环境

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
```
然后编辑 `.env` 文件，配置必要的环境变量。

3. 运行服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 部署指南

### 部署到云服务器

#### 方法一：直接部署(推荐新手)

1. 登录你的云服务器

2. 安装Node.js和npm
```bash
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. 将项目传输到服务器
```bash
# 在本地执行
scp -r server/ user@your_server_ip:/path/to/server
```

4. 创建环境变量文件
```bash
cd /path/to/server
cp .env.example .env
nano .env  # 编辑配置文件
```

5. 使用部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

#### 方法二：使用Docker(推荐团队开发)

1. 安装Docker
```bash
curl -fsSL https://get.docker.com | sh
```

2. 创建`.env`文件

3. 构建Docker镜像
```bash
docker build -t habit-tracker-api .
```

4. 运行Docker容器
```bash
docker run -d --name habit-tracker-api \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  habit-tracker-api
```

### 配置域名和HTTPS

1. 购买域名并添加DNS解析到你的服务器IP

2. 安装Nginx
```bash
sudo apt-get update
sudo apt-get install nginx
```

3. 安装SSL证书(使用Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourhabitapp.com
```

## 数据库

### MongoDB Atlas设置（推荐用于生产环境）

1. 创建MongoDB Atlas账户: https://www.mongodb.com/cloud/atlas/register
2. 创建一个新的集群
3. 设置数据库用户
4. 允许从你的服务器IP访问
5. 获取连接字符串并在`.env`文件中设置MONGODB_URI

## 维护

### 日志查看
```bash
pm2 logs habit-tracker-api
```

### 重启服务
```bash
pm2 restart habit-tracker-api
```

### 更新应用
```bash
# 拉取最新代码
git pull

# 重新部署
./deploy.sh
```

## 常见问题

1. **连接MongoDB失败**
   - 检查MONGODB_URI是否正确
   - 确保服务器可以访问MongoDB(检查防火墙设置)

2. **上传文件失败**
   - 检查uploads目录是否存在并有写入权限
   ```bash
   mkdir -p uploads
   chmod 777 uploads
   ```

3. **端口被占用**
   - 修改PORT环境变量或检查是否有其他应用占用该端口
   ```bash
   sudo lsof -i :3000
   ```

## Docker部署说明

### 环境要求

- Docker
- Docker Compose

### 快速启动

在Windows系统下：
```bash
# 进入服务端目录
cd server

# 运行启动脚本
start-docker.bat
```

在Linux/Mac系统下：
```bash
# 进入服务端目录
cd server

# 添加执行权限
chmod +x start-docker.sh

# 运行启动脚本
./start-docker.sh
```

### 服务访问

- API服务地址: http://localhost:3001
- MongoDB数据库: localhost:27018

### 目录结构

- `src/` - 源代码目录
- `uploads/` - 文件上传目录
  - `avatars/` - 用户头像
  - `checkins/` - 打卡图片
  - `posts/` - 社区帖子图片

### 常用Docker命令

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 注意事项

1. 确保3001端口未被占用
2. 修改`utils/config.ts`中的API地址为Docker服务地址
3. 生产环境部署时，请修改JWT密钥等敏感信息
