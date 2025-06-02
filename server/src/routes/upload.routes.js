/**
 * 文件上传路由
 */
const express = require('express');
const router = express.Router();
const { upload } = require('../utils/upload');
const uploadController = require('../controllers/upload.controller');
const auth = require('../middlewares/auth.middleware');

/**
 * @route POST /api/upload/image
 * @desc 上传图片
 * @access 需要登录
 */
router.post('/image', auth, upload.single('file'), uploadController.uploadImage);

module.exports = router; 
