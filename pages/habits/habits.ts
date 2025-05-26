/**
 * 习惯列表页面
 */
import { getHabits, saveHabits, getCheckinsByHabitId } from '../../utils/storage';
import { generateHabitStats } from '../../utils/habit';

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
    sortOrder: 'asc' as 'asc' | 'desc'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
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
    const filteredHabits = this.filterHabits(habits);
    
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
    
    wx.navigateTo({
      url: `/pages/checkin/checkin?habitId=${habitId}`
    });
  },

  /**
   * 删除习惯
   */
  onDeleteHabit(e: any) {
    const { habitId } = e.detail;
    if (!habitId) return;
    
    // 获取所有习惯
    const habits = getHabits();
    
    // 找到要删除的习惯索引
    const index = habits.findIndex(h => h.id === habitId);
    if (index === -1) return;
    
    // 删除习惯
    habits.splice(index, 1);
    
    // 保存修改
    saveHabits(habits);
    
    // 重新加载习惯
    this.loadHabits();
    
    // 显示提示
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的习惯清单',
      path: '/pages/habits/habits'
    };
  }
}); 
