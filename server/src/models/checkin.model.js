/**
 * 打卡记录数据模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const checkinSchema = new Schema({
  // 关联的习惯
  habit: {
    type: Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  
  // 关联的用户
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 打卡日期 (YYYY-MM-DD)
  date: {
    type: String,
    required: true
  },
  
  // 是否完成
  isCompleted: {
    type: Boolean,
    default: true
  },
  
  // 完成值 (对于计数或时长类型的习惯)
  value: {
    type: Number,
    default: 1
  },
  
  // 打卡时间
  time: {
    // 开始时间
    start: {
      type: Date,
      default: Date.now
    },
    // 结束时间 (对于持续时间类型的习惯)
    end: {
      type: Date,
      default: null
    }
  },
  
  // 打卡地点
  location: {
    name: String,
    latitude: Number,
    longitude: Number
  },
  
  // 打卡笔记
  note: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // 情绪记录
  mood: {
    type: String,
    enum: ['great', 'good', 'neutral', 'bad', 'terrible', null],
    default: null
  },
  
  // 难度评价 (1-5)
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  
  // 多媒体内容
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    duration: Number // 音频或视频时长（秒）
  }],
  
  // 是否为补签
  isBackfill: {
    type: Boolean,
    default: false
  },
  
  // 是否公开到社区
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // 社区互动统计
  social: {
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// 索引
checkinSchema.index({ habit: 1, date: 1 }, { unique: true });
checkinSchema.index({ user: 1, date: 1 });
checkinSchema.index({ isPublic: 1, createdAt: -1 });

const Checkin = mongoose.model('Checkin', checkinSchema);

module.exports = Checkin; 
