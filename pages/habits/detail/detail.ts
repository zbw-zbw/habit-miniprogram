import { formatDate } from '../../../utils/date';
import { habitAPI, checkinAPI } from '../../../services/api';
import { dashboardAPI } from '../../../services/api/dashboard';
import { IHabit, ICheckin, IHabitStats } from '../../../utils/types';

interface IPageData {
  habitId: string;
  habit: IHabit | null;
  checkins: Array<ICheckin & { formattedTime: string; duration?: number }>;
  stats: IHabitStats | null;
  completionRateFormatted: string;
  todayFormatted: string;
  activeTab: 'overview' | 'records' | 'stats' | 'settings';
  currentMonth: string;
  calendarDays: Array<{
    date: string;
    day: number;
    isCurrentMonth: boolean;
    isCompleted: boolean;
    isToday: boolean;
  }>;
  loading: {
    habit: boolean;
    checkins: boolean;
    stats: boolean;
  };
  error: {
    habit: string;
    checkins: string;
    stats: string;
  };
  apiAvailable: boolean;
  // 分类中英文映射
  categoryMap: Record<string, string>;
  // 随机科学洞察
  randomInsight: string;
  // 周统计数据
  weeklyStats: {
    completionRate: number;
    trend: number;
    averageDuration: number;
  };
  // 详细统计数据
  statsData: {
    averageDuration: number;
    maxDuration: number;
  };
  // 热图数据
  heatmapData: Array<{ date: string; count: number }>;
  heatmapStartDate: string;
  heatmapEndDate: string;
  // 今日是否已完成打卡
  isTodayCompleted: boolean;
  // 日历当前显示的年月
  displayYear: number;
  displayMonth: number;
}

interface IPageMethods {
  loadHabitDetail(): Promise<void>;
  loadCheckins(): Promise<void>;
  loadStats(): Promise<void>;
  loadHabitDetailWithDashboard(): Promise<void>;
  updateCalendar(): void;
  isDateCompleted(date: string): boolean;
  isToday(date: string): boolean;
  switchTab(e: WechatMiniprogram.TouchEvent): void;
  goToCheckin(): void;
  changeMonth(e: WechatMiniprogram.TouchEvent): void;
  editHabit(): void;
  toggleArchive(e: WechatMiniprogram.SwitchChange): void;
  deleteHabit(): void;
  calculateWeeklyStats(): void;
  calculateDetailedStats(): void;
  generateHeatmapData(): void;
  setRandomInsight(): void;
  navigateToAnalysis(): void;
  handleApplySuggestion(e: any): void;
  onHeatmapCellTap(e: any): void;
}

