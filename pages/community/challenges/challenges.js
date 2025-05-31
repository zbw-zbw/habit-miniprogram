/**
 * pages/community/challenges/challenges.js
 * 社区挑战页面
 */
import { communityAPI } from '../../../services/api';

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
    limit: 10,
    searchKeyword: '',
    showSearch: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 如果有标签参数，设置初始标签
    if (options.tab && ['all', 'joined', 'popular', 'new'].includes(options.tab)) {
      this.setData({ activeTab: options.tab });
    }
    
    // 如果有标签参数，直接搜索该标签
    if (options.tag) {
      this.setData({ 
        showSearch: true,
        searchKeyword: options.tag
      });
    }
    
    // 加载挑战数据
    this.loadChallenges(true);
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
    
    // 构建请求参数
    const params = {
      page: this.data.page,
      limit: this.data.limit,
      type: this.data.activeTab,
      keyword: this.data.searchKeyword || undefined
    };
    
    // 调用API获取挑战数据
    communityAPI.getChallenges(params)
      .then(result => {
        const { challenges, pagination } = result;
        
        // 更新数据
        this.setData({
          challenges: isRefresh ? challenges : [...this.data.challenges, ...challenges],
          loading: false,
          hasMore: this.data.page < pagination.pages,
          page: this.data.page + 1
        });
      })
      .catch(error => {
        console.error('获取挑战列表失败:', error);
        
        // 显示错误提示
        wx.showToast({
          title: '获取挑战列表失败',
          icon: 'none'
        });
        
        this.setData({
          loading: false
        });
      });
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
      url: `/pages/community/challenge/challenge?id=${id}`
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
    const isJoined = challenge.isJoined;
    
    // 显示加载中
    wx.showLoading({
      title: isJoined ? '退出中...' : '参加中...'
    });
    
    // 调用API
    const apiCall = isJoined 
      ? communityAPI.leaveChallenge(id) 
      : communityAPI.joinChallenge(id);
    
    apiCall
      .then(() => {
        // 更新本地数据
        challenges[index].isJoined = !isJoined;
        challenges[index].participantsCount = isJoined 
          ? Math.max(0, challenges[index].participantsCount - 1)
          : challenges[index].participantsCount + 1;
        
        this.setData({ challenges });
        
        // 显示成功提示
        wx.showToast({
          title: isJoined ? '已退出挑战' : '已参加挑战',
          icon: 'success'
        });
      })
      .catch(error => {
        console.error('操作失败:', error);
        
        // 显示错误提示
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
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
      url: '/pages/community/challenges/create/create'
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
