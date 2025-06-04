import { formatDate } from '../../../utils/date';
import { HabitChain } from '../../../utils/habit-chain';
import { IHabit } from '../../../utils/types';

// 获取应用实例
const app = getApp<IAppOption>();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    chainId: '',
    chain: null as HabitChain | null,
    allHabits: [] as IHabit[],
    habitDetails: [] as Array<IHabit & { order: number; isOptional: boolean }>,
    today: '',
    todayCompleted: 0,
    todayProgress: 0,
    canCheckin: false,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [] as Array<{
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      status: 'completed' | 'partial' | 'none';
    }>
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({
        chainId: options.id
      });
      this.loadData();
    } else {
      wx.showToast({
        title: '缺少习惯链ID',
        icon: 'none'
      });
      wx.navigateBack();
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (this.data.chainId) {
      this.loadData();
    }
  },

  /**
   * 加载数据
   */
  async loadData() {
    this.setData({ loading: true });

    try {
      // 加载用户的所有习惯
      const habits = await app.globalData.habitService.getUserHabits();
      
      // 加载习惯链
      const chain = await app.globalData.habitChainService.getChainById(this.data.chainId);
      
      if (!chain) {
        wx.showToast({
          title: '习惯链不存在',
          icon: 'none'
        });
        wx.navigateBack();
        return;
      }
      
      // 获取习惯详情
      const habitDetails = chain.habits.map(item => {
        const habit = habits.find(h => h.id === item.habitId);
        return {
          ...habit,
          order: item.order,
          isOptional: item.isOptional
        };
      }).filter(Boolean).sort((a, b) => a.order - b.order);
      
      // 加载打卡记录
      const today = formatDate(new Date());
      const checkins = await app.globalData.checkinService.getCheckinsByDate(today);
      
      // 计算今日进度
      const habitIds = chain.habits.map(h => h.habitId);
      const completedHabits = checkins.filter(c => habitIds.includes(c.habitId));
      const todayCompleted = completedHabits.length;
      const todayProgress = Math.round((todayCompleted / chain.habits.length) * 100);
      
      // 检查是否可以打卡
      const canCheckin = todayCompleted < chain.habits.length;
      
      // 生成日历数据
      const calendarDays = this.generateCalendarDays(this.data.year, this.data.month - 1);
      
      this.setData({
        chain,
        allHabits: habits,
        habitDetails,
        today,
        todayCompleted,
        todayProgress,
        canCheckin,
        calendarDays,
        loading: false
      });
    } catch (error) {
      
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 生成日历数据
   */
  generateCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const today = new Date();
    const todayStr = formatDate(today);
    
    // 添加上个月的日期
    const firstDayWeekday = firstDay.getDay();
    if (firstDayWeekday > 0) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = firstDayWeekday - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = formatDate(new Date(year, month - 1, day));
        days.push({
          date,
          day,
          isCurrentMonth: false,
          isToday: date === todayStr,
          status: 'none' as 'completed' | 'partial' | 'none'
        });
      }
    }
    
    // 添加当前月的日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = formatDate(new Date(year, month, i));
      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday: date === todayStr,
        status: 'none' as 'completed' | 'partial' | 'none'
      });
    }
    
    // 添加下个月的日期
    const lastDayWeekday = lastDay.getDay();
    if (lastDayWeekday < 6) {
      for (let i = 1; i <= 6 - lastDayWeekday; i++) {
        const date = formatDate(new Date(year, month + 1, i));
        days.push({
          date,
          day: i,
          isCurrentMonth: false,
          isToday: date === todayStr,
          status: 'none' as 'completed' | 'partial' | 'none'
        });
      }
    }
    
    // 加载日历数据
    this.loadCalendarData(days);
    
    return days;
  },

  /**
   * 加载日历数据
   */
  async loadCalendarData(days: any[]) {
    if (!this.data.chain) return;
    
    try {
      const startDate = days[0].date;
      const endDate = days[days.length - 1].date;
      
      // 加载日期范围内的打卡记录
      const checkins = await app.globalData.checkinService.getCheckinsByDateRange(startDate, endDate);
      
      // 获取习惯链中的习惯ID
      const habitIds = this.data.chain.habits.map(h => h.habitId);
      const requiredHabitIds = this.data.chain.habits.filter(h => !h.isOptional).map(h => h.habitId);
      
      // 按日期分组打卡记录
      const checkinsByDate = {};
      checkins.forEach(checkin => {
        if (!checkinsByDate[checkin.date]) {
          checkinsByDate[checkin.date] = [];
        }
        checkinsByDate[checkin.date].push(checkin);
      });
      
      // 更新日历状态
      const updatedDays = days.map(day => {
        const dayCheckins = checkinsByDate[day.date] || [];
        const completedHabitIds = dayCheckins.map(c => c.habitId).filter(id => habitIds.includes(id));
        
        let status: 'completed' | 'partial' | 'none' = 'none';
        
        if (completedHabitIds.length === habitIds.length) {
          status = 'completed';
        } else if (completedHabitIds.length > 0) {
          // 检查是否所有必须习惯都完成了
          const completedRequiredCount = completedHabitIds.filter(id => requiredHabitIds.includes(id)).length;
          if (completedRequiredCount === requiredHabitIds.length) {
            status = 'completed';
          } else {
            status = 'partial';
          }
        }
        
        return {
          ...day,
          status
        };
      });
      
      this.setData({
        calendarDays: updatedDays
      });
    } catch (error) {
      
    }
  },

  /**
   * 上个月
   */
  prevMonth() {
    let { year, month } = this.data;
    
    if (month === 1) {
      year--;
      month = 12;
    } else {
      month--;
    }
    
    this.setData({
      year,
      month,
      calendarDays: this.generateCalendarDays(year, month - 1)
    });
  },

  /**
   * 下个月
   */
  nextMonth() {
    let { year, month } = this.data;
    
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
    
    this.setData({
      year,
      month,
      calendarDays: this.generateCalendarDays(year, month - 1)
    });
  },

  /**
   * 查看习惯详情
   */
  viewHabitDetail(e: WechatMiniprogram.BaseEvent) {
    const habitId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/habits/detail/detail?id=${habitId}`
    });
  },

  /**
   * 编辑习惯链
   */
  editChain() {
    wx.navigateTo({
      url: `/pages/habit-chain/habit-chain?edit=true&id=${this.data.chainId}`
    });
  },

  /**
   * 删除习惯链
   */
  deleteChain() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个习惯链吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.globalData.habitChainService.deleteChain(this.data.chainId);
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            wx.navigateBack();
          } catch (error) {
            
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 打卡习惯链
   */
  checkinChain() {
    if (!this.data.canCheckin) return;
    
    wx.navigateTo({
      url: `/pages/checkin/chain-checkin?chainId=${this.data.chainId}`
    });
  },

  /**
   * 格式化日期
   */
  formatDate
}); 
