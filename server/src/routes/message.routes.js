/**
 * 消息路由
 */
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 所有消息路由都需要登录
router.use(authMiddleware);

// 获取聊天会话列表
router.get('/sessions', messageController.getChatSessions);

// 获取聊天消息
router.get('/:targetId', messageController.getChatMessages);

// 获取新消息
router.get('/:targetId/new', messageController.getNewMessages);

// 发送消息
router.post('/send', messageController.sendMessage);

// 标记消息为已读
router.post('/:targetId/read', messageController.markAsRead);

// 删除会话
router.post('/sessions/:sessionId/delete', messageController.deleteSession);

// 调试路由 - 获取当前用户ID
router.get('/debug/user-info', (req, res) => {
  try {
    res.json({
      success: true,
      currentUser: {
        id: req.user._id,
        username: req.user.username,
        nickname: req.user.nickname
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

module.exports = router; 
