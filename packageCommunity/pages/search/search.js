// packageCommunity/pages/search/search.js
const { communityAPI } = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    keyword: '',
    hasSearched: false,
    loading: false,
    loadingMore: false,
    hasMore: true,
    activeTab: 'all',
    searchHistory: [],
    hotSearches: ['习惯养成', '早起', '阅读', '运动', '冥想', '学习', '健康饮食', '写作'],
    results: [],
    page: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 如果有传入的关键词，自动搜索
    if (options.keyword) {
      this.setData({ keyword: options.keyword }, () => {
        this.doSearch();
      });
    }
    
    // 加载搜索历史
    this.loadSearchHistory();
  },

  /**
   * 加载搜索历史
   */
  loadSearchHistory() {
    const searchHistory = wx.getStorageSync('searchHistory') || [];
    this.setData({ searchHistory });
  },

  /**
   * 保存搜索历史
   */
  saveSearchHistory(keyword) {
    if (!keyword.trim()) return;
    
    let searchHistory = wx.getStorageSync('searchHistory') || [];
    
    // 如果已存在，先删除旧的
    const index = searchHistory.indexOf(keyword);
    if (index !== -1) {
      searchHistory.splice(index, 1);
    }
    
    // 添加到最前面
    searchHistory.unshift(keyword);
    
    // 最多保存10条
    if (searchHistory.length > 10) {
      searchHistory = searchHistory.slice(0, 10);
    }
    
    // 保存到本地
    wx.setStorageSync('searchHistory', searchHistory);
    
    // 更新页面
    this.setData({ searchHistory });
  },

  /**
   * 清空搜索历史
   */
  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory');
          this.setData({ searchHistory: [] });
        }
      }
    });
  },

  /**
   * 输入关键词
   */
  inputKeyword(e) {
    this.setData({ keyword: e.detail.value });
  },

  /**
   * 清空关键词
   */
  clearKeyword() {
    this.setData({
      keyword: '',
      hasSearched: false,
      results: []
    });
  },

  /**
   * 使用历史关键词
   */
  useHistoryKeyword(e) {
    const { keyword } = e.currentTarget.dataset;
    this.setData({ keyword }, () => {
      this.doSearch();
    });
  },

  /**
   * 使用热门关键词
   */
  useHotKeyword(e) {
    const { keyword } = e.currentTarget.dataset;
    this.setData({ keyword }, () => {
      this.doSearch();
    });
  },

  /**
   * 执行搜索
   */
  doSearch() {
    const { keyword } = this.data;
    
    if (!keyword.trim()) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      });
      return;
    }
    
    // 保存搜索历史
    this.saveSearchHistory(keyword.trim());
    
    // 重置搜索状态
    this.setData({
      hasSearched: true,
      loading: true,
      results: [],
      page: 1,
      hasMore: true
    });
    
    // 执行搜索
    this.searchResults();
  },

  /**
   * 搜索结果
   */
  searchResults(isLoadMore = false) {
    const { keyword, activeTab, page } = this.data;
    
    // 如果是加载更多，显示加载更多状态
    if (isLoadMore) {
      this.setData({ loadingMore: true });
    }
    
    // 构建请求参数
    const params = {
      keyword: keyword,
      type: activeTab === 'all' ? undefined : activeTab,
      page: page,
      limit: 10
    };
    
    // 调用搜索API
    communityAPI.search(params)
      .then(result => {
        console.log('搜索结果:', result);
        
        // 处理分页数据
        const { items, total, page: currentPage, limit } = result;
        const hasMore = currentPage * limit < total;
        
        // 添加新数据到列表
        const currentResults = this.data.results;
        const newResults = isLoadMore ? [...currentResults, ...items] : items;
        
        this.setData({
          results: newResults,
          loading: false,
          loadingMore: false,
          hasMore: hasMore,
          page: page + 1
        });
      })
      .catch(error => {
        console.error('搜索失败:', error);
        this.setData({ 
          loading: false, 
          loadingMore: false 
        });
        
        // 显示错误提示
        wx.showToast({
          title: '搜索失败，请重试',
          icon: 'none'
        });
        
        // 如果API调用失败，使用模拟数据（开发阶段过渡用）
        this.searchWithMockData(isLoadMore);
      });
  },
  
  /**
   * 使用模拟数据搜索（API不可用时的备选方案）
   */
  searchWithMockData(isLoadMore = false) {
    const { activeTab, page } = this.data;
    
    // 模拟搜索结果
    let mockResults = [];
    
    // 根据标签页过滤结果
    switch (activeTab) {
      case 'all':
        mockResults = this.getMockResults();
        break;
      case 'posts':
        mockResults = this.getMockResults().filter(item => item.type === 'post');
        break;
      case 'users':
        mockResults = this.getMockResults().filter(item => item.type === 'user');
        break;
      case 'habits':
        mockResults = this.getMockResults().filter(item => item.type === 'habit');
        break;
      case 'topics':
        mockResults = this.getMockResults().filter(item => item.type === 'topic');
        break;
    }
    
    // 模拟分页
    const currentResults = this.data.results;
    const newResults = isLoadMore ? [...currentResults, ...mockResults] : mockResults;
    
    // 判断是否还有更多数据
    const hasMore = page < 3; // 模拟只有3页数据
    
    this.setData({
      results: newResults,
      loading: false,
      loadingMore: false,
      hasMore: hasMore,
      page: page + 1
    });
  },

  /**
   * 获取模拟搜索结果
   */
  getMockResults() {
    const { keyword } = this.data;
    
    // 模拟搜索结果
    return [
      // 动态结果
      {
        id: 'post1',
        type: 'post',
        userId: '101',
        userName: '李小华',
        userAvatar: '/images/avatars/avatar1.png',
        content: `今天完成了《原子习惯》的阅读，真的很有启发！分享一个金句："习惯是复利的魔力：1%的微小改变，带来巨大的人生转变。"`,
        likes: 256,
        comments: 48,
        time: '2小时前'
      },
      {
        id: 'post2',
        type: 'post',
        userId: '102',
        userName: '张明',
        userAvatar: '/images/avatars/avatar2.png',
        content: `坚持早起一个月了，感觉整个人的精力和效率都提高了！推荐大家尝试"5点起床法"，确实很有效。`,
        likes: 128,
        comments: 32,
        time: '3小时前'
      },
      
      // 用户结果
      {
        id: '101',
        type: 'user',
        name: '李小华',
        avatar: '/images/avatars/avatar1.png',
        bio: '热爱阅读，每天学习一点点',
        isFollowing: false
      },
      {
        id: '102',
        type: 'user',
        name: '张明',
        avatar: '/images/avatars/avatar2.png',
        bio: '早起俱乐部创始人，5点起床法实践者',
        isFollowing: true
      },
      
      // 习惯结果
      {
        id: 'habit1',
        type: 'habit',
        name: '每日阅读',
        icon: '/images/habits/reading.png',
        color: '#4F7CFF',
        users: 2568,
        isAdded: false
      },
      {
        id: 'habit2',
        type: 'habit',
        name: '早起打卡',
        icon: '/images/habits/wakeup.png',
        color: '#67C23A',
        users: 3721,
        isAdded: true
      },
      
      // 话题结果
      {
        id: 'topic1',
        type: 'topic',
        name: '习惯养成',
        image: '/images/topics/habit.png',
        posts: 1256
      },
      {
        id: 'topic2',
        type: 'topic',
        name: '早起打卡',
        image: '/images/topics/wakeup.png',
        posts: 986
      }
    ];
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    if (tab !== this.data.activeTab) {
      this.setData({
        activeTab: tab,
        results: [],
        page: 1,
        hasMore: true
      }, () => {
        this.searchResults();
      });
    }
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
   * 关注/取消关注用户
   */
  toggleFollow(e) {
    const { id, index } = e.currentTarget.dataset;
    const results = this.data.results;
    const userIndex = results.findIndex(item => item.id === id && item.type === 'user');
    
    if (userIndex !== -1) {
      results[userIndex].isFollowing = !results[userIndex].isFollowing;
      this.setData({ results });
      
      wx.showToast({
        title: results[userIndex].isFollowing ? '已关注' : '已取消关注',
        icon: 'success'
      });
    }
  },

  /**
   * 添加/移除习惯
   */
  toggleAddHabit(e) {
    const { id, index } = e.currentTarget.dataset;
    const results = this.data.results;
    const habitIndex = results.findIndex(item => item.id === id && item.type === 'habit');
    
    if (habitIndex !== -1) {
      results[habitIndex].isAdded = !results[habitIndex].isAdded;
      this.setData({ results });
      
      wx.showToast({
        title: results[habitIndex].isAdded ? '已添加' : '已移除',
        icon: 'success'
      });
    }
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
      url: `/pages/habits/habit-detail/habit-detail?id=${id}`
    });
  },

  /**
   * 查看话题详情
   */
  viewTopicDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/topic/topic?id=${id}`
    });
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading && !this.data.loadingMore) {
      this.searchResults(true);
    }
  }
}) 
