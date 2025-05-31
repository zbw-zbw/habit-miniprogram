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
        this.setData({ 
          post,
          loading: false
        });
      })
      .catch(error => {
        console.error('获取动态详情失败:', error);
        
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
        
        this.setData({
          comments: loadMore ? [...this.data.comments, ...comments] : comments,
          commentPage: params.page,
          hasMoreComments: params.page < pagination.pages,
          loadingComments: false
        });
      })
      .catch(error => {
        console.error('获取评论失败:', error);
        
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
  likePost() {
    const post = this.data.post;
    const apiCall = post.isLiked 
      ? communityAPI.unlikePost(post.id)
      : communityAPI.likePost(post.id);
    
    apiCall
      .then(result => {
        const { likeCount, isLiked } = result;
        
        post.isLiked = isLiked;
        post.likes = likeCount;
        
        this.setData({ post });
      })
      .catch(error => {
        console.error('点赞操作失败:', error);
        
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
    
    const apiCall = comment.isLiked 
      ? communityAPI.unlikeComment(this.data.postId, comment.id)
      : communityAPI.likeComment(this.data.postId, comment.id);
    
    apiCall
      .then(result => {
        const { likeCount, isLiked } = result;
        
        const comments = this.data.comments;
        comments[index].isLiked = isLiked;
        comments[index].likes = likeCount;
        
        this.setData({ comments });
      })
      .catch(error => {
        console.error('点赞评论失败:', error);
        
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
  },
  
  /**
   * 回复评论
   */
  replyComment(e) {
    const { index, username } = e.currentTarget.dataset;
    
    this.setData({
      replyTo: {
        index: index,
        username: username
      },
      commentContent: `回复 @${username}: `,
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
    let commentData = { content };
    
    // 如果是回复评论，添加回复信息
    if (this.data.replyTo) {
      commentData.replyTo = this.data.comments[this.data.replyTo.index].id;
    }
    
    // 调用API提交评论
    communityAPI.addComment(this.data.postId, commentData)
      .then(comment => {
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
        console.error('提交评论失败:', error);
        
        wx.showToast({
          title: '评论失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },
  
  /**
   * 查看用户资料
   */
  viewUserProfile(e) {
    const userId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/profile/user/user?id=${userId}`
    });
  },
  
  /**
   * 查看图片
   */
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.post.images;
    
    wx.previewImage({
      current: images[index],
      urls: images
    });
  },
  
  /**
   * 查看标签
   */
  viewTag(e) {
    const tag = e.currentTarget.dataset.tag;
    wx.navigateTo({
      url: `/pages/community/tag/tag?name=${tag}`
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
      title: `${post.userName}的习惯分享：${post.habitName}`,
      path: `/pages/community/post-detail/post-detail?id=${post.id}&share=true`,
      imageUrl: post.images && post.images.length > 0 ? post.images[0] : ''
    };
  }
}) 
