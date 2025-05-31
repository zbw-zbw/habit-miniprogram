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
  habits: IHabit[];     // 所有习惯，包括归档的
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
  getDashboard: (date: string = getCurrentDate(), options: {
    includeCheckins?: boolean; // 是否包含打卡记录
    days?: number; // 获取多少天的打卡记录
  } = {}): Promise<IDashboardResponse> => {
    const { includeCheckins = true, days = 7 } = options;
    
    // 使用后端聚合API
    return request<ApiResponse<IDashboardResponse>>({
      url: '/api/dashboard',
      method: 'GET',
      data: { 
        date, 
        days: includeCheckins ? days : 0 
      }
    }).then(response => {
      // 确保返回的数据符合接口定义
      // 这里已经得到的是response.data，因为request模块已经处理过了
      if (typeof response === 'object' && response !== null) {
        return response.data || response;
      }
      return response;
    });
  },

  /**
   * 获取所有习惯列表（为习惯页面专门设计）
   * 包括所有历史习惯，不限于今天需要执行的习惯
   * @param options 可选参数
   * @returns 所有习惯及相关数据
   */
  getAllHabits: (options: {
    includeArchived?: boolean; // 是否包含归档的习惯
    includeStats?: boolean; // 是否包含统计数据
    includeCheckins?: boolean; // 是否包含打卡记录
    days?: number; // 获取多少天的打卡记录
  } = {}): Promise<IHabitsListResponse> => {
    const { 
      includeArchived = true, 
      includeStats = true, 
      includeCheckins = false, 
      days = 7 
    } = options;

    // 使用后端聚合API
    return request<ApiResponse<IHabitsListResponse>>({
      url: '/api/habits',
      method: 'GET',
      data: { 
        includeArchived, 
        includeStats, 
        includeCheckins, 
        days 
      }
    }).then(response => {
      // 确保返回的数据符合接口定义
      if (typeof response === 'object' && response !== null) {
        return response.data || response;
      }
      return response;
    });
  },

  /**
   * 获取分析数据（专为分析页面设计）
   * @param options 可选参数
   * @returns 分析数据
   */
  getAnalytics: (options: {
    startDate?: string;
    endDate?: string;
    timeRange?: 'week' | 'month' | 'year' | 'all'; // 时间范围
  } = {}): Promise<IAnalyticsResponse> => {
    const { 
      startDate = formatDate(new Date(new Date().setMonth(new Date().getMonth() - 1))), 
      endDate = getCurrentDate(),
      timeRange = 'month'
    } = options;
    
    // 使用后端聚合API
    return request<ApiResponse<IAnalyticsResponse>>({
      url: '/api/analytics',
      method: 'GET',
      data: { 
        startDate, 
        endDate, 
        timeRange 
      }
    }).then(response => {
      // 确保返回的数据符合接口定义
      if (typeof response === 'object' && response !== null) {
        return response.data || response;
      }
      return response;
    });
  }
}; 
