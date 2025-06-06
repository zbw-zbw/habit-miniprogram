/**
 * 关注控制器
 */
const Follow = require('../models/follow.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

/**
 * 获取当前用户的关注列表
 * @route GET /api/community/users/following
 */
exports.getFollowing = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // 获取关注列表
    const follows = await Follow.find({ follower: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('following', 'username nickname avatar');
    
    // 提取关注的用户列表
    const following = follows.map(f => f.following);
    
    // 获取总数
    const total = await Follow.countDocuments({ follower: req.user._id });
    
    res.status(200).json({
      success: true,
      data: {
        following,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取关注列表失败'
    });
  }
};

/**
 * 获取当前用户的粉丝列表
 * @route GET /api/community/users/followers
 */
exports.getFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // 获取粉丝列表
    const follows = await Follow.find({ following: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('follower', 'username nickname avatar');
    
    // 提取粉丝用户列表
    const followers = follows.map(f => f.follower);
    
    // 获取总数
    const total = await Follow.countDocuments({ following: req.user._id });
    
    res.status(200).json({
      success: true,
      data: {
        followers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取粉丝列表失败'
    });
  }
};

/**
 * 关注用户
 * @route POST /api/community/users/:userId/follow
 */
exports.followUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;
    
    // 检查是否关注自己
    if (followerId.toString() === followingId) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }
    
    // 检查被关注用户是否存在
    const followingUser = await User.findById(followingId);
    
    if (!followingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查是否已关注
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId
    });
    
    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: '已经关注此用户'
      });
    }
    
    // 使用事务进行关注操作
    const session = await mongoose.startSession();
    let follow;
    
    await session.withTransaction(async () => {
      // 创建关注关系
      follow = await Follow.followUser(followerId, followingId);
    });
    
    session.endSession();
    
    // 填充用户信息
    await follow.populate('following', 'username nickname avatar');
    
    res.status(200).json({
      success: true,
      message: '关注成功',
      data: {
        status: follow.status,
        following: follow.following
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，关注失败'
    });
  }
};

/**
 * 取消关注用户
 * @route POST /api/community/users/:userId/unfollow
 */
exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;
    
    // 检查是否关注自己
    if (followerId.toString() === followingId) {
      return res.status(400).json({
        success: false,
        message: '不能取消关注自己'
      });
    }
    
    // 使用事务进行取消关注操作
    const session = await mongoose.startSession();
    
    await session.withTransaction(async () => {
      // 取消关注关系
      const follow = await Follow.unfollowUser(followerId, followingId);
      
      if (!follow) {
        throw new Error('未关注此用户');
      }
    });
    
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: '取消关注成功'
    });
  } catch (error) {
    
    
    // 处理特定错误
    if (error.message === '未关注此用户') {
      return res.status(400).json({
        success: false,
        message: '未关注此用户'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误，取消关注失败'
    });
  }
};

/**
 * 获取指定用户的关注列表
 * @route GET /api/community/users/:userId/following
 */
exports.getUserFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // 检查用户是否存在
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查隐私设置（根据需要实现）
    
    // 获取关注列表
    const follows = await Follow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('following', 'username nickname avatar');
    
    // 提取关注的用户列表
    const following = follows.map(f => f.following);
    
    // 获取总数
    const total = await Follow.countDocuments({ follower: userId });
    
    res.status(200).json({
      success: true,
      data: {
        following,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取关注列表失败'
    });
  }
};

/**
 * 获取指定用户的粉丝列表
 * @route GET /api/community/users/:userId/followers
 */
exports.getUserFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // 检查用户是否存在
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查隐私设置（根据需要实现）
    
    // 获取粉丝列表
    const follows = await Follow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('follower', 'username nickname avatar');
    
    // 提取粉丝用户列表
    const followers = follows.map(f => f.follower);
    
    // 获取总数
    const total = await Follow.countDocuments({ following: userId });
    
    res.status(200).json({
      success: true,
      data: {
        followers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取粉丝列表失败'
    });
  }
};

/**
 * 获取好友列表（关注的用户）
 * @route GET /api/friends
 */
exports.getFriends = async (req, res) => {
  try {
    // 获取关注列表
    const follows = await Follow.find({ follower: req.user._id })
      .sort({ createdAt: -1 })
      .populate('following', 'username nickname avatar');
    
    // 提取关注的用户列表
    const friends = follows.map(f => ({
      _id: f.following._id,
      username: f.following.username,
      nickname: f.following.nickname,
      avatar: f.following.avatar,
      followedAt: f.createdAt
    }));
    
    res.status(200).json({
      success: true,
      data: friends
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取好友列表失败'
    });
  }
};

