/**
 * 习惯模板数据模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const habitTemplateSchema = new Schema({
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
  
  // 创建者（可以是系统或用户）
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // 是否为系统模板
  isSystem: {
    type: Boolean,
    default: false
  },
  
  // 默认频率设置
  defaultFrequency: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      required: true,
      default: 'daily'
    },
    days: [Number],
    interval: Number
  },
  
  // 默认目标设置
  defaultGoal: {
    type: {
      type: String,
      enum: ['completion', 'duration', 'count'],
      default: 'completion'
    },
    value: {
      type: Number,
      default: 1
    },
    unit: {
      type: String,
      default: '次'
    }
  },
  
  // 默认时间设置
  defaultTimeSettings: {
    hasTime: {
      type: Boolean,
      default: false
    },
    startTime: String,
    endTime: String,
    reminderTime: String
  },
  
  // 科学依据
  scientificBasis: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // 预期效果
  expectedOutcomes: [String],
  
  // 建议步骤
  suggestedSteps: [{
    order: Number,
    description: String
  }],
  
  // 常见问题
  faqs: [{
    question: String,
    answer: String
  }],
  
  // 相关资源
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['article', 'video', 'book', 'app', 'other']
    },
    url: String
  }],
  
  // 使用统计
  stats: {
    usageCount: {
      type: Number,
      default: 0
    },
    averageCompletionRate: {
      type: Number,
      default: 0
    },
    averageStreak: {
      type: Number,
      default: 0
    }
  },
  
  // 标签
  tags: [String],
  
  // 难度级别 (1-5)
  difficultyLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // 估计养成时间（天）
  estimatedFormationDays: {
    type: Number,
    default: 21
  },
  
  // 是否公开
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // 是否为精选
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 索引
habitTemplateSchema.index({ category: 1 });
habitTemplateSchema.index({ isSystem: 1 });
habitTemplateSchema.index({ tags: 1 });
habitTemplateSchema.index({ isFeatured: 1 });

const HabitTemplate = mongoose.model('HabitTemplate', habitTemplateSchema);

module.exports = HabitTemplate; 
