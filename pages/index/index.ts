/**
 * 首页
 */
import { getCurrentDate } from '../../utils/date';
import { shouldDoHabitOnDate, generateHabitStats } from '../../utils/habit';
import { getHabits, getCheckins, getCheckinsByHabitId } from '../../utils/storage';
import { generateUUID } from '../../utils/util';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    todayHabits: [] as IHabit[],
    habitStats: {} as Record<string, IHabitStats>,
    loading: true,
    userInfo: null as IUserInfo | null,
    hasLogin: false,
    today: '',
    weekday: '',
    completedCount: 0,
    totalCount: 0,
    completionRate: 0,
    completionRateDisplay: '0',
    currentStreak: 0,
    motto: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const today = getCurrentDate();
    const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdayNames[new Date(today).getDay()];
    
    this.setData({
      today,
      weekday
    });
    
    // 获取激励语
    this.getRandomMotto();
    
    // 获取用户信息
    const app = getApp<IAppOption>();
    this.setData({
      userInfo: app.globalData.userInfo,
      hasLogin: app.globalData.isLoggedIn
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadTodayHabits();
  },

  /**
   * 加载今日习惯
   */
  loadTodayHabits() {
    this.setData({ loading: true });
    
    // 获取所有习惯
    const habits = getHabits();
    
    // 过滤出今日需要执行的习惯
    const today = getCurrentDate();
    const todayHabits = habits.filter(habit => 
      !habit.isArchived && shouldDoHabitOnDate(habit, today)
    );
    
    // 计算习惯统计数据
    const habitStats: Record<string, IHabitStats> = {};
    let completedCount = 0;
    
    todayHabits.forEach(habit => {
      const checkins = getCheckinsByHabitId(habit.id);
      const stats = generateHabitStats(habit, checkins);
      habitStats[habit.id] = stats;
      
      // 检查今日是否已完成
      const todayCheckin = checkins.find(c => c.date === today);
      if (todayCheckin?.isCompleted) {
        completedCount++;
      }
    });
    
    // 计算总体完成率
    const totalCount = todayHabits.length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const completionRateDisplay = Math.floor(completionRate).toString();
    
    // 计算当前连续天数（取所有习惯中的最大值）
    const currentStreak = Object.values(habitStats).reduce(
      (max, stats) => Math.max(max, stats.currentStreak),
      0
    );
    
    this.setData({
      todayHabits,
      habitStats,
      loading: false,
      completedCount,
      totalCount,
      completionRate,
      completionRateDisplay,
      currentStreak
    });
  },

  /**
   * 获取随机激励语
   */
  getRandomMotto() {
    const mottos = [
      "坚持的第一天，是迈向成功的第一步。",
      "每一个习惯，都是未来更好的自己。",
      "不要等待完美时机，现在就行动。",
      "小小的习惯，成就大大的改变。",
      "今天的坚持，是明天的骄傲。",
      "习惯的力量，超乎你的想象。",
      "每天进步一点点，离目标就近一点点。",
      "坚持下去，你会感谢今天努力的自己。",
      "不积跬步，无以至千里。",
      "养成好习惯，成就好人生。"
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
    
    // 获取所有打卡记录
    const checkins = getCheckins();
    const today = getCurrentDate();
    
    // 查找今日是否已有打卡记录
    let todayCheckin = checkins.find(c => c.habitId === habitId && c.date === today);
    
    if (todayCheckin) {
      // 更新打卡状态
      todayCheckin.isCompleted = !todayCheckin.isCompleted;
      // 使用类型断言避免类型错误
      (todayCheckin as any).updatedAt = new Date().toISOString();
    } else {
      // 创建新的打卡记录
      todayCheckin = {
        id: generateUUID(),
        habitId,
        date: today,
        isCompleted: true,
        createdAt: new Date().toISOString()
      };
      checkins.push(todayCheckin);
    }
    
    // 保存打卡记录
    wx.setStorageSync('checkins', checkins);
    
    // 重新加载今日习惯
    this.loadTodayHabits();
    
    // 显示提示
    wx.showToast({
      title: todayCheckin.isCompleted ? '打卡成功' : '已取消打卡',
      icon: todayCheckin.isCompleted ? 'success' : 'none'
    });
  },

  /**
   * 跳转到习惯列表
   */
  goToHabits() {
    wx.switchTab({
      url: '/pages/habits/habits'
    });
  },

  /**
   * 跳转到创建习惯
   */
  goToCreateHabit() {
    wx.navigateTo({
      url: '/pages/habits/create/create'
    });
  },

  /**
   * 跳转到数据分析
   */
  goToAnalytics() {
    wx.switchTab({
      url: '/pages/analytics/analytics'
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '习惯打卡小程序，养成好习惯，成就好人生',
      path: '/pages/index/index'
    };
  }
}); 