/**
 * 关注/取消关注用户
 * @route PUT /api/friends/:userId/follow
 */
exports.toggleFollow = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;
    const { isFollow } = req.body;
    
    // 检查是否关注自己
    if (followerId.toString() === followingId) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }
    
    // 检查被关注用户是否存在
    const followingUser = await User.findById(followingId);
    
    if (!followingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 使用事务进行关注/取消关注操作
    const session = await mongoose.startSession();
    let result;
    
    await session.withTransaction(async () => {
      if (isFollow) {
        // 检查是否已关注
        const existingFollow = await Follow.findOne({
          follower: followerId,
          following: followingId
        });
        
        if (existingFollow) {
          result = { 
            success: true, 
            message: '已经关注此用户',
            isFollowing: true
          };
          return;
        }
        
        // 创建关注关系
        const follow = await Follow.followUser(followerId, followingId);
        result = { 
          success: true, 
          message: '关注成功',
          isFollowing: true
        };
      } else {
        // 取消关注
        const follow = await Follow.unfollowUser(followerId, followingId);
        
        if (!follow) {
          result = { 
            success: true, 
            message: '未关注此用户',
            isFollowing: false
          };
          return;
        }
        
        result = { 
          success: true, 
          message: '取消关注成功',
          isFollowing: false
        };
      }
    });
    
    session.endSession();
    
    res.status(200).json(result);
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，操作失败'
    });
  }
}; 

/**
 * 获取推荐用户
 * @route GET /api/community/recommend-users
 */
exports.getRecommendUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // 查询当前用户已关注的用户ID列表
    const following = await Follow.find({ follower: currentUserId }).select('following');
    const followingIds = following.map(f => f.following);
    
    // 添加当前用户ID到排除列表
    const excludeIds = [...followingIds, currentUserId];
    
    // 查询最近活跃的用户（不包括已关注的用户和自己）
    const users = await User.find({ 
      _id: { $nin: excludeIds },
      isActive: true
    })
    .sort({ lastLogin: -1 })
    .limit(10)
    .select('username nickname avatar bio');
    
    // 处理用户数据，添加isFriend标记
    const processedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      isFriend: false
    }));
    
    res.status(200).json({
      success: true,
      data: processedUsers
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取推荐用户失败'
    });
  }
};

/**
 * 搜索用户
 * @route GET /api/community/search/users
 */
exports.searchUsers = async (req, res) => {
  try {
    const { keyword } = req.query;
    const currentUserId = req.user._id;
    
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }
    
    // 查询当前用户已关注的用户ID列表
    const following = await Follow.find({ follower: currentUserId }).select('following');
    const followingIds = following.map(f => f.following.toString());
    
    // 根据关键词搜索用户
    const users = await User.find({
      $or: [
        { username: { $regex: keyword, $options: 'i' } },
        { nickname: { $regex: keyword, $options: 'i' } }
      ],
      isActive: true
    })
    .limit(20)
    .select('username nickname avatar bio');
    
    // 处理用户数据，添加isFriend标记
    const processedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      isFriend: followingIds.includes(user._id.toString())
    }));
    
    res.status(200).json({
      success: true,
      data: processedUsers
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，搜索用户失败'
    });
  }
}; 

/**
 * 添加好友（本质上是关注用户）
 * @route POST /api/friends/:userId/add
 */
exports.addFriend = async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;
    
    // 检查是否添加自己
    if (followerId.toString() === followingId) {
      return res.status(400).json({
        success: false,
        message: '不能添加自己为好友'
      });
    }
    
    // 检查被添加用户是否存在
    const followingUser = await User.findById(followingId);
    
    if (!followingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查是否已经是好友
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId
    });
    
    if (existingFollow) {
      return res.status(200).json({
        success: true,
        message: '已经是好友',
        isFollowing: true
      });
    }
    
    // 使用事务进行添加好友操作
    const session = await mongoose.startSession();
    let follow;
    
    await session.withTransaction(async () => {
      // 创建关注关系
      follow = await Follow.followUser(followerId, followingId);
    });
    
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: '添加好友成功',
      isFollowing: true
    });
  } catch (error) {
    console.error('添加好友失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，添加好友失败'
    });
  }
}; 
