/**
 * 仪表盘数据API服务
 * 聚合所有前端需要的数据，减少网络请求
 *
 * 后端已实现聚合API端点：
 * 1. `/api/dashboard` - 获取仪表盘数据
 * 2. `/api/habits/all` - 获取所有习惯数据
 * 3. `/api/analytics` - 获取分析数据
 */
import { request } from '../../utils/request';
import { getCurrentDate, formatDate } from '../../utils/date';
import { IHabit, ICheckin, IHabitStats } from '../../utils/types';

// API响应类型定义
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * 仪表盘数据接口
 */
export interface IDashboardResponse {
  date: string;
  todayHabits: IHabit[];
  completedHabits: IHabit[];
  stats: {
    totalHabits: number;
    activeHabits: number;
    completedToday: number;
    completionRate: number;
    totalCheckins: number;
    currentStreak: number;
    longestStreak: number;
  };
  recentCheckins: ICheckin[];
  habitStats: Record<string, IHabitStats>;
}

/**
 * 习惯列表数据接口，专为习惯页面设计
 */
export interface IHabitsListResponse {
  habits: IHabit[]; // 所有习惯，包括归档的
  activeHabits: IHabit[]; // 活跃的习惯
  archivedHabits: IHabit[]; // 归档的习惯
  habitStats: Record<string, IHabitStats>; // 习惯统计数据
  categories: string[]; // 已使用的分类列表
  recentCheckins: ICheckin[]; // 最近的打卡记录（可选）
}

/**
 * 分析数据接口
 */
export interface IAnalyticsResponse {
  summary: {
    totalHabits: number;
    activeHabits: number;
    averageCompletionRate: number;
    bestStreak: number;
    currentStreak: number;
    bestCategory: string;
    totalCheckins: number;
    thisWeekCheckins: number;
    weeklyTrend: number; // 正数表示上升，负数表示下降
  };
  habitStats: Record<string, IHabitStats>;
  timelineData: Array<{
    date: string;
    completionRate: number;
    totalCompleted: number;
    totalHabits: number;
  }>;
  categoryData: Array<{
    category: string;
    count: number;
    completionRate: number;
    averageStreak: number;
  }>;
  // 热图数据
  heatmapData: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * 检查对象是否符合IDashboardResponse接口
 * @param obj 要检查的对象
 * @returns 是否符合IDashboardResponse接口
 */
function isDashboardResponse(obj: any): obj is IDashboardResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    'date' in obj &&
    'todayHabits' in obj &&
    'completedHabits' in obj &&
    'stats' in obj &&
    'recentCheckins' in obj &&
    'habitStats' in obj
  );
}

/**
 * 检查对象是否符合IHabitsListResponse接口
 * @param obj 要检查的对象
 * @returns 是否符合IHabitsListResponse接口
 */
function isHabitsListResponse(obj: any): obj is IHabitsListResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    'habits' in obj &&
    'activeHabits' in obj &&
    'archivedHabits' in obj &&
    'habitStats' in obj
  );
}

/**
 * 检查对象是否符合IAnalyticsResponse接口
 * @param obj 要检查的对象
 * @returns 是否符合IAnalyticsResponse接口
 */
function isAnalyticsResponse(obj: any): obj is IAnalyticsResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    'summary' in obj &&
    'habitStats' in obj &&
    'timelineData' in obj &&
    'categoryData' in obj &&
    'heatmapData' in obj
  );
}

/**
 * 仪表盘API
 */
