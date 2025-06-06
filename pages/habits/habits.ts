/**
 * 习惯列表页面
 */
import { login } from '../../utils/auth';
import { habitAPI } from '../../services/api';
import { dashboardAPI } from '../../services/api/dashboard';
import { IHabit, IHabitStats } from '../../utils/types';
import { useAuth } from '../../utils/use-auth';
import { getCurrentDate } from '../../utils/date';
import { IAppOption } from '../../typings/index';

// 添加通用API响应类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

// 页面数据接口
interface IPageData {
  habits: IHabit[];
  allHabits: IHabit[]; // 添加allHabits属性，用于保存完整的习惯列表
  habitStats: Record<string, IHabitStats>;
  loading: boolean;
  activeTab: number;
  categories: string[];
  categoryLabels: string[];
  categoryTabs: string[];
  categoryMap: Record<string, string>;
  showCategoryModal: boolean;
  showSortModal: boolean;
  sortType: string;
  sortOrder: string;
  sortOptions: Array<{
    type: string;
    label: string;
    orders: Array<{ value: string; label: string }>;
  }>;
  showArchived: boolean;
  error: string;
  apiAvailable: boolean;
  hasLogin: boolean;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    habits: [] as IHabit[],
    allHabits: [] as IHabit[],
    habitStats: {} as Record<string, IHabitStats>,
    loading: true,
    activeTab: 0,
    // 使用英文分类名，方便与后端数据匹配
    categories: ['all', 'learning', 'health', 'work', 'life'] as string[],
    // 用于Tab组件显示的中文标签
    categoryLabels: [] as string[],
    // 为tab-bar组件准备的标签
    categoryTabs: [] as string[],
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
    showArchived: false, // 是否显示已归档习惯
    hasLogin: false, // 添加登录状态
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

    // 确保默认选中"全部"标签
    this.setData({
      apiAvailable: app.globalData.apiAvailable,
      categoryLabels,
      categoryTabs: categoryLabels, // 同时设置tab-bar组件使用的标签
      activeTab: 0, // 默认选中"全部"标签
      hasLogin: app.globalData.hasLogin,
      // 初始化排序选项
      sortType: 'default',
      sortOrder: 'asc',
    });

