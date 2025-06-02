/**
 * 小组相关路由
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');
const groupController = require('../controllers/group.controller');

// 资源所有者权限中间件
const checkResourceOwner = (req, res, next) => {
  if (req.resource && req.resource.user && req.resource.user.toString() === req.user._id.toString()) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: '无权操作此资源'
  });
};

// 小组列表
router.get('/', authMiddleware, groupController.getGroups);

// 创建小组
router.post('/', [
  authMiddleware,
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('小组名称长度应在2-50字之间'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('小组描述长度应在10-1000字之间'),
  body('type').optional().isIn(['habit', 'challenge', 'topic', 'other']).withMessage('小组类型无效'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate字段必须是布尔值'),
  body('tags').optional().isArray().withMessage('标签必须是数组')
], groupController.createGroup);

// 获取小组详情
router.get('/:groupId', authMiddleware, groupController.getGroup);

// 更新小组
router.put('/:groupId', [
  authMiddleware,
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('小组名称长度应在2-50字之间'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('小组描述长度应在10-1000字之间'),
  body('type').optional().isIn(['habit', 'challenge', 'topic', 'other']).withMessage('小组类型无效'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate字段必须是布尔值'),
  body('tags').optional().isArray().withMessage('标签必须是数组')
], groupController.checkGroupOwner, checkResourceOwner, groupController.updateGroup);

// 删除小组
router.delete('/:groupId', authMiddleware, groupController.checkGroupOwner, checkResourceOwner, groupController.deleteGroup);

// 加入小组
router.post('/:groupId/join', authMiddleware, groupController.joinGroup);

// 退出小组
router.post('/:groupId/leave', authMiddleware, groupController.leaveGroup);

// 获取小组成员
router.get('/:groupId/members', authMiddleware, groupController.getGroupMembers);

// 获取小组动态
router.get('/:groupId/posts', authMiddleware, groupController.getGroupPosts);

// 解散小组
router.delete('/:groupId/dismiss', authMiddleware, groupController.checkGroupOwner, checkResourceOwner, groupController.dismissGroup);

module.exports = router; 
