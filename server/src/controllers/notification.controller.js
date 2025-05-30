/**
 * 通知系统控制器
 */
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

/**
 * 获取通知列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query = { recipient: req.user.id };
    if (type) {
      query.type = type;
    }
    
    // 查询通知
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'username nickname avatar')
      .populate('relatedPost', 'content')
      .populate('relatedHabit', 'name')
      .populate('relatedChallenge', 'title');
    
    // 统计未读通知数量
    const unread = await Notification.countDocuments({ 
      recipient: req.user.id, 
      isRead: false 
    });
    
    // 统计通知总数
    const total = await Notification.countDocuments(query);
    
    res.status(200).json({
      notifications,
      total,
      unread
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 标记通知为已读
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: '通知已标记为已读'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 标记所有通知为已读
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({
      success: true,
      message: '所有通知已标记为已读'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除通知
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }
    
    await Notification.deleteOne({ _id: notification._id });
    
    res.status(200).json({
      success: true,
      message: '通知已删除'
    });
  } catch (error) {
    next(error);
  }
}; 
