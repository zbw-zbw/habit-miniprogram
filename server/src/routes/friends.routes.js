/**
 * 好友相关路由
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const followController = require('../controllers/follow.controller');

// 获取好友列表（关注的用户）
router.get('/', authMiddleware, followController.getFriends);

// 关注/取消关注用户
router.put('/:userId/follow', authMiddleware, followController.toggleFollow);

// 添加好友
router.post('/:userId/add', authMiddleware, followController.addFriend);

module.exports = router; 
