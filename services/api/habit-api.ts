/**
 * 习惯相关API
 */
import { get, post, put, del } from '../../utils/request';

export const habitAPI = {
  /**
   * 获取所有习惯
   * @param params 查询参数
   * @returns Promise<IHabit[]>
   */
  getHabits: (params?: { category?: string; isArchived?: boolean }): Promise<IHabit[]> => {
    return get('/api/habits', params);
  },

  /**
   * 获取习惯详情
   * @param habitId 习惯ID
   * @returns Promise<IHabit>
   */
  getHabit: (habitId: string): Promise<IHabit> => {
    return get(`/api/habits/${habitId}`);
  },

  /**
   * 创建习惯
   * @param habitData 习惯数据
   * @returns Promise<IHabit>
   */
  createHabit: (habitData: Partial<IHabit>): Promise<IHabit> => {
    return post<IHabit>('/api/habits', habitData);
  },

  /**
   * 更新习惯
   * @param habitId 习惯ID
   * @param habitData 习惯数据
   * @returns Promise<IHabit>
   */
  updateHabit: (habitId: string, habitData: Partial<IHabit>): Promise<IHabit> => {
    return put<IHabit>(`/api/habits/${habitId}`, habitData);
  },

  /**
   * 删除习惯
   * @param habitId 习惯ID
   * @returns Promise<void>
   */
  deleteHabit: (habitId: string): Promise<void> => {
    return del<{ success: boolean }>(`/api/habits/${habitId}`).then(() => undefined);
  },

  /**
   * 归档习惯
   * @param habitId 习惯ID
   * @returns Promise<IHabit>
   */
  archiveHabit: (habitId: string): Promise<IHabit> => {
    return post<IHabit>(`/api/habits/${habitId}/archive`);
  },

  /**
   * 取消归档习惯
   * @param habitId 习惯ID
   * @returns Promise<IHabit>
   */
  unarchiveHabit: (habitId: string): Promise<IHabit> => {
    return post<IHabit>(`/api/habits/${habitId}/unarchive`);
  },

  /**
   * 获取习惯统计数据
   * @param habitId 习惯ID
   * @returns Promise<IHabitStats>
   */
  getHabitStats: (habitId: string): Promise<IHabitStats> => {
    if (!habitId) {
      return Promise.reject(new Error('习惯ID不能为空'));
    }
    return get<IHabitStats>(`/api/habits/${habitId}/stats`);
  },

  /**
   * 获取习惯分类
   * @returns Promise<{ id: string; name: string; icon: string; }[]>
   */
  getCategories: () => {
    return get<{ id: string; name: string; icon: string; }[]>('/api/habits/categories');
  },

  /**
   * 获取习惯模板
   * @returns Promise<IHabit[]>
   */
  getTemplates: () => {
    return get<IHabit[]>('/api/habits/templates');
  },

  /**
   * 从模板创建习惯
   * @param templateId 模板ID
   * @returns Promise<IHabit>
   */
  createFromTemplate: (templateId: string) => {
    return post<IHabit>(`/api/habits/from-template/${templateId}`);
  }
}; 
 