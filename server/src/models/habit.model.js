/**
 * 习惯数据模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const habitSchema = new Schema({
  // 基本信息
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['health', 'learning', 'work', 'social', 'finance', 'other'],
    default: 'other'
  },
  icon: {
    type: String,
    default: 'default'
  },
  color: {
    type: String,
    default: '#4F7CFF'
  },
  
  // 所属用户
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 习惯频率设置
  frequency: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom', 'weekends', 'workdays'],
      required: true
    },
    // 对于weekly，表示星期几 [1-7]，对于monthly，表示每月几号 [1-31]
    days: [Number],
    // 对于custom，表示每隔几天
    interval: Number
  },
  
  // 目标设置
  goal: {
    type: {
      type: String,
      enum: ['completion', 'duration', 'count'],
      default: 'completion'
    },
    // 对于duration，表示分钟数；对于count，表示次数
    value: {
      type: Number,
      default: 1
    },
    // 单位
    unit: {
      type: String,
      default: '次'
    }
  },
  
  // 时间设置
  timeSettings: {
    // 是否有特定时间
    hasTime: {
      type: Boolean,
      default: false
    },
    // 开始时间 (HH:mm)
    startTime: String,
    // 结束时间 (HH:mm)
    endTime: String,
    // 提醒时间 (HH:mm)
    reminderTime: String
  },
  
  // 日期范围
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  
  // 统计数据
  stats: {
    totalDays: {
      type: Number,
      default: 0
    },
    completedDays: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastCompletedDate: {
      type: Date,
      default: null
    }
  },
  
  // 高级设置
  advanced: {
    // 是否公开
    isPublic: {
      type: Boolean,
      default: false
    },
    // 是否允许补签
    allowBackfill: {
      type: Boolean,
      default: true
    },
    // 是否启用提醒
    reminderEnabled: {
      type: Boolean,
      default: true
    },
    // 是否为模板创建
    isFromTemplate: {
      type: Boolean,
      default: false
    },
    // 模板ID (如果是从模板创建)
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'HabitTemplate',
      default: null
    }
  },
  
  // 习惯链设置
  chain: {
    // 前置习惯
    previous: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      default: null
    },
    // 后续习惯
    next: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      default: null
    }
  },
  
  // 是否归档
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 索引
habitSchema.index({ user: 1, name: 1 }, { unique: true });
habitSchema.index({ user: 1, category: 1 });
habitSchema.index({ "advanced.isPublic": 1 });

// 虚拟字段：完成率
habitSchema.virtual('completionRate').get(function() {
  if (this.stats.totalDays === 0) return 0;
  return (this.stats.completedDays / this.stats.totalDays) * 100;
});

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit; 
