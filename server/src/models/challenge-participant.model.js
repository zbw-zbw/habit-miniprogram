/**
 * 挑战参与者模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const challengeParticipantSchema = new Schema({
  // 挑战ID
  challenge: {
    type: Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  // 参与者
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 参与状态
  status: {
    type: String,
    enum: ['joined', 'invited', 'completed', 'failed', 'withdrawn'],
    default: 'joined'
  },
  // 参与日期
  joinedAt: {
    type: Date,
    default: Date.now
  },
  // 完成情况
  progress: {
    // 已完成次数
    completedCount: {
      type: Number,
      default: 0
    },
    // 目标次数（冗余存储，便于查询）
    targetCount: {
      type: Number,
      required: true
    },
    // 当前连续打卡天数
    currentStreak: {
      type: Number,
      default: 0
    },
    // 最长连续打卡天数
    longestStreak: {
      type: Number,
      default: 0
    },
    // 最后一次打卡日期
    lastCheckinDate: {
      type: Date
    },
    // 完成率
    completionRate: {
      type: Number,
      default: 0
    }
  },
  // 已获得的奖励
  earnedRewards: {
    points: {
      type: Number,
      default: 0
    },
    badges: [{
      name: String,
      image: String,
      description: String,
      earnedAt: Date
    }]
  },
  // 排名（动态计算）
  rank: {
    type: Number
  },
  // 备注
  notes: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true });

// 索引
challengeParticipantSchema.index({ challenge: 1, user: 1 }, { unique: true });
challengeParticipantSchema.index({ challenge: 1, 'progress.completedCount': -1 });
challengeParticipantSchema.index({ user: 1, createdAt: -1 });
challengeParticipantSchema.index({ challenge: 1, status: 1 });

// 计算完成率
challengeParticipantSchema.methods.calculateCompletionRate = function() {
  if (this.progress.targetCount === 0) return 0;
  return (this.progress.completedCount / this.progress.targetCount) * 100;
};

// 更新打卡记录
challengeParticipantSchema.methods.updateCheckin = async function(isCompleted = true) {
  if (!isCompleted) return this;

  // 更新完成次数
  this.progress.completedCount += 1;
  
  const today = new Date();
  const lastDate = this.progress.lastCheckinDate;
  
  // 计算连续打卡天数
  if (lastDate) {
    const lastDay = new Date(lastDate);
    const diffTime = Math.abs(today - lastDay);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // 连续打卡
      this.progress.currentStreak += 1;
    } else if (diffDays > 1) {
      // 中断连续打卡
      this.progress.currentStreak = 1;
    }
  } else {
    // 首次打卡
    this.progress.currentStreak = 1;
  }
  
  // 更新最长连续打卡记录
  if (this.progress.currentStreak > this.progress.longestStreak) {
    this.progress.longestStreak = this.progress.currentStreak;
  }
  
  // 更新最后打卡日期
  this.progress.lastCheckinDate = today;
  
  // 计算完成率
  this.progress.completionRate = this.calculateCompletionRate();
  
  // 检查是否完成挑战
  if (this.progress.completedCount >= this.progress.targetCount) {
    this.status = 'completed';
  }
  
  return this.save();
};

const ChallengeParticipant = mongoose.model('ChallengeParticipant', challengeParticipantSchema);

module.exports = ChallengeParticipant; 
