/**
 * 通知模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  // 通知接收者
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 通知发送者
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // 通知类型
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'challenge', 'system'],
    required: true
  },
  // 通知内容
  content: {
    type: String,
    required: true
  },
  // 是否已读
  isRead: {
    type: Boolean,
    default: false
  },
  // 相关联的动态
  relatedPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  // 相关联的习惯
  relatedHabit: {
    type: Schema.Types.ObjectId,
    ref: 'Habit'
  },
  // 相关联的挑战
  relatedChallenge: {
    type: Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  // 额外数据
  data: {
    type: Object
  }
}, {
  timestamps: true
});

// 索引
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 
