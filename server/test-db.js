const mongoose = require('mongoose');
require('dotenv').config();

console.log('开始测试数据库连接...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const connectDB = async () => {
  try {
    console.log('正在连接数据库...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5秒超时
      connectTimeoutMS: 10000, // 10秒连接超时
    });
    
    console.log('数据库连接成功!');
    console.log('连接主机:', conn.connection.host);
    console.log('数据库名:', conn.connection.name);
    
    // 测试一个简单的操作
    const db = mongoose.connection.db;
    const admin = db.admin();
    const result = await admin.ping();
    console.log('Ping结果:', result);
    
    process.exit(0);
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

connectDB(); 
