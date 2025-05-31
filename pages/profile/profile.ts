/**
 * 个人中心页面
 */
import { formatDate } from '../../utils/date';
import { habitAPI, checkinAPI, userAPI } from '../../services/api';
import { IUserProfileAll } from '../../utils/types';

interface IPageData {
  userInfo: IUserInfo | null;
  hasLogin: boolean;
  loading: boolean;
  stats: {
    totalHabits: number;
    completedToday: number;
    totalCheckins: number;
    currentStreak: number;
    longestStreak: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    progress: number;
    isCompleted: boolean;
  }>;
}

interface IPageMethods {
  loadUserInfo(): void;
  loadProfileData(): void;
  login(): void;
  logout(): void;
  navigateTo(e: WechatMiniprogram.TouchEvent): void;
  navigateToAchievement(e: WechatMiniprogram.TouchEvent): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    hasLogin: false,
    loading: true,
    stats: {
      totalHabits: 0,
      completedToday: 0,
      totalCheckins: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
    achievements: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log('个人中心页面初始加载');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadUserInfo();
    this.loadProfileData();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const app = getApp<IAppOption>();

    this.setData({
      userInfo: app.globalData.userInfo,
      hasLogin: app.globalData.hasLogin,
      'settings.theme': app.globalData.theme || 'light',
    });

    // 监听主题变化
    if (typeof app.onThemeChange === 'function') {
      app.onThemeChange((theme) => {
        this.setData({
          'settings.theme': theme,
        });
      });
    }
  },

  /**
   * 加载个人资料数据
   */
  loadProfileData() {
    this.setData({ loading: true });

    // 使用新的聚合API获取所有数据
    userAPI
      .getProfileAll()
      .then((data: IUserProfileAll) => {
        console.log('获取用户聚合数据成功:', data);

        // 更新统计数据
        this.setData({
          'stats.totalHabits': data.stats.totalHabits,
          'stats.completedToday': data.stats.completedToday,
          'stats.totalCheckins': data.stats.totalCheckins,
          'stats.currentStreak': data.stats.currentStreak,
          'stats.longestStreak': data.stats.longestStreak,
          // 更新成就数据
          achievements: data.achievements,
          loading: false,
        });
      })
      .catch((error) => {
        console.error('获取用户聚合数据失败:', error);
        this.setData({ loading: false });
      });
  },

  /**
   * 旧的成就数据加载方法（仅在聚合API失败时使用）

  /**
   * 用户登录
   */
  login() {
    wx.showLoading({
      title: '登录中',
    });

    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const app = getApp<IAppOption>();
        // 添加ID属性以满足IUserInfo接口要求
        const userInfo = {
          ...res.userInfo,
          id: 'temp_' + Date.now(),
        } as IUserInfo;

        app.login(userInfo, (success) => {
          if (success) {
            this.setData({
              userInfo: app.globalData.userInfo,
              hasLogin: true,
            });

            // 登录成功后重新加载数据
            this.loadProfileData();

            // 注意：登录状态变化会通过app.notifyLoginStateChanged()通知所有页面，
            // 包括首页，无需手动更新其他页面

            wx.showToast({
              title: '登录成功',
              icon: 'success',
            });
          } else {
            wx.showToast({
              title: '登录失败',
              icon: 'error',
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '已取消',
          icon: 'none',
        });
      },
      complete: () => {
        wx.hideLoading();
      },
    });
  },

  /**
   * 用户登出
   */
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp<IAppOption>();
          app.logout(() => {
            this.setData({
              userInfo: null,
              hasLogin: false,
              stats: {
                totalHabits: 0,
                completedToday: 0,
                totalCheckins: 0,
                currentStreak: 0,
                longestStreak: 0,
              },
              achievements: [],
            });

            wx.showToast({
              title: '已退出登录',
              icon: 'success',
            });
          });
        }
      },
    });
  },

  /**
   * 导航到指定页面
   */
  navigateTo(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  /**
   * 导航到成就详情页
   */
  navigateToAchievement(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/profile/achievements/detail/detail?id=${id}`,
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的习惯养成进度',
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-profile.png',
    };
  },
});
