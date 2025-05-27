import { formatDate } from '../../../utils/date';

interface IPageData {
  habitId: string;
  habit: IHabit | null;
  checkins: Array<ICheckin & { formattedTime: string }>;
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
}

interface IPageMethods {
  loadHabitDetail(): Promise<void>;
  loadCheckins(): Promise<void>;
  loadStats(): Promise<void>;
  initCalendar(): void;
  switchTab(e: WechatMiniprogram.TouchEvent): void;
  goToCheckin(): void;
  changeMonth(e: WechatMiniprogram.TouchEvent): void;
  editHabit(): void;
  archiveHabit(): void;
  deleteHabit(): void;
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
    calendarDays: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        habitId: options.id
      });
      this.loadHabitDetail();
      this.loadCheckins();
      this.loadStats();
      this.initCalendar();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载习惯详情
  async loadHabitDetail() {
    wx.showLoading({
      title: '加载中'
    });

    try {
      // 模拟API请求
      // 实际项目中应替换为真实API调用
      setTimeout(() => {
        const habit: IHabit = {
          id: this.data.habitId,
          name: '每日阅读',
          description: '每天阅读30分钟，培养阅读习惯',
          category: '学习',
          icon: 'book',
          color: '#4F7CFF',
          frequency: {
            type: 'daily'
          },
          reminder: {
            enabled: true,
            time: '07:00'
          },
          isArchived: false,
          createdAt: '2023-06-01',
          updatedAt: '2023-06-15'
        };

        this.setData({
          habit
        });

        wx.hideLoading();
      }, 500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 加载打卡记录
  async loadCheckins() {
    try {
      // 模拟API请求
      // 实际项目中应替换为真实API调用
      setTimeout(() => {
        // 获取基础数据
        const baseCheckins: ICheckin[] = [
          {
            id: '1',
            habitId: this.data.habitId,
            date: formatDate(new Date()),
            isCompleted: true,
            note: '今天读完了《原子习惯》第15章，关于如何建立良好习惯的反馈系统。作者提出了"习惯追踪"的概念，非常实用！',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            habitId: this.data.habitId,
            date: formatDate(new Date(Date.now() - 86400000)), // 昨天
            isCompleted: true,
            note: '读完第14章，关于如何让好习惯变得容易。作者提出的"环境设计"理念很有启发，我决定在床头放本书，让阅读变得更容易开始。',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        
        // 处理打卡记录，添加格式化的时间
        const checkins = baseCheckins.map(checkin => ({
          ...checkin,
          formattedTime: checkin.createdAt.substring(11, 16)
        }));

        this.setData({
          checkins
        });
      }, 500);
    } catch (error) {
      wx.showToast({
        title: '记录加载失败',
        icon: 'error'
      });
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      // 模拟API请求
      // 实际项目中应替换为真实API调用
      setTimeout(() => {
        const stats: IHabitStats = {
          totalCompletions: 45,
          totalDays: 49,
          completionRate: 0.92,
          currentStreak: 12,
          longestStreak: 12,
          lastCompletedDate: formatDate(new Date())
        };
        
        // 预先计算格式化的完成率
        const completionRateFormatted = (stats.completionRate * 100).toFixed(0);

        this.setData({
          stats,
          completionRateFormatted
        });
      }, 500);
    } catch (error) {
      wx.showToast({
        title: '统计加载失败',
        icon: 'error'
      });
    }
  },

  // 初始化日历
  initCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
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
      calendarDays.push({
        date: `${year}-${month === 0 ? 12 : month}-${day}`,
        day,
        isCurrentMonth: false,
        isCompleted: false,
        isToday: false
      });
    }
    
    // 当月的日期
    const today = now.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
        date: `${year}-${month + 1}-${i}`,
        day: i,
        isCurrentMonth: true,
        isCompleted: i < today, // 模拟数据：今天之前的日期都已完成
        isToday: i === today
      });
    }
    
    // 下个月的日期
    const remainingDays = 42 - calendarDays.length; // 6行7列
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({
        date: `${year}-${month + 2}-${i}`,
        day: i,
        isCurrentMonth: false,
        isCompleted: false,
        isToday: false
      });
    }
    
    this.setData({
      currentMonth,
      calendarDays
    });
  },

  // 切换标签
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as 'overview' | 'records' | 'stats' | 'settings';
    this.setData({
      activeTab: tab
    });
  },

  // 前往打卡页面
  goToCheckin() {
    if (!this.data.habit) return;
    
    wx.navigateTo({
      url: `/pages/checkin/checkin?habitId=${this.data.habitId}&habitName=${this.data.habit.name}`
    });
  },

  // 分享
  onShareAppMessage() {
    const habit = this.data.habit;
    if (!habit) return {};
    
    return {
      title: `我正在坚持「${habit.name}」，一起来吧！`,
      path: `/pages/habits/detail/detail?id=${this.data.habitId}`
    };
  },

  // 切换月份
  changeMonth(e: WechatMiniprogram.TouchEvent) {
    const direction = e.currentTarget.dataset.direction;
    // 实际项目中应该实现月份切换逻辑
    wx.showToast({
      title: `切换到${direction === 'prev' ? '上' : '下'}个月`,
      icon: 'none'
    });
  },

  // 编辑习惯
  editHabit() {
    if (!this.data.habit) return;
    
    // 将习惯数据转为查询参数，以便传递到编辑页面
    const habit = this.data.habit;
    const queryParams = [
      `id=${this.data.habitId}`,
      `name=${encodeURIComponent(habit.name)}`,
      `description=${encodeURIComponent(habit.description || '')}`,
      `category=${encodeURIComponent(habit.category)}`,
      `icon=${encodeURIComponent(habit.icon)}`,
      `color=${encodeURIComponent(habit.color)}`,
      `isEdit=true`
    ].join('&');
    
    wx.navigateTo({
      url: `/pages/habits/create/create?${queryParams}`
    });
  },

  // 归档习惯
  archiveHabit() {
    wx.showModal({
      title: '归档习惯',
      content: '归档后，该习惯将不再显示在习惯列表中，但历史记录将被保留。确认归档？',
      success: (res) => {
        if (res.confirm) {
          // 实际项目中应调用API归档习惯
          wx.showToast({
            title: '归档成功',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  },

  // 删除习惯
  deleteHabit() {
    wx.showModal({
      title: '删除习惯',
      content: '删除后，该习惯及所有历史记录将被永久删除，无法恢复。确认删除？',
      success: (res) => {
        if (res.confirm) {
          // 实际项目中应调用API删除习惯
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  }
}); 
