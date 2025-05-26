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

3. 使用微信开发者工具打开项目目录

## 设计规范

项目遵循《习惯打卡小程序设计规范》，包括色彩系统、字体规范、间距规范等，确保整体风格一致。

## 开发规范

项目遵循《习惯打卡小程序开发规范》，包括代码风格、命名规范、组件设计原则等。

## 贡献指南

欢迎提交 Issue 或 Pull Request 来帮助改进这个项目！

## 许可证

MIT 
