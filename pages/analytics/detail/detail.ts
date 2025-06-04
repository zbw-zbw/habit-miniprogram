/**
 * 习惯分析详情页面
 * 提供单个习惯的详细分析报告
 */

import { habitAPI, checkinAPI, analyticsAPI } from '../../../services/api';
import { generateHabitStats, formatDateRange } from '../../../utils/habit';
import { getCurrentWeekDates, formatDate, addDays, daysBetween } from '../../../utils/date';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    habitId: '',
    habit: null,
    checkins: [],
    loading: true,
    error: '',
    dateRanges: [
      { name: '最近7天', value: 7 },
      { name: '最近30天', value: 30 },
      { name: '最近90天', value: 90 },
      { name: '全部', value: 0 }
    ],
    selectedRange: 30,
    stats: {
      completionRate: 0,
      totalCompletions: 0,
      totalDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageStreak: 0
    },
    chartData: {
      completion: [],
      trend: [],
      weekdays: []
    },
    detailedInsights: [],
    recommendationCategories: [
      { id: 'timing', name: '时间建议', icon: 'clock', tips: [] },
      { id: 'consistency', name: '一致性建议', icon: 'calendar', tips: [] },
      { id: 'motivation', name: '动机建议', icon: 'bulb', tips: [] },
      { id: 'environment', name: '环境建议', icon: 'location', tips: [] }
    ],
    activeCategoryIndex: 0,
    habitMilestones: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({
        habitId: options.id
      });
      this.loadHabitData();
    } else {
      wx.showToast({
        title: '参数错误',
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
  async loadHabitData() {
    this.setData({ loading: true, error: '' });
    try {
      // 获取习惯详情
      const habit = await habitAPI.getHabit(this.data.habitId);
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: `${habit.name} · 分析`
      });
      
      // 获取打卡记录
      await this.loadCheckins(habit);
      
      // 更新页面数据
      this.setData({
        habit,
        loading: false
      });
    } catch (error) {
      
      this.setData({
        loading: false,
        error: '加载数据失败，请稍后重试'
      });
    }
  },

  /**
   * 加载打卡记录
   */
  async loadCheckins(habit) {
    try {
      // 计算日期范围
      const endDate = formatDate(new Date());
      let startDate = endDate;
      
      if (this.data.selectedRange > 0) {
        const startDateObj = new Date();
        startDateObj.setDate(startDateObj.getDate() - this.data.selectedRange);
        startDate = formatDate(startDateObj);
      } else if (habit.startDate) {
        startDate = habit.startDate;
      }
      
      // 获取指定日期范围内的打卡记录
      const checkins = await checkinAPI.getCheckins({
        habitId: this.data.habitId,
        startDate,
        endDate
      });
      
      // 计算统计数据
      this.calculateStats(habit, checkins, startDate, endDate);
      
      // 生成图表数据
      this.generateChartData(habit, checkins, startDate, endDate);
      
      // 生成详细洞察
      this.generateDetailedInsights(habit, checkins);
      
      // 生成建议
      this.generateRecommendations(habit, checkins);
      
      // 生成里程碑
      this.generateMilestones(habit, checkins);
      
      // 更新页面数据
      this.setData({
        checkins,
        loading: false
      });
    } catch (error) {
      
      this.setData({
        loading: false,
        error: '加载数据失败，请稍后重试'
      });
    }
  },

  /**
   * 计算统计数据
   */
  calculateStats(habit, checkins, startDate, endDate) {
    // 获取基础统计数据
    const stats = generateHabitStats(habit, checkins);
    
    // 计算时间范围内的总天数
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const totalDays = daysBetween(startDateObj, endDateObj) + 1;
    
    // 计算平均连续天数
    const streaks = this.calculateStreaks(habit, checkins);
    const averageStreak = streaks.length > 0
      ? streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length
      : 0;
    
    // 更新统计数据
    this.setData({
      'stats.completionRate': stats.completionRate,
      'stats.totalCompletions': stats.totalCompletions,
      'stats.totalDays': totalDays,
      'stats.currentStreak': stats.currentStreak,
      'stats.longestStreak': stats.longestStreak,
      'stats.averageStreak': averageStreak.toFixed(1)
    });
  },

  /**
   * 计算所有连续天数记录
   */
  calculateStreaks(habit, checkins) {
    // 按日期排序
    const sortedCheckins = [...checkins].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const streaks = [];
    let currentStreak = 0;
    
    // 遍历打卡记录，计算每个连续记录段
    for (let i = 0; i < sortedCheckins.length; i++) {
      if (sortedCheckins[i].isCompleted) {
        currentStreak++;
      } else if (currentStreak > 0) {
        streaks.push(currentStreak);
        currentStreak = 0;
      }
    }
    
    // 添加最后一个连续段
    if (currentStreak > 0) {
      streaks.push(currentStreak);
    }
    
    return streaks;
  },

  /**
   * 生成图表数据
   */
  generateChartData(habit, checkins, startDate, endDate) {
    // 按日期排序
    const sortedCheckins = [...checkins].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // 生成完成率图表数据
    const completion = [];
    const trend = [];
    
    // 计算每个日期的完成情况
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    let currentDate = new Date(startDateObj);
    
    while (currentDate <= endDateObj) {
      const dateStr = formatDate(currentDate);
      const checkin = sortedCheckins.find(c => c.date === dateStr);
      
      completion.push({
        date: dateStr,
        completed: checkin ? checkin.isCompleted : false
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    // 计算7天滚动平均完成率
    if (completion.length >= 7) {
      for (let i = 6; i < completion.length; i++) {
        const weekData = completion.slice(i - 6, i + 1);
        const completedCount = weekData.filter(d => d.completed).length;
        const rate = (completedCount / 7) * 100;
        
        trend.push({
          date: completion[i].date,
          rate: parseFloat(rate.toFixed(1))
        });
      }
    }
    
    // 计算每周日完成率
    const weekdays = [0, 0, 0, 0, 0, 0, 0]; // 周一到周日的完成次数
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // 周一到周日的总次数
    
    for (const item of completion) {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay(); // 0是周日，1-6是周一到周六
      const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 转换为0-6表示周一到周日
      
      weekdayCounts[index]++;
      if (item.completed) {
        weekdays[index]++;
      }
    }
    
    // 计算每天的完成率
    const weekdayRates = weekdays.map((count, index) => {
      return weekdayCounts[index] > 0
        ? parseFloat(((count / weekdayCounts[index]) * 100).toFixed(1))
        : 0;
    });
    
    // 更新图表数据
    this.setData({
      'chartData.completion': completion,
      'chartData.trend': trend,
      'chartData.weekdays': weekdayRates
    });
  },

  /**
   * 生成详细洞察
   */
  generateDetailedInsights(habit, checkins) {
    // 按日期排序
    const sortedCheckins = [...checkins].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const insights = [];
    
    // 添加基础洞察
    if (this.data.stats.completionRate >= 80) {
      insights.push({
        type: 'achievement',
        title: '优秀的坚持',
        content: `你的完成率达到了${this.data.stats.completionRate.toFixed(1)}%，这是非常出色的表现！坚持是成功的关键。`,
        icon: 'trophy'
      });
    } else if (this.data.stats.completionRate >= 50) {
      insights.push({
        type: 'progress',
        title: '良好的进展',
        content: `你的完成率为${this.data.stats.completionRate.toFixed(1)}%，继续保持并尝试提高。`,
        icon: 'thumbs-up'
      });
    } else if (sortedCheckins.length > 0) {
      insights.push({
        type: 'encouragement',
        title: '继续努力',
        content: `你的完成率为${this.data.stats.completionRate.toFixed(1)}%，养成习惯需要时间，不要放弃！`,
        icon: 'heart'
      });
    }
    
    // 分析时间模式
    if (this.data.chartData.weekdays.length > 0) {
      const maxRate = Math.max(...this.data.chartData.weekdays);
      const maxIndex = this.data.chartData.weekdays.indexOf(maxRate);
      const minRate = Math.min(...this.data.chartData.weekdays.filter(r => r > 0));
      const minIndex = this.data.chartData.weekdays.indexOf(minRate);
      
      if (maxRate > 0) {
        const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        insights.push({
          type: 'pattern',
          title: '时间模式',
          content: `你在${weekdayNames[maxIndex]}的完成率最高(${maxRate}%)，而在${weekdayNames[minIndex]}的完成率最低(${minRate}%)。考虑分析这些差异的原因。`,
          icon: 'calendar'
        });
      }
    }
    
    // 分析连续性
    if (this.data.stats.longestStreak > 7) {
      insights.push({
        type: 'streak',
        title: '出色的连续性',
        content: `你的最长连续记录达到了${this.data.stats.longestStreak}天，这表明你有能力保持长期坚持。`,
        icon: 'fire'
      });
    }
    
    // 分析趋势
    if (this.data.chartData.trend.length >= 2) {
      const firstRate = this.data.chartData.trend[0].rate;
      const lastRate = this.data.chartData.trend[this.data.chartData.trend.length - 1].rate;
      const difference = lastRate - firstRate;
      
      if (Math.abs(difference) >= 10) {
        insights.push({
          type: difference > 0 ? 'improvement' : 'decline',
          title: difference > 0 ? '积极改善' : '需要注意',
          content: difference > 0
            ? `你的习惯完成率比开始时提高了${difference.toFixed(1)}%，继续保持这种进步！`
            : `你的习惯完成率比开始时下降了${Math.abs(difference).toFixed(1)}%，可能需要重新审视你的策略。`,
          icon: difference > 0 ? 'trending-up' : 'trending-down'
        });
      }
    }
    
    // 检查笔记内容
    const notesCheckins = sortedCheckins.filter(c => c.note && c.note.trim() !== '');
    if (notesCheckins.length > 0) {
      const noteRate = (notesCheckins.length / sortedCheckins.length) * 100;
      
      if (noteRate >= 50) {
        insights.push({
          type: 'reflection',
          title: '良好的反思习惯',
          content: `你有${noteRate.toFixed(0)}%的打卡记录包含笔记，这种记录和反思有助于更好地理解你的习惯。`,
          icon: 'pencil'
        });
      }
    }
    
    this.setData({
      detailedInsights: insights
    });
  },

  /**
   * 生成建议
   */
  generateRecommendations(habit, checkins) {
    // 时间建议
    const timingTips = [];
    
    // 检查是否有明显的最佳时间
    if (this.data.chartData.weekdays.length > 0) {
      const maxRate = Math.max(...this.data.chartData.weekdays);
      const maxIndex = this.data.chartData.weekdays.indexOf(maxRate);
      
      if (maxRate >= 70) {
        const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        timingTips.push({
          title: '利用最佳时间',
          content: `你在${weekdayNames[maxIndex]}的完成率最高，尝试将更多重要习惯安排在这一天。`
        });
      }
    }
    
    timingTips.push({
      title: '固定时间',
      content: '在固定的时间执行习惯可以降低决策疲劳，提高完成率。'
    });
    
    // 一致性建议
    const consistencyTips = [];
    
    if (this.data.stats.currentStreak > 0) {
      consistencyTips.push({
        title: '不要打破链条',
        content: `你当前已连续${this.data.stats.currentStreak}天，继续保持这个链条不要中断。`
      });
    }
    
    consistencyTips.push({
      title: '两日原则',
      content: '避免连续两天不执行习惯，这会大大降低习惯中断的风险。'
    });
    
    if (this.data.stats.completionRate < 50) {
      consistencyTips.push({
        title: '降低难度',
        content: '你的完成率较低，考虑降低习惯难度，先培养持续性再提高标准。'
      });
    }
    
    // 动机建议
    const motivationTips = [];
    
    motivationTips.push({
      title: '习惯叠加',
      content: '将新习惯与已有的稳定习惯绑定，利用现有习惯的惯性。'
    });
    
    motivationTips.push({
      title: '习惯追踪',
      content: '每天记录习惯本身就能提高动机，确保坚持打卡记录。'
    });
    
    if (this.data.stats.longestStreak > 0) {
      motivationTips.push({
        title: '挑战自己',
        content: `尝试打破你的最长连续记录${this.data.stats.longestStreak}天，将其作为挑战目标。`
      });
    }
    
    // 环境建议
    const environmentTips = [];
    
    environmentTips.push({
      title: '环境设计',
      content: '设计支持习惯的环境，减少摩擦，增加提示。'
    });
    
    environmentTips.push({
      title: '社交支持',
      content: '与朋友分享你的习惯目标，利用社交压力提高坚持度。'
    });
    
    environmentTips.push({
      title: '习惯可视化',
      content: '在显眼位置放置习惯提醒或进度表，增强环境提示。'
    });
    
    // 更新建议分类
    this.setData({
      'recommendationCategories[0].tips': timingTips,
      'recommendationCategories[1].tips': consistencyTips,
      'recommendationCategories[2].tips': motivationTips,
      'recommendationCategories[3].tips': environmentTips
    });
  },

  /**
   * 生成里程碑
   */
  generateMilestones(habit, checkins) {
    const completedCheckins = checkins.filter(c => c.isCompleted);
    const milestones = [];
    
    // 计算里程碑
    const totalCompletions = completedCheckins.length;
    
    // 第一次完成
    if (totalCompletions > 0) {
      const firstCheckin = completedCheckins.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )[0];
      
      milestones.push({
        title: '第一次完成',
        date: firstCheckin.date,
        description: '开始是最重要的一步，你已经迈出了这一步！',
        achieved: true,
        icon: 'flag'
      });
    }
    
    // 累计次数里程碑
    const countMilestones = [7, 21, 50, 100, 365];
    for (const count of countMilestones) {
      if (totalCompletions >= count) {
        milestones.push({
          title: `完成${count}次`,
          date: completedCheckins.length >= count ? completedCheckins[count - 1].date : '',
          description: `你已累计完成${count}次，继续坚持！`,
          achieved: true,
          icon: 'trophy'
        });
      } else {
        milestones.push({
          title: `完成${count}次`,
          date: '',
          description: `再完成${count - totalCompletions}次即可达成`,
          achieved: false,
          icon: 'trophy'
        });
        break; // 只显示下一个未达成的里程碑
      }
    }
    
    // 连续天数里程碑
    const streakMilestones = [7, 21, 30, 60, 100, 365];
    let streakMilestoneAdded = false;
    
    for (const days of streakMilestones) {
      if (this.data.stats.longestStreak >= days) {
        milestones.push({
          title: `连续${days}天`,
          date: '',
          description: `你曾连续完成${days}天，这是习惯养成的重要里程碑！`,
          achieved: true,
          icon: 'fire'
        });
      } else if (!streakMilestoneAdded) {
        milestones.push({
          title: `连续${days}天`,
          date: '',
          description: this.data.stats.currentStreak > 0
            ? `当前连续${this.data.stats.currentStreak}天，再坚持${days - this.data.stats.currentStreak}天即可达成`
            : `连续完成${days}天是习惯养成的重要里程碑`,
          achieved: false,
          icon: 'fire'
        });
        streakMilestoneAdded = true;
      }
    }
    
    this.setData({
      habitMilestones: milestones.sort((a, b) => b.achieved - a.achieved)
    });
  },

  /**
   * 切换日期范围
   */
  changeDateRange(e) {
    const selectedRange = parseInt(e.detail.value);
    this.setData({ selectedRange });
    
    if (this.data.habit) {
      this.loadCheckins(this.data.habit);
    }
  },

  /**
   * 切换建议分类
   */
  switchRecommendationCategory(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      activeCategoryIndex: index
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    const habitName = this.data.habit ? this.data.habit.name : '习惯';
    return {
      title: `我正在培养「${habitName}」习惯，一起来养成好习惯吧！`,
      path: `/pages/habits/detail/detail?id=${this.data.habitId}`
    };
  }
}); 
