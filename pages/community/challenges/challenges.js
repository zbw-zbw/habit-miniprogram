const utils = require('../../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    hasMore: true,
    activeTab: 'all', // all, joined, popular, new
    challenges: [],
    page: 1,
    pageSize: 10,
    searchKeyword: '',
    showSearch: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 如果有传入的标签参数，自动切换到该标签
    if (options.tab && ['all', 'joined', 'popular', 'new'].includes(options.tab)) {
      this.setData({
        activeTab: options.tab
      });
    }
    
    // 加载挑战数据
    this.loadChallenges();
  },
  
  /**
   * 加载挑战数据
   */
  loadChallenges(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        page: 1,
        challenges: [],
        hasMore: true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore && !isRefresh) {
      return;
    }
    
    // 显示加载中
    this.setData({
      loading: true
    });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟挑战数据
      const mockChallenges = [
        {
          id: 'challenge1',
          title: '21天阅读挑战',
          description: '每天阅读30分钟，持续21天，培养阅读习惯。',
          image: '/images/challenges/reading.jpg',
          totalDays: 21,
          participantsCount: 1358,
          isJoined: false,
          progress: 0,
          tags: ['阅读', '自我提升']
        },
        {
          id: 'challenge2',
          title: '早起俱乐部',
          description: '每天早上6点起床，坚持30天，改变你的生活节奏。',
          image: '/images/challenges/morning.jpg',
          totalDays: 30,
          participantsCount: 2546,
          isJoined: true,
          progress: 40,
          tags: ['早起', '生活习惯']
        },
        {
          id: 'challenge3',
          title: '每日冥想',
          description: '每天冥想15分钟，持续14天，提升专注力和心灵平静。',
          image: '/images/challenges/meditation.jpg',
          totalDays: 14,
          participantsCount: 863,
          isJoined: false,
          progress: 0,
          tags: ['冥想', '心灵成长']
        },
        {
          id: 'challenge4',
          title: '健身打卡',
          description: '每天进行30分钟的有氧运动，持续28天，塑造健康体魄。',
          image: '/images/challenges/fitness.jpg',
          totalDays: 28,
          participantsCount: 1762,
          isJoined: false,
          progress: 0,
          tags: ['健身', '运动']
        },
        {
          id: 'challenge5',
          title: '写作练习',
          description: '每天写作500字，持续30天，提升表达能力和思考深度。',
          image: '/images/challenges/writing.jpg',
          totalDays: 30,
          participantsCount: 743,
          isJoined: true,
          progress: 60,
          tags: ['写作', '创作']
        }
      ];
      
      // 根据当前标签筛选数据
      let filteredChallenges = [...mockChallenges];
      
      switch (this.data.activeTab) {
        case 'joined':
          filteredChallenges = filteredChallenges.filter(item => item.isJoined);
          break;
        case 'popular':
          filteredChallenges.sort((a, b) => b.participantsCount - a.participantsCount);
          break;
        case 'new':
          // 假设有创建时间字段，这里简单模拟
          filteredChallenges.reverse();
          break;
      }
      
      // 如果有搜索关键词，进行筛选
      if (this.data.searchKeyword) {
        const keyword = this.data.searchKeyword.toLowerCase();
        filteredChallenges = filteredChallenges.filter(item => 
          item.title.toLowerCase().includes(keyword) || 
          item.description.toLowerCase().includes(keyword) ||
          item.tags.some(tag => tag.toLowerCase().includes(keyword))
        );
      }
      
      // 模拟分页
      const currentChallenges = this.data.challenges;
      const newChallenges = isRefresh ? filteredChallenges : [...currentChallenges, ...filteredChallenges];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page < 3; // 模拟只有3页数据
      
      this.setData({
        challenges: newChallenges,
        loading: false,
        hasMore: hasMore,
        page: this.data.page + 1
      });
    }, 1000);
  },
  
  /**
   * 切换标签
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    if (tab !== this.data.activeTab) {
      this.setData({
        activeTab: tab,
        page: 1,
        challenges: [],
        hasMore: true
      });
      
      // 重新加载数据
      this.loadChallenges();
    }
  },
  
  /**
   * 查看挑战详情
   */
  viewChallengeDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/packageCommunity/pages/challenge/challenge?id=${id}`
    });
  },
  
  /**
   * 参加/退出挑战
   */
  toggleJoinChallenge(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    // 防止事件冒泡
    e.stopPropagation();
    
    // 获取当前挑战
    const challenges = this.data.challenges;
    const challenge = challenges[index];
    
    // 切换参与状态
    if (!challenge.isJoined) {
      // 如果当前未参加，显示确认对话框
      wx.showModal({
        title: '参加挑战',
        content: `确定要参加"${challenge.title}"挑战吗？参加后需要按照挑战规则完成任务。`,
        confirmText: '参加',
        success: (res) => {
          if (res.confirm) {
            // 更新参与状态
            challenges[index].isJoined = true;
            challenges[index].participantsCount += 1;
            
            this.setData({
              challenges: challenges
            });
            
            wx.showToast({
              title: '成功参加挑战',
              icon: 'success'
            });
          }
        }
      });
    } else {
      // 如果当前已参加，显示确认退出对话框
      wx.showModal({
        title: '退出挑战',
        content: '确定要退出此挑战吗？退出后将失去当前的进度。',
        confirmText: '退出',
        confirmColor: '#F56C6C',
        success: (res) => {
          if (res.confirm) {
            // 更新参与状态
            challenges[index].isJoined = false;
            challenges[index].participantsCount -= 1;
            
            this.setData({
              challenges: challenges
            });
            
            wx.showToast({
              title: '已退出挑战',
              icon: 'success'
            });
          }
        }
      });
    }
  },
  
  /**
   * 显示搜索框
   */
  showSearchInput() {
    this.setData({
      showSearch: true
    });
  },
  
  /**
   * 隐藏搜索框
   */
  hideSearchInput() {
    this.setData({
      showSearch: false,
      searchKeyword: ''
    });
    
    // 重新加载数据
    this.loadChallenges(true);
  },
  
  /**
   * 输入搜索关键词
   */
  inputSearch(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },
  
  /**
   * 执行搜索
   */
  doSearch() {
    // 重新加载数据
    this.loadChallenges(true);
  },
  
  /**
   * 创建新挑战
   */
  createChallenge() {
    wx.navigateTo({
      url: '/pages/community/create-challenge/create-challenge'
    });
  },
  
  /**
   * 查看标签
   */
  viewTag(e) {
    const tag = e.currentTarget.dataset.tag;
    
    // 防止事件冒泡
    e.stopPropagation();
    
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
    this.loadChallenges(true);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadChallenges();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '一起来参加习惯挑战，培养好习惯！',
      path: '/pages/community/challenges/challenges'
    };
  }
}) 
