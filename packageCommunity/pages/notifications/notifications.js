Page({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'all',
    loading: true,
    loadingMore: false,
    hasMore: true,
    notifications: [],
    page: 1,
    pageSize: 20,
    unreadCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 如果有指定标签页，切换到该标签页
    if (options.tab && ['all', 'like', 'comment', 'follow'].includes(options.tab)) {
      this.setData({ activeTab: options.tab });
    }
    
    this.loadNotifications();
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    if (tab !== this.data.activeTab) {
      this.setData({
        activeTab: tab,
        notifications: [],
        page: 1,
        hasMore: true
      }, () => {
        this.loadNotifications();
      });
    }
  },

  /**
   * 加载通知列表
   */
  loadNotifications(isRefresh = false) {
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        page: 1,
        notifications: [],
        hasMore: true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore && !isRefresh) {
      return;
    }
    
    // 显示加载中
    this.setData({
      loading: this.data.notifications.length === 0,
      loadingMore: this.data.notifications.length > 0
    });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 根据当前标签页获取不同类型的通知
      let mockNotifications = [];
      
      switch (this.data.activeTab) {
        case 'all':
          mockNotifications = this.getMockNotifications();
          break;
        case 'like':
          mockNotifications = this.getMockNotifications().filter(item => item.type === 'like');
          break;
        case 'comment':
          mockNotifications = this.getMockNotifications().filter(item => item.type === 'comment');
          break;
        case 'follow':
          mockNotifications = this.getMockNotifications().filter(item => item.type === 'follow');
          break;
      }
      
      // 模拟分页
      const currentNotifications = this.data.notifications;
      const newNotifications = isRefresh ? mockNotifications : [...currentNotifications, ...mockNotifications];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page < 3; // 模拟只有3页数据
      
      this.setData({
        notifications: newNotifications,
        loading: false,
        loadingMore: false,
        hasMore: hasMore,
        page: this.data.page + 1
      });
    }, 1000);
  },

  /**
   * 获取模拟通知数据
   */
  getMockNotifications() {
    return [
      {
        id: '1',
        type: 'like',
        userId: '101',
        userName: '李小华',
        userAvatar: '/images/avatars/avatar1.png',
        actionText: '赞了你的动态',
        targetText: '',
        previewText: '今天完成了《原子习惯》的阅读，真的很有启发！分享一个金句："习惯是复利的魔力：1%的微小改变，带来巨大的人生转变。"',
        targetImage: '/images/posts/post1.jpg',
        targetId: 'post1',
        time: '2分钟前',
        isRead: false
      },
      {
        id: '2',
        type: 'comment',
        userId: '102',
        userName: '张明',
        userAvatar: '/images/avatars/avatar2.png',
        actionText: '评论了你的动态',
        targetText: '',
        previewText: '这本书我也在读，确实很棒！推荐你也看看《深度工作》，两本书结合起来效果更好。',
        targetImage: '/images/posts/post1.jpg',
        targetId: 'post1',
        time: '10分钟前',
        isRead: false
      },
      {
        id: '3',
        type: 'follow',
        userId: '103',
        userName: '王丽',
        userAvatar: '/images/avatars/avatar3.png',
        actionText: '关注了你',
        targetText: '',
        previewText: '',
        targetImage: '',
        targetId: '',
        time: '1小时前',
        isRead: true
      },
      {
        id: '4',
        type: 'like',
        userId: '104',
        userName: '赵强',
        userAvatar: '/images/avatars/avatar4.png',
        actionText: '赞了你的评论',
        targetText: '在《晨间日记的奇迹》',
        previewText: '早起确实需要一个有效的方法，我现在用番茄工作法结合这个习惯，效果很好！',
        targetImage: '',
        targetId: 'comment1',
        time: '2小时前',
        isRead: true
      },
      {
        id: '5',
        type: 'system',
        userId: 'system',
        userName: '系统通知',
        userAvatar: '/images/icons/system.png',
        actionText: '你获得了新的成就',
        targetText: '「坚持不懈」',
        previewText: '恭喜你连续打卡30天，获得"坚持不懈"成就！',
        targetImage: '/images/achievements/achievement1.png',
        targetId: 'achievement1',
        time: '1天前',
        isRead: true
      }
    ];
  },

  /**
   * 处理通知点击
   */
  handleNotification(e) {
    const { id, type, targetId } = e.currentTarget.dataset;
    
    // 标记为已读
    this.markAsRead(id);
    
    // 根据不同类型的通知跳转到不同页面
    switch (type) {
      case 'like':
      case 'comment':
        // 跳转到动态详情页
        wx.navigateTo({
          url: `/packageCommunity/pages/post-detail/post-detail?id=${targetId}`
        });
        break;
      case 'follow':
        // 跳转到用户资料页
        wx.navigateTo({
          url: `/packageCommunity/pages/user-profile/user-profile?id=${e.currentTarget.dataset.userId}`
        });
        break;
      case 'system':
        // 根据系统通知类型处理
        if (targetId.startsWith('achievement')) {
          // 跳转到成就详情
          wx.navigateTo({
            url: `/pages/profile/achievements/detail/detail?id=${targetId}`
          });
        }
        break;
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
   * 标记通知为已读
   */
  markAsRead(id) {
    const { notifications } = this.data;
    const index = notifications.findIndex(item => item.id === id);
    
    if (index !== -1 && !notifications[index].isRead) {
      notifications[index].isRead = true;
      this.setData({ notifications });
      
      // TODO: 发送请求到服务器更新已读状态
    }
  },

  /**
   * 标记所有通知为已读
   */
  markAllAsRead() {
    const notifications = this.data.notifications.map(item => {
      return { ...item, isRead: true };
    });
    
    this.setData({
      notifications: notifications,
      unreadCount: 0
    });
    
    // TODO: 发送请求到服务器更新所有通知状态
    
    wx.showToast({
      title: '已全部标为已读',
      icon: 'success'
    });
  },

  /**
   * 删除通知
   */
  deleteNotification(e) {
    const { id, index } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '删除通知',
      content: '确定要删除这条通知吗？',
      success: (res) => {
        if (res.confirm) {
          const notifications = this.data.notifications;
          
          // 如果是未读通知，更新未读数量
          if (!notifications[index].isRead) {
            this.setData({
              unreadCount: this.data.unreadCount - 1
            });
          }
          
          // 删除通知
          notifications.splice(index, 1);
          
          this.setData({
            notifications: notifications
          });
          
          // TODO: 发送请求到服务器删除通知
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadNotifications(true);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadNotifications();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '习惯打卡通知中心',
      path: '/packageCommunity/pages/notifications/notifications'
    };
  }
}) 
