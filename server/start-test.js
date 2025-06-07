/**
 * 测试环境服务器启动脚本
 */
process.env.NODE_ENV = 'test';

// 启动应用
require('./src/app');
