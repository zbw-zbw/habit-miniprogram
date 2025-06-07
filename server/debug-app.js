const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('启动调试版应用...');

// 导入配置
let config;
try {
  config = require('./src/config');
  console.log('✓ 配置文件加载成功');
} catch (err) {
  console.error('✗ 配置文件加载失败:', err.message);
  process.exit(1);
}

const app = express();
const PORT = config.port;

// 基础中间件
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('✓ 基础中间件加载成功');

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '习惯打卡小程序API服务',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

console.log('✓ 基础路由设置完成');

// 尝试加载路由文件
const routesToTest = [
  './src/routes/auth.routes',
  './src/routes/user.routes',
  './src/routes/habit.routes'
];

routesToTest.forEach(routePath => {
  try {
    require(routePath);
    console.log(`✓ 路由文件存在: ${routePath}`);
  } catch (err) {
    console.log(`✗ 路由文件问题: ${routePath} - ${err.message}`);
  }
});

// 启动服务器
const startServer = async () => {
  try {
    console.log('连接数据库...');
    await mongoose.connect(config.db.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log('✓ 数据库连接成功');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ 调试服务器启动成功，端口: ${PORT}`);
      console.log(`访问: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✗ 启动失败:', err);
    process.exit(1);
  }
};

startServer(); 
