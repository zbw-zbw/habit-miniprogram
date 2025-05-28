Page({
  /**
   * 页面的初始数据
   */
  data: {
    userId: '',
    userInfo: null,
    activeTab: 'posts', // posts, habits, challenges
    isFollowing: false,
    loading: true,
    posts: [],
    habits: [],
    challenges: [],
    hasMore: {
      posts: true,
      habits: true,
      challenges: true
    },
    page: {
      posts: 1,
      habits: 1,
      challenges: 1
    },
    pageSize: 10
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({ userId: options.id });
      this.loadUserInfo();
      this.loadUserData();
    } else {
      wx.showToast({
        title: '用户ID不存在',
        icon: 'error'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    // 显示加载中
    this.setData({ loading: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟用户数据
      const mockUser = {
        id: this.data.userId,
        name: this.data.userId === '101' ? '李小华' : '张明',
        avatar: this.data.userId === '101' ? '/images/avatars/avatar1.png' : '/images/avatars/avatar2.png',
        bio: this.data.userId === '101' ? '热爱阅读和写作的文艺青年' : '运动健身爱好者，每日5公里跑步',
        followingCount: this.data.userId === '101' ? 128 : 256,
        followersCount: this.data.userId === '101' ? 356 : 512,
        postsCount: this.data.userId === '101' ? 86 : 125,
        habitsCount: this.data.userId === '101' ? 5 : 8,
        challengesCount: this.data.userId === '101' ? 3 : 6,
        isFollowing: this.data.userId === '101' ? true : false
      };
      
      this.setData({
        userInfo: mockUser,
        isFollowing: mockUser.isFollowing,
        loading: false
      });
    }, 1000);
  },

  /**
   * 加载用户数据（动态、习惯、挑战）
   */
  loadUserData() {
    const { activeTab } = this.data;
    
    switch (activeTab) {
      case 'posts':
        this.loadUserPosts();
        break;
      case 'habits':
        this.loadUserHabits();
        break;
      case 'challenges':
        this.loadUserChallenges();
        break;
    }
  },

  /**
   * 加载用户动态
   */
  loadUserPosts(isRefresh = false) {
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
    wx.showLoading({ title: '加载中' });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟动态数据
      const mockPosts = [
        {
          id: '1',
          content: '今天完成了《原子习惯》的阅读，真的很有启发！',
          images: ['/images/posts/post1.jpg'],
          likes: 256,
          comments: 48,
          createdAt: '2023-10-16 08:23'
        },
        {
          id: '2',
          content: '坚持晨跑第30天，感觉整个人都不一样了！',
          images: ['/images/posts/post2.jpg', '/images/posts/post3.jpg'],
          likes: 189,
          comments: 32,
          createdAt: '2023-10-15 07:15'
        },
        {
          id: '3',
          content: '早晨冥想20分钟，整个人都平静下来了。',
          images: [],
          likes: 89,
          comments: 15,
          createdAt: '2023-10-14 07:30'
        }
      ];
      
      // 模拟分页
      const currentPosts = this.data.posts;
      const newPosts = isRefresh ? mockPosts : [...currentPosts, ...mockPosts];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page.posts < 3; // 模拟只有3页数据
      
      this.setData({
        posts: newPosts,
        'hasMore.posts': hasMore,
        'page.posts': this.data.page.posts + 1
      });
      
      wx.hideLoading();
    }, 1000);
  },

  /**
   * 加载用户习惯
   */
  loadUserHabits(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        'page.habits': 1,
        habits: [],
        'hasMore.habits': true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore.habits && !isRefresh) {
      return;
    }
    
    // 显示加载中
    wx.showLoading({ title: '加载中' });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟习惯数据
      const mockHabits = [
        {
          id: 'habit1',
          name: '每日阅读',
          icon: '/images/habits/reading.png',
          color: '#4F7CFF',
          frequency: '每天',
          streak: 15,
          completionRate: 92
        },
        {
          id: 'habit2',
          name: '晨间冥想',
          icon: '/images/habits/meditation.png',
          color: '#67C23A',
          frequency: '每天',
          streak: 8,
          completionRate: 85
        },
        {
          id: 'habit3',
          name: '每周健身',
          icon: '/images/habits/workout.png',
          color: '#E6A23C',
          frequency: '每周3次',
          streak: 4,
          completionRate: 78
        }
      ];
      
      // 模拟分页
      const currentHabits = this.data.habits;
      const newHabits = isRefresh ? mockHabits : [...currentHabits, ...mockHabits];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page.habits < 2; // 模拟只有2页数据
      
      this.setData({
        habits: newHabits,
        'hasMore.habits': hasMore,
        'page.habits': this.data.page.habits + 1
      });
      
      wx.hideLoading();
    }, 1000);
  },

  /**
   * 加载用户挑战
   */
  loadUserChallenges(isRefresh = false) {
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
    wx.showLoading({ title: '加载中' });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟挑战数据
      const mockChallenges = [
        {
          id: 'challenge1',
          title: '21天阅读挑战',
          image: '/images/challenges/reading.jpg',
          progress: 80,
          totalDays: 21,
          participants: 1358
        },
        {
          id: 'challenge2',
          title: '早起俱乐部',
          image: '/images/challenges/morning.jpg',
          progress: 40,
          totalDays: 30,
          participants: 2546
        },
        {
          id: 'challenge3',
          title: '每日冥想',
          image: '/images/challenges/meditation.jpg',
          progress: 60,
          totalDays: 14,
          participants: 863
        }
      ];
      
      // 模拟分页
      const currentChallenges = this.data.challenges;
      const newChallenges = isRefresh ? mockChallenges : [...currentChallenges, ...mockChallenges];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page.challenges < 2; // 模拟只有2页数据
      
      this.setData({
        challenges: newChallenges,
        'hasMore.challenges': hasMore,
        'page.challenges': this.data.page.challenges + 1
      });
      
      wx.hideLoading();
    }, 1000);
  },

  /**
   * 切换标签
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    if (tab !== this.data.activeTab) {
      this.setData({ activeTab: tab });
      this.loadUserData();
    }
  },

  /**
   * 关注/取消关注用户
   */
  toggleFollow() {
    const isFollowing = !this.data.isFollowing;
    
    this.setData({ isFollowing });
    
    // 提示用户
    wx.showToast({
      title: isFollowing ? '已关注' : '已取消关注',
      icon: 'success'
    });
    
    // TODO: 发送请求到服务器更新关注状态
  },

  /**
   * 发送私信
   */
  sendMessage() {
    wx.showToast({
      title: '私信功能开发中',
      icon: 'none'
    });
    
    // TODO: 跳转到私信页面
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
   * 查看习惯详情
   */
  viewHabitDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/habits/detail/detail?id=${id}`
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
   * 查看关注列表
   */
  viewFollowing() {
    wx.navigateTo({
      url: `/packageCommunity/pages/following/following?id=${this.data.userId}`
    });
  },

  /**
   * 查看粉丝列表
   */
  viewFollowers() {
    wx.navigateTo({
      url: `/packageCommunity/pages/followers/followers?id=${this.data.userId}`
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadUserInfo();
    this.loadUserData();
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
          this.loadUserPosts();
        }
        break;
      case 'habits':
        if (this.data.hasMore.habits) {
          this.loadUserHabits();
        }
        break;
      case 'challenges':
        if (this.data.hasMore.challenges) {
          this.loadUserChallenges();
        }
        break;
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { userInfo } = this.data;
    
    if (userInfo) {
      return {
        title: `${userInfo.name}的习惯打卡主页`,
        path: `/packageCommunity/pages/user-profile/user-profile?id=${userInfo.id}`
      };
    }
    
    return {
      title: '习惯打卡',
      path: '/pages/index/index'
    };
  }
}) 
