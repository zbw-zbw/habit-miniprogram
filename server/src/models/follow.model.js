/**
 * 关注关系模型
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const followSchema = new Schema({
  // 关注者
  follower: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 被关注者
  following: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 关注状态（互相关注、单向关注）
  status: {
    type: String,
    enum: ['mutual', 'single'],
    default: 'single'
  }
}, { timestamps: true });

// 索引
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1, createdAt: -1 });
followSchema.index({ following: 1, createdAt: -1 });

// 静态方法 - 检查是否已关注
followSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({ follower: followerId, following: followingId });
  return !!follow;
};

// 静态方法 - 获取关注列表
followSchema.statics.getFollowingList = async function(userId, limit = 20, skip = 0) {
  return this.find({ follower: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('following', 'username nickname avatar');
};

// 静态方法 - 获取粉丝列表
followSchema.statics.getFollowersList = async function(userId, limit = 20, skip = 0) {
  return this.find({ following: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('follower', 'username nickname avatar');
};

// 静态方法 - 关注用户
followSchema.statics.followUser = async function(followerId, followingId) {
  // 检查是否已存在关注关系
  const existingFollow = await this.findOne({ follower: followerId, following: followingId });
  if (existingFollow) return existingFollow;

  // 检查对方是否已关注自己，如果是则设置为互相关注
  const reverseFollow = await this.findOne({ follower: followingId, following: followerId });
  const status = reverseFollow ? 'mutual' : 'single';

  // 创建新的关注关系
  const newFollow = await this.create({ follower: followerId, following: followingId, status });

  // 如果对方已关注自己，更新对方的关注状态为互相关注
  if (reverseFollow) {
    await this.findByIdAndUpdate(reverseFollow._id, { status: 'mutual' });
  }

  return newFollow;
};

// 静态方法 - 取消关注
followSchema.statics.unfollowUser = async function(followerId, followingId) {
  // 查找并删除关注关系
  const follow = await this.findOneAndDelete({ follower: followerId, following: followingId });
  if (!follow) return null;

  // 检查对方是否关注自己，如果是则更新对方的关注状态为单向关注
  const reverseFollow = await this.findOne({ follower: followingId, following: followerId });
  if (reverseFollow) {
    await this.findByIdAndUpdate(reverseFollow._id, { status: 'single' });
  }

  return follow;
};

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow; 
