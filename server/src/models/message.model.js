/**
 * 消息模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  // 会话ID
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  
  // 发送者ID
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 接收者ID
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 消息类型: text, image, voice, location
  type: {
    type: String,
    enum: ['text', 'image', 'voice', 'location'],
    default: 'text'
  },
  
  // 消息内容
  content: {
    type: String,
    required: true
  },
  
  // 是否已读
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema); 
