/**
 * 文件上传工具
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // 根据文件类型创建不同的子目录
    let subDir = 'others';
    
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos';
    } else if (file.mimetype.startsWith('audio/')) {
      subDir = 'audios';
    }
    
    const destDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    cb(null, destDir);
  },
  filename: function(req, file, cb) {
    // 生成唯一文件名
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 创建上传中间件
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * 上传到云存储
 * @param {string} filePath 本地文件路径
 * @returns {Promise<string>} 云存储URL
 */
exports.uploadToCloud = async (filePath) => {
  // 这里应该实现实际的云存储上传逻辑
  // 目前返回本地URL作为示例
  const filename = path.basename(filePath);
  const fileType = path.extname(filePath).toLowerCase();
  let subDir = 'others';
  
  // 根据文件扩展名判断类型
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileType)) {
    subDir = 'images';
  } else if (['.mp4', '.avi', '.mov'].includes(fileType)) {
    subDir = 'videos';
  } else if (['.mp3', '.wav', '.ogg'].includes(fileType)) {
    subDir = 'audios';
  }
  
  // 返回文件URL
  return `/uploads/${subDir}/${filename}`;
};

/**
 * 删除文件
 * @param {string} fileUrl 文件URL
 * @returns {Promise<boolean>} 是否成功删除
 */
exports.deleteFile = async (fileUrl) => {
  try {
    // 从URL中提取文件路径
    const filePath = path.join(__dirname, '../..', fileUrl);
    
    // 检查文件是否存在
    if (fs.existsSync(filePath)) {
      // 删除文件
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
};

// 导出上传中间件
exports.upload = upload; 
