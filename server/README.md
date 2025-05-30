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
├── src/                    # 源代码目录
│   ├── app.js              # 应用入口文件
│   ├── controllers/        # 控制器
│   ├── middlewares/        # 中间件
│   ├── models/             # 数据模型
│   └── routes/             # 路由
├── uploads/                # 上传文件存储目录
├── .env                    # 环境变量配置
├── .env.example            # 环境变量示例
├── package.json            # 项目依赖
└── README.md               # 项目说明
```

## 安装与运行

### 前提条件

- Node.js >= 14.0.0
- MongoDB >= 4.0.0

### 安装步骤

1. 克隆仓库

```bash
git clone <repository-url>
cd server
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，配置必要的环境变量。

4. 运行服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API文档

API接口文档请参考 [API文档](docs/api.md)

## 数据模型

系统包含以下核心数据模型：

- 用户（User）：用户基本信息、统计数据和设置
- 习惯（Habit）：习惯信息、频率设置、目标设置、统计数据
- 打卡记录（Checkin）：打卡日期、完成状态、媒体内容、笔记等
- 习惯模板（HabitTemplate）：预设习惯模板，包含科学依据和建议步骤
- 社区动态（Post）：用户分享的动态内容
- 评论（Comment）：动态评论
- 关注关系（Follow）：用户关注关系
- 挑战（Challenge）：习惯挑战活动
- 挑战参与者（ChallengeParticipant）：挑战参与记录
- 通知（Notification）：用户通知
- 设置（Settings）：用户个性化设置

## 环境变量配置

详细的环境变量配置请参考 `.env.example` 文件

## 开发规范

- 使用 ESLint 进行代码风格检查
- 使用 Prettier 进行代码格式化
- 使用 TypeScript 进行类型检查

## 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交变更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 许可证

[MIT](LICENSE) 
