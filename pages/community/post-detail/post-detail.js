/**
 * pages/community/post-detail/post-detail.js
 * 社区动态详情页面
 */
import { communityAPI } from '../../../services/api';
const utils = require('../../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    postId: null,
    post: null,
    comments: [],
    loading: true,
    loadingComments: false,
    commentContent: '',
    focusComment: false,
    showEmojiPanel: false,
    replyTo: null,
    commentPage: 1,
    commentLimit: 10,
    hasMoreComments: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({
        postId: options.id
      });
      
      // 加载动态详情数据
      this.loadPostData(options.id);
      
      // 加载评论数据
      this.loadComments(options.id);
      
      // 如果传入了focus=comment参数，自动聚焦评论框
      if (options.focus === 'comment') {
        this.setData({
          focusComment: true
        });
      }
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error',
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    }
  },
  
  /**
   * 加载动态详情数据
   */
  loadPostData(postId) {
    this.setData({ loading: true });
    
    communityAPI.getPost(postId)
      .then(post => {
        // 格式化时间
        if (post.createdAt) {
          post.createdAt = utils.formatRelativeTime(post.createdAt);
        }
        
        // 确保点赞数和评论数正确
        post.likes = post.likeCount || 0;
        post.comments = post.commentCount || 0;
        
        // 确保用户信息字段统一
        if (post.user) {
          post.userName = post.user.nickname || post.user.username;
          post.userAvatar = post.user.avatar;
          post.userId = post.user.id;
        }
        
        
        
        this.setData({ 
          post,
          loading: false
        });
      })
      .catch(error => {
        
        
        wx.showToast({
          title: '获取动态详情失败',
          icon: 'none'
        });
        
        this.setData({ loading: false });
      });
  },
  
  /**
   * 加载评论数据
   */
  loadComments(postId, loadMore = false) {
    // 如果没有更多评论，直接返回
    if (!this.data.hasMoreComments && loadMore) {
      return;
    }
    
    const params = {
      page: loadMore ? this.data.commentPage + 1 : 1,
      pageSize: this.data.commentLimit
    };
    
    this.setData({ loadingComments: true });
    
    communityAPI.getComments(postId, params)
      .then(result => {
        const { comments, pagination } = result;
        
        // 格式化评论时间并标准化字段
        comments.forEach(comment => {
          // 格式化时间
          if (comment.createdAt) {
            comment.createdAt = utils.formatRelativeTime(comment.createdAt);
          }
          
          // 确保用户信息字段统一
          if (comment.user) {
            comment.userName = comment.user.nickname || comment.user.username;
            comment.userAvatar = comment.user.avatar;
            comment.userId = comment.user.id;
          }
          
          // 确保点赞数据正确
          comment.likes = comment.likeCount || comment.likes?.length || 0;
          
          // 格式化回复时间
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
              // 格式化时间
              if (reply.createdAt) {
                reply.createdAt = utils.formatRelativeTime(reply.createdAt);
              }
              
              // 确保用户信息字段统一
              if (reply.user) {
                reply.userName = reply.user.nickname || reply.user.username;
                reply.userAvatar = reply.user.avatar;
                reply.userId = reply.user.id;
              }
              
              // 确保回复目标信息字段统一
              if (reply.replyToUser) {
                reply.replyTo = reply.replyToUser.nickname || reply.replyToUser.username;
                reply.replyToId = reply.replyToUser.id;
              }
              
              // 确保回复有正确的ID
              if (!reply.id && reply._id) {
                reply.id = reply._id;
              }
              
              // 确保点赞数据正确
              reply.likes = reply.likeCount || reply.likes?.length || 0;
              
              
            });
          }
        });
        
        this.setData({
          comments: loadMore ? [...this.data.comments, ...comments] : comments,
          commentPage: params.page,
          hasMoreComments: params.page < pagination.pages,
          loadingComments: false
        });
      })
      .catch(error => {
        
        
        wx.showToast({
          title: '获取评论失败',
          icon: 'none'
        });
        
        this.setData({ loadingComments: false });
      });
  },
  
  /**
   * 聚焦评论输入框
   */
  focusCommentInput() {
    this.setData({
      focusComment: true,
      replyTo: null,
      commentContent: ''
    });
  },
  
  /**
   * 点赞动态
   */
  likePost(e) {
    const post = this.data.post;
    const apiCall = post.isLiked 
      ? communityAPI.unlikePost(post.id)
      : communityAPI.likePost(post.id);
    
    apiCall
      .then(result => {
        // 处理嵌套的数据结构
        const responseData = result.data || result;
        const likeCount = responseData.likeCount || responseData.likes?.length || 0;
        const isLiked = responseData.isLiked || false;
        
        post.isLiked = isLiked;
        post.likes = likeCount;
        
        this.setData({ post });
      })
      .catch(error => {
        
        
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
  },
  
  /**
   * 点赞评论
   */
  likeComment(e) {
    const index = e.currentTarget.dataset.index;
    const comment = this.data.comments[index];
    
    // 检查评论ID
    const commentId = comment.id || comment._id;
    
    if (!commentId) {
      
      wx.showToast({
        title: '操作失败：评论ID不存在',
        icon: 'none'
      });
      return;
    }
    
    
    
    // 直接使用API路径
    const apiUrl = `/api/comments/${commentId}/${comment.isLiked ? 'unlike' : 'like'}`;
    
    wx.request({
      url: wx.getStorageSync('apiBaseUrl') + apiUrl,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      data: {},
      success: (res) => {
        if (res.statusCode === 200) {
          
          // 处理嵌套的数据结构
          const responseData = res.data.data || res.data;
          const likeCount = responseData.likeCount || responseData.likes?.length || 0;
          const isLiked = responseData.isLiked || false;
        
        const comments = this.data.comments;
        comments[index].isLiked = isLiked;
        comments[index].likes = likeCount;
        
        this.setData({ comments });
        } else {
          
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
      });
  },
  
  /**
   * 回复评论
   */
  replyComment(e) {
    const { index, username } = e.currentTarget.dataset;
    const comment = this.data.comments[index];
    
    // 确保用户名存在
    const replyUsername = username || (comment.user ? comment.user.nickname || comment.user.username : '用户');
    
    this.setData({
      replyTo: {
        index: index,
        username: replyUsername,
        userId: comment.user ? comment.user.id || comment.userId : ''
      },
      commentContent: '',
      focusComment: true
    });
  },
  
  /**
   * 取消回复
   */
  cancelReply() {
    this.setData({
      replyTo: null,
      commentContent: ''
    });
  },
  
  /**
   * 输入评论内容
   */
  inputComment(e) {
    this.setData({
      commentContent: e.detail.value
    });
  },
  
  /**
   * 显示/隐藏表情面板
   */
  toggleEmojiPanel() {
    this.setData({
      showEmojiPanel: !this.data.showEmojiPanel
    });
  },
  
  /**
   * 选择表情
   */
  selectEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji;
    const content = this.data.commentContent + emoji;
    
    this.setData({
      commentContent: content
    });
  },
  
  /**
   * 提交评论
   */
  submitComment() {
    // 获取评论内容
    const content = this.data.commentContent.trim();
    
    // 如果评论内容为空，提示用户
    if (!content) {
      wx.showToast({
        title: '评论内容不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '提交中...'
    });
    
    // 构建评论数据
    let commentData = { 
      content
    };
    
    // 如果是回复评论，添加回复信息
    if (this.data.replyTo) {
      const replyToComment = this.data.comments[this.data.replyTo.index];
      
      if (replyToComment) {
        // 如果是回复二级评论
        if (this.data.replyTo.isReplyToReply && this.data.replyTo.replyId) {
          commentData.replyTo = this.data.replyTo.replyId;
        } else {
          commentData.replyTo = replyToComment.id;
        }
        
        // 获取被回复用户ID
        if (this.data.replyTo.userId) {
          commentData.replyToUser = this.data.replyTo.userId;
        } else if (replyToComment.user && replyToComment.user.id) {
          commentData.replyToUser = replyToComment.user.id;
        } else if (replyToComment.userId) {
          commentData.replyToUser = replyToComment.userId;
        }
        
        // 在评论内容前添加@用户名前缀
        if (this.data.replyTo.username && !content.includes(`@${this.data.replyTo.username}`)) {
          commentData.content = `@${this.data.replyTo.username} ${content}`;
        }
      }
    }
    
    
    
    // 调用API提交评论
    const sendComment = (retryCount = 0) => {
    communityAPI.addComment(this.data.postId, commentData)
        .then(result => {
          
          // 获取返回的评论数据
          const comment = result;
          
          // 格式化评论时间
          if (comment.createdAt) {
            comment.createdAt = utils.formatRelativeTime(comment.createdAt);
          }
          
          // 确保用户信息字段统一
          if (comment.user) {
            comment.userName = comment.user.nickname || comment.user.username;
            comment.userAvatar = comment.user.avatar;
            comment.userId = comment.user.id;
          }
          
          // 确保回复信息字段统一
          if (comment.replyToUser) {
            comment.replyToUserName = comment.replyToUser.nickname || comment.replyToUser.username;
            comment.replyToId = comment.replyToUser.id;
          }
          
          // 确保点赞数据正确
          comment.likes = comment.likeCount || comment.likes?.length || 0;
          comment.isLiked = comment.isLiked || false;
          
        // 更新评论列表
        const comments = [comment, ...this.data.comments];
        
        // 更新评论数量
        const post = this.data.post;
        post.comments += 1;
        
        // 清空评论内容
        this.setData({
          comments,
          post,
          commentContent: '',
          replyTo: null,
          showEmojiPanel: false
        });
        
        // 显示成功提示
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });
      })
      .catch(error => {
        
          
          let errorMessage = '评论失败';
          if (error.message) {
            errorMessage = error.message;
          } else if (error.errMsg) {
            errorMessage = error.errMsg;
          }
          
          // 如果是服务器错误且重试次数小于2，尝试重试
          if (retryCount < 2 && (errorMessage.includes('服务器错误') || errorMessage.includes('500'))) {
            
            setTimeout(() => sendComment(retryCount + 1), 1000);
            return;
          }
        
        wx.showToast({
            title: errorMessage,
            icon: 'none',
            duration: 3000
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
    };
    
    // 开始发送评论
    sendComment();
  },
  
  /**
   * 查看用户资料
   */
  viewUserProfile(e) {
    const userId = e.detail ? e.detail.userId : e.currentTarget.dataset.id;
    
    if (!userId) {
      return;
    }
    
    wx.navigateTo({
      url: `/pages/profile/user-profile/user-profile?id=${userId}`
    });
  },
  
  /**
   * 预览图片
   */
  previewImage(e) {
    const { index, images } = e.detail || e.currentTarget.dataset;
    const urls = images || this.data.post.images;
    
    wx.previewImage({
      current: urls[index],
      urls: urls
    });
  },
  
  /**
   * 查看标签
   */
  viewTag(e) {
    const tag = e.detail ? e.detail.tag : e.currentTarget.dataset.tag;
    
    wx.navigateTo({
      url: `/pages/community/tag-posts/tag-posts?tag=${encodeURIComponent(tag)}`
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    if (this.data.postId) {
      this.loadPostData(this.data.postId);
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const post = this.data.post;
    
    return {
      title: `${post.userName}的动态`,
      path: `/pages/community/post-detail/post-detail?id=${post.id}&share=true`,
      imageUrl: post.images && post.images.length > 0 ? post.images[0] : ''
    };
  },

  /**
   * 点赞回复
   */
  likeReply(e) {
    const { commentIndex, replyIndex } = e.currentTarget.dataset;
    const comment = this.data.comments[commentIndex];
    const reply = comment.replies[replyIndex];
    
    
    
    // 检查回复ID
    const replyId = reply.id || reply._id;
    
    if (!replyId) {
      
      wx.showToast({
        title: '操作失败：回复ID不存在',
        icon: 'none'
      });
      return;
    }
    
    
    
    // 直接使用API路径
    const apiUrl = `/api/comments/${replyId}/${reply.isLiked ? 'unlike' : 'like'}`;
    
    wx.request({
      url: wx.getStorageSync('apiBaseUrl') + apiUrl,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      data: {},
      success: (res) => {
        if (res.statusCode === 200) {
          
          // 处理嵌套的数据结构
          const responseData = res.data.data || res.data;
          const likeCount = responseData.likeCount || responseData.likes?.length || 0;
          const isLiked = responseData.isLiked || false;
          
          const comments = this.data.comments;
          comments[commentIndex].replies[replyIndex].isLiked = isLiked;
          comments[commentIndex].replies[replyIndex].likes = likeCount;
          
          this.setData({ comments });
        } else {
          
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 回复二级评论
   */
  replyToReply(e) {
    const { commentIndex, replyIndex, username } = e.currentTarget.dataset;
    const comment = this.data.comments[commentIndex];
    const reply = comment.replies[replyIndex];
    
    this.setData({
      replyTo: {
        index: commentIndex,
        username: username,
        userId: reply.userId || (reply.user ? reply.user.id : ''),
        isReplyToReply: true,
        replyId: reply.id
      },
      commentContent: '',
      focusComment: true
    });
  },
}) 
