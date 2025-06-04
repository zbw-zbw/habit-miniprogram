/**
 * 媒体文件上传相关路由
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middlewares/auth.middleware');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|mp3|wav/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (ext && mimetype) {
      return cb(null, true);
    }
    
    cb(new Error('不支持的文件类型'));
  }
});

/**
 * @route POST /api/media/upload
 * @desc 上传媒体文件
 * @access Private
 */
router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '未提供有效的媒体文件'
        });
      }

      // 处理上传的文件
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' :
                     req.file.mimetype.startsWith('video/') ? 'video' :
                     req.file.mimetype.startsWith('audio/') ? 'audio' : null;
      
      if (!fileType) {
        return res.status(400).json({
          success: false,
          message: '不支持的文件类型'
        });
      }

      // 返回文件URL
      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        url: `/uploads/${req.file.filename}`,
        type: fileType,
        filename: req.file.filename
      });
    } catch (error) {
      
      res.status(500).json({
        success: false,
        message: '服务器错误，文件上传失败'
      });
    }
  }
);

/**
 * @route POST /api/media/uploads
 * @desc 上传多个媒体文件
 * @access Private
 */
router.post(
  '/uploads',
  authMiddleware,
  upload.array('files', 9),
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '未提供有效的媒体文件'
        });
      }

      // 处理上传的多个文件
      const fileUrls = req.files.map(file => {
        const fileType = file.mimetype.startsWith('image/') ? 'image' :
                       file.mimetype.startsWith('video/') ? 'video' :
                       file.mimetype.startsWith('audio/') ? 'audio' : null;

        return {
          url: `/uploads/${file.filename}`,
          type: fileType,
          filename: file.filename
        };
      });

      // 返回文件URL数组
      res.status(200).json({
        success: true,
        message: '文件上传成功',
        files: fileUrls
      });
    } catch (error) {
      
      res.status(500).json({
        success: false,
        message: '服务器错误，文件上传失败'
      });
    }
  }
);

module.exports = router; 
