Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    loadingMore: false,
    hasMore: true,
    searchKeyword: '',
    showSearch: false,
    activeTab: 'all', // all, joined, recommended
    groups: [],
    page: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadGroups();
  },

  /**
   * 加载小组列表
   */
  loadGroups(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        page: 1,
        groups: [],
        hasMore: true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore && !isRefresh) {
      return;
    }
    
    // 显示加载中
    this.setData({
      loading: this.data.groups.length === 0,
      loadingMore: this.data.groups.length > 0
    });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟小组数据
      const mockGroups = [
        {
          id: '1',
          name: '早起俱乐部',
          avatar: '/images/avatars/avatar1.png',
          coverImage: '/images/avatars/avatar1.png',
          membersCount: 256,
          description: '每天早起，养成健康生活习惯。分享早起心得，互相监督打卡。',
          isJoined: true
        },
        {
          id: '2',
          name: '读书分享会',
          avatar: '/images/avatars/avatar2.png',
          coverImage: '/images/avatars/avatar2.png',
          membersCount: 189,
          description: '分享读书心得，推荐好书。每周一本书，每天一小时阅读。',
          isJoined: false
        },
        {
          id: '3',
          name: '健身达人',
          avatar: '/images/avatars/avatar3.png',
          coverImage: '/images/avatars/avatar3.png',
          membersCount: 324,
          description: '一起锻炼，分享健身经验。无论你是健身新手还是老手，都能在这里找到志同道合的朋友。',
          isJoined: true
        },
        {
          id: '4',
          name: '冥想修行',
          avatar: '/images/avatars/avatar4.png',
          coverImage: '/images/avatars/avatar4.png',
          membersCount: 156,
          description: '每天冥想，提升专注力和幸福感。分享冥想技巧和心得体会。',
          isJoined: false
        },
        {
          id: '5',
          name: '学习打卡',
          avatar: '/images/avatars/avatar5.png',
          coverImage: '/images/avatars/avatar5.png',
          membersCount: 412,
          description: '互相监督学习，分享学习方法和资源。每天打卡，坚持学习。',
          isJoined: false
        }
      ];
      
      // 根据标签筛选
      let filteredGroups = [...mockGroups];
      if (this.data.activeTab === 'joined') {
        filteredGroups = filteredGroups.filter(group => group.isJoined);
      } else if (this.data.activeTab === 'recommended') {
        // 模拟推荐逻辑，这里简单地随机排序
        filteredGroups.sort(() => Math.random() - 0.5);
      }
      
      // 根据搜索关键词筛选
      if (this.data.searchKeyword) {
        const keyword = this.data.searchKeyword.toLowerCase();
        filteredGroups = filteredGroups.filter(group => 
          group.name.toLowerCase().includes(keyword) || 
          group.description.toLowerCase().includes(keyword)
        );
      }
      
      // 模拟分页
      const currentGroups = this.data.groups;
      const newGroups = isRefresh ? filteredGroups : [...currentGroups, ...filteredGroups];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page < 3; // 模拟只有3页数据
      
      this.setData({
        groups: newGroups,
        loading: false,
        loadingMore: false,
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
      url: `/packageCommunity/pages/group/group?id=${id}`
    });
  },

  /**
   * 加入/退出小组
   */
  toggleJoinGroup(e) {
    const { id, index } = e.currentTarget.dataset;
    const groups = this.data.groups;
    
    // 切换加入状态
    groups[index].isJoined = !groups[index].isJoined;
    groups[index].membersCount = groups[index].isJoined ? 
      groups[index].membersCount + 1 : 
      groups[index].membersCount - 1;
    
    this.setData({ groups });
    
    // 提示用户
    wx.showToast({
      title: groups[index].isJoined ? '已加入小组' : '已退出小组',
      icon: 'success'
    });
    
    // TODO: 发送请求到服务器更新加入状态
  },

  /**
   * 创建小组
   */
  createGroup() {
    wx.showToast({
      title: '创建小组功能开发中',
      icon: 'none'
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
      title: '发现有趣的小组',
      path: '/pages/community/groups/groups'
    };
  }
}) 
