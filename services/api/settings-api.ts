/**
 * 设置相关API
 */
import { get, post, put, del } from '../../utils/request';

export const settingsAPI = {
  /**
   * 获取用户设置
   * @returns Promise<{theme: 'light' | 'dark' | 'system'; language: 'zh_CN' | 'en_US'; notification: boolean; sound: boolean; vibration: boolean;}>
   */
  getSettings: () => {
    return get<{
      theme: 'light' | 'dark' | 'system';
      language: 'zh_CN' | 'en_US';
      notification: boolean;
      sound: boolean;
      vibration: boolean;
    }>('/api/settings');
  },

  /**
   * 更新用户设置
   * @param settings 设置数据
   * @returns Promise<{ success: boolean }>
   */
  updateSettings: (settings: Partial<{
    theme: 'light' | 'dark' | 'system';
    language: 'zh_CN' | 'en_US';
    notification: boolean;
    sound: boolean;
    vibration: boolean;
  }>) => {
    return put<{ success: boolean }>('/api/settings', settings);
  }
}; 
