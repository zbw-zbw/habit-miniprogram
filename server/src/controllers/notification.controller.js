/**
 * 通知系统控制器
 */
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

/**
 * 获取通知列表
 * @route GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const userId = req.user._id;
    
    const query = { recipient: userId };
    
    // 根据类型筛选
    if (type && ['system', 'follow', 'like', 'comment', 'challenge', 'habit'].includes(type)) {
      query.type = type;
    }
    
    // 查询通知总数
    const total = await Notification.countDocuments(query);
    
    // 查询通知列表
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'username nickname avatar')
      .populate('relatedPost', 'content images')
      .populate('relatedChallenge', 'name image')
      .populate('relatedHabit', 'name icon');
    
    // 计算未读通知数量
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });
    
    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('获取通知列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取通知列表失败'
    });
  }
};

/**
 * 标记通知为已读
 * @route PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    
    // 查找并更新通知
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在或无权操作'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '已标记为已读',
      data: notification
    });
  } catch (error) {
    console.error('标记通知已读错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，标记通知已读失败'
    });
  }
};

/**
 * 标记所有通知为已读
 * @route PUT /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.body;
    
    const query = { recipient: userId, isRead: false };
    
    // 根据类型筛选
    if (type && ['system', 'follow', 'like', 'comment', 'challenge', 'habit'].includes(type)) {
      query.type = type;
    }
    
    // 更新所有未读通知
    const result = await Notification.updateMany(
      query,
      { isRead: true }
    );
    
    res.status(200).json({
      success: true,
      message: '已全部标记为已读',
      data: {
        modifiedCount: result.nModified || result.modifiedCount
      }
    });
  } catch (error) {
    console.error('标记所有通知已读错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，标记所有通知已读失败'
    });
  }
};

/**
 * 删除通知
 * @route DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    
    // 查找并删除通知
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在或无权操作'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '通知已删除'
    });
  } catch (error) {
    console.error('删除通知错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除通知失败'
    });
  }
};

/**
 * 创建通知（内部方法，不暴露为API）
 * @param {Object} notificationData 通知数据
 * @returns {Promise<Object>} 创建的通知对象
 */
exports.createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('创建通知错误:', error);
    throw error;
  }
}; 
