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
    commentContent: '',
    focusComment: false,
    showEmojiPanel: false,
    replyTo: null
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
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟动态数据
      const mockPost = {
        id: postId,
        userId: 'user2',
        userName: '小红',
        userAvatar: '/images/avatars/avatar2.png',
        habitName: '每日阅读',
        content: '今天读完了《原子习惯》这本书，收获颇多！书中提到的"复利效应"让我明白了坚持小习惯的重要性，从今天开始我要更加认真地对待每一个微小的进步。\n\n推荐大家也读一读这本书，对养成习惯很有帮助。',
        createdAt: '2小时前',
        images: ['/images/posts/book.jpg'],
        tags: ['阅读', '自我提升'],
        likes: 28,
        comments: 5,
        isLiked: false
      };
      
      // 模拟评论数据
      const mockComments = [
        {
          id: 'comment1',
          userId: 'user3',
          userName: '小华',
          userAvatar: '/images/avatars/avatar3.png',
          content: '我也读过这本书，确实很棒！里面的习惯追踪方法我一直在用。',
          createdAt: '1小时前',
          likes: 5,
          isLiked: false
        },
        {
          id: 'comment2',
          userId: 'user5',
          userName: '小张',
          userAvatar: '/images/avatars/avatar5.png',
          content: '看来我也要读一读这本书了，最近正好想改变一些习惯。',
          createdAt: '40分钟前',
          likes: 2,
          isLiked: false
        },
        {
          id: 'comment3',
          userId: 'user1',
          userName: '小明',
          userAvatar: '/images/avatars/avatar1.png',
          content: '复利效应确实很神奇，小的改变积累起来就是巨大的变化。',
          createdAt: '30分钟前',
          likes: 3,
          isLiked: true,
          replies: [
            {
              id: 'reply1',
              userId: 'user2',
              userName: '小红',
              userAvatar: '/images/avatars/avatar2.png',
              content: '没错，这也是我最大的收获！',
              createdAt: '20分钟前',
              replyTo: '小明'
            }
          ]
        }
      ];
      
      this.setData({
        post: mockPost,
        comments: mockComments,
        loading: false
      });
    }, 1000);
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
    post.isLiked = !post.isLiked;
    
    if (post.isLiked) {
      post.likes += 1;
    } else {
      post.likes -= 1;
    }
    
    this.setData({
      post: post
    });
    
    // 在实际应用中，这里应该调用API更新点赞状态
  },
  
  /**
   * 点赞评论
   */
  likeComment(e) {
    const index = e.currentTarget.dataset.index;
    const comments = this.data.comments;
    
    comments[index].isLiked = !comments[index].isLiked;
    
    if (comments[index].isLiked) {
      comments[index].likes += 1;
    } else {
      comments[index].likes -= 1;
    }
    
    this.setData({
      comments: comments
    });
    
    // 在实际应用中，这里应该调用API更新点赞状态
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
    const { commentContent, replyTo } = this.data;
    
    // 验证评论内容不能为空
    if (!commentContent.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '提交中...',
      mask: true
    });
    
    // 模拟提交过程
    setTimeout(() => {
      if (replyTo) {
        // 添加回复
        const comments = this.data.comments;
        const comment = comments[replyTo.index];
        
        if (!comment.replies) {
          comment.replies = [];
        }
        
        // 创建新回复
        const newReply = {
          id: `reply${Date.now()}`,
          userId: 'self',
          userName: '我',
          userAvatar: '/images/avatars/self.png',
          content: commentContent.replace(`回复 @${replyTo.username}: `, ''),
          createdAt: '刚刚',
          replyTo: replyTo.username
        };
        
        comment.replies.push(newReply);
        
        this.setData({
          comments: comments,
          commentContent: '',
          replyTo: null,
          showEmojiPanel: false
        });
      } else {
        // 创建新评论
        const newComment = {
          id: `comment${Date.now()}`,
          userId: 'self',
          userName: '我',
          userAvatar: '/images/avatars/self.png',
          content: commentContent,
          createdAt: '刚刚',
          likes: 0,
          isLiked: false
        };
        
        // 添加到评论列表
        const comments = [newComment, ...this.data.comments];
        
        // 更新动态评论数
        const post = this.data.post;
        post.comments += 1;
        
        this.setData({
          comments: comments,
          post: post,
          commentContent: '',
          showEmojiPanel: false
        });
      }
      
      wx.hideLoading();
      
      wx.showToast({
        title: '评论成功',
        icon: 'success'
      });
    }, 1000);
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
