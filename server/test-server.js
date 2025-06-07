const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('启动最小化测试服务器...');

const app = express();
const PORT = process.env.PORT || 3000;

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '最小化测试服务器运行中',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const startServer = async () => {
  try {
    console.log('连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log('数据库连接成功');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`测试服务器启动成功，端口: ${PORT}`);
      console.log(`访问: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
};

startServer(); 
