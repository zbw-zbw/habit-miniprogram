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

- Node.js >= 16.x
- Express
- MongoDB
- JWT认证
- RESTful API
- PM2 (生产环境进程管理)

## 目录结构

```
server/
├── src/                    # 源代码目录
│   ├── app.js             # 应用入口文件
│   ├── config.js          # 配置文件
│   ├── controllers/       # 控制器
│   ├── middlewares/       # 中间件
│   ├── models/            # 数据模型
│   ├── routes/            # 路由
│   ├── services/          # 业务服务
│   └── utils/             # 工具函数
├── uploads/               # 上传文件存储目录
├── start-server.js        # 服务器启动脚本
├── deploy.sh             # 部署脚本
├── .env                  # 环境变量配置
├── package.json          # 项目依赖
└── README.md             # 项目说明
```

## 快速开始

### 前提条件

- Node.js >= 16.0.0
- MongoDB >= 4.0.0
- npm 或 yarn

### 本地开发

1. **安装依赖**
```bash
npm install
```

2. **配置环境变量**
```bash
# 创建环境变量文件
cp .env.example .env

# 编辑配置文件
nano .env
```

3. **启动服务**
```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start
```

4. **访问服务**
- API地址：http://localhost:3000
- 健康检查：http://localhost:3000/api/health

## 生产部署

**详细部署指南请参考：[DEPLOYMENT.md](./DEPLOYMENT.md)**

### 快速部署

```bash
# 1. 上传项目到服务器
scp -r server/ user@your_server:/opt/habit-tracker/

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### Docker部署

```bash
# 使用Docker Compose快速启动
docker-compose up -d
```

## API文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌

### 习惯管理
- `GET /api/habits` - 获取习惯列表
- `POST /api/habits` - 创建新习惯
- `PUT /api/habits/:id` - 更新习惯
- `DELETE /api/habits/:id` - 删除习惯

### 打卡记录
- `GET /api/checkins` - 获取打卡记录
- `POST /api/checkins` - 创建打卡记录
- `GET /api/analytics` - 获取数据分析

### 社区功能
- `GET /api/posts` - 获取社区动态
- `POST /api/posts` - 发布动态
- `POST /api/posts/:id/like` - 点赞
- `POST /api/posts/:id/comments` - 评论

## 环境变量配置

```bash
# 服务器配置
NODE_ENV=production
PORT=3000
BASE_URL=http://your-server-ip:3000

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/habit-tracker

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 文件上传
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# CORS配置
CORS_ORIGIN=*
```

## 开发脚本

```bash
npm start        # 启动生产服务器
npm run dev      # 启动开发服务器（热重载）
npm test         # 运行测试
npm run lint     # 代码检查
npm run format   # 代码格式化
npm run deploy   # 运行部署脚本
```

## 维护操作

### PM2 进程管理

```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs habit-tracker-api

# 重启服务
pm2 restart habit-tracker-api

# 停止服务
pm2 stop habit-tracker-api
```

### 数据库操作

```bash
# 连接MongoDB
mongo mongodb://localhost:27017/habit-tracker

# 备份数据库
mongodump --db habit-tracker --out /backup/$(date +%Y%m%d)

# 恢复数据库
mongorestore --db habit-tracker /backup/20231201/habit-tracker
```

## 常见问题

### 1. 端口冲突
```bash
# 查看端口占用
sudo lsof -i :3000

# 杀死占用进程
sudo kill -9 <PID>
```

### 2. MongoDB连接失败
- 检查MongoDB服务状态：`sudo systemctl status mongod`
- 验证连接字符串：`mongo "mongodb://localhost:27017/habit-tracker"`

### 3. 文件上传失败
```bash
# 创建上传目录并设置权限
mkdir -p uploads
chmod 755 uploads
```

### 4. PM2进程异常
```bash
# 重新加载PM2配置
pm2 reload ecosystem.config.js

# 清理PM2日志
pm2 flush
```

## 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交 Pull Request

## 许可证

[ISC License](LICENSE)

## 支持

如有问题或建议，请：
1. 查看 [常见问题](#常见问题)
2. 参考 [部署文档](./DEPLOYMENT.md)
3. 提交 Issue
