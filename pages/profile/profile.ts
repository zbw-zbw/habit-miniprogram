/**
 * 个人中心页面
 */
import { getHabits, getCheckins } from '../../utils/storage';

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
  achievements: IAchievement[];
}

interface IPageMethods {
  loadUserInfo(): void;
  loadStats(): void;
  loadAchievements(): void;
  login(): void;
  logout(): void;
  navigateTo(e: WechatMiniprogram.TouchEvent): void;
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
      longestStreak: 0
    },
    achievements: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.loadUserInfo();
    this.loadStats();
    this.loadAchievements();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时加载最新数据
    this.loadUserInfo();
    this.loadStats();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const app = getApp<IAppOption>();
    
    this.setData({
      userInfo: app.globalData.userInfo,
      hasLogin: app.globalData.hasLogin,
      'settings.theme': app.globalData.theme || 'light'
    });
    
    // 监听主题变化
    app.onThemeChange((theme: 'light' | 'dark') => {
      this.setData({
        'settings.theme': theme
      });
    });
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    this.setData({ loading: true });
    
    // 获取习惯和打卡数据
    const habits = getHabits();
    const checkins = getCheckins();
    
    // 计算总习惯数
    const totalHabits = habits.length;
    
    // 计算今日完成数
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
    const completedToday = checkins.filter(c => c.date === todayStr && c.isCompleted).length;
    
    // 计算总打卡次数
    const totalCheckins = checkins.filter(c => c.isCompleted).length;
    
    // 计算连续天数（简化实现）
    const currentStreak = 5; // 模拟数据
    const longestStreak = 12; // 模拟数据
    
    this.setData({
      'stats.totalHabits': totalHabits,
      'stats.completedToday': completedToday,
      'stats.totalCheckins': totalCheckins,
      'stats.currentStreak': currentStreak,
      'stats.longestStreak': longestStreak,
      loading: false
    });
  },

  /**
   * 加载成就数据
   */
  loadAchievements() {
    // 模拟成就数据
    const achievements: IAchievement[] = [
      {
        id: '1',
        title: '习惯养成者',
        description: '创建第一个习惯',
        icon: 'achievement-1',
        progress: 100,
        isCompleted: true,
        completedAt: '2023-09-15'
      },
      {
        id: '2',
        title: '坚持不懈',
        description: '连续打卡7天',
        icon: 'achievement-2',
        progress: 100,
        isCompleted: true,
        completedAt: '2023-09-20'
      },
      {
        id: '3',
        title: '习惯大师',
        description: '连续打卡30天',
        icon: 'achievement-3',
        progress: 40,
        isCompleted: false
      },
      {
        id: '4',
        title: '多面手',
        description: '创建5个不同类别的习惯',
        icon: 'achievement-4',
        progress: 60,
        isCompleted: false
      }
    ];
    
    this.setData({ achievements });
  },

  /**
   * 用户登录
   */
  login() {
    wx.showLoading({
      title: '登录中'
    });
    
    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const app = getApp<IAppOption>();
        app.login(res.userInfo, (success) => {
          if (success) {
            this.setData({
              userInfo: res.userInfo,
              hasLogin: true
            });
            
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '登录失败',
              icon: 'error'
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '已取消',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
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
              hasLogin: false
            });
            
            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            });
          });
        }
      }
    });
  },

  /**
   * 页面导航
   */
  navigateTo(e: WechatMiniprogram.TouchEvent) {
    const { url } = e.currentTarget.dataset;
    wx.navigateTo({ url });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '习惯打卡小程序',
      path: '/pages/index/index'
    };
  }
}); 
