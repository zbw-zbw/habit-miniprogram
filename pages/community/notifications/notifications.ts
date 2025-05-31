// 社区通知页面
interface ISender {
  id: string;
  avatar: string;
  nickname: string;
  bio?: string;
}

interface IPost {
  id: string;
  content: string;
  image?: string;
}

interface IComment {
  id: string;
  content: string;
}

interface INotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  time: string;
  isRead: boolean;
  targetId: string;
  sender?: ISender;
  post?: IPost;
  comment?: IComment;
  isFollowing?: boolean;
  title?: string;
  message?: string;
  systemIcon?: string;
}

type TabType = 'all' | 'like' | 'comment' | 'follow' | 'system';

const tabNameMap: Record<TabType, string> = {
  all: '全部',
  like: '点赞',
  comment: '评论',
  follow: '关注',
  system: '系统'
};

Page({
  data: {
    activeTab: 'all' as TabType,
    tabName: '全部',
    loading: true,
    notifications: [] as INotification[],
    hasMore: false,
    page: 1,
    pageSize: 10,
    unreadCount: 0
  },

  onLoad() {
    this.fetchNotifications();
  },

  onShow() {
    // 每次显示页面时，更新通知数量
    this.updateUnreadCount();
  },

  // 切换标签
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as TabType;
    this.setData({
      activeTab: tab,
      tabName: tabNameMap[tab],
      loading: true,
      notifications: [],
      page: 1
    });
    this.fetchNotifications();
  },

  // 获取通知列表
  fetchNotifications() {
    const { activeTab, page, pageSize } = this.data;

    // 模拟API请求
    setTimeout(() => {
      // 模拟数据
      const mockData: INotification[] = [
        {
          id: '1',
          type: 'like',
          time: '10分钟前',
          isRead: false,
          targetId: 'post1',
          sender: {
            id: 'user1',
            avatar: '/assets/images/avatar1.png',
            nickname: '健身达人'
          },
          post: {
            id: 'post1',
            content: '今天完成了5公里跑步，感觉很好！#健身打卡#',
            image: '/assets/images/post1.png'
          }
        },
        {
          id: '2',
          type: 'comment',
          time: '1小时前',
          isRead: true,
          targetId: 'post2',
          sender: {
            id: 'user2',
            avatar: '/assets/images/avatar2.png',
            nickname: '阅读小子'
          },
          comment: {
            id: 'comment1',
            content: '坚持就是胜利，加油！'
          },
          post: {
            id: 'post2',
            content: '今天阅读了30页书，慢慢坚持中。'
          }
        },
        {
          id: '3',
          type: 'follow',
          time: '2小时前',
          isRead: false,
          targetId: 'user3',
          sender: {
            id: 'user3',
            avatar: '/assets/images/avatar3.png',
            nickname: '跑步爱好者',
            bio: '热爱跑步，每天都要跑5公里'
          },
          isFollowing: false
        },
        {
          id: '4',
          type: 'system',
          time: '昨天',
          isRead: true,
          targetId: 'system1',
          title: '习惯打卡提醒',
          message: '您今天还有3个习惯未完成打卡，抓紧时间吧！',
          systemIcon: 'icon-notification'
        }
      ];

      // 根据当前标签过滤数据
      let filteredData = mockData;
      if (activeTab !== 'all') {
        filteredData = mockData.filter(item => item.type === activeTab);
      }

      this.setData({
        loading: false,
        notifications: page === 1 ? filteredData : [...this.data.notifications, ...filteredData],
        hasMore: page < 3, // 模拟只有3页数据
        page: page + 1
      });

      this.updateUnreadCount();
    }, 1000);
  },

  // 更新未读消息数量
  updateUnreadCount() {
    const unreadCount = this.data.notifications.filter(item => !item.isRead).length;
    this.setData({ unreadCount });
    
    // 更新小程序右上角的红点
    if (unreadCount > 0) {
      wx.setTabBarBadge({
        index: 2, // 社区 tab 的索引
        text: unreadCount.toString()
      });
    } else {
      wx.removeTabBarBadge({
        index: 2
      });
    }
  },

  // 处理通知点击
  handleNotification(e: WechatMiniprogram.TouchEvent) {
    const { id, type, targetId } = e.currentTarget.dataset;
    
    // 标记为已读
    const notifications = this.data.notifications.map(item => {
      if (item.id === id) {
        return { ...item, isRead: true };
      }
      return item;
    });
    
    this.setData({ notifications });
    this.updateUnreadCount();
    
    // 根据不同类型的通知跳转到不同页面
    switch (type) {
      case 'like':
      case 'comment':
        wx.navigateTo({
          url: `/pages/community/post-detail/post-detail?id=${targetId}`
        });
        break;
      case 'follow':
        wx.navigateTo({
          url: `/pages/profile/profile?id=${targetId}`
        });
        break;
      case 'system':
        // 系统通知通常不需要跳转
        break;
    }
  },

  // 关注/取消关注
  toggleFollow(e: WechatMiniprogram.TouchEvent) {
    const { id, index } = e.currentTarget.dataset;
    const notifications = [...this.data.notifications];
    if (notifications[index].type === 'follow') {
      notifications[index].isFollowing = !notifications[index].isFollowing;
      this.setData({ notifications });
    }
  },

  // 加载更多
  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    this.fetchNotifications();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      notifications: [],
      loading: true
    });
    this.fetchNotifications();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
}); 
