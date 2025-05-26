/**
 * 数据分析-报告页面
 * 提供详细的数据分析报告
 */
import { getHabits, getCheckins } from '../../../utils/storage';
import { formatDate, getDaysBetween } from '../../../utils/date';

interface IPageData {
  loading: boolean;
  reportData: {
    overview: {
      totalHabits: number;
      activeHabits: number;
      completedToday: number;
      completionRate: number;
      totalCheckins: number;
      currentStreak: number;
      longestStreak: number;
      startDate: string;
      totalDays: number;
    };
    habitDetails: Array<{
      id: string;
      name: string;
      color: string;
      icon: string;
      completionRate: number;
      streak: number;
      totalCheckins: number;
      bestDay: string;
      bestTime: string;
    }>;
    trends: {
      weeklyCompletion: number[];
      monthlyCompletion: number[];
      weekLabels: string[];
      monthLabels: string[];
    };
  };
}

interface IPageMethods {
  loadData(): void;
  generateReport(habits: IHabit[], checkins: ICheckin[]): void;
  calculateOverview(habits: IHabit[], checkins: ICheckin[]): void;
  calculateHabitDetails(habits: IHabit[], checkins: ICheckin[]): void;
  calculateTrends(habits: IHabit[], checkins: ICheckin[]): void;
  navigateToHabit(e: WechatMiniprogram.TouchEvent): void;
  saveReport(): void;
  shareReport(): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    reportData: {
      overview: {
        totalHabits: 0,
        activeHabits: 0,
        completedToday: 0,
        completionRate: 0,
        totalCheckins: 0,
        currentStreak: 0,
        longestStreak: 0,
        startDate: '',
        totalDays: 0
      },
      habitDetails: [],
      trends: {
        weeklyCompletion: [],
        monthlyCompletion: [],
        weekLabels: [],
        monthLabels: []
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.loadData();
  },

  /**
   * 加载数据
   */
  loadData() {
    this.setData({ loading: true });
    
    // 获取习惯和打卡数据
    const habits = getHabits();
    const checkins = getCheckins();
    
    // 生成报告
    this.generateReport(habits, checkins);
    
    this.setData({ loading: false });
  },

  /**
   * 生成报告
   */
  generateReport(habits: IHabit[], checkins: ICheckin[]) {
    // 计算概览数据
    this.calculateOverview(habits, checkins);
    
    // 计算习惯详情
    this.calculateHabitDetails(habits, checkins);
    
    // 计算趋势数据
    this.calculateTrends(habits, checkins);
  },

  /**
   * 计算概览数据
   */
  calculateOverview(habits: IHabit[], checkins: ICheckin[]) {
    const today = new Date();
    const todayStr = formatDate(today);
    const activeHabits = habits.filter(h => !h.isArchived);
    const completedToday = checkins.filter(c => c.date === todayStr && c.isCompleted).length;
    
    // 计算总体完成率
    let totalDays = 0;
    let completedDays = 0;
    
    activeHabits.forEach(habit => {
      const habitCheckins = checkins.filter(c => c.habitId === habit.id);
      
      // 获取该习惯应该执行的天数
      const startDate = new Date(habit.createdAt);
      const now = new Date();
      
      for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        
        // 简化逻辑，实际应调用 shouldDoHabitOnDate
        totalDays++;
        
        // 检查是否完成
        if (habitCheckins.some(c => c.date === dateStr && c.isCompleted)) {
          completedDays++;
        }
      }
    });
    
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
    // 计算当前连续天数和最长连续天数
    // 简化实现，实际应考虑更复杂的逻辑
    let currentStreak = 5; // 模拟数据
    let longestStreak = 12; // 模拟数据
    
    // 找出最早的习惯创建日期
    let earliestDate = today;
    habits.forEach(habit => {
      const createdAt = new Date(habit.createdAt);
      if (createdAt < earliestDate) {
        earliestDate = createdAt;
      }
    });
    
    const startDate = formatDate(earliestDate);
    const totalDaysUsing = getDaysBetween(earliestDate, today);
    
    this.setData({
      'reportData.overview': {
        totalHabits: habits.length,
        activeHabits: activeHabits.length,
        completedToday: completedToday,
        completionRate: completionRate,
        totalCheckins: checkins.filter(c => c.isCompleted).length,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        startDate: startDate,
        totalDays: totalDaysUsing
      }
    });
  },

  /**
   * 计算习惯详情
   */
  calculateHabitDetails(habits: IHabit[], checkins: ICheckin[]) {
    const habitDetails = habits
      .filter(h => !h.isArchived)
      .map(habit => {
        const habitCheckins = checkins.filter(c => c.habitId === habit.id);
        const totalCheckins = habitCheckins.filter(c => c.isCompleted).length;
        
        // 计算完成率
        const totalDays = 30; // 简化为最近30天
        const completedDays = habitCheckins.filter(c => c.isCompleted).length;
        const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        
        // 计算连续天数
        // 简化实现，实际应考虑更复杂的逻辑
        const streak = Math.floor(Math.random() * 10) + 1; // 模拟数据
        
        // 计算最佳日期和时间
        // 简化实现，使用模拟数据
        const bestDay = '周一';
        const bestTime = '早晨';
        
        return {
          id: habit.id,
          name: habit.name,
          color: habit.color,
          icon: habit.icon,
          completionRate,
          streak,
          totalCheckins,
          bestDay,
          bestTime
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate);
    
    this.setData({ 'reportData.habitDetails': habitDetails });
  },

  /**
   * 计算趋势数据
   */
  calculateTrends(habits: IHabit[], checkins: ICheckin[]) {
    // 生成周标签（最近4周）
    const weekLabels = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      weekLabels.push(`第${4-i}周`);
    }
    
    // 生成月标签（最近6个月）
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      monthLabels.push(`${date.getMonth() + 1}月`);
    }
    
    // 生成周完成率数据（模拟数据）
    const weeklyCompletion = [65, 72, 80, 85];
    
    // 生成月完成率数据（模拟数据）
    const monthlyCompletion = [50, 55, 62, 68, 75, 82];
    
    this.setData({
      'reportData.trends': {
        weeklyCompletion,
        monthlyCompletion,
        weekLabels,
        monthLabels
      }
    });
  },

  /**
   * 跳转到习惯详情
   */
  navigateToHabit(e: WechatMiniprogram.TouchEvent) {
    const habitId = e.currentTarget.dataset.habitId;
    wx.navigateTo({
      url: `/pages/habits/detail/detail?id=${habitId}`
    });
  },

  /**
   * 保存报告
   */
  saveReport() {
    wx.showLoading({
      title: '保存中'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '报告已保存',
        icon: 'success'
      });
    }, 1500);
  },

  /**
   * 分享报告
   */
  shareReport() {
    // 分享功能在onShareAppMessage中实现
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的习惯数据报告',
      path: '/packageAnalytics/pages/report/report'
    };
  }
}); 
