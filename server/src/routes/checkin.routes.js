/**
 * 打卡记录相关路由
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const checkinController = require('../controllers/checkin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
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
 * @route GET /api/checkins
 * @desc 获取当前用户的所有打卡记录
 * @access Private
 */
router.get('/', authMiddleware, checkinController.getCheckins);

/**
 * @route POST /api/checkins
 * @desc 创建新打卡记录
 * @access Private
 */
router.post(
  '/',
  authMiddleware,
  [
    body('habit')
      .notEmpty()
      .withMessage('习惯ID不能为空'),
    body('date')
      .notEmpty()
      .withMessage('打卡日期不能为空')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('日期格式应为YYYY-MM-DD'),
    body('isCompleted')
      .isBoolean()
      .withMessage('完成状态必须是布尔值'),
    body('value')
      .optional()
      .isNumeric()
      .withMessage('完成值必须是数字')
  ],
  checkinController.createCheckin
);

/**
 * @route POST /api/checkins/with-media
 * @desc 创建带媒体文件的打卡记录
 * @access Private
 */
router.post(
  '/with-media',
  authMiddleware,
  upload.array('media', 5),
  [
    body('habit')
      .notEmpty()
      .withMessage('习惯ID不能为空'),
    body('date')
      .notEmpty()
      .withMessage('打卡日期不能为空')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('日期格式应为YYYY-MM-DD')
  ],
  checkinController.createCheckinWithMedia
);

/**
 * @route POST /api/checkins/with-details
 * @desc 创建打卡记录并返回详细信息（聚合API）
 * @access Private
 */
router.post(
  '/with-details',
  authMiddleware,
  [
    body('habit')
      .notEmpty()
      .withMessage('习惯ID不能为空'),
    body('date')
      .notEmpty()
      .withMessage('打卡日期不能为空')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('日期格式应为YYYY-MM-DD'),
    body('isCompleted')
      .optional()
      .isBoolean()
      .withMessage('完成状态必须是布尔值')
  ],
  checkinController.createCheckinWithDetails
);

/**
 * @route GET /api/checkins/:checkinId
 * @desc 获取指定打卡记录详情
 * @access Private
 */
router.get(
  '/:checkinId',
  authMiddleware,
  authMiddleware.isOwner('Checkin', 'checkinId'),
  checkinController.getCheckin
);

/**
 * @route PUT /api/checkins/:checkinId
 * @desc 更新指定打卡记录
 * @access Private
 */
router.put(
  '/:checkinId',
  authMiddleware,
  authMiddleware.isOwner('Checkin', 'checkinId'),
  [
    body('isCompleted')
      .optional()
      .isBoolean()
      .withMessage('完成状态必须是布尔值'),
    body('value')
      .optional()
      .isNumeric()
      .withMessage('完成值必须是数字'),
    body('note')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('笔记不能超过1000个字符'),
    body('mood')
      .optional()
      .isIn(['great', 'good', 'neutral', 'bad', 'terrible', null])
      .withMessage('无效的情绪值')
  ],
  checkinController.updateCheckin
);

/**
 * @route DELETE /api/checkins/:checkinId
 * @desc 删除指定打卡记录
 * @access Private
 */
router.delete(
  '/:checkinId',
  authMiddleware,
  authMiddleware.isOwner('Checkin', 'checkinId'),
  checkinController.deleteCheckin
);

/**
 * @route POST /api/checkins/:checkinId/media
 * @desc 为打卡记录添加媒体文件
 * @access Private
 */
router.post(
  '/:checkinId/media',
  authMiddleware,
  authMiddleware.isOwner('Checkin', 'checkinId'),
  upload.array('media', 5),
  checkinController.addCheckinMedia
);

/**
 * @route DELETE /api/checkins/:checkinId/media/:mediaId
 * @desc 删除打卡记录的媒体文件
 * @access Private
 */
router.delete(
  '/:checkinId/media/:mediaId',
  authMiddleware,
  authMiddleware.isOwner('Checkin', 'checkinId'),
  checkinController.deleteCheckinMedia
);

/**
 * @route POST /api/checkins/:checkinId/share
 * @desc 分享打卡记录到社区
 * @access Private
 */
router.post(
  '/:checkinId/share',
  authMiddleware,
  authMiddleware.isOwner('Checkin', 'checkinId'),
  checkinController.shareCheckin
);

/**
 * @route POST /api/checkins/:checkinId/unshare
 * @desc 取消分享打卡记录
 * @access Private
 */
router.post(
  '/:checkinId/unshare',
  authMiddleware,
  authMiddleware.isOwner('Checkin', 'checkinId'),
  checkinController.unshareCheckin
);

/**
 * @route GET /api/checkins/date/:date
 * @desc 获取指定日期的打卡记录
 * @access Private
 */
router.get(
  '/date/:date',
  authMiddleware,
  [
    param('date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('日期格式应为YYYY-MM-DD')
  ],
  checkinController.getCheckinsByDate
);

/**
 * @route GET /api/checkins/stats/summary
 * @desc 获取打卡统计摘要
 * @access Private
 */
router.get(
  '/stats/summary',
  authMiddleware,
  checkinController.getCheckinStatsSummary
);

module.exports = router; 
