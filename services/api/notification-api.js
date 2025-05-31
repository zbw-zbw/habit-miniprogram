"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationAPI = void 0;
/**
 * 通知相关API
 */
const request_1 = require("../../utils/request");
exports.notificationAPI = {
    /**
     * 获取通知列表
     * @param params 查询参数
     * @returns Promise<{notifications: INotification[]; total: number; unread: number;}>
     */
    getNotifications: (params) => {
        return (0, request_1.get)('/api/notifications', params);
    },
    /**
     * 标记通知为已读
     * @param notificationId 通知ID
     * @returns Promise<{ success: boolean }>
     */
    markAsRead: (notificationId) => {
        return (0, request_1.put)(`/api/notifications/${notificationId}/read`);
    },
    /**
     * 标记所有通知为已读
     * @returns Promise<{ success: boolean }>
     */
    markAllAsRead: () => {
        return (0, request_1.put)('/api/notifications/read-all');
    },
    /**
     * 删除通知
     * @param notificationId 通知ID
     * @returns Promise<{ success: boolean }>
     */
    deleteNotification: (notificationId) => {
        return (0, request_1.del)(`/api/notifications/${notificationId}`);
    }
};
