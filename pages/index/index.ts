/**
 * 首页
 */
import { getCurrentDate } from '../../utils/date';
import { shouldDoHabitOnDate, generateHabitStats } from '../../utils/habit';
import { habitAPI, checkinAPI } from '../../services/api';
import { generateUUID } from '../../utils/util';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    todayHabits: [] as IHabit[],
    habitStats: {} as Record<string, IHabitStats>,
    todayCheckins: [] as any[], // 今日所有打卡记录
    loading: {
      habits: true,
      checkins: true,
      stats: true
    },
    error: {
      habits: '',
      checkins: '',
      stats: ''
    },
    userInfo: null as IUserInfo | null,
    hasLogin: false,
    today: '',
    weekday: '',
    completedCount: 0,
    totalCount: 0,
    completionRate: 0,
    completionRateDisplay: '0',
    currentStreak: 0,
    motto: '',
    showAchievementUnlock: false,
    unlockedAchievement: null,
    apiAvailable: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const today = getCurrentDate();
    const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdayNames[new Date(today).getDay()];
    
    const app = getApp<IAppOption>();
    
    this.setData({
      today,
      weekday,
      userInfo: app.globalData.userInfo,
      hasLogin: app.globalData.hasLogin,
      apiAvailable: app.globalData.apiAvailable
    });
    
    // 获取激励语
    this.getRandomMotto();
    
    // 监听成就解锁事件
    if (typeof app.onAchievementUnlock === 'function') {
      app.onAchievementUnlock(this.onAchievementUnlock.bind(this));
    } else {
      console.error('App.onAchievementUnlock 方法不存在');
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadData();
  },

  /**
   * 加载所有数据
   * 按顺序执行: 习惯 -> 打卡记录 -> 统计数据
   */
  async loadData() {
    const today = getCurrentDate();
    
    // 重置加载状态
    this.setData({
      'loading.habits': true,
      'loading.checkins': true,
      'loading.stats': true,
      'error.habits': '',
      'error.checkins': '',
      'error.stats': ''
    });
    
    try {
      // 1. 加载习惯数据
      const habits = await habitAPI.getHabits();
      
      // 过滤出今日需要执行的习惯
      const todayHabits = habits.filter(habit => 
        !habit.isArchived && shouldDoHabitOnDate(habit, today)
      );
      
      this.setData({
        todayHabits,
        'loading.habits': false,
        totalCount: todayHabits.length
      });
      
      // 2. 加载今日打卡记录
      const todayCheckins = await checkinAPI.getCheckins({
        startDate: today,
        endDate: today
      });
      
      // 提取已完成习惯的ID (注意: 服务器返回的打卡记录可能使用habit或habitId字段)
      const completedHabitIds = new Set();
      
      todayCheckins.forEach(checkin => {
        if (checkin.isCompleted) {
          // 兼容不同格式的打卡记录
          const habitId = (checkin as any).habit || checkin.habitId;
          if (habitId) {
            completedHabitIds.add(habitId);
          }
        }
      });
      
      // 计算完成率
      const completedCount = completedHabitIds.size;
      const totalCount = todayHabits.length;
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      const completionRateDisplay = Math.floor(completionRate).toString();
      
      this.setData({
        todayCheckins,
        completedCount,
        completionRate,
        completionRateDisplay,
        'loading.checkins': false
      });
      
      // 3. 加载每个习惯的统计数据
      if (todayHabits.length === 0) {
        this.setData({
          'loading.stats': false,
          habitStats: {},
          currentStreak: 0
        });
        return;
      }
      
      const habitStats: Record<string, IHabitStats> = {};
      const statsPromises = todayHabits.map(async (habit) => {
        try {
          // 获取习惯ID (优先使用_id)
          const habitId = habit._id || habit.id;
          if (!habitId) return;
          
          // 获取习惯统计数据
          const stats = await habitAPI.getHabitStats(habitId);
          
          // 检查这个习惯今天是否已完成
          if (completedHabitIds.has(habitId)) {
            // 强制更新lastCompletedDate为今天
            stats.lastCompletedDate = today;
          }
          
          // 保存统计数据
          habitStats[habitId] = stats;
        } catch (error) {
          console.error(`获取习惯统计数据失败:`, error);
        }
      });
      
      // 等待所有统计数据加载完成
      await Promise.all(statsPromises);
      
      // 计算当前连续天数
      let currentStreak = 0;
      
      // 只有当今天所有习惯都完成时，才显示连续天数
      if (completedCount === totalCount && totalCount > 0) {
        // 取最小连续天数，确保所有习惯都坚持了
        currentStreak = Object.values(habitStats).reduce(
          (max, stats) => Math.max(max, stats?.currentStreak || 0),
          0
        );
      }
      
      this.setData({
        habitStats,
        currentStreak,
        'loading.stats': false
      });
      
    } catch (error) {
      console.error('加载数据失败:', error);
      this.setData({
        'loading.habits': false,
        'loading.checkins': false,
        'loading.stats': false,
        'error.habits': '加载数据失败'
      });
    }
  },

  /**
   * 获取随机激励语
   */
  getRandomMotto() {
    const mottos = [
      '坚持的第一天，是迈向成功的第一步。',
      '每一个习惯，都是未来更好的自己。',
      '不要等待完美时机，现在就行动。',
      '小小的习惯，成就大大的改变。',
      '今天的坚持，是明天的骄傲。',
      '习惯的力量，超乎你的想象。',
      '每天进步一点点，离目标就近一点点。',
      '坚持下去，你会感谢今天努力的自己。',
      '不积跬步，无以至千里。',
      '养成好习惯，成就好人生。'
    ];
    
    const randomIndex = Math.floor(Math.random() * mottos.length);
    this.setData({
      motto: mottos[randomIndex]
    });
  },

  /**
   * 打卡习惯
   */
  onCheckin(e: any) {
    const { habitId } = e.detail;
    if (!habitId) return;
    
    // 直接跳转到打卡页面
    wx.navigateTo({
      url: `/pages/checkin/checkin?habitId=${habitId}`
    });
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadData();
  },

  /**
   * 跳转到习惯列表页
   */
  goToHabits() {
    wx.switchTab({
      url: '/pages/habits/habits'
    });
  },

  /**
   * 跳转到创建习惯页
   */
  goToCreateHabit() {
    wx.navigateTo({
      url: '/pages/habits/create/create'
    });
  },

  /**
   * 跳转到数据分析页
   */
  goToAnalytics() {
    wx.switchTab({
      url: '/pages/analytics/analytics',
      fail: (err) => {
        console.error('跳转到数据分析页失败:', err);
        wx.showToast({
          title: '跳转失败，请稍后再试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '养成好习惯，改变好人生',
      path: '/pages/index/index'
    };
  },

  /**
   * 成就解锁事件处理
   */
  onAchievementUnlock(achievement: IAchievement) {
    this.setData({
      showAchievementUnlock: true,
      unlockedAchievement: achievement as any
    });
    
    // 3秒后自动关闭
    setTimeout(this.hideAchievementUnlock.bind(this), 3000);
  },

  /**
   * 隐藏成就解锁提示
   */
  hideAchievementUnlock() {
    this.setData({
      showAchievementUnlock: false
    });
  },

  /**
   * 查看成就详情
   */
  viewAchievementDetail(e: any) {
    if (!this.data.unlockedAchievement) return;
    
    wx.navigateTo({
      url: '/pages/profile/achievements/achievements',
      success: () => {
        this.hideAchievementUnlock();
      }
    });
  }
}); 
