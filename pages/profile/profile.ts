/**
 * 个人中心页面
 */
import { formatDate } from '../../utils/date';
import { habitAPI, checkinAPI, userAPI } from '../../services/api';

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
  loadStats(): void;
  loadAchievements(): void;
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
    if (typeof app.onThemeChange === 'function') {
      app.onThemeChange((theme) => {
        this.setData({
          'settings.theme': theme
        });
      });
    }
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    this.setData({ loading: true });
    
    // 获取习惯和打卡数据
    Promise.all([
      habitAPI.getHabits(),
      checkinAPI.getCheckins()
    ])
      .then(([habits, checkins]) => {
        const today = formatDate(new Date());
        
        // 计算总习惯数
        const totalHabits = habits.length;
        
        // 计算今日完成数
        const completedToday = checkins.filter(c => c.date === today && c.isCompleted).length;
        
        // 计算总打卡次数
        const totalCheckins = checkins.filter(c => c.isCompleted).length;
        
        // 获取所有习惯的统计数据
        const activeHabits = habits.filter(h => !h.isArchived);
        const statsPromises = activeHabits.map(habit => {
          // 确保习惯ID不为undefined
          const habitId = habit.id || habit._id;
          if (!habitId) {
            console.error('习惯ID不存在:', habit);
            return Promise.resolve({
              totalCompletions: 0,
              totalDays: 0,
              completionRate: 0,
              currentStreak: 0,
              longestStreak: 0,
              lastCompletedDate: null
            });
          }
          return habitAPI.getHabitStats(habitId);
        });
        
        return Promise.all([
          Promise.resolve(totalHabits),
          Promise.resolve(completedToday),
          Promise.resolve(totalCheckins),
          Promise.all(statsPromises)
        ]);
      })
      .then(([totalHabits, completedToday, totalCheckins, statsArray]) => {
        // 计算最大连续天数和当前连续天数
        let maxCurrentStreak = 0;
        let maxLongestStreak = 0;
        
        statsArray.forEach(stats => {
          maxCurrentStreak = Math.max(maxCurrentStreak, stats.currentStreak || 0);
          maxLongestStreak = Math.max(maxLongestStreak, stats.longestStreak || 0);
        });
        
        this.setData({
          'stats.totalHabits': totalHabits,
          'stats.completedToday': completedToday,
          'stats.totalCheckins': totalCheckins,
          'stats.currentStreak': maxCurrentStreak,
          'stats.longestStreak': maxLongestStreak,
          loading: false
        });
      })
      .catch(error => {
        console.error('加载统计数据失败:', error);
        this.setData({ loading: false });
      });
  },

  /**
   * 加载成就数据
   */
  async loadAchievements() {
    try {
      // 获取用户成就
      const achievements = await userAPI.getAchievements();
      
      // 只显示前3个成就
      const topAchievements = achievements.slice(0, 3);
      
      this.setData({ achievements: topAchievements });
    } catch (error) {
      console.error('加载成就数据失败:', error);
      
      // 如果API不可用，显示默认成就
      this.setData({ 
        achievements: [
          {
            id: 'habit_master',
            title: '习惯养成者',
            description: '连续完成一个习惯30天',
            icon: 'trophy',
            progress: 0,
            isCompleted: false
          },
          {
            id: 'early_bird',
            title: '早起达人',
            description: '连续7天在早上7点前打卡"早起"习惯',
            icon: 'sun',
            progress: 0,
            isCompleted: false
          },
          {
            id: 'reading_expert',
            title: '阅读专家',
            description: '累计阅读时间达到100小时',
            icon: 'book',
            progress: 0,
            isCompleted: false
          }
        ]
      });
    }
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
        // 添加ID属性以满足IUserInfo接口要求
        const userInfo = {
          ...res.userInfo,
          id: 'temp_' + Date.now()
        } as IUserInfo;
        
        app.login(userInfo, (success) => {
          if (success) {
            this.setData({
              userInfo: app.globalData.userInfo,
              hasLogin: true
            });
            
            // 登录成功后重新加载数据
            this.loadStats();
            this.loadAchievements();
            
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
   * 成就详情导航
   */
  navigateToAchievement(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/profile/achievements/detail/detail?id=${id}`
    });
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