    // 使用useAuth工具获取全局登录状态
    useAuth(this, {
      onChange: (authState) => {
        // 当登录状态变化时更新本地状态
        this.setData({ hasLogin: authState.hasLogin });
      },
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const app = getApp();

    // 更新登录状态
    this.setData({
      hasLogin: app.globalData.hasLogin,
    });

    // 检查是否已登录，未登录则不请求数据
    if (!app.globalData.hasLogin) {
      this.setData({
        habits: [],
        loading: false,
        error: '请先登录以查看您的习惯',
      });
      return;
    }

    // 强制刷新习惯数据
    this.loadData();
  },

  /**
   * 登录方法
   */
  login() {
    // 使用公共登录方法
    login((success) => {
      if (success) {
        // 登录成功后，获取最新的用户信息
        const app = getApp<IAppOption>();
        this.setData({
          userInfo: app.globalData.userInfo,
          hasLogin: true,
        });

        // 重新加载数据
        this.loadData();
      }
    });
  },

  /**
   * 初始化数据
   */
  loadData() {
    // 设置加载状态
    this.setData({
      loading: true,
      error: '',
    });
    // 使用新的专用API获取所有习惯，添加时间戳参数避免缓存
    dashboardAPI
      .getAllHabits({
        includeArchived: false,
        includeStats: true,
        includeCheckins: true,
        timestamp: Date.now(), // 添加时间戳避免缓存
      } as any) // 使用类型断言处理timestamp属性
      .then((response) => {
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
              'habits' in apiResponse.data &&
              Array.isArray(apiResponse.data.habits)
            ) {
              habits = apiResponse.data.habits;
              habitStats = (apiResponse.data as any).habitStats || {};
            }
          }
        }

        // 处理习惯数据，确保每个习惯都有ID
        habits = habits.map((habit) => {
          // 确保每个习惯都有id属性，优先使用_id
          const id = habit._id || habit.id;
          return { ...habit, id };
        });

        // 确保habitStats中的日期格式正确
        const today = getCurrentDate();
        Object.keys(habitStats).forEach((habitId) => {
          const stats = habitStats[habitId];
          if (stats && stats.lastCompletedDate) {
            // 处理lastCompletedDate，确保格式一致
            const lastCompletedDate =
              typeof stats.lastCompletedDate === 'string'
                ? stats.lastCompletedDate.split('T')[0] // 处理ISO格式日期
                : '';

            // 比较日期字符串，确定是否今天已完成
            const isCompletedToday = lastCompletedDate === today;

            // 添加调试日志

            // 更新统计数据中的lastCompletedDate格式
            stats.lastCompletedDate = lastCompletedDate;
          }
        });

        // 根据当前标签筛选习惯
        const filteredHabits = this.filterHabits(habits);

        // 更新数据
        this.setData({
          habits: filteredHabits,
          allHabits: habits, // 保存完整的习惯列表
          habitStats,
          loading: false,
          apiAvailable: true,
          error: habits.length === 0 ? '暂无习惯数据' : '',
        });
      })
      .catch((error) => {
        console.error('获取习惯数据失败:', error);
        // 设置加载失败状态，确保loading被重置
        this.setData({
          loading: false,
          error: '加载习惯数据失败，请重试',
          apiAvailable: false,
        });
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

    // 检查是否已登录，未登录则不请求数据
    if (!app.globalData.hasLogin) {
      this.setData({
        habits: [],
        loading: false,
        error: '请先登录以查看您的习惯',
      });
      return;
    }

    // 使用新的专用API获取所有习惯
    dashboardAPI
      .getAllHabits({
        includeArchived: this.data.showArchived,
        includeStats: true,
        includeCheckins: false,
        // 添加排序参数
        sort: this.data.sortType,
        order: this.data.sortOrder,
      })
      .then((response) => {
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
        // 确保每个习惯都有分类属性
        habits = habits.map((habit: IHabit) => {
          // 如果没有分类，则默认为"other"
          if (!habit.category) {
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
        // 更新数据
        this.setData({
          habits: filteredHabits,
          allHabits: habits, // 保存完整的习惯列表
          habitStats,
          loading: false,
          apiAvailable: true,
          error: habits.length === 0 ? '暂无习惯数据' : '',
        });
      })
      .catch((error) => {
        console.error('获取习惯数据失败:', error);
        // 设置加载失败状态，确保loading被重置
        this.setData({
          loading: false,
          error: '加载习惯数据失败，请重试',
          apiAvailable: false,
        });
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

    // 筛选出符合条件的习惯
    return habits.filter((habit) => {
      // 不在前端过滤归档状态，由服务端处理
      // 已归档的习惯是否显示完全取决于API请求时的includeArchived参数

      // 如果是"全部"标签，则不进行分类筛选
      if (selectedCategory === 'all') return true;

      // 获取习惯分类，默认为'other'
      const habitCategory = habit.category || 'other';

      // 匹配分类
      return habitCategory === selectedCategory;
    });
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
    } else {
      // 来自点击事件的原始处理方式
      activeTab = e.currentTarget.dataset.index;
    }

    // 只更新活动标签，并基于现有数据过滤，不再重新加载
    this.setData({ activeTab }, () => {
      // 从缓存中获取所有习惯数据，如果没有则重新加载
      const { allHabits, habitStats } = this.data;

      if (allHabits && allHabits.length > 0) {
        // 根据当前标签筛选习惯
        const filteredHabits = this.filterHabits(allHabits);

        // 更新数据
        this.setData({
          habits: filteredHabits,
        });
      } else {
        // 如果没有缓存的所有习惯数据，重新加载
        this.loadHabits();
      }
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
          // 延迟一点执行，确保后端数据已更新
          setTimeout(() => {
            this.loadData();
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
   * 切换显示已归档习惯
   */
  toggleArchived(e: any) {
    const showArchived = e.detail.value;
    this.setData({ showArchived }, () => {
      this.loadHabits();
    });
  },
});
