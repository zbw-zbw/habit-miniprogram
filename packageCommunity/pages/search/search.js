// packageCommunity/pages/search/search.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    keyword: '',
    activeTab: 'all', // all, users, posts, habits, challenges
    loading: false,
    hasResult: false,
    searchHistory: [],
    hotKeywords: ['早起', '阅读', '运动', '冥想', '写作', '学习', '健康饮食'],
    results: {
      users: [],
      posts: [],
      habits: [],
      challenges: []
    },
    hasMore: {
      users: false,
      posts: false,
      habits: false,
      challenges: false
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取搜索历史
    this.loadSearchHistory();
    
    // 如果有传入的关键词参数，自动执行搜索
    if (options.keyword) {
      this.setData({ keyword: options.keyword });
      this.search();
    }
  },

  /**
   * 加载搜索历史
   */
  loadSearchHistory() {
    // 从本地存储获取搜索历史
    const history = wx.getStorageSync('searchHistory') || [];
    this.setData({ searchHistory: history });
  },

  /**
   * 保存搜索历史
   */
  saveSearchHistory(keyword) {
    if (!keyword.trim()) return;
    
    let history = this.data.searchHistory;
    
    // 如果已存在相同关键词，先移除
    history = history.filter(item => item !== keyword);
    
    // 添加到历史记录开头
    history.unshift(keyword);
    
    // 限制历史记录数量
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    // 更新数据和本地存储
    this.setData({ searchHistory: history });
    wx.setStorageSync('searchHistory', history);
  },

  /**
   * 清空搜索历史
   */
  clearSearchHistory() {
    wx.showModal({
      title: '清空搜索历史',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ searchHistory: [] });
          wx.setStorageSync('searchHistory', []);
        }
      }
    });
  },

  /**
   * 输入搜索关键词
   */
  inputKeyword(e) {
    this.setData({ keyword: e.detail.value });
  },

  /**
   * 清空搜索关键词
   */
  clearKeyword() {
    this.setData({ 
      keyword: '',
      hasResult: false
    });
  },

  /**
   * 点击搜索历史或热门关键词
   */
  tapKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.search();
  },

  /**
   * 执行搜索
   */
  search() {
    const { keyword } = this.data;
    
    if (!keyword.trim()) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      });
      return;
    }
    
    // 保存搜索历史
    this.saveSearchHistory(keyword);
    
    // 显示加载中
    this.setData({ 
      loading: true,
      hasResult: false,
      results: {
        users: [],
        posts: [],
        habits: [],
        challenges: []
      },
      hasMore: {
        users: false,
        posts: false,
        habits: false,
        challenges: false
      }
    });
    
    // 模拟搜索延迟
    setTimeout(() => {
      // 模拟搜索结果
      const mockResults = {
        users: [
          {
            id: '101',
            name: '李小华',
            avatar: '/images/avatars/avatar1.png',
            bio: '热爱阅读和写作的文艺青年',
            isFollowing: true
          },
          {
            id: '102',
            name: '张明',
            avatar: '/images/avatars/avatar2.png',
            bio: '运动健身爱好者，每日5公里跑步',
            isFollowing: false
          }
        ],
        posts: [
          {
            id: '1',
            userId: '101',
            userName: '李小华',
            userAvatar: '/images/avatars/avatar1.png',
            content: '今天完成了《原子习惯》的阅读，真的很有启发！',
            images: ['/images/posts/post1.jpg'],
            likes: 256,
            comments: 48,
            createdAt: '2023-10-16 08:23'
          },
          {
            id: '3',
            userId: '103',
            userName: '王丽',
            userAvatar: '/images/avatars/avatar3.png',
            content: '早晨冥想20分钟，整个人都平静下来了。',
            images: [],
            likes: 89,
            comments: 15,
            createdAt: '2023-10-14 07:30'
          }
        ],
        habits: [
          {
            id: 'habit1',
            name: '每日阅读',
            icon: '/images/habits/reading.png',
            color: '#4F7CFF',
            frequency: '每天',
            streak: 15
          },
          {
            id: 'habit2',
            name: '晨间冥想',
            icon: '/images/habits/meditation.png',
            color: '#67C23A',
            frequency: '每天',
            streak: 8
          }
        ],
        challenges: [
          {
            id: 'challenge1',
            title: '21天阅读挑战',
            image: '/images/challenges/reading.jpg',
            participants: 1358,
            isJoined: false
          },
          {
            id: 'challenge3',
            title: '每日冥想',
            image: '/images/challenges/meditation.jpg',
            participants: 863,
            isJoined: false
          }
        ]
      };
      
      // 根据关键词过滤结果
      const keyword = this.data.keyword.toLowerCase();
      
      const filteredResults = {
        users: mockResults.users.filter(item => 
          item.name.toLowerCase().includes(keyword) || 
          item.bio.toLowerCase().includes(keyword)
        ),
        posts: mockResults.posts.filter(item => 
          item.content.toLowerCase().includes(keyword) || 
          item.userName.toLowerCase().includes(keyword)
        ),
        habits: mockResults.habits.filter(item => 
          item.name.toLowerCase().includes(keyword)
        ),
        challenges: mockResults.challenges.filter(item => 
          item.title.toLowerCase().includes(keyword)
        )
      };
      
      // 判断是否有结果
      const hasResult = 
        filteredResults.users.length > 0 || 
        filteredResults.posts.length > 0 || 
        filteredResults.habits.length > 0 || 
        filteredResults.challenges.length > 0;
      
      // 更新数据
      this.setData({
        loading: false,
        hasResult: hasResult,
        results: filteredResults,
        hasMore: {
          users: filteredResults.users.length >= 2,
          posts: filteredResults.posts.length >= 2,
          habits: filteredResults.habits.length >= 2,
          challenges: filteredResults.challenges.length >= 2
        }
      });
    }, 1000);
  },

  /**
   * 切换标签
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  /**
   * 查看更多结果
   */
  viewMore(e) {
    const type = e.currentTarget.dataset.type;
    const { keyword } = this.data;
    
    wx.navigateTo({
      url: `/packageCommunity/pages/search-result/search-result?keyword=${keyword}&type=${type}`
    });
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
   * 关注/取消关注用户
   */
  toggleFollow(e) {
    const { id, index } = e.currentTarget.dataset;
    
    // 防止事件冒泡
    e.stopPropagation();
    
    // 更新关注状态
    const users = this.data.results.users;
    users[index].isFollowing = !users[index].isFollowing;
    
    this.setData({
      'results.users': users
    });
    
    // 提示用户
    wx.showToast({
      title: users[index].isFollowing ? '已关注' : '已取消关注',
      icon: 'success'
    });
    
    // TODO: 发送请求到服务器更新关注状态
  }
}) 
