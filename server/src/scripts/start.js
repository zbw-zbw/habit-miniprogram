/**
 * 服务启动脚本
 * 
 * 此脚本用于启动后端服务
 * 运行方式：node src/scripts/start.js
 */

const app = require('../app');
require('dotenv').config();

// 获取端口
const PORT = process.env.PORT || 3002;

// 启动服务器
app.listen(PORT, () => {
  console.log(`
  ================================================
  习惯打卡小程序后端服务已启动
  服务运行在: http://localhost:${PORT}
  环境: ${process.env.NODE_ENV || 'development'}
  ================================================
  `);
}); 
