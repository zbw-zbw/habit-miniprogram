/**
 * 打卡相关API
 */
import { get, post, put, del } from '../../utils/request';

export const checkinAPI = {
  /**
   * 获取打卡记录
   * @param params 查询参数
   * @returns Promise<ICheckin[]>
   */
  getCheckins: (params?: {
    startDate?: string;
    endDate?: string;
    habitId?: string;
  }): Promise<ICheckin[]> => {
    return get<ICheckin[]>('/api/checkins', params);
  },

  /**
   * 获取习惯打卡记录
   * @param habitId 习惯ID
   * @returns Promise<ICheckin[]>
   */
  getHabitCheckins: (habitId: string): Promise<ICheckin[]> => {
    return get<ICheckin[]>(`/api/habits/${habitId}/checkins`);
  },

  /**
   * 获取单个打卡记录
   * @param id 打卡记录ID
   * @returns Promise<ICheckin>
   */
  getCheckin: (id: string): Promise<ICheckin> => {
    return get(`/api/checkins/${id}`);
  },
  
  /**
   * 创建打卡记录
   * @param checkinData 打卡数据
   * @returns Promise<ICheckin>
   */
  createCheckin: (checkinData: Partial<ICheckin> & { habitId?: string, habit?: string }): Promise<ICheckin> => {
    // 确保habitId或habit至少有一个
    if (!checkinData.habitId && !checkinData.habit) {
      return Promise.reject(new Error('习惯ID不能为空'));
    }
    
    // 将habitId复制到habit字段，以满足服务器端要求
    const data = { ...checkinData };
    if (!data.habit && data.habitId) {
      data.habit = data.habitId;
    }
    
    return post<ICheckin>('/api/checkins', data);
  },

  /**
   * 更新打卡记录
   * @param id 打卡记录ID
   * @param checkin 打卡记录数据
   * @returns Promise<ICheckin>
   */
  updateCheckin: (id: string, checkin: Partial<ICheckin>): Promise<ICheckin> => {
    return put(`/api/checkins/${id}`, checkin);
  },
  
  /**
   * 删除打卡记录
   * @param id 打卡记录ID
   * @returns Promise<void>
   */
  deleteCheckin: (id: string): Promise<void> => {
    return del(`/api/checkins/${id}`);
  }
}; 
