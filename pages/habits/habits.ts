/**
 * 习惯列表页面
 */
import { habitAPI } from '../../services/api';
import { dashboardAPI } from '../../services/api/dashboard';
import { IHabit, IHabitStats } from '../../utils/types';

// 添加通用API响应类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

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
    // 用于Tab组件显示的中文标签
    categoryLabels: [] as string[],
    // 分类英文到中文的映射
    categoryMap: {
      all: '全部',
      learning: '学习',
      health: '健康',
      work: '工作',
      life: '生活',
      other: '其他',
      reading: '阅读',
      exercise: '运动',
      diet: '饮食',
      sleep: '睡眠',
      meditation: '冥想',
    } as Record<string, string>,
    showCategoryModal: false,
    showSortModal: false,
    sortType: 'default' as 'default' | 'name' | 'createdAt' | 'completionRate',
    sortOrder: 'asc' as 'asc' | 'desc',
    error: '',
    apiAvailable: true,
    forceRefresh: false, // 添加强制刷新标志
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 页面加载时执行
    const app = getApp<IAppOption>();

    // 将英文分类名转为中文展示
    const categoryLabels = this.data.categories.map(
      (category) => this.data.categoryMap[category] || category
    );

    console.log('初始化categoryLabels:', categoryLabels);

    // 确保默认选中"全部"标签
    this.setData({
      apiAvailable: app.globalData.apiAvailable,
      categoryLabels,
      activeTab: 0, // 默认选中"全部"标签
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('习惯页面onShow');

    // 强制刷新习惯数据
    this.forceRefreshHabits();

    // 延迟执行诊断
    setTimeout(() => {
      this.debug();
    }, 2000);
  },

  /**
   * 强制刷新习惯数据，不使用缓存
   */
  forceRefreshHabits() {
    console.log('强制刷新习惯数据');

    // 设置加载状态
    this.setData({
      loading: true,
      error: '',
    });

    // 使用新的专用API获取所有习惯，添加时间戳参数避免缓存
    dashboardAPI
      .getAllHabits({
        includeArchived: true,
        includeStats: true,
        includeCheckins: false,
        timestamp: Date.now(), // 添加时间戳避免缓存
      } as any)
      .then((response) => {
        console.log('强制刷新获取习惯数据成功:', response);

        // 从响应中提取所需数据，确保数据存在
        let habits: IHabit[] = [];
        let habitStats: Record<string, IHabitStats> = {};

        // 处理不同格式的API响应
        if (response && typeof response === 'object') {
          // 标准API返回格式
          if ('habits' in response && Array.isArray(response.habits)) {
            habits = response.habits;
            habitStats = response.habitStats || {};
          }
          // 处理直接返回的数组
          else if (Array.isArray(response)) {
            habits = response;
          }
          // 处理通用API响应格式
          else if ('success' in response && 'data' in response) {
            const apiResponse = response as unknown as ApiResponse<
              IHabit[] | { habits: IHabit[] }
            >;
            if (Array.isArray(apiResponse.data)) {
              habits = apiResponse.data;
            } else if (
              apiResponse.data &&
              typeof apiResponse.data === 'object' &&
              'habits' in apiResponse.data
            ) {
              habits = apiResponse.data.habits;
            }
          }
        }

        console.log('解析后的习惯数据:', habits);

        // 确保每个习惯都有分类属性
        habits = habits.map((habit: IHabit) => {
          // 如果没有分类，则默认为"other"
          if (!habit.category) {
            console.log(`习惯[${habit.name}]没有分类，设置为默认分类"other"`);
            return { ...habit, category: 'other' };
          }
          return habit;
        });

        // 更新分类列表（如果后端提供了）
        if (response.categories && Array.isArray(response.categories)) {
          // 始终添加"all"类别
          const categories = ['all', ...response.categories];
          const categoryLabels = categories.map(
            (category) => this.data.categoryMap[category] || category
          );

          this.setData({
            categories,
            categoryLabels,
          });
        }

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
          apiAvailable: true,
          error: habits.length === 0 ? '暂无习惯数据' : '',
        });

        console.log('更新后的habitStats:', habitStats);
      })
      .catch((error) => {
        console.error('强制刷新习惯数据失败:', error);

        // 尝试正常加载数据
        this.loadHabits();
      });
  },

  /**
   * 加载习惯数据
   */
  loadHabits() {
    // 设置加载状态
    this.setData({
      loading: true,
      error: '',
    });

    const app = getApp<IAppOption>();

    // 使用新的专用API获取所有习惯
    dashboardAPI
      .getAllHabits({
        includeArchived: true,
        includeStats: true,
        includeCheckins: false,
      })
      .then((response) => {
        console.log('获取所有习惯数据成功:', response);

        // 从响应中提取所需数据，确保数据存在
        let habits: IHabit[] = [];
        let habitStats: Record<string, IHabitStats> = {};

        // 处理不同格式的API响应
        if (response && typeof response === 'object') {
          // 标准API返回格式
          if ('habits' in response && Array.isArray(response.habits)) {
            habits = response.habits;
            habitStats = response.habitStats || {};
          }
          // 处理直接返回的数组
          else if (Array.isArray(response)) {
            habits = response;
          }
          // 处理通用API响应格式
          else if ('success' in response && 'data' in response) {
            const apiResponse = response as unknown as ApiResponse<
              IHabit[] | { habits: IHabit[] }
            >;
            if (Array.isArray(apiResponse.data)) {
              habits = apiResponse.data;
            } else if (
              apiResponse.data &&
              typeof apiResponse.data === 'object' &&
              'habits' in apiResponse.data
            ) {
              habits = apiResponse.data.habits;
            }
          }
        }

        console.log('解析后的习惯数据:', habits);

        // 确保每个习惯都有分类属性
        habits = habits.map((habit: IHabit) => {
          // 如果没有分类，则默认为"other"
          if (!habit.category) {
            console.log(`习惯[${habit.name}]没有分类，设置为默认分类"other"`);
            return { ...habit, category: 'other' };
          }
          return habit;
        });

        // 更新分类列表（如果后端提供了）
        if (response.categories && Array.isArray(response.categories)) {
          // 始终添加"all"类别
          const categories = ['all', ...response.categories];
          const categoryLabels = categories.map(
            (category) => this.data.categoryMap[category] || category
          );

          this.setData({
            categories,
            categoryLabels,
          });
        }

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
          apiAvailable: true,
          error: habits.length === 0 ? '暂无习惯数据' : '',
        });

        console.log('更新后的habitStats:', habitStats);
      })
      .catch((error) => {
        console.error('获取习惯数据失败:', error);
      });
  },

  /**
   * 根据类别筛选习惯
   */
  filterHabits(habits: any[]): IHabit[] {
    if (!Array.isArray(habits)) {
      console.error('habits不是数组:', habits);
      return [];
    }

    const { activeTab, categories } = this.data;

    // 获取当前选中的分类
    const selectedCategory = categories[activeTab];

    console.log(
      '当前选择的分类:',
      selectedCategory,
      '活动标签索引:',
      activeTab
    );

    // 如果是"全部"标签，则只过滤掉已归档的习惯
    if (selectedCategory === 'all') {
      const filteredHabits = habits.filter((habit) => !habit.isArchived);
      console.log('全部标签下过滤后的习惯数量:', filteredHabits.length);
      return filteredHabits;
    }

    // 根据类别筛选
    return habits.filter((habit) => {
      // 过滤掉已归档的习惯
      if (habit.isArchived) return false;

      // 获取习惯分类，默认为'other'
      const habitCategory = habit.category || 'other';

      // 输出日志帮助调试
      console.log(
        `习惯[${habit.name}]的分类:`,
        habitCategory,
        '当前选中分类:',
        selectedCategory
      );

      // 匹配分类 - 增加日志
      const match = habitCategory === selectedCategory;
      if (!match) {
        console.log(`习惯[${habit.name}]分类不匹配，被过滤掉`);
      }

      return match;
    });
  },

  /**
   * 根据排序方式排序习惯
   */
  sortHabits(habits: any[], habitStats: Record<string, IHabitStats>): IHabit[] {
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
          const result =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return sortOrder === 'asc' ? result : -result;
        });
        break;
      case 'completionRate':
        sortedHabits.sort((a, b) => {
          // 获取习惯ID (可能是id或_id)
          const habitIdA = a.id || a._id || '';
          const habitIdB = b.id || b._id || '';

          // 获取完成率
          const rateA =
            habitIdA && habitStats[habitIdA]
              ? habitStats[habitIdA].completionRate || 0
              : 0;
          const rateB =
            habitIdB && habitStats[habitIdB]
              ? habitStats[habitIdB].completionRate || 0
              : 0;

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
    // 支持来自tab-bar组件的事件
    let activeTab: number;

    // 判断事件类型
    if (e.detail && e.detail.index !== undefined) {
      // 来自tab-bar组件的事件
      activeTab = e.detail.index;
      console.log('来自tab-bar组件的Tab切换:', activeTab);
    } else {
      // 来自点击事件的原始处理方式
      activeTab = e.currentTarget.dataset.index;
      console.log('来自点击事件的Tab切换:', activeTab);
    }

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
    this.setData(
      {
        sortType: type,
        sortOrder: order,
        showSortModal: false,
      },
      () => {
        this.loadHabits();
      }
    );
  },

  /**
   * 创建新习惯
   */
  createHabit() {
    wx.navigateTo({
      url: '/pages/habits/create/create',
    });
  },

  /**
   * 打卡习惯
   */
  onCheckin(e: any) {
    const { habitId } = e.detail;
    if (!habitId) return;

    // 获取习惯信息，用于传递到打卡页面
    const habit = this.data.habits.find(
      (h) => h.id === habitId || h._id === habitId
    );
    if (!habit) return;

    // 跳转到打卡页面
    wx.navigateTo({
      url: `/pages/checkin/checkin?habitId=${habitId}&habitName=${encodeURIComponent(
        habit.name
      )}`,
      events: {
        // 监听打卡完成事件，然后刷新数据
        checkinCompleted: () => {
          console.log('接收到打卡完成事件，刷新习惯列表');
          // 延迟一点执行，确保后端数据已更新
          setTimeout(() => {
            this.forceRefreshHabits();
          }, 500);
        },
      },
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
            mask: true,
          });

          // 调用API删除习惯
          habitAPI
            .deleteHabit(habitId)
            .then(() => {
              wx.hideLoading();

              // 重新加载数据
              this.loadHabits();

              wx.showToast({
                title: '删除成功',
                icon: 'success',
              });
            })
            .catch((error) => {
              wx.hideLoading();
              console.error('删除习惯失败:', error);

              wx.showToast({
                title: '删除失败',
                icon: 'none',
              });
            });
        }
      },
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
      path: '/pages/index/index',
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

    habits.forEach((habit) => {
      const habitId = habit._id || habit.id;
      const stats = habitStats[habitId];

      console.log(`习惯: ${habit.name}`);
      console.log(`- ID: ${habitId}`);
      console.log(`- _id: ${habit._id}`);
      console.log(`- id: ${habit.id}`);
      console.log(`- 分类: ${habit.category}`);
      console.log(
        `- 中文分类: ${
          this.data.categoryMap[
            habit.category as keyof typeof this.data.categoryMap
          ] || habit.category
        }`
      );
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
  },
});
