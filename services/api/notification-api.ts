/**
 * 通知API服务
 */
import { get, post, put, del } from '../../utils/request';

export const notificationAPI = {
  /**
   * 获取通知列表
   * @param params 查询参数
   * @returns Promise<{notifications: any[], pagination: any, unreadCount: number}>
   */
  getNotifications: (params?: { page?: number, limit?: number, type?: string }): Promise<{notifications: any[], pagination: any, unreadCount: number}> => {
    return get('/api/notifications', params);
  },

  /**
   * 标记通知为已读
   * @param id 通知ID
   * @returns Promise<{success: boolean}>
   */
  markAsRead: (id: string): Promise<{success: boolean}> => {
    return put(`/api/notifications/${id}/read`, {});
  },

  /**
   * 标记所有通知为已读
   * @param type 可选的通知类型
   * @returns Promise<{success: boolean, modifiedCount: number}>
   */
  markAllAsRead: (type?: string): Promise<{success: boolean, modifiedCount: number}> => {
    return put('/api/notifications/read-all', { type });
  },

  /**
   * 删除通知
   * @param id 通知ID
   * @returns Promise<{success: boolean}>
   */
  deleteNotification: (id: string): Promise<{success: boolean}> => {
    return del(`/api/notifications/${id}`);
  }
}; 
