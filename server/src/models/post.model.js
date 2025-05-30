/**
 * 社区动态模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  // 动态创建者
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 动态内容
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  // 媒体文件（图片、视频）
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String // 视频缩略图
  }],
  // 关联的打卡记录
  checkin: {
    type: Schema.Types.ObjectId,
    ref: 'Checkin'
  },
  // 关联的习惯
  habit: {
    type: Schema.Types.ObjectId,
    ref: 'Habit'
  },
  // 点赞数
  likeCount: {
    type: Number,
    default: 0
  },
  // 评论数
  commentCount: {
    type: Number,
    default: 0
  },
  // 点赞用户列表
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // 话题标签
  tags: [{
    type: String,
    trim: true
  }],
  // 隐私设置
  privacy: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  // 位置信息
  location: {
    name: String,
    longitude: Number,
    latitude: Number
  },
  // 是否置顶
  isPinned: {
    type: Boolean,
    default: false
  },
  // 是否已删除
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// 索引
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ likes: 1 });
postSchema.index({ isDeleted: 1, privacy: 1, createdAt: -1 });

// 预处理 - 查询时排除已删除的动态
postSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

postSchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

// 虚拟字段 - 是否已点赞
postSchema.virtual('isLiked').get(function() {
  if (!this._currentUserId) return false;
  return this.likes.some(userId => userId.toString() === this._currentUserId.toString());
});

// 设置当前用户ID方法（用于确定是否已点赞）
postSchema.methods.setCurrentUserId = function(userId) {
  this._currentUserId = userId;
  return this;
};

// 转换为JSON时包含虚拟字段
postSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._currentUserId;
    return ret;
  }
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post; 
