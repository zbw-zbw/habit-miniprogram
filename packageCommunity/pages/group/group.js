// packageCommunity/pages/group/group.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    groupId: '',
    group: null,
    isJoined: false,
    isAdmin: false,
    loading: true,
    loadingMore: false,
    activeTab: 'posts',
    posts: [],
    members: [],
    admins: [],
    challenges: [],
    hasMore: {
      posts: true,
      members: true,
      challenges: true
    },
    page: {
      posts: 1,
      members: 1,
      challenges: 1
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({ groupId: options.id });
      this.loadGroupInfo();
    } else {
      wx.showToast({
        title: '小组ID不存在',
        icon: 'error'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 加载小组信息
   */
  loadGroupInfo() {
    this.setData({ loading: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟小组数据
      const mockGroup = {
        id: this.data.groupId,
        name: '早起俱乐部',
        description: '每天早起，养成健康生活习惯。分享早起心得，互相监督打卡。',
        avatar: '/images/groups/group1.png',
        coverImage: '/images/groups/cover1.jpg',
        membersCount: 256,
        postsCount: 1024,
        challengesCount: 5,
        createdAt: '2023-08-15',
        rules: '1. 尊重每一位成员\n2. 禁止发布广告内容\n3. 每天打卡分享\n4. 互相鼓励支持'
      };
      
      // 判断用户是否已加入
      const isJoined = true; // 模拟已加入
      const isAdmin = true; // 模拟是管理员
      
      this.setData({
        group: mockGroup,
        isJoined: isJoined,
        isAdmin: isAdmin,
        loading: false
      });
      
      // 加载当前标签页的数据
      this.loadTabData();
    }, 1000);
  },

  /**
   * 加载标签页数据
   */
  loadTabData() {
    const { activeTab } = this.data;
    
    switch (activeTab) {
      case 'posts':
        this.loadPosts();
        break;
      case 'members':
        this.loadMembers();
        break;
      case 'challenges':
        this.loadChallenges();
        break;
    }
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    if (tab !== this.data.activeTab) {
      this.setData({ activeTab: tab }, () => {
        this.loadTabData();
      });
    }
  },

  /**
   * 加载动态列表
   */
  loadPosts(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        'page.posts': 1,
        posts: [],
        'hasMore.posts': true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore.posts && !isRefresh) {
      return;
    }
    
    // 显示加载中
    this.setData({ loadingMore: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟动态数据
      const mockPosts = [
        {
          id: '1',
          userId: '101',
          userName: '李小华',
          userAvatar: '/images/avatars/avatar1.png',
          content: '今天5点起床，感觉一天都很有精神！坚持早起的第30天，已经养成习惯了。',
          images: ['/images/posts/post1.jpg'],
          likes: 45,
          comments: 12,
          isLiked: false,
          createdAt: '2023-10-16 06:23'
        },
        {
          id: '2',
          userId: '102',
          userName: '张明',
          userAvatar: '/images/avatars/avatar2.png',
          content: '分享一个早起小技巧：睡前准备好第二天的衣物和必需品，减少早上的决策负担，更容易坚持早起。',
          images: [],
          likes: 36,
          comments: 8,
          isLiked: true,
          createdAt: '2023-10-15 07:45'
        },
        {
          id: '3',
          userId: '103',
          userName: '王丽',
          userAvatar: '/images/avatars/avatar3.png',
          content: '早起后的晨跑真的很舒服，空气清新，人也少。附上今天的晨跑照片~',
          images: ['/images/posts/post2.jpg', '/images/posts/post3.jpg'],
          likes: 52,
          comments: 15,
          isLiked: false,
          createdAt: '2023-10-14 06:30'
        }
      ];
      
      // 模拟分页
      const currentPosts = this.data.posts;
      const newPosts = isRefresh ? mockPosts : [...currentPosts, ...mockPosts];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page.posts < 3; // 模拟只有3页数据
      
      this.setData({
        posts: newPosts,
        loadingMore: false,
        'hasMore.posts': hasMore,
        'page.posts': this.data.page.posts + 1
      });
    }, 1000);
  },

  /**
   * 加载成员列表
   */
  loadMembers(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        'page.members': 1,
        members: [],
        admins: [],
        'hasMore.members': true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore.members && !isRefresh) {
      return;
    }
    
    // 显示加载中
    this.setData({ loadingMore: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟管理员数据
      const mockAdmins = [
        {
          id: '101',
          name: '李小华',
          avatar: '/images/avatars/avatar1.png'
        }
      ];
      
      // 模拟成员数据
      const mockMembers = [
        {
          id: '102',
          name: '张明',
          avatar: '/images/avatars/avatar2.png'
        },
        {
          id: '103',
          name: '王丽',
          avatar: '/images/avatars/avatar3.png'
        },
        {
          id: '104',
          name: '赵强',
          avatar: '/images/avatars/avatar4.png'
        },
        {
          id: '105',
          name: '陈静',
          avatar: '/images/avatars/avatar5.png'
        },
        {
          id: '106',
          name: '刘洋',
          avatar: '/images/avatars/avatar6.png'
        },
        {
          id: '107',
          name: '周婷',
          avatar: '/images/avatars/avatar7.png'
        },
        {
          id: '108',
          name: '孙伟',
          avatar: '/images/avatars/avatar8.png'
        }
      ];
      
      // 模拟分页
      const currentMembers = this.data.members;
      const newMembers = isRefresh ? mockMembers : [...currentMembers, ...mockMembers];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page.members < 3; // 模拟只有3页数据
      
      this.setData({
        members: newMembers,
        admins: isRefresh ? mockAdmins : this.data.admins,
        loadingMore: false,
        'hasMore.members': hasMore,
        'page.members': this.data.page.members + 1
      });
    }, 1000);
  },

  /**
   * 加载挑战列表
   */
  loadChallenges(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        'page.challenges': 1,
        challenges: [],
        'hasMore.challenges': true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore.challenges && !isRefresh) {
      return;
    }
    
    // 显示加载中
    this.setData({ loadingMore: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟挑战数据
      const mockChallenges = [
        {
          id: '1',
          title: '连续早起30天挑战',
          image: '/images/challenges/challenge1.jpg',
          participants: 156,
          progress: 70,
          isJoined: true
        },
        {
          id: '2',
          title: '晨间阅读打卡',
          image: '/images/challenges/challenge2.jpg',
          participants: 98,
          progress: 40,
          isJoined: false
        },
        {
          id: '3',
          title: '早起晨练21天',
          image: '/images/challenges/challenge3.jpg',
          participants: 124,
          progress: 0,
          isJoined: false
        }
      ];
      
      // 模拟分页
      const currentChallenges = this.data.challenges;
      const newChallenges = isRefresh ? mockChallenges : [...currentChallenges, ...mockChallenges];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page.challenges < 2; // 模拟只有2页数据
      
      this.setData({
        challenges: newChallenges,
        loadingMore: false,
        'hasMore.challenges': hasMore,
        'page.challenges': this.data.page.challenges + 1
      });
    }, 1000);
  },

  /**
   * 加入/退出小组
   */
  toggleJoinGroup() {
    const isJoined = !this.data.isJoined;
    
    if (!isJoined) {
      // 退出小组确认
      wx.showModal({
        title: '退出小组',
        content: '确定要退出该小组吗？',
        success: (res) => {
          if (res.confirm) {
            this.updateJoinStatus(isJoined);
          }
        }
      });
    } else {
      this.updateJoinStatus(isJoined);
    }
  },

  /**
   * 更新加入状态
   */
  updateJoinStatus(isJoined) {
    // 显示加载中
    wx.showLoading({
      title: isJoined ? '加入中' : '退出中'
    });
    
    // 模拟请求延迟
    setTimeout(() => {
      // 更新小组成员数
      const group = this.data.group;
      group.membersCount = isJoined ? group.membersCount + 1 : group.membersCount - 1;
      
      this.setData({
        isJoined: isJoined,
        group: group
      });
      
      wx.hideLoading();
      
      wx.showToast({
        title: isJoined ? '已加入小组' : '已退出小组',
        icon: 'success'
      });
      
      // 如果退出小组，返回上一页
      if (!isJoined) {
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }, 1000);
  },

  /**
   * 查看用户资料
   */
  viewUserProfile(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/user-profile/user-profile?id=${id}`
    });
  },

  /**
   * 查看动态详情
   */
  viewPostDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/post-detail/post-detail?id=${id}`
    });
  },

  /**
   * 查看挑战详情
   */
  viewChallengeDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/challenge/challenge?id=${id}`
    });
  },

  /**
   * 点赞/取消点赞
   */
  likePost(e) {
    const { id, index } = e.currentTarget.dataset;
    const posts = this.data.posts;
    
    // 更新点赞状态
    posts[index].isLiked = !posts[index].isLiked;
    posts[index].likes = posts[index].isLiked ? posts[index].likes + 1 : posts[index].likes - 1;
    
    this.setData({ posts });
    
    // TODO: 发送请求到服务器更新点赞状态
  },

  /**
   * 评论动态
   */
  commentPost(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/post-detail/post-detail?id=${id}&focus=comment`
    });
  },

  /**
   * 分享动态
   */
  sharePost(e) {
    const { id } = e.currentTarget.dataset;
    // 使用小程序分享功能
  },

  /**
   * 创建动态
   */
  createPost() {
    wx.navigateTo({
      url: `/packageCommunity/pages/post/post?groupId=${this.data.groupId}`
    });
  },

  /**
   * 创建挑战
   */
  createChallenge() {
    wx.navigateTo({
      url: `/packageCommunity/pages/challenge/create?groupId=${this.data.groupId}`
    });
  },

  /**
   * 邀请好友
   */
  inviteMembers() {
    wx.showToast({
      title: '邀请功能开发中',
      icon: 'none'
    });
  },

  /**
   * 编辑小组
   */
  editGroup() {
    wx.navigateTo({
      url: `/packageCommunity/pages/group/edit?id=${this.data.groupId}`
    });
  },

  /**
   * 解散小组
   */
  deleteGroup() {
    wx.showModal({
      title: '解散小组',
      content: '确定要解散该小组吗？此操作不可恢复！',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中' });
          
          // 模拟请求延迟
          setTimeout(() => {
            wx.hideLoading();
            
            wx.showToast({
              title: '小组已解散',
              icon: 'success',
              duration: 1500,
              success: () => {
                // 延迟返回
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              }
            });
          }, 1500);
        }
      }
    });
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadGroupInfo();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    const { activeTab } = this.data;
    
    switch (activeTab) {
      case 'posts':
        if (this.data.hasMore.posts) {
          this.loadPosts();
        }
        break;
      case 'members':
        if (this.data.hasMore.members) {
          this.loadMembers();
        }
        break;
      case 'challenges':
        if (this.data.hasMore.challenges) {
          this.loadChallenges();
        }
        break;
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { group } = this.data;
    
    if (group) {
      return {
        title: `邀请你加入「${group.name}」小组`,
        path: `/packageCommunity/pages/group/group?id=${group.id}`,
        imageUrl: group.coverImage
      };
    }
    
    return {
      title: '习惯打卡',
      path: '/pages/index/index'
    };
  }
})