Page<IPageData, IPageMethods>({
  data: {
    habitId: '',
    habit: null,
    checkins: [],
    stats: null,
    completionRateFormatted: '0',
    todayFormatted: formatDate(new Date()),
    activeTab: 'overview',
    currentMonth: '',
    calendarDays: [],
    loading: {
      habit: true,
      checkins: true,
      stats: true,
    },
    error: {
      habit: '',
      checkins: '',
      stats: '',
    },
    apiAvailable: true,
    // 分类中英文映射
    categoryMap: {},
    // 随机科学洞察
    randomInsight: '养成习惯需要21-66天不等，坚持是关键。',
    // 周统计数据
    weeklyStats: {
      completionRate: 0,
      trend: 0,
      averageDuration: 0,
    },
    // 详细统计数据
    statsData: {
      averageDuration: 0,
      maxDuration: 0,
    },
    // 热图数据
    heatmapData: [],
    heatmapStartDate: '',
    heatmapEndDate: '',
    // 今日是否已完成打卡
    isTodayCompleted: false,
    // 日历当前显示的年月
    displayYear: new Date().getFullYear(),
    displayMonth: new Date().getMonth(),
  },

  onLoad(options) {
    const app = getApp<IAppOption>();
    this.setData({
      apiAvailable: app.globalData.apiAvailable,
      // 初始化分类映射
      categoryMap: {
        learning: '学习',
        health: '健康',
        work: '工作',
        social: '社交',
        finance: '财务',
        other: '其他',
        reading: '阅读',
        exercise: '运动',
        diet: '饮食',
        sleep: '睡眠',
        meditation: '冥想',
      },
      // 设置热图日期范围
      heatmapStartDate: formatDate(
        new Date(new Date().setMonth(new Date().getMonth() - 3))
      ),
      heatmapEndDate: formatDate(new Date()),
    });

    // 设置随机科学洞察
    this.setRandomInsight();

    if (options.id) {
      this.setData({
        habitId: options.id,
      });
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 页面显示时重新加载数据
  onShow() {
    if (this.data.habitId) {
      // 使用聚合API重新加载数据
      this.loadHabitDetailWithDashboard();
    }
  },

  // 使用聚合API加载所有数据
  async loadHabitDetailWithDashboard() {
    // 设置所有数据为加载状态
    this.setData({
      'loading.habit': true,
      'loading.checkins': true,
      'loading.stats': true,
      'error.habit': '',
      'error.checkins': '',
      'error.stats': '',
      // 重置日历显示为当前月份
      displayYear: new Date().getFullYear(),
      displayMonth: new Date().getMonth()
    });

    try {
      // 使用dashboard API获取数据
      const dashboardData = await dashboardAPI.getDashboard(undefined, {
        days: 180,
      }); // 获取半年数据用于热图
      

      // 查找当前习惯
      const habit = dashboardData.todayHabits.find(
        (h) =>
          h.id === this.data.habitId || (h as any)._id === this.data.habitId
      );

      // 如果找不到习惯，尝试单独获取
      if (!habit) {
        await this.loadHabitDetail();
      } else {
        this.setData({
          habit,
          'loading.habit': false,
        });
      }

      // 过滤出当前习惯的打卡记录
      const habitCheckins = dashboardData.recentCheckins.filter((c) => {
        const checkinHabitId =
          c.habitId ||
          (c.habit && typeof c.habit === 'object'
            ? (c.habit as any)._id
            : c.habit);
        return checkinHabitId === this.data.habitId;
      });

      // 处理打卡记录
      const processedCheckins = habitCheckins.map((c) => {
        // 根据API返回的数据格式调整时间处理逻辑
        let formattedTime = '00:00';
        if (c.time) {
          // 处理新版API返回的time对象格式
          if (typeof c.time === 'object' && c.time !== null && 'start' in c.time) {
            const startTime = new Date((c.time as any).start);
            const hours = startTime.getHours().toString().padStart(2, '0');
            const minutes = startTime.getMinutes().toString().padStart(2, '0');
            formattedTime = `${hours}:${minutes}`;
          } else if (typeof c.time === 'string') {
            // 处理旧版API返回的time字符串格式
            formattedTime = c.time;
          }
        }

        return {
          ...c,
          formattedTime,
          duration: c.value || 0,
        };
      });

      // 按日期排序（最新的在前）
      processedCheckins.sort(
        (a, b) => {
          // 获取日期对象 (优先使用time.start，其次使用date+time字符串)
          const dateA = a.time && typeof a.time === 'object' && a.time !== null && 'start' in a.time 
                        ? new Date((a.time as any).start) 
                        : new Date(a.date + 'T' + (a.formattedTime || '00:00'));
          const dateB = b.time && typeof b.time === 'object' && b.time !== null && 'start' in b.time
                        ? new Date((b.time as any).start)
                        : new Date(b.date + 'T' + (b.formattedTime || '00:00'));
          return dateB.getTime() - dateA.getTime();
        }
      );

      // 检查今天是否已完成打卡
      const todayFormatted = formatDate(new Date());
      const isTodayCompleted = processedCheckins.some(
        checkin => checkin.date === todayFormatted && checkin.isCompleted
      );

      this.setData({
        checkins: processedCheckins,
        'loading.checkins': false,
        isTodayCompleted
      });

      // 获取习惯统计数据
      const stats = dashboardData.habitStats[this.data.habitId];
      if (stats) {
        // 确保完成率是有效数字
        let completionRate = stats.completionRate;
        if (isNaN(completionRate) || completionRate === null || completionRate === undefined) {
          completionRate = 0;
        }
        
        // 处理百分比格式
        if (completionRate > 1 && completionRate <= 100) {
          // 已经是百分比，保持不变
        } else if (completionRate > 0 && completionRate <= 1) {
          // 小数形式，转为百分比
          completionRate = completionRate * 100;
        }
        
        // 格式化完成率
        const completionRateFormatted = Math.round(completionRate).toString();
        
        this.setData({
          stats: {
            ...stats,
            completionRate
          },
          completionRateFormatted,
          'loading.stats': false,
        });
      } else {
        // 如果没有找到统计数据，单独加载
        await this.loadStats();
      }

      // 计算统计数据
      this.calculateWeeklyStats();
      this.calculateDetailedStats();
      this.generateHeatmapData();

      // 初始化日历
      this.updateCalendar();
    } catch (error) {
      console.error('加载习惯详情失败:', error);
      // 单独加载每个部分的数据
      await this.loadHabitDetail();
      await this.loadCheckins();
      await this.loadStats();
    }
  },

  // 加载习惯详情（作为备选）
  async loadHabitDetail() {
    this.setData({
      'loading.habit': true,
      'error.habit': '',
    });

    try {
      const habit = await habitAPI.getHabit(this.data.habitId);
      // 确保habit对象有id属性
      const habitWithId = {
        ...habit,
        id: habit.id || this.data.habitId
      };
      
      this.setData({
        habit: habitWithId,
        'loading.habit': false,
      });

      // 初始化日历（在获取习惯信息后）
      this.updateCalendar();
    } catch (error) {
      
      this.setData({
        'loading.habit': false,
        'error.habit': '加载习惯详情失败',
      });
    }
  },

  // 加载打卡记录（作为备选）
  async loadCheckins() {
    this.setData({
      'loading.checkins': true,
      'error.checkins': '',
    });

    try {
      // 获取习惯的所有打卡记录
      const params = {
        habitId: this.data.habitId,
        // 获取最近3个月的数据
        startDate: formatDate(
          new Date(new Date().setMonth(new Date().getMonth() - 3))
        ),
        endDate: formatDate(new Date()),
        limit: 100, // 增加限制，获取更多数据用于分析
        sort: 'date,desc', // 按日期降序排序
      };

      const checkins = await checkinAPI.getCheckins(params);

      // 处理每条打卡记录
      const processedCheckins = checkins.map((checkin: ICheckin) => {
        return {
          ...checkin,
          formattedTime: checkin.time || '00:00',
          duration: checkin.value || 0,
        };
      });

      this.setData({
        checkins: processedCheckins,
        'loading.checkins': false,
      });

      // 计算详细统计数据
      this.calculateDetailedStats();
      this.generateHeatmapData();
    } catch (error) {
      
      this.setData({
        'loading.checkins': false,
        'error.checkins': '加载打卡记录失败',
      });
    }
  },

  // 加载统计数据（作为备选）
  async loadStats() {
    this.setData({
      'loading.stats': true,
      'error.stats': '',
    });

    try {
      const stats = await habitAPI.getHabitStats(this.data.habitId);

      // 确保stats不为null
      if (!stats) {
        this.setData({
          stats: {
            totalDays: 0,
            completedDays: 0,
            completionRate: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: null,
            totalCompletions: 0
          },
          completionRateFormatted: '0',
          'loading.stats': false,
        });
        return;
      }

      // 确保完成率是有效数字
      let completionRate = isNaN(stats.completionRate) ? 0 : stats.completionRate;
      
      // 正规化完成率值
      if (completionRate > 1 && completionRate <= 100) {
        // 已经是百分比形式，保持不变
        completionRate = Math.min(completionRate, 100); // 限制最大值为100%
      } else if (completionRate > 0 && completionRate <= 1) {
        // 小数形式，转换为百分比
        completionRate = completionRate * 100;
      } else if (completionRate > 100) {
        // 异常值，限制为100%
        completionRate = 100;
      }

      // 预先计算格式化的完成率
      const completionRateFormatted = Math.round(completionRate || 0).toString();

      // 更新统计数据
      this.setData({
        stats: {
          ...stats,
          completionRate: completionRate, // 更新为标准化的完成率
        },
        completionRateFormatted,
        'loading.stats': false,
      });
    } catch (error) {
      this.setData({
        // 当发生错误时，初始化默认数据而不是留空
        stats: {
          totalDays: 0,
          completedDays: 0,
          completionRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
          totalCompletions: 0
        },
        completionRateFormatted: '0',
        'loading.stats': false,
        'error.stats': '加载统计数据失败',
      });
    }
  },

  // 计算周统计数据
  calculateWeeklyStats() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const oneWeekAgoStr = formatDate(oneWeekAgo);
    const twoWeeksAgoStr = formatDate(twoWeeksAgo);

    // 本周打卡记录
    const thisWeekCheckins = this.data.checkins.filter(
      (c) => new Date(c.date) >= oneWeekAgo && c.isCompleted
    );

    // 上周打卡记录
    const lastWeekCheckins = this.data.checkins.filter(
      (c) =>
        new Date(c.date) >= twoWeeksAgo &&
        new Date(c.date) < oneWeekAgo &&
        c.isCompleted
    );

    // 计算本周完成率
    const daysInThisWeek = 7;
    const uniqueDaysThisWeek = new Set(thisWeekCheckins.map((c) => c.date))
      .size;
    const completionRateThisWeek = Math.round(
      (uniqueDaysThisWeek / daysInThisWeek) * 100
    );

    // 计算上周完成率
    const daysInLastWeek = 7;
    const uniqueDaysLastWeek = new Set(lastWeekCheckins.map((c) => c.date))
      .size;
    const completionRateLastWeek = Math.round(
      (uniqueDaysLastWeek / daysInLastWeek) * 100
    );

    // 计算趋势
    const trend = completionRateThisWeek - completionRateLastWeek;

    // 计算平均时长
    let totalDuration = 0;
    let count = 0;

    thisWeekCheckins.forEach((c) => {
      if (c.duration) {
        totalDuration += c.duration;
        count++;
      }
    });

    const averageDuration = count > 0 ? Math.round(totalDuration / count) : 0;

    this.setData({
      weeklyStats: {
        completionRate: completionRateThisWeek,
        trend: trend,
        averageDuration: averageDuration,
      },
    });
  },

  // 计算详细统计数据
  calculateDetailedStats() {
    let totalDuration = 0;
    let count = 0;
    let maxDuration = 0;

    this.data.checkins.forEach((c) => {
      if (c.duration) {
        totalDuration += c.duration;
        count++;
        if (c.duration > maxDuration) {
          maxDuration = c.duration;
        }
      }
    });

    const averageDuration = count > 0 ? Math.round(totalDuration / count) : 0;

    this.setData({
      statsData: {
        averageDuration: averageDuration,
        maxDuration: maxDuration,
      },
    });
  },

  // 生成热图数据
  generateHeatmapData() {
    // 生成过去3个月的热图数据
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 3);

    const heatmapData: Array<{ date: string; count: number }> = [];

    // 将打卡记录转换为热图数据格式
    this.data.checkins.forEach((checkin) => {
      if (checkin.isCompleted) {
        const checkDate = new Date(checkin.date);
        if (checkDate >= startDate && checkDate <= endDate) {
          heatmapData.push({
            date: checkin.date,
            count: 1,
          });
        }
      }
    });

    this.setData({
      heatmapData,
    });
  },

  // 设置随机科学洞察
  setRandomInsight() {
    const insights = [
      '养成习惯需要21-66天不等，坚持是关键。',
      '将新习惯与已有习惯关联，可以提高成功率。',
      '设定具体的时间和地点，让习惯更容易坚持。',
      '小步快走比大幅改变更容易成功。',
      '记录进度可以增加成就感，提高坚持率。',
      '环境提示能有效触发习惯行为。',
      '奖励自己有助于强化习惯的养成。',
    ];

    const randomIndex = Math.floor(Math.random() * insights.length);
    this.setData({
      randomInsight: insights[randomIndex],
    });
  },

  // 跳转到习惯分析页面
  navigateToAnalysis() {
    if (!this.data.habit) return;
    
    wx.navigateTo({
      url: `/pages/analytics/detail/detail?id=${this.data.habitId}&habitName=${encodeURIComponent(this.data.habit.name)}`,
    });
  },

  // 处理应用建议
  handleApplySuggestion(e: any) {
    const { suggestion } = e.detail;
    

    wx.showToast({
      title: '已应用建议',
      icon: 'success',
    });
  },

  // 更新日历
  updateCalendar() {
    const year = this.data.displayYear;
    const month = this.data.displayMonth;
    const now = new Date();

    const currentMonth = `${year}年${month + 1}月`;

    // 获取当月第一天是周几
    const firstDay = new Date(year, month, 1).getDay();
    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 上个月的天数
    const prevMonthDays = new Date(year, month, 0).getDate();

    const calendarDays = [];

    // 上个月的日期
    for (let i = 0; i < firstDay; i++) {
      const day = prevMonthDays - firstDay + i + 1;
      const date = formatDate(new Date(year, month - 1, day));
      calendarDays.push({
        date,
        day,
        isCurrentMonth: false,
        isCompleted: this.isDateCompleted(date),
        isToday: this.isToday(date),
      });
    }

    // 当月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = formatDate(new Date(year, month, i));
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: true,
        isCompleted: this.isDateCompleted(date),
        isToday: this.isToday(date),
      });
    }

    // 下个月的日期
    const remainingDays = 42 - calendarDays.length; // 6行7列
    for (let i = 1; i <= remainingDays; i++) {
      const date = formatDate(new Date(year, month + 1, i));
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: false,
        isCompleted: this.isDateCompleted(date),
        isToday: this.isToday(date),
      });
    }

    this.setData({
      currentMonth,
      calendarDays,
    });
  },

  // 检查日期是否已完成打卡
  isDateCompleted(date: string): boolean {
    return this.data.checkins.some((c) => c.date === date && c.isCompleted);
  },

  // 检查是否是今天
  isToday(date: string): boolean {
    return date === this.data.todayFormatted;
  },

  // 切换标签
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as
      | 'overview'
      | 'records'
      | 'stats'
      | 'settings';
    this.setData({
      activeTab: tab,
    });
  },

  // 前往打卡页面
  goToCheckin() {
    if (!this.data.habit) return;

    wx.navigateTo({
      url: `/pages/checkin/checkin?habitId=${
        this.data.habitId
      }&habitName=${encodeURIComponent(this.data.habit.name)}`,
    });
  },

  // 分享
  onShareAppMessage() {
    const habitName = this.data.habit?.name || '习惯养成';
    return {
      title: `我正在坚持「${habitName}」，一起来打卡吧！`,
      path: `/pages/index/index?share=habit&id=${this.data.habitId}`,
    };
  },

  // 切换月份
  changeMonth(e: WechatMiniprogram.TouchEvent) {
    const { direction } = e.currentTarget.dataset;
    let { displayYear, displayMonth } = this.data;
    
    if (direction === 'prev') {
      // 上个月
      if (displayMonth === 0) {
        displayYear--;
        displayMonth = 11;
      } else {
        displayMonth--;
      }
    } else {
      // 下个月
      if (displayMonth === 11) {
        displayYear++;
        displayMonth = 0;
      } else {
        displayMonth++;
      }
    }
    
    this.setData({
      displayYear,
      displayMonth
    }, () => {
      // 更新日历视图
      this.updateCalendar();
    });
  },

  // 编辑习惯
  editHabit() {
    wx.navigateTo({
      url: `/pages/habits/create/create?id=${this.data.habitId}`,
    });
  },

  // 切换归档状态
  toggleArchive(e: WechatMiniprogram.SwitchChange) {
    const isArchived = e.detail.value;
    const actionText = isArchived ? '归档' : '取消归档';
    
    wx.showLoading({
      title: `${actionText}中...`,
      mask: true,
    });
    
    habitAPI.updateHabit(this.data.habitId, {
      isArchived: isArchived,
    })
      .then(() => {
        // 重新加载习惯数据
        this.loadHabitDetailWithDashboard();
        wx.hideLoading();
        wx.showToast({
          title: `${actionText}成功`,
          icon: 'success',
        });
      })
      .catch(error => {
        
        wx.hideLoading();
        wx.showToast({
          title: `${actionText}失败`,
          icon: 'error',
        });
        
        // 恢复开关状态
        this.setData({
          'habit.isArchived': !isArchived
        });
      });
  },

  // 删除习惯
  deleteHabit() {
    wx.showModal({
      title: '删除习惯',
      content: '删除后将无法恢复，确定要删除吗？',
      confirmColor: '#F56C6C',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true,
          });

          try {
            // 删除习惯
            await habitAPI.deleteHabit(this.data.habitId);

            wx.hideLoading();
            wx.showToast({
              title: '删除成功',
              icon: 'success',
            });

            // 返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } catch (error) {
            
            wx.hideLoading();
            wx.showToast({
              title: '删除失败',
              icon: 'error',
            });
          }
        }
      },
    });
  },

  // 处理热图单元格点击
  onHeatmapCellTap(e: any) {
    const { date } = e.detail;
    if (!date) return;

    // 获取当天的打卡记录
    const dayCheckins = this.data.checkins.filter(c => c.date === date);
    
    if (dayCheckins.length === 0) {
      wx.showToast({
        title: `${date} 没有打卡记录`,
        icon: 'none'
      });
      return;
    }

    // 显示当天的打卡情况
    const isCompleted = dayCheckins.some(c => c.isCompleted);
    const message = isCompleted 
      ? `${date} 已完成打卡` 
      : `${date} 未完成打卡`;

    wx.showToast({
      title: message,
      icon: 'none'
    });
  }
});
