/**
 * 社区动态控制器
 */
const { validationResult } = require('express-validator');
const Post = require('../models/post.model');
const User = require('../models/user.model');
const Follow = require('../models/follow.model');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * 获取社区动态列表
 * @route GET /api/community/posts
 * @route GET /api/posts
 */
exports.getPosts = async (req, res) => {
  try {
    const { type = 'all', filter = 'all', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    let query = { isDeleted: false };

    // 根据过滤条件构建查询
    if (filter === 'following' || type === 'follow') {
      // 获取用户关注的人
      const following = await Follow.find({ follower: req.user._id }).select(
        'following'
      );

      const followingIds = following.map((f) => f.following);

      // 添加自己的ID，显示自己和关注的人的动态
      followingIds.push(req.user._id);

      query.user = { $in: followingIds };
    } else if (filter === 'mine' || type === 'mine') {
      // 仅显示自己的动态
      query.user = req.user._id;
    } else if (type === 'discover' || type === 'nearby' || type === 'rank') {
      // 发现/附近/排行 - 目前都显示公开动态，后续可以根据需求调整
      query.privacy = 'public';
    } else {
      // 全部公开动态
      query.privacy = 'public';
    }

    // 获取动态列表
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username nickname avatar')
      .populate('habit', 'name category icon color');

    // 设置当前用户ID，用于判断是否已点赞
    posts.forEach((post) => post.setCurrentUserId(req.user._id));

    // 获取总数
    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取动态列表失败',
    });
  }
};

/**
 * 创建新动态
 * @route POST /api/community/posts
 */
exports.createPost = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      content,
      checkinId,
      habitId,
      privacy = 'public',
      location,
      tags,
    } = req.body;

    // 处理上传的媒体文件
    const media = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const fileType = file.mimetype.startsWith('image/')
          ? 'image'
          : file.mimetype.startsWith('video/')
          ? 'video'
          : null;

        if (fileType) {
          media.push({
            type: fileType,
            url: `/uploads/${file.filename}`,
            thumbnail:
              fileType === 'video'
                ? `/uploads/thumbnails/${file.filename.replace(
                    /\.[^/.]+$/,
                    '.jpg'
                  )}`
                : null,
          });
        }
      });
    }

    // 处理标签
    let processedTags = [];
    if (tags) {
      // 如果是数组，直接使用
      if (Array.isArray(tags)) {
        processedTags = tags;
      }
      // 如果是字符串，尝试解析 JSON
      else if (typeof tags === 'string') {
        try {
          const parsedTags = JSON.parse(tags);
          if (Array.isArray(parsedTags)) {
            processedTags = parsedTags;
          } else {
            processedTags = tags.split(',').map((tag) => tag.trim());
          }
        } catch (e) {
          // 如果不是有效的 JSON，当作逗号分隔的字符串处理
          processedTags = tags.split(',').map((tag) => tag.trim());
        }
      }
    }
    // 创建新动态
    const post = new Post({
      user: req.user._id,
      content,
      media,
      checkin: checkinId,
      habit: habitId,
      privacy,
      location,
      tags: processedTags,
    });

    await post.save();

    // 填充用户信息
    await post.populate('user', 'username nickname avatar');
    if (habitId) {
      await post.populate('habit', 'name category icon color');
    }

    res.status(201).json({
      success: true,
      message: '动态发布成功',
      data: post,
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，创建动态失败',
    });
  }
};

/**
 * 检查动态所有者
 * 中间件，用于验证请求用户是否为动态创建者
 */
exports.checkPostOwner = async (req, res, next) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '动态不存在',
      });
    }

    // 将动态添加到请求对象中
    req.resource = post;

    next();
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
};

/**
 * 获取指定动态详情
 * @route GET /api/community/posts/:postId
 */
exports.getPost = async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId)
      .populate('user', 'username nickname avatar')
      .populate('habit', 'name category icon color');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '动态不存在',
      });
    }

    // 检查权限
    if (
      post.privacy !== 'public' &&
      post.user._id.toString() !== req.user._id.toString()
    ) {
      if (post.privacy === 'friends') {
        // 检查是否互相关注
        const isFollowing = await Follow.isFollowing(
          req.user._id,
          post.user._id
        );
        const isFollower = await Follow.isFollowing(
          post.user._id,
          req.user._id
        );

        if (!(isFollowing && isFollower)) {
          return res.status(403).json({
            success: false,
            message: '无权查看此动态',
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: '无权查看此动态',
        });
      }
    }

    // 设置当前用户ID，用于判断是否已点赞
    post.setCurrentUserId(req.user._id);

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，获取动态详情失败',
    });
  }
};

/**
 * 更新指定动态
 * @route PUT /api/community/posts/:postId
 */
exports.updatePost = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { content, privacy, location, tags } = req.body;

    const post = req.resource;

    // 更新动态内容
    if (content !== undefined) post.content = content;
    if (privacy !== undefined) post.privacy = privacy;
    if (location !== undefined) post.location = location;
    if (tags !== undefined)
      post.tags = tags.split(',').map((tag) => tag.trim());

    await post.save();

    res.status(200).json({
      success: true,
      message: '动态更新成功',
      data: post,
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，更新动态失败',
    });
  }
};

/**
 * 删除指定动态
 * @route DELETE /api/community/posts/:postId
 */
exports.deletePost = async (req, res) => {
  try {
    const post = req.resource;
    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      // 删除媒体文件
      if (post.media && post.media.length > 0) {
        post.media.forEach((media) => {
          const mediaPath = path.join(__dirname, '../..', media.url);
          if (fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
          }

          if (media.thumbnail) {
            const thumbnailPath = path.join(
              __dirname,
              '../..',
              media.thumbnail
            );
            if (fs.existsSync(thumbnailPath)) {
              fs.unlinkSync(thumbnailPath);
            }
          }
        });
      }

      // 将动态标记为已删除
      post.isDeleted = true;
      await post.save({ session });
    });

    session.endSession();

    res.status(200).json({
      success: true,
      message: '动态删除成功',
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，删除动态失败',
    });
  }
};

/**
 * 点赞动态
 * @route POST /api/community/posts/:postId/like
 */
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '动态不存在',
      });
    }

    // 检查是否已点赞
    if (post.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: '已经点赞过此动态',
      });
    }

    // 添加点赞
    post.likes.push(userId);
    post.likeCount = post.likes.length;
    await post.save();

    // 设置当前用户ID，用于判断是否已点赞
    post.setCurrentUserId(userId);

    res.status(200).json({
      success: true,
      message: '点赞成功',
      data: {
        likeCount: post.likeCount,
        isLiked: true,
      },
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，点赞失败',
    });
  }
};

/**
 * 取消点赞动态
 * @route POST /api/community/posts/:postId/unlike
 */
exports.unlikePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '动态不存在',
      });
    }

    // 检查是否已点赞
    if (!post.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: '还没有点赞此动态',
      });
    }

    // 移除点赞
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    post.likeCount = post.likes.length;
    await post.save();

    // 设置当前用户ID，用于判断是否已点赞
    post.setCurrentUserId(userId);

    res.status(200).json({
      success: true,
      message: '取消点赞成功',
      data: {
        likeCount: post.likeCount,
        isLiked: false,
      },
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，取消点赞失败',
    });
  }
};
