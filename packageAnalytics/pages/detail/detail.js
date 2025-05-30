// packageAnalytics/pages/detail/detail.js

const { getHabit, getCheckinsByHabitId, formatDate, getPastDates } = require('../../../utils/storage');
const { shouldDoHabitOnDate, generateHabitStats } = require('../../../utils/habit');
const { formatDate: formatDateUtil } = require('../../../utils/date');

// 引入图表绘制工具
let wxCharts;
// 判断是否引入成功
try {
  wxCharts = require('../../../utils/wxcharts.js');
} catch (e) {
  console.error('wxcharts.js 未找到，图表功能将不可用');
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    habitId: '',
    loading: true,
    timeRange: 'week', // 'week', 'month', 'year'
    habitData: {
      id: '',
      name: '',
      category: '',
      color: '#4F7CFF',
      icon: 'habit',
      createdAt: '',
      stats: {
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalCheckins: 0
      },
      patterns: {
        bestTime: '',
        bestDay: '',
        longestStreakDate: ''
      },
      suggestions: []
    },
    calendarData: {
      year: 2023,
      month: 10,
      days: []
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({ habitId: options.id });
      this.loadHabitData(options.id);
    } else {
      wx.showToast({
        title: '未找到习惯信息',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 加载习惯数据
   */
  loadHabitData(habitId) {
    this.setData({ loading: true });

    // 获取习惯信息
    const habit = getHabit(habitId);
    if (!habit) {
      wx.showToast({
        title: '未找到习惯信息',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 获取习惯打卡记录
    const checkins = getCheckinsByHabitId(habitId);
    
    // 计算习惯统计数据
    const stats = generateHabitStats(habit, checkins);
    
    // 分析习惯模式
    const patterns = this.analyzeHabitPatterns(habit, checkins);
    
    // 生成个性化建议
    const suggestions = this.generateSuggestions(habit, stats, patterns);
    
    // 更新习惯数据
    this.setData({
      'habitData.id': habit.id,
      'habitData.name': habit.name,
      'habitData.category': habit.category,
      'habitData.color': habit.color || '#4F7CFF',
      'habitData.icon': habit.icon || 'habit',
      'habitData.createdAt': formatDateUtil(new Date(habit.createdAt)),
      'habitData.stats': stats,
      'habitData.patterns': patterns,
      'habitData.suggestions': suggestions,
      loading: false
    });
    
    // 初始化日历
    this.initCalendar();
    
    // 生成图表
    this.generateChart();
  },

  /**
   * 分析习惯模式
   */
  analyzeHabitPatterns(habit, checkins) {
    // 初始化模式数据
    const patterns = {
      bestTime: '',
      bestDay: '',
      longestStreakDate: ''
    };
    
    if (checkins.length === 0) {
      return patterns;
    }
    
    // 分析最佳时段
    const timeDistribution = {};
    checkins.forEach(checkin => {
      if (!checkin.isCompleted || !checkin.time) return;
      
      // 简化时段划分，按小时
      const hour = new Date(checkin.time).getHours();
      let timeSlot = '';
      
      if (hour >= 5 && hour < 9) {
        timeSlot = '早晨 (5:00-9:00)';
      } else if (hour >= 9 && hour < 12) {
        timeSlot = '上午 (9:00-12:00)';
      } else if (hour >= 12 && hour < 14) {
        timeSlot = '中午 (12:00-14:00)';
      } else if (hour >= 14 && hour < 18) {
        timeSlot = '下午 (14:00-18:00)';
      } else if (hour >= 18 && hour < 22) {
        timeSlot = '晚上 (18:00-22:00)';
      } else {
        timeSlot = '深夜 (22:00-5:00)';
      }
      
      timeDistribution[timeSlot] = (timeDistribution[timeSlot] || 0) + 1;
    });
    
    // 找出最佳时段
    let bestTime = '';
    let maxCount = 0;
    
    for (const time in timeDistribution) {
      if (timeDistribution[time] > maxCount) {
        bestTime = time;
        maxCount = timeDistribution[time];
      }
    }
    
    patterns.bestTime = bestTime || '暂无数据';
    
    // 分析最佳日期
    const dayDistribution = {
      '周一': 0, '周二': 0, '周三': 0, '周四': 0, '周五': 0, '周六': 0, '周日': 0
    };
    
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    checkins.forEach(checkin => {
      if (!checkin.isCompleted || !checkin.date) return;
      
      const date = new Date(checkin.date.replace(/-/g, '/'));
      const day = dayNames[date.getDay()];
      
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    });
    
    // 找出最佳日期
    let bestDay = '';
    maxCount = 0;
    
    for (const day in dayDistribution) {
      if (dayDistribution[day] > maxCount) {
        bestDay = day;
        maxCount = dayDistribution[day];
      }
    }
    
    patterns.bestDay = bestDay || '暂无数据';
    
    // 最长连续日期
    if (habit.stats && habit.stats.longestStreakStart) {
      patterns.longestStreakDate = formatDateUtil(new Date(habit.stats.longestStreakStart));
    } else {
      patterns.longestStreakDate = '暂无数据';
    }
    
    return patterns;
  },

  /**
   * 生成个性化建议
   */
  generateSuggestions(habit, stats, patterns) {
    const suggestions = [];
    
    // 根据完成率生成建议
    if (stats.completionRate < 30) {
      suggestions.push('完成率较低，建议降低难度或调整目标，让习惯更容易坚持。');
    } else if (stats.completionRate < 70) {
      suggestions.push('完成率一般，可以尝试设置提醒或与朋友一起打卡，增加坚持动力。');
    } else {
      suggestions.push('完成率很高，可以考虑适当提高难度或设置新的挑战。');
    }
    
    // 根据连续天数生成建议
    if (stats.currentStreak === 0) {
      suggestions.push('当前连续打卡中断，不要气馁，重新开始并记录感受，找到中断原因。');
    } else if (stats.currentStreak < 7) {
      suggestions.push(`已连续打卡${stats.currentStreak}天，坚持到7天是形成习惯的第一步。`);
    } else if (stats.currentStreak < 21) {
      suggestions.push(`已连续打卡${stats.currentStreak}天，坚持到21天习惯将更加稳固。`);
    } else if (stats.currentStreak < 66) {
      suggestions.push(`已连续打卡${stats.currentStreak}天，坚持到66天习惯将成为自然行为。`);
    } else {
      suggestions.push(`已连续打卡${stats.currentStreak}天，太棒了！习惯已经成为你生活的一部分。`);
    }
    
    // 根据最佳时段生成建议
    if (patterns.bestTime && patterns.bestTime !== '暂无数据') {
      suggestions.push(`你在${patterns.bestTime}完成习惯的频率最高，建议固定在这个时段执行，提高成功率。`);
    }
    
    return suggestions;
  },

  /**
   * 初始化日历
   */
  initCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    this.generateCalendarDays(year, month);
  },

  /**
   * 生成日历数据
   */
  generateCalendarDays(year, month) {
    // 获取当月第一天是周几（0-6，0是周日）
    const firstDay = new Date(year, month - 1, 1).getDay();
    // 调整为周一为一周的第一天（0-6，0是周一）
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
    
    // 获取当月天数
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 获取上个月的天数
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
    
    // 获取习惯打卡记录
    const checkins = getCheckinsByHabitId(this.data.habitId);
    
    // 生成日历数据
    const days = [];
    
    // 上个月的日期
    for (let i = 0; i < firstDayAdjusted; i++) {
      const day = daysInPrevMonth - firstDayAdjusted + i + 1;
      const date = `${year}-${month > 1 ? month - 1 : 12}-${day < 10 ? '0' + day : day}`;
      
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: formatDateUtil(new Date()) === date,
        isCompleted: this.checkIsCompleted(date, checkins)
      });
    }
    
    // 当月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${year}-${month < 10 ? '0' + month : month}-${i < 10 ? '0' + i : i}`;
      
      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday: formatDateUtil(new Date()) === date,
        isCompleted: this.checkIsCompleted(date, checkins)
      });
    }
    
    // 下个月的日期
    const nextMonthDays = 42 - days.length; // 6行7列
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = `${year}-${month < 12 ? month + 1 : 1}-${i < 10 ? '0' + i : i}`;
      
      days.push({
        date,
        day: i,
        isCurrentMonth: false,
        isToday: formatDateUtil(new Date()) === date,
        isCompleted: this.checkIsCompleted(date, checkins)
      });
    }
    
    this.setData({
      'calendarData.year': year,
      'calendarData.month': month,
      'calendarData.days': days
    });
  },

  /**
   * 检查某日是否完成打卡
   */
  checkIsCompleted(date, checkins) {
    return checkins.some(checkin => checkin.date === date && checkin.isCompleted);
  },

  /**
   * 切换月份
   */
  changeMonth(e) {
    const direction = e.currentTarget.dataset.direction;
    let { year, month } = this.data.calendarData;
    
    if (direction === 'prev') {
      if (month === 1) {
        year--;
        month = 12;
      } else {
        month--;
      }
    } else {
      if (month === 12) {
        year++;
        month = 1;
      } else {
        month++;
      }
    }
    
    this.generateCalendarDays(year, month);
  },

  /**
   * 切换时间范围
   */
  switchTimeRange(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({ timeRange: range }, () => {
      this.generateChart();
    });
  },

  /**
   * 生成图表
   */
  generateChart() {
    if (!wxCharts) {
      console.error('wxCharts未加载，无法绘制图表');
      return;
    }
    
    const { timeRange, habitId } = this.data;
    const checkins = getCheckinsByHabitId(habitId);
    
    // 根据时间范围确定数据点数量
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
    
    // 获取过去n天的日期
    const dates = getPastDates(days);
    
    // 计算每天的完成情况
    const completionData = dates.map(date => {
      const checkin = checkins.find(c => c.date === date);
      return checkin && checkin.isCompleted ? 1 : 0;
    });
    
    // 计算7天移动平均完成率
    const movingAverage = [];
    for (let i = 0; i < completionData.length; i++) {
      if (i < 6) {
        // 不足7天的数据点，使用当前所有数据的平均值
        const sum = completionData.slice(0, i + 1).reduce((a, b) => a + b, 0);
        movingAverage.push((sum / (i + 1)) * 100);
      } else {
        // 7天移动平均
        const sum = completionData.slice(i - 6, i + 1).reduce((a, b) => a + b, 0);
        movingAverage.push((sum / 7) * 100);
      }
    }
    
    // 准备图表数据
    const categories = dates.map(date => {
      // 简化日期显示
      if (timeRange === 'week') {
        return date.substring(5); // 只显示月-日
      } else if (timeRange === 'month') {
        return date.substring(8); // 只显示日
      } else {
        return date.substring(5, 10); // 显示月-日
      }
    });
    
    // 绘制图表
    try {
      new wxCharts({
        canvasId: 'completionChart',
        type: 'line',
        categories: categories,
        series: [{
          name: '完成率',
          data: movingAverage,
          format: function (val) {
            return val.toFixed(0) + '%';
          }
        }],
        yAxis: {
          title: '完成率 (%)',
          format: function (val) {
            return val.toFixed(0);
          },
          min: 0,
          max: 100
        },
        width: wx.getSystemInfoSync().windowWidth - 64,
        height: 200,
        dataLabel: false,
        dataPointShape: true,
        extra: {
          lineStyle: 'curve'
        }
      });
    } catch (e) {
      console.error('绘制图表失败', e);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadHabitData(this.data.habitId);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: `${this.data.habitData.name}的习惯分析`,
      path: `/packageAnalytics/pages/detail/detail?id=${this.data.habitId}`
    };
  }
})
