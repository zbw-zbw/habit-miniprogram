/**
 * 用户数据模型
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 基本信息
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // 默认查询不返回密码
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unknown'],
    default: 'unknown'
  },
  
  // 微信相关信息
  openid: {
    type: String,
    unique: true,
    sparse: true
  },
  unionid: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // 统计信息
  totalHabits: {
    type: Number,
    default: 0
  },
  completedCheckins: {
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
  
  // 成就和徽章
  achievements: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    unlockedAt: Date
  }],
  
  // 设置
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      reminderTime: {
        type: String,
        default: '20:00'
      }
    },
    privacy: {
      shareData: {
        type: Boolean,
        default: true
      },
      showInRankings: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // 状态和角色
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // 时间戳
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt 字段
});

// 保存前加密密码
userSchema.pre('save', async function(next) {
  const user = this;
  
  if (!user.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 比较密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 转换为JSON时的处理
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 
