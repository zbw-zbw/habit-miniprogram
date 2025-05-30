/**
 * 评论模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  // 评论所属的动态
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  // 评论作者
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 评论内容
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  // 回复的评论ID（如果是回复其他评论）
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  // 回复的用户ID（如果是回复其他用户）
  replyToUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // 点赞数
  likeCount: {
    type: Number,
    default: 0
  },
  // 点赞用户列表
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // 是否已删除
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// 索引
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ replyTo: 1 });

// 预处理 - 查询时排除已删除的评论
commentSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

commentSchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

// 虚拟字段 - 是否已点赞
commentSchema.virtual('isLiked').get(function() {
  if (!this._currentUserId) return false;
  return this.likes.some(userId => userId.toString() === this._currentUserId.toString());
});

// 设置当前用户ID方法（用于确定是否已点赞）
commentSchema.methods.setCurrentUserId = function(userId) {
  this._currentUserId = userId;
  return this;
};

// 转换为JSON时包含虚拟字段
commentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._currentUserId;
    return ret;
  }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment; 
