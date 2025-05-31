/**
 * pages/community/groups/groups.js
 * 社区小组页面
 */
import { communityAPI } from '../../../services/api';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'all', // all, joined, recommended
    groups: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    limit: 10,
    showSearch: false,
    searchKeyword: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 加载小组数据
    this.loadGroups(true);
  },

  /**
   * 加载小组数据
   */
  loadGroups(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({ page: 1 });
    }
    
    // 显示加载中
    this.setData({
      loading: this.data.groups.length === 0,
      loadingMore: this.data.groups.length > 0
    });
    
    // 构建请求参数
    const params = {
      page: this.data.page,
      limit: this.data.limit,
      type: this.data.activeTab,
      keyword: this.data.searchKeyword || undefined
    };
    
    // 调用API获取小组数据
    communityAPI.getGroups(params)
      .then(result => {
        const { groups, pagination } = result;
        
        // 更新数据
        this.setData({
          groups: isRefresh ? groups : [...this.data.groups, ...groups],
          loading: false,
          loadingMore: false,
          hasMore: this.data.page < pagination.pages,
          page: this.data.page + 1
        });
      })
      .catch(error => {
        console.error('获取小组列表失败:', error);
        
        // 显示错误提示
        wx.showToast({
          title: '获取小组列表失败',
          icon: 'none'
        });
        
        this.setData({
          loading: false,
          loadingMore: false
        });
      });
  },

  /**
   * 切换标签
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    if (tab !== this.data.activeTab) {
      this.setData({ activeTab: tab }, () => {
        this.loadGroups(true);
      });
    }
  },

  /**
   * 显示搜索输入框
   */
  showSearchInput() {
    this.setData({ showSearch: true });
  },

  /**
   * 隐藏搜索输入框
   */
  hideSearchInput() {
    this.setData({ 
      showSearch: false,
      searchKeyword: ''
    }, () => {
      this.loadGroups(true);
    });
  },

  /**
   * 输入搜索关键词
   */
  inputSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  /**
   * 执行搜索
   */
  doSearch() {
    this.loadGroups(true);
  },

  /**
   * 查看小组详情
   */
  viewGroupDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community/group/group?id=${id}`
    });
  },

  /**
   * 加入/退出小组
   */
  toggleJoinGroup(e) {
    const { id, index } = e.currentTarget.dataset;
    const group = this.data.groups[index];
    const isJoined = group.isJoined;
    
    // 显示加载中
    wx.showLoading({
      title: isJoined ? '退出中...' : '加入中...'
    });
    
    // 调用API
    const apiCall = isJoined 
      ? communityAPI.leaveGroup(id) 
      : communityAPI.joinGroup(id);
    
    apiCall
      .then(() => {
        // 更新本地数据
        const groups = this.data.groups;
        groups[index].isJoined = !isJoined;
        groups[index].membersCount = isJoined 
          ? Math.max(0, groups[index].membersCount - 1)
          : groups[index].membersCount + 1;
        
        this.setData({ groups });
        
        // 显示成功提示
        wx.showToast({
          title: isJoined ? '已退出小组' : '已加入小组',
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
   * 创建小组
   */
  createGroup() {
    wx.navigateTo({
      url: '/pages/community/group/create/create'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadGroups(true);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadGroups();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '习惯打卡社区 - 小组',
      path: '/pages/community/groups/groups'
    };
  }
}) 
