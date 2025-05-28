// packageCommunity/pages/post-detail/post-detail.js
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
    imageUrls: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({ postId: options.id });
      this.loadPostDetail();
      this.loadComments();
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
    // 显示加载中
    this.setData({ loading: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟动态数据
      const mockPost = {
        id: this.data.postId,
        userId: '101',
        userName: '李小华',
        userAvatar: '/images/avatars/avatar1.png',
        content: '今天完成了《原子习惯》的阅读，真的很有启发！这本书教会了我如何通过微小的改变积累成巨大的成果，强烈推荐给大家。',
        images: ['/images/posts/post1.jpg', '/images/posts/post2.jpg'],
        likes: 256,
        comments: 48,
        favorites: 32,
        createdAt: '2023-10-16 08:23',
        location: '北京市朝阳区',
        isLiked: false,
        isFavorited: false,
        tags: ['阅读', '习惯养成', '自我提升']
      };
      
      // 设置图片预览数组
      const imageUrls = mockPost.images || [];
      
      this.setData({
        post: mockPost,
        loading: false,
        isLiked: mockPost.isLiked,
        isFavorited: mockPost.isFavorited,
        imageUrls
      });
    }, 1000);
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
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟评论数据
      const mockComments = [
        {
          id: 'c1',
          userId: '102',
          userName: '张明',
          userAvatar: '/images/avatars/avatar2.png',
          content: '我也在读这本书，确实很棒！',
          createdAt: '2023-10-16 09:15',
          likes: 12,
          isLiked: false,
          replies: []
        },
        {
          id: 'c2',
          userId: '103',
          userName: '王丽',
          userAvatar: '/images/avatars/avatar3.png',
          content: '能分享一下你最大的收获是什么吗？',
          createdAt: '2023-10-16 10:30',
          likes: 8,
          isLiked: false,
          replies: [
            {
              id: 'r1',
              userId: '101',
              userName: '李小华',
              userAvatar: '/images/avatars/avatar1.png',
              content: '最大的收获是理解了习惯的复利效应，以及如何通过环境设计来促进好习惯的养成。',
              createdAt: '2023-10-16 11:05',
              parentId: 'c2'
            }
          ]
        },
        {
          id: 'c3',
          userId: '104',
          userName: '赵强',
          userAvatar: '/images/avatars/avatar4.png',
          content: '推荐你也可以看看《深度工作》这本书，和《原子习惯》很搭配。',
          createdAt: '2023-10-16 13:45',
          likes: 15,
          isLiked: true,
          replies: []
        }
      ];
      
      // 模拟分页
      const currentComments = this.data.comments;
      const newComments = isRefresh ? mockComments : [...currentComments, ...mockComments];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page < 3; // 模拟只有3页数据
      
      this.setData({
        comments: newComments,
        commentsLoading: false,
        hasMore: hasMore,
        page: this.data.page + 1
      });
    }, 1000);
  },

  /**
   * 点赞/取消点赞
   */
  toggleLike() {
    const isLiked = !this.data.isLiked;
    const post = this.data.post;
    
    // 更新点赞数
    post.likes = isLiked ? post.likes + 1 : post.likes - 1;
    
    this.setData({
      isLiked: isLiked,
      post: post
    });
    
    // TODO: 发送请求到服务器更新点赞状态
  },

  /**
   * 收藏/取消收藏
   */
  toggleFavorite() {
    const isFavorited = !this.data.isFavorited;
    const post = this.data.post;
    
    // 更新收藏数
    post.favorites = isFavorited ? post.favorites + 1 : post.favorites - 1;
    
    this.setData({
      isFavorited: isFavorited,
      post: post
    });
    
    // TODO: 发送请求到服务器更新收藏状态
  },

  /**
   * 分享
   */
  sharePost() {
    wx.showActionSheet({
      itemList: ['分享给朋友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 分享给朋友
            break;
          case 1:
            // 分享到朋友圈
            wx.showToast({
              title: '分享到朋友圈功能开发中',
              icon: 'none'
            });
            break;
          case 2:
            // 复制链接
            wx.setClipboardData({
              data: `https://example.com/post/${this.data.postId}`,
              success: () => {
                wx.showToast({
                  title: '链接已复制',
                  icon: 'success'
                });
              }
            });
            break;
        }
      }
    });
  },

  /**
   * 查看用户资料
   */
  viewUserProfile() {
    const { userId } = this.data.post;
    wx.navigateTo({
      url: `/packageCommunity/pages/user-profile/user-profile?id=${userId}`
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
   * 点赞/取消点赞评论
   */
  toggleCommentLike(e) {
    const { id, index } = e.currentTarget.dataset;
    const comments = this.data.comments;
    const comment = comments[index];
    
    // 更新点赞状态
    comment.isLiked = !comment.isLiked;
    comment.likes = comment.isLiked ? comment.likes + 1 : comment.likes - 1;
    
    this.setData({
      comments: comments
    });
    
    // TODO: 发送请求到服务器更新评论点赞状态
  },

  /**
   * 回复评论
   */
  replyComment(e) {
    const { id, userName } = e.currentTarget.dataset;
    
    this.setData({
      newComment: `回复 @${userName}: `
    });
    
    // 聚焦评论输入框
    this.selectComponent('#commentInput').focus();
  },

  /**
   * 输入评论
   */
  inputComment(e) {
    this.setData({
      newComment: e.detail.value
    });
  },

  /**
   * 提交评论
   */
  submitComment() {
    const { newComment, comments, post } = this.data;
    
    if (!newComment.trim()) {
      wx.showToast({
        title: '评论内容不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 模拟提交评论
    wx.showLoading({ title: '提交中' });
    
    setTimeout(() => {
      // 创建新评论
      const newCommentObj = {
        id: `c${Date.now()}`,
        userId: 'self',
        userName: '我',
        userAvatar: '/images/avatars/self.png',
        content: newComment,
        createdAt: '刚刚',
        likes: 0,
        isLiked: false,
        replies: []
      };
      
      // 更新评论列表和评论数
      const updatedComments = [newCommentObj, ...comments];
      const updatedPost = { ...post };
      updatedPost.comments += 1;
      
      this.setData({
        comments: updatedComments,
        post: updatedPost,
        newComment: ''
      });
      
      wx.hideLoading();
      
      wx.showToast({
        title: '评论成功',
        icon: 'success'
      });
      
      // TODO: 发送请求到服务器提交评论
    }, 500);
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const { index } = e.currentTarget.dataset;
    const { imageUrls } = this.data;
    
    wx.previewImage({
      current: imageUrls[index],
      urls: imageUrls
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
        title: post.content.substring(0, 30) + '...',
        path: `/packageCommunity/pages/post-detail/post-detail?id=${post.id}`,
        imageUrl: post.images && post.images.length > 0 ? post.images[0] : ''
      };
    }
    
    return {
      title: '习惯打卡',
      path: '/pages/index/index'
    };
  }
}) 
