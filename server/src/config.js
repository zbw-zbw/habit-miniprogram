/**
 * 服务器配置
 * 支持多环境部署 - 开发、测试、生产
 */

// 获取当前环境
const env = process.env.NODE_ENV || 'development';

// 基础配置
const baseConfig = {
  // 服务器基础URL，用于生成完整的资源链接
  baseUrl: process.env.BASE_URL || '',
  
  // 服务器端口
  port: process.env.PORT || 3000,
  
  // 数据库配置
  db: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker'
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'habit-tracker-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  // 上传配置
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 默认10MB
    dir: process.env.UPLOAD_DIR || 'uploads',
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav'
    ]
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
  },
  
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// 环境特定配置
const envConfigs = {
  development: {
    // 开发环境特定配置
  },
  test: {
    // 测试环境特定配置
    db: {
      url: process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker-test'
    }
  },
  production: {
    // 生产环境特定配置
    log: {
      level: process.env.LOG_LEVEL || 'error'
    }
  }
};

// 合并配置
const config = {
  ...baseConfig,
  ...(envConfigs[env] || {})
};

// 输出当前环境信息
console.log(`服务器运行环境: ${env}`);
if (env !== 'production') {
  console.log('数据库连接: ', config.db.url);
}

module.exports = config; 
