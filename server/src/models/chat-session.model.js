/**
 * 聊天会话模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSessionSchema = new Schema({
  // 用户1
  user1: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 用户2
  user2: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 创建复合索引，确保会话唯一性
ChatSessionSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('ChatSession', ChatSessionSchema); 
