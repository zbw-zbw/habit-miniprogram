/**
 * 小组控制器
 */
const Group = require('../models/group.model');
const User = require('../models/user.model');
const Post = require('../models/post.model');
const { validationResult } = require('express-validator');

/**
 * 获取小组列表
 */
exports.getGroups = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, keyword, joined, created, recommended } = req.query;
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query = {};
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // 处理关键词搜索
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } }
      ];
    }
    
    // 处理已加入的小组
    if (joined === 'true') {
      query.members = req.user._id;
    }
    
    // 处理我创建的小组
    if (created === 'true') {
      query.creator = req.user._id;
    }
    
    // 处理推荐的小组
    if (recommended === 'true') {
      // 这里可以根据用户兴趣、标签等进行推荐算法
      // 简单实现：推荐用户未加入的活跃小组
      query.members = { $ne: req.user._id };
      // 按成员数量排序
      var sortOption = { membersCount: -1 };
    } else {
      // 默认按创建时间排序
      var sortOption = { createdAt: -1 };
    }
    
    // 查询小组
    const groups = await Group.find(query)
      .populate('creator', 'nickname avatarUrl')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    // 查询总数
    const total = await Group.countDocuments(query);
    
    // 处理小组数据，添加isJoined标志
    const processedGroups = await Promise.all(groups.map(async (group) => {
      const groupObj = group.toObject();
      
      // 检查当前用户是否已加入该小组
      groupObj.isJoined = group.members.some(memberId => 
        memberId.toString() === req.user._id.toString()
      );
      
      // 检查当前用户是否是创建者
      groupObj.isCreator = group.creator && 
        group.creator._id.toString() === req.user._id.toString();
      
      return groupObj;
    }));
    
    // 返回结果
    return res.json({
      success: true,
      data: {
        groups: processedGroups,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '获取小组列表失败'
    });
  }
};

/**
 * 获取单个小组详情
 */
exports.getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId)
      .populate('creator', 'nickname avatarUrl')
      .populate('members', 'nickname avatarUrl');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '小组不存在'
      });
    }
    
    return res.json({
      success: true,
      data: group
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '获取小组详情失败'
    });
  }
};

/**
 * 创建小组
 */
exports.createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }
    
    const { name, description, isPrivate, tags, avatar, coverImage } = req.body;
    
    // 创建小组
    const group = new Group({
      name,
      description,
      isPrivate: isPrivate || false,
      tags: tags || [],
      avatar: avatar || '/assets/images/groups.png',
      coverImage: coverImage || '/assets/images/groups.png',
      creator: req.user._id,
      members: [req.user._id],
      membersCount: 1
    });
    
    await group.save();
    
    // 返回结果
    return res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '创建小组失败'
    });
  }
};

/**
 * 更新小组信息
 */
exports.updateGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        errors: errors.array()
      });
    }
    
    const { groupId } = req.params;
    const { name, description, isPrivate, tags, avatar, coverImage } = req.body;
    
    // 查找小组
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '小组不存在'
      });
    }
    
    // 检查权限
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有小组创建者可以更新小组信息'
      });
    }
    
    // 更新小组信息
    if (name) group.name = name;
    if (description) group.description = description;
    if (typeof isPrivate !== 'undefined') group.isPrivate = isPrivate;
    if (tags) group.tags = tags;
    if (avatar) group.avatar = avatar;
    if (coverImage) group.coverImage = coverImage;
    
    await group.save();
    
    // 返回结果
    return res.json({
      success: true,
      data: group
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '更新小组失败'
    });
  }
};

/**
 * 删除小组
 */
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // 查找小组
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '小组不存在'
      });
    }
    
    // 检查权限
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有小组创建者可以删除小组'
      });
    }
    
    // 删除小组
    await Group.findByIdAndDelete(groupId);
    
    // 返回结果
    return res.json({
      success: true,
      message: '小组已删除'
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '删除小组失败'
    });
  }
};

/**
 * 加入小组
 */
exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // 查找小组
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '小组不存在'
      });
    }
    
    // 检查用户是否已经是小组成员
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: '您已经是小组成员'
      });
    }
    
    // 加入小组
    group.members.push(req.user._id);
    group.membersCount = group.members.length;
    await group.save();
    
    // 返回结果
    return res.json({
      success: true,
      message: '成功加入小组'
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '加入小组失败'
    });
  }
};

/**
 * 退出小组
 */
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // 查找小组
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '小组不存在'
      });
    }
    
    // 检查用户是否是小组创建者
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '小组创建者不能退出小组'
      });
    }
    
    // 检查用户是否是小组成员
    const memberIndex = group.members.findIndex(member => member.toString() === req.user._id.toString());
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: '您不是小组成员'
      });
    }
    
    // 退出小组
    group.members.splice(memberIndex, 1);
    group.membersCount = group.members.length;
    await group.save();
    
    // 返回结果
    return res.json({
      success: true,
      message: '成功退出小组'
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '退出小组失败'
    });
  }
};

/**
 * 获取小组成员
 */
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // 查找小组
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '小组不存在'
      });
    }
    
    // 分页查询小组成员
    const members = await User.find({ _id: { $in: group.members } })
      .select('nickname avatarUrl bio')
      .skip(skip)
      .limit(parseInt(limit));
    
    // 返回结果
    return res.json({
      success: true,
      data: {
        members,
        pagination: {
          total: group.members.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(group.members.length / limit)
        }
      }
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '获取小组成员失败'
    });
  }
};

/**
 * 检查小组所有者
 */
exports.checkGroupOwner = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '小组不存在'
      });
    }
    
    // 将小组信息添加到请求对象
    req.resource = {
      user: group.creator
    };
    
    next();
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '检查小组所有者失败'
    });
  }
};

/**
 * 获取小组动态
 */
exports.getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // 查找小组
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '小组不存在'
      });
    }
    
    // 查询小组动态
    const posts = await Post.find({ group: groupId })
      .populate('user', 'nickname avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 查询总数
    const total = await Post.countDocuments({ group: groupId });
    
    // 处理点赞状态
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.includes(req.user._id);
      return postObj;
    });
    
    // 返回结果
    return res.json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '获取小组动态失败'
    });
  }
};

/**
 * 解散小组
 */
exports.dismissGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // 查找小组
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '小组不存在'
      });
    }
    
    // 检查权限
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有小组创建者可以解散小组'
      });
    }
    
    // 删除小组相关的所有动态
    await Post.deleteMany({ group: groupId });
    
    // 删除小组
    await Group.findByIdAndDelete(groupId);
    
    // 返回结果
    return res.json({
      success: true,
      message: '小组已解散'
    });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: '解散小组失败'
    });
  }
}; 
