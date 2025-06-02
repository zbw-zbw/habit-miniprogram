"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationAPI = void 0;
/**
 * 通知API服务
 */
const request_1 = require("../../utils/request");
exports.notificationAPI = {
    /**
     * 获取通知列表
     * @param params 查询参数
     * @returns Promise<{notifications: any[], pagination: any, unreadCount: number}>
     */
    getNotifications: (params) => {
        return (0, request_1.get)('/api/notifications', params);
    },
    /**
     * 标记通知为已读
     * @param id 通知ID
     * @returns Promise<{success: boolean}>
     */
    markAsRead: (id) => {
        return (0, request_1.put)(`/api/notifications/${id}/read`, {});
    },
    /**
     * 标记所有通知为已读
     * @param type 可选的通知类型
     * @returns Promise<{success: boolean, modifiedCount: number}>
     */
    markAllAsRead: (type) => {
        return (0, request_1.put)('/api/notifications/read-all', { type });
    },
    /**
     * 删除通知
     * @param id 通知ID
     * @returns Promise<{success: boolean}>
     */
    deleteNotification: (id) => {
        return (0, request_1.del)(`/api/notifications/${id}`);
    }
};
