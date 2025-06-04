/**
 * 社区搜索控制器
 */
const Post = require('../models/post.model');
const User = require('../models/user.model');
const Group = require('../models/group.model');
const Challenge = require('../models/challenge.model');
const Follow = require('../models/follow.model');

/**
 * 综合搜索
 * @route GET /api/community/search
 */
exports.search = async (req, res) => {
  try {
    const { keyword, type = 'all', page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }
    
    const skip = (page - 1) * limit;
    const searchResults = { posts: [], users: [], challenges: [], groups: [] };
    
    // 获取用户关注的用户ID列表
    const following = await Follow.find({ follower: userId }).select('following');
    const followingIds = following.map(f => f.following.toString());
    
    // 根据类型执行相应的搜索
    if (type === 'all' || type === 'posts') {
      // 搜索动态
      const posts = await Post.find({
        $or: [
          { content: { $regex: keyword, $options: 'i' } },
          { tags: { $in: [new RegExp(keyword, 'i')] } }
        ],
        privacy: 'public' // 只搜索公开动态
      })
      .sort({ createdAt: -1 })
      .skip(type === 'posts' ? skip : 0)
      .limit(type === 'posts' ? parseInt(limit) : 5)
      .populate('user', 'username nickname avatar');
      
      searchResults.posts = posts.map(post => ({
        id: post._id,
        content: post.content,
        images: post.images,
        createdAt: post.createdAt,
        likes: post.likeCount || 0,
        comments: post.commentCount || 0,
        user: {
          id: post.user._id,
          username: post.user.username,
          nickname: post.user.nickname,
          avatar: post.user.avatar
        }
      }));
    }
    
    if (type === 'all' || type === 'users') {
      // 搜索用户
      const users = await User.find({
        $or: [
          { username: { $regex: keyword, $options: 'i' } },
          { nickname: { $regex: keyword, $options: 'i' } },
          { bio: { $regex: keyword, $options: 'i' } }
        ],
        isActive: true
      })
      .sort({ lastLogin: -1 })
      .skip(type === 'users' ? skip : 0)
      .limit(type === 'users' ? parseInt(limit) : 5)
      .select('username nickname avatar bio');
      
      searchResults.users = users.map(user => ({
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio,
        isFollowing: followingIds.includes(user._id.toString())
      }));
    }
    
    if (type === 'all' || type === 'challenges') {
      // 搜索挑战
      const challenges = await Challenge.find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { tags: { $in: [new RegExp(keyword, 'i')] } }
        ],
        status: { $ne: 'cancelled' } // 不包括已取消的挑战
      })
      .sort({ createdAt: -1 })
      .skip(type === 'challenges' ? skip : 0)
      .limit(type === 'challenges' ? parseInt(limit) : 5)
      .populate('creator', 'username nickname avatar');
      
      searchResults.challenges = challenges.map(challenge => ({
        id: challenge._id,
        name: challenge.name,
        description: challenge.description,
        image: challenge.image,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        participantsCount: challenge.participantsCount || 0,
        creator: {
          id: challenge.creator._id,
          username: challenge.creator.username,
          nickname: challenge.creator.nickname,
          avatar: challenge.creator.avatar
        }
      }));
    }
    
    if (type === 'all' || type === 'groups') {
      // 搜索小组
      const groups = await Group.find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { tags: { $in: [new RegExp(keyword, 'i')] } }
        ],
        isPrivate: false // 只搜索公开小组
      })
      .sort({ createdAt: -1 })
      .skip(type === 'groups' ? skip : 0)
      .limit(type === 'groups' ? parseInt(limit) : 5)
      .populate('creator', 'username nickname avatar');
      
      searchResults.groups = groups.map(group => ({
        id: group._id,
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        membersCount: group.membersCount || 0,
        creator: {
          id: group.creator._id,
          username: group.creator.username,
          nickname: group.creator.nickname,
          avatar: group.creator.avatar
        }
      }));
    }
    
    // 返回搜索结果
    res.status(200).json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，搜索失败'
    });
  }
};

/**
 * 获取热门搜索词
 * @route GET /api/community/hot-searches
 */
exports.getHotSearches = async (req, res) => {
  try {
    // 这里可以根据实际需求从数据库获取热门搜索词
    // 为了演示，返回一些固定的热门搜索词
    const hotSearches = [
      '健身打卡',
      '早起习惯',
      '阅读挑战',
      '冥想',
      '学习英语',
      '每日喝水',
      '跑步',
      '饮食记录',
      '写作'
    ];
    
    res.status(200).json({
      success: true,
      data: hotSearches
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取热门搜索词失败'
    });
  }
};

/**
 * 获取热门话题
 * @route GET /api/community/hot-topics
 */
exports.getHotTopics = async (req, res) => {
  try {
    // 这里可以根据实际需求从数据库获取热门话题
    // 为了演示，返回一些固定的热门话题
    const hotTopics = [
      {
        id: 'topic1',
        name: '健身打卡',
        count: 1234,
        isTrending: true
      },
      {
        id: 'topic2',
        name: '早起习惯',
        count: 896,
        isTrending: true
      },
      {
        id: 'topic3',
        name: '阅读挑战',
        count: 756,
        isTrending: false
      },
      {
        id: 'topic4',
        name: '冥想',
        count: 543,
        isTrending: true
      },
      {
        id: 'topic5',
        name: '学习英语',
        count: 432,
        isTrending: false
      }
    ];
    
    res.status(200).json({
      success: true,
      data: hotTopics
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取热门话题失败'
    });
  }
}; 
