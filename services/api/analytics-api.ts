/**
 * 数据分析相关API
 */
import { get, post, put, del } from '../../utils/request';

export const analyticsAPI = {
  /**
   * 获取完成率数据
   * @param params 查询参数
   * @returns Promise<{labels: string[]; data: number[]; average: number;}>
   */
  getCompletionRate: (params?: {
    habitId?: string;
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }) => {
    return get<{
      labels: string[];
      data: number[];
      average: number;
    }>('/api/analytics/completion-rate', params);
  },

  /**
   * 获取习惯统计数据
   * @param habitId 习惯ID
   * @returns Promise<{totalCompletions: number; completionRate: number; currentStreak: number; longestStreak: number; bestDayOfWeek: string; bestTimeOfDay: string;}>
   */
  getHabitStats: (habitId: string) => {
    return get<{
      totalCompletions: number;
      completionRate: number;
      currentStreak: number;
      longestStreak: number;
      bestDayOfWeek: string;
      bestTimeOfDay: string;
    }>(`/api/analytics/habits/${habitId}/stats`);
  },

  /**
   * 获取分析数据（用于分析页面）
   * @param params 查询参数
   * @returns Promise<any>
   */
  getAnalytics: (params: {
    startDate: string;
    endDate: string;
    timeRange: 'week' | 'month' | 'year';
  }) => {
    return get<any>('/api/analytics', params);
  },

  /**
   * 获取月度报告
   * @param params 查询参数
   * @returns Promise
   */
  getMonthlyReport: (params: { month: string }) => {
    return get<{
      overview: {
        totalHabits: number;
        activeHabits: number;
        completedToday: number;
        completionRate: number;
        totalCheckins: number;
        currentStreak: number;
        longestStreak: number;
        startDate: string;
        totalDays: number;
      };
      habitDetails: Array<{
        id: string;
        name: string;
        color: string;
        icon: string;
        completionRate: number;
        streak: number;
        totalCheckins: number;
        bestDay: string;
        bestTime: string;
      }>;
      trends: {
        weeklyCompletion: number[];
        monthlyCompletion: number[];
        weekLabels: string[];
        monthLabels: string[];
      };
    }>('/api/analytics/monthly-report', params);
  },
  
  /**
   * 获取周报告
   * @param params 查询参数
   * @returns Promise
   */
  getWeeklyReport: (params: { week: string }) => {
    return get<{
      overview: {
        totalHabits: number;
        activeHabits: number;
        completedToday: number;
        completionRate: number;
        totalCheckins: number;
        currentStreak: number;
        longestStreak: number;
        startDate: string;
        totalDays: number;
      };
      habitDetails: Array<{
        id: string;
        name: string;
        color: string;
        icon: string;
        completionRate: number;
        streak: number;
        totalCheckins: number;
        bestDay: string;
        bestTime: string;
      }>;
      trends: {
        dailyCompletion: number[];
        dayLabels: string[];
      };
    }>('/api/analytics/weekly-report', params);
  },
  
  /**
   * 获取综合报告数据
   * @returns Promise
   */
  getReport: () => {
    return get<{
      overview: {
        totalHabits: number;
        activeHabits: number;
        completedToday: number;
        completionRate: number;
        totalCheckins: number;
        currentStreak: number;
        longestStreak: number;
        startDate: string;
        totalDays: number;
      };
      habitDetails: Array<{
        id: string;
        name: string;
        color: string;
        icon: string;
        completionRate: number;
        streak: number;
        totalCheckins: number;
        bestDay: string;
        bestTime: string;
      }>;
      trends: {
        weeklyCompletion: number[];
        monthlyCompletion: number[];
        weekLabels: string[];
        monthLabels: string[];
      };
    }>('/api/analytics/report');
  }
}; 
