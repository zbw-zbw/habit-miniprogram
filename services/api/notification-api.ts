/**
 * 通知相关API
 */
import { get, post, put, del } from '../../utils/request';

export const notificationAPI = {
  /**
   * 获取通知列表
   * @param params 查询参数
   * @returns Promise<{notifications: INotification[]; total: number; unread: number;}>
   */
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    type?: 'like' | 'comment' | 'follow' | 'challenge' | 'system';
  }) => {
    return get<{
      notifications: INotification[];
      total: number;
      unread: number;
    }>('/api/notifications', params);
  },

  /**
   * 标记通知为已读
   * @param notificationId 通知ID
   * @returns Promise<{ success: boolean }>
   */
  markAsRead: (notificationId: string) => {
    return put<{ success: boolean }>(`/api/notifications/${notificationId}/read`);
  },

  /**
   * 标记所有通知为已读
   * @returns Promise<{ success: boolean }>
   */
  markAllAsRead: () => {
    return put<{ success: boolean }>('/api/notifications/read-all');
  },

  /**
   * 删除通知
   * @param notificationId 通知ID
   * @returns Promise<{ success: boolean }>
   */
  deleteNotification: (notificationId: string) => {
    return del<{ success: boolean }>(`/api/notifications/${notificationId}`);
  }
}; 
