/**
 * 习惯挑战模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const challengeSchema = new Schema({
  // 挑战名称
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  // 挑战描述
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  // 挑战封面图
  coverImage: {
    type: String
  },
  // 挑战创建者
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 挑战类型（个人、团体）
  type: {
    type: String,
    enum: ['personal', 'group'],
    default: 'personal'
  },
  // 挑战目标习惯
  targetHabit: {
    name: {
      type: String,
      required: true
    },
    description: String,
    category: String,
    icon: String,
    frequency: {
      type: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'daily'
      },
      days: [Number],
      interval: Number
    }
  },
  // 挑战要求
  requirements: {
    // 目标完成次数
    targetCount: {
      type: Number,
      required: true,
      min: 1
    },
    // 连续打卡要求
    requireStreak: {
      type: Boolean,
      default: false
    },
    // 最低连续天数
    minStreakDays: {
      type: Number,
      default: 0
    }
  },
  // 挑战日期范围
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  // 挑战奖励
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    badges: [{
      name: String,
      image: String,
      description: String
    }],
    customReward: String
  },
  // 隐私设置
  privacy: {
    type: String,
    enum: ['public', 'private', 'invitation'],
    default: 'public'
  },
  // 挑战状态
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  // 参与人数上限（0表示无限制）
  maxParticipants: {
    type: Number,
    default: 0
  },
  // 当前参与人数
  participantCount: {
    type: Number,
    default: 0
  },
  // 是否官方挑战
  isOfficial: {
    type: Boolean,
    default: false
  },
  // 是否精选挑战
  isFeatured: {
    type: Boolean,
    default: false
  },
  // 话题标签
  tags: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

// 索引
challengeSchema.index({ creator: 1 });
challengeSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
challengeSchema.index({ status: 1, privacy: 1, isOfficial: 1, isFeatured: 1 });
challengeSchema.index({ tags: 1 });

// 自动更新挑战状态
challengeSchema.pre('find', async function() {
  const now = new Date();
  
  // 将到达开始日期的挑战更新为进行中
  await this.model.updateMany({
    status: 'upcoming',
    'dateRange.startDate': { $lte: now }
  }, {
    status: 'active'
  });
  
  // 将超过结束日期的挑战更新为已完成
  await this.model.updateMany({
    status: 'active',
    'dateRange.endDate': { $lt: now }
  }, {
    status: 'completed'
  });
});

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge; 
