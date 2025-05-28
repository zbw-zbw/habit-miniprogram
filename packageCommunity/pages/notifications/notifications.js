Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    notifications: [],
    hasMore: true,
    page: 1,
    pageSize: 20,
    unreadCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadNotifications();
  },

  /**
   * 加载通知数据
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
    
    // 显示加载中
    this.setData({ loading: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 模拟通知数据
      const mockNotifications = [
        {
          id: 'n1',
          type: 'like',
          isRead: false,
          createdAt: '2023-10-16 14:30',
          content: '赵强赞了你的动态',
          sender: {
            id: '104',
            name: '赵强',
            avatar: '/images/avatars/avatar4.png'
          },
          targetId: '1',
          targetType: 'post'
        },
        {
          id: 'n2',
          type: 'comment',
          isRead: false,
          createdAt: '2023-10-15 18:45',
          content: '陈静评论了你的动态：这个习惯很棒，我也想尝试！',
          sender: {
            id: '105',
            name: '陈静',
            avatar: '/images/avatars/avatar5.png'
          },
          targetId: '2',
          targetType: 'post'
        },
        {
          id: 'n3',
          type: 'follow',
          isRead: true,
          createdAt: '2023-10-14 09:20',
          content: '李小华关注了你',
          sender: {
            id: '101',
            name: '李小华',
            avatar: '/images/avatars/avatar1.png'
          },
          targetId: null,
          targetType: null
        },
        {
          id: 'n4',
          type: 'challenge',
          isRead: true,
          createdAt: '2023-10-13 12:15',
          content: '你的好友张明邀请你参加"早起俱乐部"挑战',
          sender: {
            id: '102',
            name: '张明',
            avatar: '/images/avatars/avatar2.png'
          },
          targetId: '2',
          targetType: 'challenge'
        },
        {
          id: 'n5',
          type: 'system',
          isRead: true,
          createdAt: '2023-10-12 10:00',
          content: '恭喜你获得"坚持不懈"徽章！',
          sender: null,
          targetId: '3',
          targetType: 'achievement'
        }
      ];
      
      // 计算未读通知数量
      const unreadCount = mockNotifications.filter(item => !item.isRead).length;
      
      // 模拟分页
      const currentNotifications = this.data.notifications;
      const newNotifications = isRefresh ? mockNotifications : [...currentNotifications, ...mockNotifications];
      
      // 判断是否还有更多数据
      const hasMore = this.data.page < 3; // 模拟只有3页数据
      
      this.setData({
        notifications: newNotifications,
        loading: false,
        hasMore: hasMore,
        page: this.data.page + 1,
        unreadCount: unreadCount
      });
    }, 1000);
  },

  /**
   * 标记通知为已读
   */
  markAsRead(e) {
    const { id, index } = e.currentTarget.dataset;
    
    // 更新通知状态
    const notifications = this.data.notifications;
    
    if (notifications[index].isRead) return;
    
    notifications[index].isRead = true;
    
    this.setData({
      notifications: notifications,
      unreadCount: this.data.unreadCount - 1
    });
    
    // TODO: 发送请求到服务器更新通知状态
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
   * 查看通知详情
   */
  viewNotification(e) {
    const { id, index, type, targetId, targetType } = e.currentTarget.dataset;
    
    // 标记为已读
    this.markAsRead(e);
    
    // 根据通知类型和目标类型导航到相应页面
    switch (targetType) {
      case 'post':
        wx.navigateTo({
          url: `/packageCommunity/pages/post-detail/post-detail?id=${targetId}`
        });
        break;
      case 'challenge':
        wx.navigateTo({
          url: `/packageCommunity/pages/challenge/challenge?id=${targetId}`
        });
        break;
      case 'achievement':
        wx.navigateTo({
          url: `/pages/profile/achievements/detail/detail?id=${targetId}`
        });
        break;
      default:
        if (type === 'follow') {
          const { sender } = this.data.notifications[index];
          wx.navigateTo({
            url: `/packageCommunity/pages/user-profile/user-profile?id=${sender.id}`
          });
        }
        break;
    }
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
    if (!this.data.loading && this.data.hasMore) {
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
