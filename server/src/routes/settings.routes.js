/**
 * 设置系统路由
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const settingsController = require('../controllers/settings.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

// 所有设置路由都需要认证
router.use(authMiddleware);

/**
 * @route GET /api/settings
 * @description 获取用户设置
 * @access Private
 */
router.get('/', settingsController.getSettings);

/**
 * @route PUT /api/settings
 * @description 更新用户设置
 * @access Private
 */
router.put('/', [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('主题类型无效'),
  body('language')
    .optional()
    .isIn(['zh_CN', 'en_US'])
    .withMessage('语言类型无效'),
  body('notification')
    .optional()
    .isBoolean()
    .withMessage('通知设置必须是布尔值'),
  body('sound')
    .optional()
    .isBoolean()
    .withMessage('声音设置必须是布尔值'),
  body('vibration')
    .optional()
    .isBoolean()
    .withMessage('振动设置必须是布尔值'),
  validationMiddleware
], settingsController.updateSettings);

module.exports = router; 
