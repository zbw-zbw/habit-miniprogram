/**
 * 通知系统路由
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

// 所有通知路由都需要认证
router.use(authMiddleware);

/**
 * @route GET /api/notifications
 * @description 获取通知列表
 * @access Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @description 标记通知为已读
 * @access Private
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route PUT /api/notifications/read-all
 * @description 标记所有通知为已读
 * @access Private
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @description 删除通知
 * @access Private
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 
