/**
 * 文件上传控制器
 */
const path = require('path');
const { uploadToCloud } = require('../utils/upload');
const config = require('../config');

/**
 * 上传图片
 * @route POST /api/upload/image
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未找到上传文件' });
    }
    
    
    
    // 获取文件路径
    const filePath = req.file.path;
    
    // 上传到云存储（这里是模拟）
    const fileUrl = await uploadToCloud(filePath);
    
    // 构建完整URL
    const baseUrl = config.baseUrl || `http://${req.headers.host}`;
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;
    
    
    
    res.json({
      success: true,
      url: fullUrl,
      data: {
        url: fullUrl
      }
    });
  } catch (error) {
    
    res.status(500).json({ success: false, message: '上传图片失败' });
  }
}; 
