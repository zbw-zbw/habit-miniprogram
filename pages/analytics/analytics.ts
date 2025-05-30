/**
 * 数据分析页面
 */
import { formatDate, getPastDates } from '../../utils/date';
import { habitAPI, checkinAPI } from '../../services/api';

interface IPageData {
  activeTab: 'overview' | 'habits' | 'calendar';
  timeRange: 'week' | 'month' | 'year';
  loading: boolean;
  stats: {
    totalHabits: number;
    activeHabits: number;
    completedToday: number;
    completionRate: number;
    totalCheckins: number;
    currentStreak: number;
    longestStreak: number;
  };
  habitStats: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    completionRate: number;
    streak: number;
    totalCheckins: number;
  }>;
  chartData: {
    dates: string[];
    values: number[];
    completionRates: number[];
  };
  // 日历相关数据
  calendarTitle: string;
  calendarMonth: number;
  calendarYear: number;
  calendarDays: Array<{
    date: string;
    day: number;
    isCurrentMonth: boolean;
    isCompleted: boolean;
    isToday: boolean;
  }>;
  // 存储打卡数据
  checkins: ICheckin[];
}

interface IPageMethods {
  loadData(): void;
  calculateOverallStats(habits: IHabit[], checkins: ICheckin[]): void;
  calculateHabitStats(habits: IHabit[], checkins: ICheckin[]): void;
  generateChartData(habits: IHabit[], checkins: ICheckin[]): void;
  switchTab(e: WechatMiniprogram.TouchEvent): void;
  switchTimeRange(e: WechatMiniprogram.TouchEvent): void;
  viewHabitDetail(e: WechatMiniprogram.TouchEvent): void;
  generateReport(): void;
  navigateToInsights(): void;
  // 日历相关方法
  updateCalendar(): void;
  isDateCompleted(date: string): boolean;
  isToday(date: string): boolean;
  changeMonth(e: WechatMiniprogram.TouchEvent): void;
  viewDayDetail(e: WechatMiniprogram.TouchEvent): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'overview',
    timeRange: 'week',
    loading: true,
    stats: {
      totalHabits: 0,
      activeHabits: 0,
      completedToday: 0,
      completionRate: 0,
      totalCheckins: 0,
      currentStreak: 0,
      longestStreak: 0
    },
    habitStats: [],
    chartData: {
      dates: [],
      values: [],
      completionRates: []
    },
    // 日历相关数据
    calendarTitle: '',
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
    calendarDays: [],
    // 存储打卡数据
    checkins: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 页面加载时执行
    this.updateCalendar();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadData();
    this.updateCalendar();
  },

  /**
   * 加载数据
   */
  loadData() {
    this.setData({ loading: true });
    
    // 获取习惯和打卡数据
    Promise.all([
      habitAPI.getHabits(),
      checkinAPI.getCheckins()
    ])
      .then(([habits, checkins]) => {
        // 保存打卡数据到页面数据中
        this.setData({ checkins });
        
        // 计算总体统计数据
        this.calculateOverallStats(habits, checkins);
        
        // 计算各习惯统计数据
        this.calculateHabitStats(habits, checkins);
        
        // 生成图表数据
        this.generateChartData(habits, checkins);
        
        this.setData({ loading: false });
        
        // 更新日历数据
        this.updateCalendar();
      })
      .catch(error => {
        console.error('加载数据失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  /**
   * 计算总体统计数据
   */
  calculateOverallStats(habits: IHabit[], checkins: ICheckin[]) {
    const today = formatDate(new Date());
    const activeHabits = habits.filter(h => !h.isArchived);
    const completedToday = checkins.filter(c => c.date === today && c.isCompleted).length;
    
    // 获取所有习惯的统计数据
    const statsPromises = activeHabits
      .filter(habit => !!habit.id) // 过滤掉没有有效ID的习惯
      .map(habit => 
        habitAPI.getHabitStats(habit.id)
          .catch(error => {
            console.error(`获取习惯 ${habit.name || habit.id} 的统计数据失败:`, error);
            // 返回默认统计数据
            return {
              totalCompletions: 0,
              totalDays: 0,
              currentStreak: 0,
              longestStreak: 0,
              completionRate: 0,
              lastCompletedDate: null
            };
          })
      );
    
    Promise.all(statsPromises)
      .then(statsArray => {
        // 计算总体完成率
        let totalCompletions = 0;
        let totalDays = 0;
        let maxCurrentStreak = 0;
        let maxLongestStreak = 0;
        
        statsArray.forEach(stats => {
          totalCompletions += stats.totalCompletions;
          totalDays += stats.totalDays;
          maxCurrentStreak = Math.max(maxCurrentStreak, stats.currentStreak);
          maxLongestStreak = Math.max(maxLongestStreak, stats.longestStreak);
        });
    
        const completionRate = totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100) : 0;
    
        this.setData({
          'stats.totalHabits': habits.length,
          'stats.activeHabits': activeHabits.length,
          'stats.completedToday': completedToday,
          'stats.completionRate': completionRate,
          'stats.totalCheckins': checkins.filter(c => c.isCompleted).length,
          'stats.currentStreak': maxCurrentStreak,
          'stats.longestStreak': maxLongestStreak
        });
      })
      .catch(error => {
        console.error('计算总体统计数据失败:', error);
      });
  },

  /**
   * 计算各习惯统计数据
   */
  calculateHabitStats(habits: IHabit[], checkins: ICheckin[]) {
    const activeHabits = habits.filter(h => !h.isArchived);
    
    // 获取每个习惯的统计数据
    const statsPromises = activeHabits
      .filter(habit => !!habit.id) // 过滤掉没有有效ID的习惯
      .map(habit => 
        habitAPI.getHabitStats(habit.id)
          .then(stats => {
            const habitCheckins = checkins.filter(c => c.habitId === habit.id);
            const totalCheckins = habitCheckins.filter(c => c.isCompleted).length;
            
            return {
              id: habit.id,
              name: habit.name,
              color: habit.color,
              icon: habit.icon,
              completionRate: Math.round(stats.completionRate * 100),
              streak: stats.currentStreak,
              totalCheckins
            };
          })
          .catch(error => {
            console.error(`获取习惯 ${habit.name || habit.id} 的统计数据失败:`, error);
            // 返回默认统计数据
            return {
              id: habit.id,
              name: habit.name,
              color: habit.color || '#4F7CFF',
              icon: habit.icon || 'star',
              completionRate: 0,
              streak: 0,
              totalCheckins: 0
            };
          })
      );
    
    Promise.all(statsPromises)
      .then(habitStats => {
        // 按完成率排序
        habitStats.sort((a, b) => b.completionRate - a.completionRate);
        this.setData({ habitStats });
      })
      .catch(error => {
        console.error('计算习惯统计数据失败:', error);
      });
  },

  /**
   * 生成图表数据
   */
  generateChartData(habits: IHabit[], checkins: ICheckin[]) {
    const { timeRange } = this.data;
    let days = 7;
    
    switch (timeRange) {
      case 'week':
        days = 7;
        break;
      case 'month':
        days = 30;
        break;
      case 'year':
        days = 365;
        break;
    }
    
    // 获取过去几天的日期
    const dates = getPastDates(days);
    const activeHabits = habits.filter(h => !h.isArchived);
    
    // 计算每天的完成情况
    const values = [];
    const completionRates = [];
    
    for (const date of dates) {
      let totalHabits = 0;
      let completedHabits = 0;
      
      activeHabits.forEach(habit => {
        // 简化逻辑，实际应调用 shouldDoHabitOnDate
        totalHabits++;
        
        // 检查是否完成
        if (checkins.some(c => c.habitId === habit.id && c.date === date && c.isCompleted)) {
          completedHabits++;
        }
      });
      
      values.push(completedHabits);
      const rate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
      completionRates.push(rate);
    }
    
    // 格式化日期为短格式
    const formattedDates = dates.map(date => {
      const parts = date.split('-');
      return `${parts[1]}/${parts[2]}`;
    });
    
    this.setData({
      'chartData.dates': formattedDates,
      'chartData.values': values,
      'chartData.completionRates': completionRates
    });
  },

  /**
   * 切换标签
   */
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as 'overview' | 'habits' | 'calendar';
    this.setData({ activeTab: tab });
    
    // 切换到日历标签时更新日历
    if (tab === 'calendar') {
      this.updateCalendar();
    }
  },

  /**
   * 切换时间范围
   */
  switchTimeRange(e: WechatMiniprogram.TouchEvent) {
    const range = e.currentTarget.dataset.range as 'week' | 'month' | 'year';
    this.setData({ timeRange: range }, () => {
      // 重新加载数据
      this.loadData();
    });
  },

  /**
   * 查看习惯详情
   */
  viewHabitDetail(e: WechatMiniprogram.TouchEvent) {
    const habitId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/habits/detail/detail?id=${habitId}`
    });
  },

  /**
   * 生成报告
   */
  generateReport() {
    wx.showLoading({
      title: '生成报告中'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '报告已生成',
        content: '您的习惯分析报告已生成，可以在"我的-报告"中查看',
        showCancel: false
      });
    }, 1500);
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的习惯分析报告',
      path: '/pages/analytics/analytics',
      imageUrl: '/images/share-analytics.png'
    };
  },

  /**
   * 跳转到习惯洞察页面
   */
  navigateToInsights() {
    wx.navigateTo({
      url: '/packageAnalytics/pages/insights/insights'
    });
  },

  /**
   * 更新日历
   */
  updateCalendar() {
    const { calendarYear, calendarMonth } = this.data;
    const calendarTitle = `${calendarYear}年${calendarMonth + 1}月`;
    
    // 获取当月第一天是周几
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay() || 7; // 转换为周一为1，周日为7
    const firstDayIndex = firstDay === 7 ? 0 : firstDay; // 调整为数组索引
    
    // 获取当月天数
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    
    // 上个月的天数
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();
    
    const calendarDays = [];
    const today = formatDate(new Date());
    
    // 上个月的日期
    for (let i = 0; i < firstDayIndex; i++) {
      const day = prevMonthDays - firstDayIndex + i + 1;
      const date = formatDate(new Date(calendarYear, calendarMonth - 1, day));
      calendarDays.push({
        date,
        day,
        isCurrentMonth: false,
        isCompleted: this.isDateCompleted(date),
        isToday: this.isToday(date)
      });
    }
    
    // 当月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = formatDate(new Date(calendarYear, calendarMonth, i));
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: true,
        isCompleted: this.isDateCompleted(date),
        isToday: this.isToday(date)
      });
    }
    
    // 下个月的日期
    const remainingDays = 42 - calendarDays.length; // 6行7列
    for (let i = 1; i <= remainingDays; i++) {
      const date = formatDate(new Date(calendarYear, calendarMonth + 1, i));
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: false,
        isCompleted: this.isDateCompleted(date),
        isToday: this.isToday(date)
      });
    }
    
    this.setData({
      calendarTitle,
      calendarDays
    });
  },
  
  /**
   * 检查日期是否已完成打卡
   */
  isDateCompleted(date: string): boolean {
    // 使用页面中存储的打卡记录来判断日期是否已完成
    return this.data.checkins.some(checkin => checkin.date === date && checkin.isCompleted);
  },
  
  /**
   * 检查是否是今天
   */
  isToday(date: string): boolean {
    return date === formatDate(new Date());
  },
  
  /**
   * 切换月份
   */
  changeMonth(e: WechatMiniprogram.TouchEvent) {
    const { direction } = e.currentTarget.dataset;
    let { calendarYear, calendarMonth } = this.data;
    
    if (direction === 'prev') {
      calendarMonth--;
      if (calendarMonth < 0) {
        calendarMonth = 11;
        calendarYear--;
      }
    } else {
      calendarMonth++;
      if (calendarMonth > 11) {
        calendarMonth = 0;
        calendarYear++;
      }
    }
    
    this.setData({
      calendarYear,
      calendarMonth
    }, () => {
      this.updateCalendar();
    });
  },
  
  /**
   * 查看日期详情
   */
  viewDayDetail(e: WechatMiniprogram.TouchEvent) {
    const { date } = e.currentTarget.dataset;
    
    wx.showToast({
      title: `查看${date}的记录`,
      icon: 'none'
    });
    
    // 实际项目中可以跳转到日期详情页
    // wx.navigateTo({
    //   url: `/pages/date-detail/date-detail?date=${date}`
    // });
  }
}); 
