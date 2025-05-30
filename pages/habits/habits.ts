/**
 * 习惯列表页面
 */
import { habitAPI, checkinAPI } from '../../services/api';
import { generateHabitStats } from '../../utils/habit';
import { generateUUID } from '../../utils/util';
import { getCurrentDate, formatDate } from '../../utils/date';
import { getAllHabitCardsData } from '../../services/habit-card';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    habits: [] as IHabit[],
    habitStats: {} as Record<string, IHabitStats>,
    loading: true,
    activeTab: 0,
    // 使用英文分类名，方便与后端数据匹配
    categories: ['all', 'learning', 'health', 'work', 'life'] as string[],
    // 分类英文到中文的映射
    categoryMap: {
      'all': '全部',
      'learning': '学习',
      'health': '健康',
      'work': '工作',
      'life': '生活',
      'other': '其他',
      'reading': '阅读',
      'exercise': '运动',
      'diet': '饮食',
      'sleep': '睡眠',
      'meditation': '冥想'
    },
    showCategoryModal: false,
    showSortModal: false,
    sortType: 'default' as 'default' | 'name' | 'createdAt' | 'completionRate',
    sortOrder: 'asc' as 'asc' | 'desc',
    error: '',
    apiAvailable: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 页面加载时执行
    const app = getApp<IAppOption>();
    this.setData({
      apiAvailable: app.globalData.apiAvailable
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadHabits();
    
    // 延迟执行诊断
    setTimeout(() => {
      this.debug();
    }, 2000);
  },

  /**
   * 加载习惯数据
   */
  loadHabits() {
    // 设置加载状态
    this.setData({ 
      loading: true,
      error: ''
    });
    
    const app = getApp<IAppOption>();
    
    // 使用habitAPI获取习惯数据
    habitAPI.getHabits()
      .then(habits => {
        console.log('获取到所有习惯数据:', habits);
        
        // 获取每个习惯的统计数据
        const statsPromises = habits.map(habit => 
          habitAPI.getHabitStats(habit.id || habit._id || '')
            .catch(error => {
              console.error(`获取习惯${habit.id || habit._id}的统计数据失败:`, error);
              // 返回默认统计数据
              return {
                totalCompletions: 0,
                totalDays: 0,
                completionRate: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastCompletedDate: null
              } as IHabitStats;
            })
        );
        
        // 等待所有统计数据获取完成
        return Promise.all([Promise.resolve(habits), Promise.all(statsPromises)]);
      })
      .then(([habits, statsArray]) => {
        // 创建习惯ID到统计数据的映射
        const habitStats: Record<string, IHabitStats> = {};
        habits.forEach((habit, index) => {
          const habitId = habit.id || habit._id || '';
          if (habitId) {
            habitStats[habitId] = statsArray[index];
          }
        });
        
        // 根据当前标签筛选习惯
        const filteredHabits = this.filterHabits(habits);
        
        console.log('筛选后的习惯列表:', filteredHabits);
        
        // 根据当前排序方式排序习惯
        const sortedHabits = this.sortHabits(filteredHabits, habitStats);
        
        // 更新数据
        this.setData({
          habits: sortedHabits,
          habitStats,
          loading: false,
          apiAvailable: true
        });
        
        console.log('更新后的habitStats:', habitStats);
      })
      .catch(error => {
        console.error('获取习惯数据失败:', error);
        this.setData({ 
          loading: false,
          error: '获取数据失败，请稍后重试',
          apiAvailable: app.globalData.apiAvailable
        });
        
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      });
  },

  /**
   * 根据类别筛选习惯
   */
  filterHabits(habits: IHabit[]): IHabit[] {
    const { activeTab, categories } = this.data;
    
    // 获取当前选中的分类
    const selectedCategory = categories[activeTab];
    
    // 如果是"全部"标签，则不进行筛选
    if (selectedCategory === 'all') {
      return habits.filter(habit => !habit.isArchived);
    }
    
    // 根据类别筛选
    return habits.filter(habit => {
      // 过滤掉已归档的习惯
      if (habit.isArchived) return false;
      
      // 获取习惯分类，默认为'other'
      const habitCategory = habit.category || 'other';
      
      // 匹配分类
      return habitCategory === selectedCategory;
    });
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
          // 获取习惯ID (只使用_id)
          const habitIdA = a._id || '';
          const habitIdB = b._id || '';
          
          // 获取完成率
          const rateA = habitIdA ? (habitStats[habitIdA]?.completionRate || 0) : 0;
          const rateB = habitIdB ? (habitStats[habitIdB]?.completionRate || 0) : 0;
          
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
    const habit = this.data.habits.find(h => h.id === habitId || h._id === habitId);
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
          // 设置加载状态
          wx.showLoading({
            title: '删除中...',
            mask: true
          });
          
          // 调用API删除习惯
          habitAPI.deleteHabit(habitId)
            .then(() => {
              wx.hideLoading();
              
              // 重新加载数据
              this.loadHabits();
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            })
            .catch(error => {
              wx.hideLoading();
              console.error('删除习惯失败:', error);
              
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadHabits();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的习惯养成计划',
      path: '/pages/index/index'
    };
  },

  /**
   * 诊断习惯卡片问题
   */
  debug() {
    console.log('==== 习惯卡片诊断开始 ====');
    
    const { habits, habitStats } = this.data;
    
    console.log('当前标签页索引:', this.data.activeTab);
    console.log('当前选中分类:', this.data.categories[this.data.activeTab]);
    console.log('习惯总数:', habits.length);
    console.log('统计数据对象:', habitStats);
    
    habits.forEach(habit => {
      const habitId = habit._id || habit.id;
      const stats = habitStats[habitId];
      
      console.log(`习惯: ${habit.name}`);
      console.log(`- ID: ${habitId}`);
      console.log(`- _id: ${habit._id}`);
      console.log(`- id: ${habit.id}`);
      console.log(`- 分类: ${habit.category}`);
      console.log(`- 中文分类: ${this.data.categoryMap[habit.category as keyof typeof this.data.categoryMap] || habit.category}`);
      console.log(`- 统计数据:`, stats);
      
      if (stats) {
        console.log(`  - 完成率: ${stats.completionRate}%`);
        console.log(`  - 连续天数: ${stats.currentStreak}`);
        console.log(`  - 总完成次数: ${stats.totalCompletions}`);
        console.log(`  - 最后完成日期: ${stats.lastCompletedDate}`);
      } else {
        console.log(`  - 无统计数据`);
      }
      
      console.log(`--------------------------`);
    });
    
    console.log('==== 习惯卡片诊断结束 ====');
  }
}); 
