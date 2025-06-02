/**
 * 服务器配置
 */
module.exports = {
  // 服务器基础URL，用于生成完整的资源链接
  baseUrl: process.env.BASE_URL || '',
  
  // 数据库配置
  db: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/habit-tracker'
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'habit-tracker-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // 上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
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
  }
}; 
