/**
 * 数据分析-首页
 * 显示习惯相关的数据统计和分析
 */
import { analyticsAPI, habitAPI, checkinAPI } from '../../../services/api';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    dashboardData: {
      habitCount: 0,
      completedToday: 0,
      streak: 0,
      completion: 0
    },
    // 用于图表展示的数据
    chartData: {
      weeklyCompletion: [],
      weekLabels: [],
      habitCompletion: [],
      habitLabels: []
    },
    habits: [],
    selectedTimeRange: 'week', // 'week', 'month', 'year'
    emptyState: false // 是否显示空状态
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadDashboardData();
  },

  /**
   * 加载仪表盘数据
   */
  loadDashboardData() {
    this.setData({ loading: true });
    
    // 使用API获取仪表盘数据
    analyticsAPI.getDashboard()
      .then(dashboardData => {
        console.log('获取到仪表盘数据:', dashboardData);
        
        this.setData({
          dashboardData,
          loading: false,
          emptyState: dashboardData.habitCount === 0
        });
        
        // 如果有习惯数据，加载更多数据
        if (dashboardData.habitCount > 0) {
          this.loadChartData();
          this.loadHabits();
        }
      })
      .catch(error => {
        console.error('获取仪表盘数据失败:', error);
        
        // 显示错误提示
        wx.showToast({
          title: '获取数据失败，请稍后重试',
          icon: 'none'
        });
        
        // 重置加载状态
        this.setData({ 
          loading: false,
          emptyState: true
        });
      });
  },

  /**
   * 加载图表数据
   */
  loadChartData() {
    const { selectedTimeRange } = this.data;
    
    // 构建请求参数
    const params = {
      period: selectedTimeRange
    };
    
    // 使用API获取完成率数据
    analyticsAPI.getCompletionRate(params)
      .then(completionData => {
        console.log('获取到完成率数据:', completionData);
        
        // 提取图表数据
        const chartData = this.processChartData(completionData, selectedTimeRange);
        
        this.setData({ chartData });
      })
      .catch(error => {
        console.error('获取图表数据失败:', error);
      });
  },

  /**
   * 处理图表数据
   */
  processChartData(data: any, timeRange: string) {
    const chartData = {
      weeklyCompletion: [],
      weekLabels: [],
      habitCompletion: [],
      habitLabels: []
    };
    
    // 处理时间范围数据
    if (data && data.data) {
      // 根据时间范围设置标签格式
      const dateFormat = timeRange === 'week' ? 'MM-DD' : 
                          timeRange === 'month' ? 'MM-DD' : 'YYYY-MM';
      
      // 提取日期和完成率数据
      chartData.weekLabels = data.data.map((item: any) => this.formatDate(item.date, dateFormat));
      chartData.weeklyCompletion = data.data.map((item: any) => item.rate);
    }
    
    return chartData;
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr: string, format: string) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (format === 'YYYY-MM') {
      return `${year}-${month}`;
    } else {
      return `${month}-${day}`;
    }
  },

  /**
   * 加载习惯数据
   */
  loadHabits() {
    // 使用API获取习惯数据
    habitAPI.getHabits()
      .then(habits => {
        console.log('获取到习惯列表:', habits);
        
        // 并行获取所有习惯的统计数据
        const statsPromises = habits.map(habit => {
          const habitId = habit.id || habit._id;
          return analyticsAPI.getHabitStats({ habitId });
        });
        
        // 等待所有统计数据获取完成
        return Promise.all([habits, Promise.all(statsPromises)]);
      })
      .then(([habits, statsArray]) => {
        console.log('获取到习惯统计数据:', statsArray);
        
        // 合并习惯数据和统计数据
        const habitsWithStats = habits.slice(0, 5).map((habit, index) => {
          return {
            ...habit,
            stats: statsArray[index] || {}
          };
        });
        
        // 提取习惯图表数据
        const habitCompletion = habitsWithStats.map(habit => habit.stats.completionRate || 0);
        const habitLabels = habitsWithStats.map(habit => habit.name);
        
        this.setData({
          habits: habitsWithStats,
          'chartData.habitCompletion': habitCompletion,
          'chartData.habitLabels': habitLabels
        });
      })
      .catch(error => {
        console.error('获取习惯数据失败:', error);
      });
  },

  /**
   * 切换时间范围
   */
  switchTimeRange(e: any) {
    const timeRange = e.currentTarget.dataset.range;
    
    this.setData({
      selectedTimeRange: timeRange
    }, () => {
      this.loadChartData();
    });
  },

  /**
   * 跳转到详细报告页面
   */
  navigateToReport() {
    wx.navigateTo({
      url: '/packageAnalytics/pages/report/report'
    });
  },

  /**
   * 跳转到习惯详情页面
   */
  navigateToHabit(e: any) {
    const habitId = e.currentTarget.dataset.id;
    
    wx.navigateTo({
      url: `/pages/habits/detail/detail?id=${habitId}`
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
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadDashboardData();
    wx.stopPullDownRefresh();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的习惯数据统计',
      path: '/pages/index/index'
    };
  }
}); 
