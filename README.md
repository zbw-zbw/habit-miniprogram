# 习惯打卡小程序

这是一个基于微信小程序平台开发的习惯养成与打卡应用。

> 项目开发中...

## 功能特点

- 习惯创建与管理：创建、编辑、删除习惯，支持多种重复模式
- 习惯打卡：便捷记录每日习惯完成情况
- 数据分析：直观展示习惯完成率和连续打卡天数等数据
- 社区互动：分享打卡记录，参与挑战，获得鼓励
- 个性化设置：自定义主题、提醒时间等

## 技术栈

- 前端框架：微信小程序原生开发
- 语言：TypeScript
- 样式：WXSS + Less
- 状态管理：Context + Hooks
- 后端：Node.js + Express + MongoDB

## 项目结构

```
miniprogram/
├── components/        # 可复用组件
├── pages/             # 小程序页面
├── packageAnalytics/  # 数据分析分包
├── packageCommunity/  # 社区功能分包
├── styles/            # 全局样式
├── typings/           # TypeScript 类型定义
├── utils/             # 工具函数
└── assets/            # 静态资源

server/
├── src/               # 服务器源代码
├── uploads/           # 上传文件存储
└── start-server.js    # 自动端口服务器启动脚本
```

## 开发指南

1. 克隆项目
   ```bash
   git clone https://github.com/zbw-zbw/habit-miniprogram.git
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动后端服务
   - Windows: 双击 `start-server.bat` 或运行 `node server/start-server.js`
   - Mac/Linux: 运行 `./start-server.sh` 或 `node server/start-server.js`

4. 使用微信开发者工具打开项目目录

## 服务器自动端口功能

本项目包含一个智能服务器启动脚本，可以自动查找可用端口并启动服务器：

- 自动检测端口 3000-3010 范围内的可用端口
- 自动更新小程序中的API基础URL配置
- 支持Windows和Mac/Linux系统
- 提供友好的错误处理和提示

如果遇到端口占用问题，只需使用提供的启动脚本，它会自动处理端口冲突。

## 设计规范

项目遵循《习惯打卡小程序设计规范》，包括色彩系统、字体规范、间距规范等，确保整体风格一致。

## 开发规范

项目遵循《习惯打卡小程序开发规范》，包括代码风格、命名规范、组件设计原则等。

## 贡献指南

欢迎提交 Issue 或 Pull Request 来帮助改进这个项目！

## 许可证

MIT 

## 前后端数据对接

### 已完成工作

1. 修改了`utils/request.ts`，强制使用API服务而不是本地数据
2. 对接了以下页面的数据加载功能，从静态数据改为API调用：
   - 习惯列表页面 (pages/habits/habits.ts)
   - 社区动态详情页面 (packageCommunity/pages/post-detail/post-detail.js)
   - 数据分析报告页面 (packageAnalytics/pages/report/report.ts)
   - 社区搜索页面 (packageCommunity/pages/search/search.js)

3. 在API服务中添加了新的方法：
   - analyticsAPI.getMonthlyReport
   - analyticsAPI.getWeeklyReport
   - communityAPI.search
   - communityAPI.getHotSearches
   - communityAPI.getHotTopics

### 待完成工作

1. 重构API服务文件(services/api.ts)，解决重复定义方法的问题
   - 当前文件存在多处重复定义的API方法，如`getHabits`、`getHabitStats`、`getTrends`等
   - 建议将API服务按模块拆分为独立文件，按以下结构重构：
     ```
     services/
     ├── api/
     │   ├── index.ts          # 导出所有API
     │   ├── auth-api.ts       # 认证相关API
     │   ├── user-api.ts       # 用户相关API
     │   ├── habit-api.ts      # 习惯相关API
     │   ├── checkin-api.ts    # 打卡相关API
     │   ├── analytics-api.ts  # 数据分析相关API
     │   ├── community-api.ts  # 社区相关API
     │   ├── notification-api.ts # 通知相关API
     │   └── settings-api.ts   # 设置相关API
     ├── habit-card.ts
     └── habit-chain-service.ts
     ```
   - 每个API文件应导出单一API对象，避免重复定义
   - 移除重复方法，确保每个API方法只有一个定义
   - 统一API路径前缀，例如community API应统一使用`/api/community/`路径

2. 对接剩余页面：
   - 首页 (pages/index/index.ts)
   - 个人中心页面 (pages/profile/profile.ts)
   - 打卡页面 (pages/checkin/checkin.ts)
   - 习惯详情页面 (pages/habits/detail/detail.ts)
   - 社区动态列表页 (packageCommunity/pages/index/index.js)
   - 社区挑战页面 (packageCommunity/pages/challenge/challenge.js)
   - 通知页面 (packageCommunity/pages/notifications/notifications.js)

3. 实现缺失的后端API：
   - 社区搜索API (GET /api/community/search)
   - 热门搜索词API (GET /api/community/hot-searches)
   - 热门话题API (GET /api/community/hot-topics)
   - 月度报告API (GET /api/analytics/reports/monthly)
   - 周报告API (GET /api/analytics/reports/weekly)

4. 添加API调用错误处理和降级策略：
   - 已在部分页面实现了API调用失败后使用模拟数据的备选方案
   - 建议统一处理API调用错误，提供更好的用户体验
   - 实现统一的错误处理中间件，能够自动处理常见的错误情况：
     - 网络错误：尝试重试并提示用户
     - 认证错误：自动刷新令牌或引导用户重新登录
     - 服务器错误：降级到本地数据模式
     - 资源不存在错误：提供友好的空状态UI

5. 添加API请求状态管理：
   - 实现请求状态Hook，统一管理加载状态、错误状态和数据：
     ```typescript
     function useApiRequest<T>(apiCall: () => Promise<T>, dependencies: any[] = []) {
       const [loading, setLoading] = useState(true);
       const [error, setError] = useState<Error | null>(null);
       const [data, setData] = useState<T | null>(null);
       
       useEffect(() => {
         setLoading(true);
         apiCall()
           .then(data => setData(data))
           .catch(err => setError(err))
           .finally(() => setLoading(false));
       }, dependencies);
       
       return { loading, error, data };
     }
     ```
   - 实现请求缓存机制，减少重复请求
   - 添加数据预取功能，提前加载用户可能需要的数据

6. 对整个应用进行全面测试，确保所有功能正常运作 
   - 创建API请求测试脚本，验证所有API调用
   - 添加API模拟服务，便于在不依赖后端的情况下进行测试
   - 手动测试所有页面的数据加载和交互功能 
