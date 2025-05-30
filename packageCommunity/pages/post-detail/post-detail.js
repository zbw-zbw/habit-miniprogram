// packageCommunity/pages/post-detail/post-detail.js
const { communityAPI } = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    postId: '',
    post: null,
    comments: [],
    newComment: '',
    loading: true,
    commentsLoading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    isLiked: false,
    isFavorited: false,
    showImagePreview: false,
    currentImage: '',
    imageUrls: [],
    loadingMore: false,
    commentText: '',
    commentFocus: false,
    replyTo: '',
    replyCommentId: '',
    commentSort: 'time' // time 或 hot
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({ postId: options.id });
      this.loadPostDetail();
      this.loadComments();
      
      // 如果需要聚焦评论框
      if (options.focus === 'comment') {
        this.setData({ commentFocus: true });
      }
    } else {
      wx.showToast({
        title: '动态ID不存在',
        icon: 'error'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 加载动态详情
   */
  loadPostDetail() {
    this.setData({ loading: true });
    
    communityAPI.getPost(this.data.postId)
      .then(post => {
        console.log('获取到动态详情:', post);
        this.setData({
          post: post,
          loading: false,
          isLiked: post.isLiked || false,
          imageUrls: post.images || []
        });
      })
      .catch(error => {
        console.error('获取动态详情失败:', error);
        this.setData({ loading: false });
        wx.showToast({
          title: '获取动态详情失败',
          icon: 'none'
        });
      });
  },

  /**
   * 加载评论
   */
  loadComments(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        page: 1,
        comments: [],
        hasMore: true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore && !isRefresh) {
      return;
    }
    
    // 显示加载中
    this.setData({ commentsLoading: true });
    
    // 构建请求参数
    const params = {
      page: this.data.page,
      limit: this.data.pageSize,
      sort: this.data.commentSort
    };
    
    communityAPI.getComments(this.data.postId, params)
      .then(result => {
        console.log('获取到评论列表:', result);
        
        // 处理分页数据
        const { comments, total, page, limit } = result;
        const hasMore = page * limit < total;
        
        // 添加新数据到列表
        const currentComments = this.data.comments;
        const newComments = isRefresh ? comments : [...currentComments, ...comments];
        
        this.setData({
          comments: newComments,
          commentsLoading: false,
          hasMore: hasMore,
          page: this.data.page + 1
        });
      })
      .catch(error => {
        console.error('获取评论列表失败:', error);
        this.setData({ commentsLoading: false });
        wx.showToast({
          title: '获取评论失败',
          icon: 'none'
        });
      });
  },

  /**
   * 显示操作菜单
   */
  showActionSheet() {
    const { post } = this.data;
    const isMyPost = post.userId === getApp().globalData.userInfo?.id;
    
    const items = [];
    
    if (isMyPost) {
      items.push('编辑', '删除');
    } else {
      items.push('举报');
    }
    
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const index = res.tapIndex;
        if (isMyPost) {
          if (index === 0) {
            this.editPost();
          } else if (index === 1) {
            this.deletePost();
          }
        } else {
          if (index === 0) {
            this.reportPost();
          }
        }
      }
    });
  },

  /**
   * 编辑动态
   */
  editPost() {
    wx.navigateTo({
      url: `/packageCommunity/pages/post/post?id=${this.data.postId}&edit=true`
    });
  },

  /**
   * 删除动态
   */
  deletePost() {
    wx.showModal({
      title: '删除动态',
      content: '确定要删除这条动态吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          // 模拟删除操作
          wx.showLoading({
            title: '删除中...'
          });
          
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }, 1000);
        }
      }
    });
  },

  /**
   * 举报动态
   */
  reportPost() {
    wx.navigateTo({
      url: `/packageCommunity/pages/report/report?type=post&id=${this.data.postId}`
    });
  },

  /**
   * 查看用户资料
   */
  viewUserProfile() {
    const { post } = this.data;
    wx.navigateTo({
      url: `/packageCommunity/pages/user-profile/user-profile?id=${post.userId}`
    });
  },

  /**
   * 查看评论用户资料
   */
  viewCommentUserProfile(e) {
    const { userId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/user-profile/user-profile?id=${userId}`
    });
  },

  /**
   * 点赞/取消点赞动态
   */
  toggleLike() {
    const { post } = this.data;
    
    // 更新点赞状态
    post.isLiked = !post.isLiked;
    post.likes = post.isLiked ? post.likes + 1 : post.likes - 1;
    
    // 如果点赞，添加当前用户到点赞列表
    if (post.isLiked) {
      const currentUser = getApp().globalData.userInfo || {
        id: 'current',
        name: '我',
        avatar: '/images/avatars/default.png'
      };
      
      post.likedUsers.unshift({
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      });
    } else {
      // 如果取消点赞，从点赞列表移除当前用户
      const currentUserId = getApp().globalData.userInfo?.id || 'current';
      const index = post.likedUsers.findIndex(user => user.id === currentUserId);
      
      if (index !== -1) {
        post.likedUsers.splice(index, 1);
      }
    }
    
    this.setData({ post });
    
    // 显示提示
    wx.showToast({
      title: post.isLiked ? '已点赞' : '已取消点赞',
      icon: 'success'
    });
    
    // TODO: 发送请求到服务器更新点赞状态
  },

  /**
   * 点赞/取消点赞评论
   */
  likeComment(e) {
    const { id, index } = e.currentTarget.dataset;
    const { post } = this.data;
    
    // 更新评论点赞状态
    post.comments[index].isLiked = !post.comments[index].isLiked;
    post.comments[index].likes = post.comments[index].isLiked ? post.comments[index].likes + 1 : post.comments[index].likes - 1;
    
    this.setData({ post });
    
    // TODO: 发送请求到服务器更新评论点赞状态
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data.post;
    
    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  /**
   * 查看标签
   */
  viewTag(e) {
    const { tag } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/community/tag/tag?name=${tag}`
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadPostDetail();
    this.loadComments(true);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.commentsLoading && this.data.hasMore) {
      this.loadComments();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { post } = this.data;
    
    if (post) {
      return {
        title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
        path: `/packageCommunity/pages/post-detail/post-detail?id=${post.id}`,
        imageUrl: post.images && post.images.length > 0 ? post.images[0] : ''
      };
    }
    
    return {
      title: '习惯打卡',
      path: '/pages/index/index'
    };
  },

  /**
   * 切换评论排序方式
   */
  toggleCommentSort() {
    const { commentSort, post } = this.data;
    const newSort = commentSort === 'time' ? 'hot' : 'time';
    
    // 根据排序方式重新排序评论
    let sortedComments = [...post.comments];
    
    if (newSort === 'time') {
      // 按时间排序（从新到旧）
      sortedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      // 按热度排序（点赞数）
      sortedComments.sort((a, b) => b.likes - a.likes);
    }
    
    post.comments = sortedComments;
    
    this.setData({
      commentSort: newSort,
      post
    });
  },

  /**
   * 查看所有回复
   */
  viewAllReplies(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/replies/replies?commentId=${id}`
    });
  },

  /**
   * 回复评论
   */
  replyComment(e) {
    const { id, name } = e.currentTarget.dataset;
    
    this.setData({
      commentFocus: true,
      replyTo: name,
      replyCommentId: id
    });
  },

  /**
   * 聚焦评论输入框
   */
  focusComment() {
    this.setData({
      commentFocus: true,
      replyTo: '',
      replyCommentId: ''
    });
  },

  /**
   * 输入评论内容
   */
  inputComment(e) {
    this.setData({
      commentText: e.detail.value
    });
  },

  /**
   * 提交评论
   */
  submitComment() {
    const { commentText, replyTo, replyCommentId, post } = this.data;
    
    if (!commentText.trim()) {
      return;
    }
    
    // 模拟当前用户
    const currentUser = getApp().globalData.userInfo || {
      id: 'current',
      name: '我',
      avatar: '/images/avatars/default.png'
    };
    
    if (replyCommentId) {
      // 回复评论
      const commentIndex = post.comments.findIndex(comment => comment.id === replyCommentId);
      
      if (commentIndex !== -1) {
        // 创建新回复
        const newReply = {
          id: `reply${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          content: commentText,
          createdAt: this.formatTime(new Date())
        };
        
        // 添加到回复列表
        if (!post.comments[commentIndex].replies) {
          post.comments[commentIndex].replies = [];
        }
        
        post.comments[commentIndex].replies.push(newReply);
        post.comments[commentIndex].replyCount = (post.comments[commentIndex].replyCount || 0) + 1;
      }
    } else {
      // 发表新评论
      const newComment = {
        id: `comment${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: commentText,
        createdAt: this.formatTime(new Date()),
        likes: 0,
        isLiked: false,
        replyCount: 0,
        replies: []
      };
      
      // 添加到评论列表
      post.comments.unshift(newComment);
    }
    
    // 更新数据
    this.setData({
      post,
      commentText: '',
      replyTo: '',
      replyCommentId: ''
    });
    
    // 显示提示
    wx.showToast({
      title: replyCommentId ? '回复成功' : '评论成功',
      icon: 'success'
    });
    
    // TODO: 发送请求到服务器保存评论/回复
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    return `${year}-${this.formatNumber(month)}-${this.formatNumber(day)} ${this.formatNumber(hour)}:${this.formatNumber(minute)}`;
  },

  /**
   * 格式化数字
   */
  formatNumber(n) {
    return n < 10 ? `0${n}` : n;
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  }
}) 
