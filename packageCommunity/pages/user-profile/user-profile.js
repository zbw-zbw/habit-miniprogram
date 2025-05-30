Page({
  /**
   * 页面的初始数据
   */
  data: {
    userId: '',
    user: null,
    isSelf: false,
    isFollowing: false,
    loading: true,
    loadingMore: false,
    activeTab: 'posts',
    posts: [],
    habits: [],
    achievements: [],
    hasMore: {
      posts: true,
      habits: true,
      achievements: true
    },
    page: {
      posts: 1,
      habits: 1,
      achievements: 1
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({ userId: options.id });
      this.loadUserProfile();
    } else {
      // 如果没有传入用户ID，默认显示当前用户的资料
      const app = getApp();
      if (app.globalData.hasLogin && app.globalData.userInfo) {
        this.setData({
          userId: app.globalData.userInfo.id,
          isSelf: true
        });
        this.loadUserProfile();
      } else {
        wx.showToast({
          title: '用户ID不存在',
          icon: 'error'
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }
  },

  /**
   * 加载用户资料
   */
  loadUserProfile() {
    this.setData({ loading: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟用户数据
      const mockUser = {
        id: this.data.userId,
        name: '李小华',
        avatar: '/images/avatars/avatar1.png',
        coverImage: '/images/covers/cover1.jpg',
        bio: '热爱阅读和写作，每天进步一点点',
        habitsCount: 5,
        followingCount: 128,
        followersCount: 256
      };
      
      // 判断是否是当前用户
      const isSelf = this.data.isSelf;
      
      // 判断是否已关注
      const isFollowing = !isSelf && Math.random() > 0.5; // 模拟50%概率已关注
      
      this.setData({
        user: mockUser,
        isSelf: isSelf,
        isFollowing: isFollowing,
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
      case 'habits':
        this.loadHabits();
        break;
      case 'achievements':
        this.loadAchievements();
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
          content: '今天完成了《原子习惯》的阅读，真的很有启发！分享一个金句："习惯是复利的魔力：1%的微小改变，带来巨大的人生转变。"',
          images: ['/images/posts/post1.jpg'],
          tags: ['阅读', '自我提升'],
          likes: 256,
          comments: 48,
          isLiked: false,
          createdAt: '2023-10-16 08:23',
          habitName: '阅读习惯'
        },
        {
          id: '2',
          content: '坚持早起一个月了，感觉整个人的精力和效率都提高了！推荐大家尝试"5点起床法"，确实很有效。',
          images: ['/images/posts/post2.jpg', '/images/posts/post3.jpg'],
          tags: ['早起', '生活方式'],
          likes: 128,
          comments: 32,
          isLiked: true,
          createdAt: '2023-10-15 05:45',
          habitName: '早起习惯'
        },
        {
          id: '3',
          content: '早晨冥想20分钟，整个人都平静下来了。推荐大家尝试"正念呼吸法"，对缓解焦虑真的很有效！',
          images: [],
          tags: ['冥想', '心理健康'],
          likes: 89,
          comments: 15,
          isLiked: false,
          createdAt: '2023-10-14 07:30',
          habitName: '冥想习惯'
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
   * 加载习惯列表
   */
  loadHabits(isRefresh = false) {
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
    this.setData({ loadingMore: true });
    
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
          progress: 85,
          streak: 15
        },
        {
          id: 'habit2',
          name: '晨间冥想',
          icon: '/images/habits/meditation.png',
          color: '#67C23A',
          frequency: '每天',
          progress: 60,
          streak: 8
        },
        {
          id: 'habit3',
          name: '每周健身',
          icon: '/images/habits/workout.png',
          color: '#E6A23C',
          frequency: '每周3次',
          progress: 75,
          streak: 4
        }
      ];
      
      // 模拟分页
      const currentHabits = this.data.habits;
      const newHabits = isRefresh ? mockHabits : [...currentHabits, ...mockHabits];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page.habits < 2; // 模拟只有2页数据
      
      this.setData({
        habits: newHabits,
        loadingMore: false,
        'hasMore.habits': hasMore,
        'page.habits': this.data.page.habits + 1
      });
    }, 1000);
  },

  /**
   * 加载成就列表
   */
  loadAchievements(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        'page.achievements': 1,
        achievements: [],
        'hasMore.achievements': true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore.achievements && !isRefresh) {
      return;
    }
    
    // 显示加载中
    this.setData({ loadingMore: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟成就数据
      const mockAchievements = [
        {
          id: 'achievement1',
          name: '坚持不懈',
          icon: '/images/achievements/achievement1.png',
          description: '连续打卡30天',
          unlocked: true,
          unlockedAt: '2023-09-15'
        },
        {
          id: 'achievement2',
          name: '早起达人',
          icon: '/images/achievements/achievement2.png',
          description: '连续30天5点前起床',
          unlocked: false,
          progress: 60
        },
        {
          id: 'achievement3',
          name: '阅读专家',
          icon: '/images/achievements/achievement3.png',
          description: '累计阅读100小时',
          unlocked: false,
          progress: 45
        }
      ];
      
      // 模拟分页
      const currentAchievements = this.data.achievements;
      const newAchievements = isRefresh ? mockAchievements : [...currentAchievements, ...mockAchievements];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page.achievements < 2; // 模拟只有2页数据
      
      this.setData({
        achievements: newAchievements,
        loadingMore: false,
        'hasMore.achievements': hasMore,
        'page.achievements': this.data.page.achievements + 1
      });
    }, 1000);
  },

  /**
   * 关注/取消关注
   */
  toggleFollow() {
    if (this.data.isSelf) return;
    
    const isFollowing = !this.data.isFollowing;
    
    this.setData({ isFollowing });
    
    wx.showToast({
      title: isFollowing ? '已关注' : '已取消关注',
      icon: 'success'
    });
    
    // TODO: 发送请求到服务器更新关注状态
  },

  /**
   * 编辑资料
   */
  editProfile() {
    wx.navigateTo({
      url: '/pages/profile/edit/edit'
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
   * 查看动态详情
   */
  viewPostDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/post-detail/post-detail?id=${id}`
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
   * 查看习惯详情
   */
  viewHabitDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/habits/habit-detail/habit-detail?id=${id}`
    });
  },

  /**
   * 查看成就详情
   */
  viewAchievementDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/profile/achievements/detail/detail?id=${id}`
    });
  },

  /**
   * 创建动态
   */
  createPost() {
    wx.navigateTo({
      url: '/packageCommunity/pages/post/post'
    });
  },

  /**
   * 创建习惯
   */
  createHabit() {
    wx.navigateTo({
      url: '/pages/habits/create-habit/create-habit'
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
    this.loadUserProfile();
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
      case 'habits':
        if (this.data.hasMore.habits) {
          this.loadHabits();
        }
        break;
      case 'achievements':
        if (this.data.hasMore.achievements) {
          this.loadAchievements();
        }
        break;
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { user } = this.data;
    
    if (user) {
      return {
        title: `${user.name}的个人主页`,
        path: `/packageCommunity/pages/user-profile/user-profile?id=${user.id}`,
        imageUrl: user.avatar
      };
    }
    
    return {
      title: '习惯打卡',
      path: '/pages/index/index'
    };
  }
}) 
