/**
 * 生产环境服务器启动脚本
 */
process.env.NODE_ENV = 'production';

// 启动应用
require('./src/app');
