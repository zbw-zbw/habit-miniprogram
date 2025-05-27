/**
 * 习惯列表页面
 */
import { getHabits, saveHabits, getCheckinsByHabitId, getCheckins } from '../../utils/storage';
import { generateHabitStats } from '../../utils/habit';
import { generateUUID } from '../../utils/util';
import { getCurrentDate, formatDate } from '../../utils/date';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    habits: [] as IHabit[],
    habitStats: {} as Record<string, IHabitStats>,
    loading: true,
    activeTab: 0,
    categories: ['全部', '学习', '健康', '工作', '生活'] as string[],
    showCategoryModal: false,
    showSortModal: false,
    sortType: 'default' as 'default' | 'name' | 'createdAt' | 'completionRate',
    sortOrder: 'asc' as 'asc' | 'desc',
    currentMonth: '',
    selectedDate: '',
    calendarDays: [] as Array<{
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
    }>
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.initCalendar();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadHabits();
  },

  /**
   * 初始化日历
   */
  initCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = formatDate(now);
    
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
        isSelected: date === today,
        isToday: date === today
      });
    }
    
    // 当月的日期
    const currentDay = now.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = formatDate(new Date(year, month, i));
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: true,
        isSelected: date === today,
        isToday: date === today
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
        isSelected: false,
        isToday: false
      });
    }
    
    this.setData({
      currentMonth,
      selectedDate: today,
      calendarDays
    });
  },

  /**
   * 切换月份
   */
  changeMonth(e: any) {
    const direction = e.currentTarget.dataset.direction;
    
    // 获取当前显示的年月
    const currentMonthStr = this.data.currentMonth;
    const yearMonth = currentMonthStr.match(/(\d+)年(\d+)月/);
    
    if (!yearMonth) return;
    
    const year = parseInt(yearMonth[1]);
    const month = parseInt(yearMonth[2]) - 1; // 转为0-11的月份
    
    let newYear = year;
    let newMonth = month;
    
    if (direction === 'prev') {
      if (month === 0) {
        newYear = year - 1;
        newMonth = 11;
      } else {
        newMonth = month - 1;
      }
    } else {
      if (month === 11) {
        newYear = year + 1;
        newMonth = 0;
      } else {
        newMonth = month + 1;
      }
    }
    
    const newCurrentMonth = `${newYear}年${newMonth + 1}月`;
    
    // 获取新月份第一天是周几
    const firstDay = new Date(newYear, newMonth, 1).getDay();
    // 获取新月份天数
    const daysInMonth = new Date(newYear, newMonth + 1, 0).getDate();
    
    // 上个月的天数
    const prevMonthDays = new Date(newYear, newMonth, 0).getDate();
    
    const calendarDays = [];
    const today = formatDate(new Date());
    
    // 上个月的日期
    for (let i = 0; i < firstDay; i++) {
      const day = prevMonthDays - firstDay + i + 1;
      const date = formatDate(new Date(newYear, newMonth - 1, day));
      calendarDays.push({
        date,
        day,
        isCurrentMonth: false,
        isSelected: date === this.data.selectedDate,
        isToday: date === today
      });
    }
    
    // 当月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = formatDate(new Date(newYear, newMonth, i));
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: true,
        isSelected: date === this.data.selectedDate,
        isToday: date === today
      });
    }
    
    // 下个月的日期
    const remainingDays = 42 - calendarDays.length; // 6行7列
    for (let i = 1; i <= remainingDays; i++) {
      const date = formatDate(new Date(newYear, newMonth + 1, i));
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: false,
        isSelected: false,
        isToday: date === today
      });
    }
    
    this.setData({
      currentMonth: newCurrentMonth,
      calendarDays
    });
    
    // 重新加载习惯数据
    this.loadHabits();
  },

  /**
   * 选择日期
   */
  selectDate(e: any) {
    const date = e.currentTarget.dataset.date;
    
    // 更新日历选中状态
    const calendarDays = this.data.calendarDays.map(day => ({
      ...day,
      isSelected: day.date === date
    }));
    
    this.setData({
      selectedDate: date,
      calendarDays
    });
    
    // 重新加载习惯数据
    this.loadHabits();
  },

  /**
   * 加载习惯数据
   */
  loadHabits() {
    this.setData({ loading: true });
    
    // 获取所有习惯
    const habits = getHabits();
    
    // 计算习惯统计数据
    const habitStats: Record<string, IHabitStats> = {};
    
    habits.forEach(habit => {
      const checkins = getCheckinsByHabitId(habit.id);
      const stats = generateHabitStats(habit, checkins);
      habitStats[habit.id] = stats;
    });
    
    // 根据当前标签筛选习惯
    let filteredHabits = this.filterHabits(habits);
    
    // 根据选中的日期筛选习惯
    if (this.data.selectedDate) {
      const { shouldDoHabitOnDate } = require('../../utils/habit');
      filteredHabits = filteredHabits.filter(habit => 
        shouldDoHabitOnDate(habit, this.data.selectedDate)
      );
    }
    
    // 根据当前排序方式排序习惯
    const sortedHabits = this.sortHabits(filteredHabits, habitStats);
    
    this.setData({
      habits: sortedHabits,
      habitStats,
      loading: false
    });
  },

  /**
   * 根据类别筛选习惯
   */
  filterHabits(habits: IHabit[]): IHabit[] {
    const { activeTab, categories } = this.data;
    
    // 如果是"全部"标签，则不进行筛选
    if (activeTab === 0) {
      return habits.filter(habit => !habit.isArchived);
    }
    
    // 根据类别筛选
    const category = categories[activeTab];
    return habits.filter(habit => !habit.isArchived && habit.category === category);
  },

  /**
   * 根据排序方式排序习惯
   */
  sortHabits(habits: IHabit[], habitStats: Record<string, IHabitStats>): IHabit[] {
    const { sortType, sortOrder } = this.data;
    const sortedHabits = [...habits];
    
    switch (sortType) {
      case 'name':
        sortedHabits.sort((a, b) => {
          const result = a.name.localeCompare(b.name);
          return sortOrder === 'asc' ? result : -result;
        });
        break;
      case 'createdAt':
        sortedHabits.sort((a, b) => {
          const result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return sortOrder === 'asc' ? result : -result;
        });
        break;
      case 'completionRate':
        sortedHabits.sort((a, b) => {
          const rateA = habitStats[a.id]?.completionRate || 0;
          const rateB = habitStats[b.id]?.completionRate || 0;
          const result = rateA - rateB;
          return sortOrder === 'asc' ? result : -result;
        });
        break;
      default:
        // 默认排序，不做任何操作
        break;
    }
    
    return sortedHabits;
  },

  /**
   * 切换标签
   */
  onTabChange(e: any) {
    const activeTab = e.currentTarget.dataset.index;
    this.setData({ activeTab }, () => {
      this.loadHabits();
    });
  },

  /**
   * 打开类别选择模态框
   */
  openCategoryModal() {
    this.setData({ showCategoryModal: true });
  },

  /**
   * 关闭类别选择模态框
   */
  closeCategoryModal() {
    this.setData({ showCategoryModal: false });
  },

  /**
   * 打开排序模态框
   */
  openSortModal() {
    this.setData({ showSortModal: true });
  },

  /**
   * 关闭排序模态框
   */
  closeSortModal() {
    this.setData({ showSortModal: false });
  },

  /**
   * 设置排序方式
   */
  setSortType(e: any) {
    const { type, order } = e.currentTarget.dataset;
    this.setData({
      sortType: type,
      sortOrder: order,
      showSortModal: false
    }, () => {
      this.loadHabits();
    });
  },

  /**
   * 创建新习惯
   */
  createHabit() {
    wx.navigateTo({
      url: '/pages/habits/create/create'
    });
  },

  /**
   * 打卡习惯
   */
  onCheckin(e: any) {
    const { habitId } = e.detail;
    if (!habitId) return;
    
    // 获取习惯信息，用于传递到打卡页面
    const habit = this.data.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    // 跳转到打卡页面
    wx.navigateTo({
      url: `/pages/checkin/checkin?habitId=${habitId}&habitName=${encodeURIComponent(habit.name)}`
    });
  },

  /**
   * 删除习惯
   */
  onDeleteHabit(e: any) {
    const { habitId } = e.detail;
    if (!habitId) return;
    
    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          // 获取所有习惯
          const habits = getHabits();
          
          // 删除指定习惯
          const newHabits = habits.filter(h => h.id !== habitId);
          
          // 保存修改
          saveHabits(newHabits);
          
          // 重新加载习惯数据
          this.loadHabits();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '习惯养成计划',
      path: '/pages/index/index'
    };
  }
}); 
