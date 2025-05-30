/**
 * 评论控制器
 */
const { validationResult } = require('express-validator');
const Comment = require('../models/comment.model');
const Post = require('../models/post.model');
const mongoose = require('mongoose');

/**
 * 获取动态评论列表
 * @route GET /api/community/posts/:postId/comments
 */
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // 检查动态是否存在
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '动态不存在'
      });
    }
    
    // 查询评论列表
    const comments = await Comment.find({ post: postId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username nickname avatar')
      .populate('replyToUser', 'username nickname');
    
    // 设置当前用户ID，用于判断是否已点赞
    comments.forEach(comment => comment.setCurrentUserId(req.user._id));
    
    // 获取总数
    const total = await Comment.countDocuments({ post: postId, isDeleted: false });
    
    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取评论列表失败'
    });
  }
};

/**
 * 创建新评论
 * @route POST /api/community/posts/:postId/comments
 */
exports.createComment = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { postId } = req.params;
    const { content, replyTo, replyToUser } = req.body;
    
    // 检查动态是否存在
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '动态不存在'
      });
    }
    
    // 如果是回复其他评论，检查被回复的评论是否存在
    if (replyTo) {
      const replyComment = await Comment.findById(replyTo);
      
      if (!replyComment || replyComment.post.toString() !== postId) {
        return res.status(404).json({
          success: false,
          message: '被回复的评论不存在'
        });
      }
    }
    
    const session = await mongoose.startSession();
    let comment;
    
    await session.withTransaction(async () => {
      // 创建新评论
      comment = new Comment({
        post: postId,
        user: req.user._id,
        content,
        replyTo,
        replyToUser
      });
      
      await comment.save({ session });
      
      // 更新动态的评论数
      post.commentCount += 1;
      await post.save({ session });
    });
    
    session.endSession();
    
    // 填充用户信息
    await comment.populate('user', 'username nickname avatar');
    if (replyToUser) {
      await comment.populate('replyToUser', 'username nickname');
    }
    
    res.status(201).json({
      success: true,
      message: '评论发布成功',
      data: comment
    });
  } catch (error) {
    console.error('创建评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建评论失败'
    });
  }
};

/**
 * 检查评论所有者
 * 中间件，用于验证请求用户是否为评论创建者
 */
exports.checkCommentOwner = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 将评论添加到请求对象中
    req.resource = comment;
    
    next();
  } catch (error) {
    console.error('检查评论所有者错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

/**
 * 更新指定评论
 * @route PUT /api/community/comments/:commentId
 */
exports.updateComment = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { content } = req.body;
    const comment = req.resource;
    
    // 更新评论内容
    comment.content = content;
    await comment.save();
    
    res.status(200).json({
      success: true,
      message: '评论更新成功',
      data: comment
    });
  } catch (error) {
    console.error('更新评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新评论失败'
    });
  }
};

/**
 * 删除指定评论
 * @route DELETE /api/community/comments/:commentId
 */
exports.deleteComment = async (req, res) => {
  try {
    const comment = req.resource;
    const session = await mongoose.startSession();
    
    await session.withTransaction(async () => {
      // 将评论标记为已删除
      comment.isDeleted = true;
      await comment.save({ session });
      
      // 更新动态的评论数
      const post = await Post.findById(comment.post);
      if (post) {
        post.commentCount = Math.max(0, post.commentCount - 1);
        await post.save({ session });
      }
    });
    
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除评论失败'
    });
  }
};

/**
 * 点赞评论
 * @route POST /api/community/comments/:commentId/like
 */
exports.likeComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 检查是否已点赞
    if (comment.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: '已经点赞过此评论'
      });
    }
    
    // 添加点赞
    comment.likes.push(userId);
    comment.likeCount = comment.likes.length;
    await comment.save();
    
    // 设置当前用户ID，用于判断是否已点赞
    comment.setCurrentUserId(userId);
    
    res.status(200).json({
      success: true,
      message: '点赞成功',
      data: {
        likeCount: comment.likeCount,
        isLiked: true
      }
    });
  } catch (error) {
    console.error('点赞评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，点赞失败'
    });
  }
};

/**
 * 取消点赞评论
 * @route POST /api/community/comments/:commentId/unlike
 */
exports.unlikeComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 检查是否已点赞
    if (!comment.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: '还没有点赞此评论'
      });
    }
    
    // 移除点赞
    comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
    comment.likeCount = comment.likes.length;
    await comment.save();
    
    // 设置当前用户ID，用于判断是否已点赞
    comment.setCurrentUserId(userId);
    
    res.status(200).json({
      success: true,
      message: '取消点赞成功',
      data: {
        likeCount: comment.likeCount,
        isLiked: false
      }
    });
  } catch (error) {
    console.error('取消点赞评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，取消点赞失败'
    });
  }
}; 