export const dashboardAPI = {
  /**
   * 获取仪表盘数据
   * 聚合了习惯、打卡记录和统计数据
   * @param date 日期，默认为今天
   * @param options 附加选项
   * @returns 仪表盘数据
   */
  getDashboard: (
    date: string = getCurrentDate(),
    options: {
      includeCheckins?: boolean; // 是否包含打卡记录
      days?: number; // 获取多少天的打卡记录
    } = {}
  ): Promise<IDashboardResponse> => {
    const { includeCheckins = true, days = 7 } = options;

    // 检查当前页面，如果是统计页面则不调用dashboard API
    try {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      // 注意：只有在统计页面时才跳过dashboard API调用
      // 其他页面(如首页、习惯页等)需要正常调用dashboard API
      if (currentPage && currentPage.route && (
        currentPage.route === 'pages/analytics/analytics' || 
        (currentPage as any).__route__ === 'pages/analytics/analytics'
      )) {
        console.log('在统计页面，跳过dashboard API调用');
        const emptyResponse: IDashboardResponse = {
          date: date,
          todayHabits: [],
          completedHabits: [],
          stats: {
            totalHabits: 0,
            activeHabits: 0,
            completedToday: 0,
            completionRate: 0,
            totalCheckins: 0,
            currentStreak: 0,
            longestStreak: 0
          },
          recentCheckins: [],
          habitStats: {}
        };
        return Promise.resolve(emptyResponse);
      }
    } catch (err) {
      console.error('检查当前页面时出错:', err);
      // 错误处理：如果无法确定当前页面，继续正常API调用
    }

    // 使用后端聚合API
    return request<ApiResponse<IDashboardResponse>>({
      url: '/api/dashboard',
      method: 'GET',
      data: {
        date,
        days: includeCheckins ? days : 0,
      },
    }).then((response): IDashboardResponse => {
      // 检查response是否是正确的ApiResponse格式
      if (response && typeof response === 'object') {
        // response可能已经是解析后的IDashboardResponse（由request函数处理）
        if (isDashboardResponse(response)) {
          return response;
        }
        
        // 如果response是ApiResponse格式，取其中的data属性
        if ('data' in response && response.data) {
          if (isDashboardResponse(response.data)) {
            return response.data;
          }
        }
      }
      
      // 如果返回数据格式不正确，返回安全的默认值
      console.error('无法从API响应中获取有效数据:', response);
      return {
        date: date,
        todayHabits: [],
        completedHabits: [],
        stats: {
          totalHabits: 0,
          activeHabits: 0,
          completedToday: 0,
          completionRate: 0,
          totalCheckins: 0,
          currentStreak: 0,
          longestStreak: 0
        },
        recentCheckins: [],
        habitStats: {}
      };
    }).catch(error => {
      console.error('获取仪表盘数据失败:', error);
      // 出错时返回空数据而不是抛出错误，避免应用崩溃
      return {
        date: date,
        todayHabits: [],
        completedHabits: [],
        stats: {
          totalHabits: 0,
          activeHabits: 0,
          completedToday: 0,
          completionRate: 0,
          totalCheckins: 0,
          currentStreak: 0,
          longestStreak: 0
        },
        recentCheckins: [],
        habitStats: {}
      };
    });
  },

  /**
   * 获取所有习惯列表（为习惯页面专门设计）
   * 包括所有历史习惯，不限于今天需要执行的习惯
   * @param options 可选参数
   * @returns 所有习惯及相关数据
   */
  getAllHabits: (
    options: {
      includeArchived?: boolean; // 是否包含归档的习惯
      includeStats?: boolean; // 是否包含统计数据
      includeCheckins?: boolean; // 是否包含打卡记录
      days?: number; // 获取多少天的打卡记录
      sort?: string; // 排序字段
      order?: string; // 排序顺序
    } = {}
  ): Promise<IHabitsListResponse> => {
    const {
      includeArchived = false,
      includeStats = true,
      includeCheckins = true,
      days = 7,
      sort = 'createdAt',
      order = 'desc',
    } = options;

    // 使用后端聚合API
    return request<ApiResponse<IHabit[] | IHabitsListResponse>>({
      url: '/api/habits',
      method: 'GET',
      data: {
        includeArchived,
        includeStats,
        includeCheckins,
        days,
        sort,
        order,
      },
    }).then((response): IHabitsListResponse => {
      // 检查response是否是正确的格式
      if (response && typeof response === 'object') {
        let habits: IHabit[] = [];
        
        // 尝试从不同可能的响应结构中获取习惯数据
        if (Array.isArray(response)) {
          // 如果response直接是习惯数组
          habits = response;
        } else if ('data' in response) {
          // 如果response有data字段
          if (Array.isArray(response.data)) {
            // 如果data是一个数组
            habits = response.data;
          } else if (response.data && typeof response.data === 'object') {
            // 如果data是一个对象，可能是IHabitsListResponse
            if (isHabitsListResponse(response.data)) {
              return response.data;
            } else if (
              'habits' in response.data && 
              Array.isArray((response.data as any).habits)
            ) {
              // 如果data.habits是一个数组
              return response.data as unknown as IHabitsListResponse;
            }
          }
        }
        
        // 如果我们至少得到了习惯数组，构造一个符合预期的响应
        if (habits && Array.isArray(habits)) {
          // 根据数组数据构造IHabitsListResponse对象
          const activeHabits = habits.filter(h => !h.isArchived);
          const archivedHabits = habits.filter(h => h.isArchived);
          
          // 提取所有不同的分类
          const categoriesSet = new Set<string>();
          habits.forEach(habit => {
            if (habit.category) categoriesSet.add(habit.category);
          });
          
          return {
            habits,
            activeHabits,
            archivedHabits,
            habitStats: {},  // 由于API未返回统计数据，使用空对象
            categories: Array.from(categoriesSet),
            recentCheckins: []  // 由于API未返回打卡数据，使用空数组
          };
        }
      }
      
      // 如果返回数据格式不正确，返回默认值
      console.error('无法从API响应中获取有效的习惯列表数据:', response);
      return {
        habits: [],
        activeHabits: [],
        archivedHabits: [],
        habitStats: {},
        categories: [],
        recentCheckins: []
      };
    }).catch(error => {
      console.error('获取习惯列表失败:', error);
      return {
        habits: [],
        activeHabits: [],
        archivedHabits: [],
        habitStats: {},
        categories: [],
        recentCheckins: []
      };
    });
  },

  /**
   * 获取分析数据（专为分析页面设计）
   * @param options 可选参数
   * @returns 分析数据
   */
  getAnalytics: (
    options: {
      startDate?: string;
      endDate?: string;
      timeRange?: 'week' | 'month' | 'year' | 'all'; // 时间范围
    } = {}
  ): Promise<IAnalyticsResponse> => {
    const {
      startDate = formatDate(
        new Date(new Date().setMonth(new Date().getMonth() - 1))
      ),
      endDate = getCurrentDate(),
      timeRange = 'month',
    } = options;

    // 使用后端聚合API
    return request<ApiResponse<IAnalyticsResponse>>({
      url: '/api/analytics',
      method: 'GET',
      data: {
        startDate,
        endDate,
        timeRange,
      },
    }).then((response): IAnalyticsResponse => {
      // 检查response是否是正确的格式
      if (response && typeof response === 'object') {
        // response可能已经是解析后的IAnalyticsResponse
        if (isAnalyticsResponse(response)) {
          return response;
        }
        
        // 如果response是ApiResponse格式，取其中的data属性
        if ('data' in response && response.data) {
          if (isAnalyticsResponse(response.data)) {
            return response.data;
          }
        }
      }
      
      // 如果返回数据格式不正确，返回默认值
      console.error('无法从API响应中获取有效的分析数据:', response);
      return {
        summary: {
          totalHabits: 0,
          activeHabits: 0,
          averageCompletionRate: 0,
          bestStreak: 0,
          currentStreak: 0,
          bestCategory: '',
          totalCheckins: 0,
          thisWeekCheckins: 0,
          weeklyTrend: 0
        },
        habitStats: {},
        timelineData: [],
        categoryData: [],
        heatmapData: []
      };
    }).catch(error => {
      console.error('获取分析数据失败:', error);
      return {
        summary: {
          totalHabits: 0,
          activeHabits: 0,
          averageCompletionRate: 0,
          bestStreak: 0,
          currentStreak: 0,
          bestCategory: '',
          totalCheckins: 0,
          thisWeekCheckins: 0,
          weeklyTrend: 0
        },
        habitStats: {},
        timelineData: [],
        categoryData: [],
        heatmapData: []
      };
    });
  },
};
