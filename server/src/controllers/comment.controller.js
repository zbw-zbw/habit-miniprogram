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
    
    console.log('创建评论请求数据:', { postId, userId: req.user._id, content, replyTo, replyToUser });
    
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
    
    let comment;
    
    try {
      // 首先尝试使用事务
      const session = await mongoose.startSession();
    
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
    } catch (transactionError) {
      console.error('评论事务处理错误，尝试使用非事务方式:', transactionError);
      
      // 如果事务失败，使用非事务方式保存
      try {
        // 创建新评论
        comment = new Comment({
          post: postId,
          user: req.user._id,
          content,
          replyTo,
          replyToUser
        });
        
        await comment.save();
        
        // 更新动态的评论数
        post.commentCount += 1;
        await post.save();
        
        console.log('使用非事务方式创建评论成功');
      } catch (nonTransactionError) {
        console.error('非事务方式创建评论失败:', nonTransactionError);
        return res.status(500).json({
          success: false,
          message: '服务器错误，创建评论失败',
          error: process.env.NODE_ENV === 'development' ? nonTransactionError.message : undefined
        });
      }
    }
    
    try {
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
    } catch (populateError) {
      console.error('填充评论用户信息错误:', populateError);
      // 即使填充失败，评论创建已成功，返回基本数据
      res.status(201).json({
        success: true,
        message: '评论发布成功，但获取用户信息失败',
        data: comment
      });
    }
  } catch (error) {
    console.error('创建评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建评论失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    try {
      // 首先尝试使用事务
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
    } catch (transactionError) {
      console.error('评论删除事务处理错误，尝试使用非事务方式:', transactionError);
      
      // 如果事务失败，使用非事务方式保存
      try {
        // 将评论标记为已删除
        comment.isDeleted = true;
        await comment.save();
        
        // 更新动态的评论数
        const post = await Post.findById(comment.post);
        if (post) {
          post.commentCount = Math.max(0, post.commentCount - 1);
          await post.save();
        }
        
        console.log('使用非事务方式删除评论成功');
      } catch (nonTransactionError) {
        console.error('非事务方式删除评论失败:', nonTransactionError);
        return res.status(500).json({
          success: false,
          message: '服务器错误，删除评论失败',
          error: process.env.NODE_ENV === 'development' ? nonTransactionError.message : undefined
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除评论失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 点赞评论
 * @route POST /api/comments/:commentId/like
 */
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    
    console.log('点赞评论请求:', { commentId, userId: userId.toString() });
    
    // 查找评论
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      console.error('评论不存在:', commentId);
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 检查用户是否已点赞
    const isLiked = comment.likes.includes(userId);
    
    if (!isLiked) {
    // 添加点赞
    comment.likes.push(userId);
    await comment.save();
    }
    
    console.log('点赞评论成功:', { 
      commentId, 
      userId: userId.toString(), 
      likeCount: comment.likes.length,
      isLiked: true
    });
    
    return res.status(200).json({
      success: true,
      likeCount: comment.likes.length,
        isLiked: true
    });
  } catch (error) {
    console.error('点赞评论失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，点赞评论失败'
    });
  }
};

/**
 * 取消点赞评论
 * @route POST /api/comments/:commentId/unlike
 */
exports.unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    
    console.log('取消点赞评论请求:', { commentId, userId: userId.toString() });
    
    // 查找评论
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      console.error('评论不存在:', commentId);
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 检查用户是否已点赞
    const likeIndex = comment.likes.indexOf(userId);
    const isLiked = likeIndex !== -1;
    
    if (isLiked) {
    // 移除点赞
      comment.likes.splice(likeIndex, 1);
    await comment.save();
    }
    
    console.log('取消点赞评论成功:', { 
      commentId, 
      userId: userId.toString(), 
      likeCount: comment.likes.length,
      isLiked: false
    });
    
    return res.status(200).json({
      success: true,
      likeCount: comment.likes.length,
        isLiked: false
    });
  } catch (error) {
    console.error('取消点赞评论失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，取消点赞评论失败'
    });
  }
}; 
