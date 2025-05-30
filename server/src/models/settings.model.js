/**
 * 用户设置模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const settingsSchema = new Schema({
  // 用户引用
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // 主题设置
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  // 语言设置
  language: {
    type: String,
    enum: ['zh_CN', 'en_US'],
    default: 'zh_CN'
  },
  // 通知设置
  notification: {
    type: Boolean,
    default: true
  },
  // 声音设置
  sound: {
    type: Boolean,
    default: true
  },
  // 振动设置
  vibration: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema); 
