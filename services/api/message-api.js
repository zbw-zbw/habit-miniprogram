"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageAPI = exports.MessageType = void 0;
/**
 * 消息相关API
 */
const request_1 = require("../../utils/request");
/**
 * 消息类型
 */
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["VOICE"] = "voice";
    MessageType["LOCATION"] = "location";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
/**
 * 消息API服务
 */
exports.messageAPI = {
    /**
     * 获取聊天会话列表
     * @returns Promise<IChatSession[]>
     */
    getChatSessions: () => {
        return (0, request_1.get)('/api/messages/sessions');
    },
    /**
     * 获取聊天消息列表
     * @param sessionId 会话ID或用户ID
     * @returns Promise<IMessage[]>
     */
    getChatMessages: (sessionId) => {
        return (0, request_1.get)(`/api/messages/${sessionId}`);
    },
    /**
     * 获取新消息
     * @param sessionId 会话ID或用户ID
     * @param lastTime 最后一条消息的时间戳
     * @returns Promise<IMessage[]>
     */
    getNewMessages: (sessionId, lastTime) => {
        return (0, request_1.get)(`/api/messages/${sessionId}/new`, { lastTime });
    },
    /**
     * 发送消息
     * @param params 消息参数
     * @returns Promise<IMessage>
     */
    sendMessage: (params) => {
        return (0, request_1.post)('/api/messages/send', params);
    },
    /**
     * 上传图片
     * @param filePath 文件路径
     * @returns Promise<string> 图片URL
     */
    uploadImage: (filePath) => {
        return (0, request_1.upload)('/api/upload/image', filePath, {
            name: 'file',
            formData: {
                type: 'message'
            }
        }).then((result) => {
            // 确保返回的是完整URL
            if (typeof result === 'string') {
                return result;
            }
            else if (result && result.url) {
                return result.url;
            }
            else if (result && result.data && result.data.url) {
                return result.data.url;
            }
            else if (result && result.data) {
                return result.data;
            }
            // 如果无法获取URL，返回原始临时路径
            return filePath;
        });
    },
    /**
     * 获取用户信息
     * @param userId 用户ID
     * @returns Promise<any>
     */
    getUserInfo: (userId) => {
        return (0, request_1.get)(`/api/users/${userId}`);
    },
    /**
     * 标记消息为已读
     * @param sessionId 会话ID
     * @returns Promise<{success: boolean}>
     */
    markAsRead: (sessionId) => {
        return (0, request_1.post)(`/api/messages/${sessionId}/read`);
    },
    /**
     * 删除聊天会话
     * @param sessionId 会话ID
     * @returns Promise<{success: boolean}>
     */
    deleteSession: (sessionId) => {
        return (0, request_1.post)(`/api/messages/sessions/${sessionId}/delete`);
    },
    /**
     * 获取当前用户信息（调试用）
     * @returns Promise<{id: string, username: string, nickname: string}>
     */
    getCurrentUserInfo: () => {
        return (0, request_1.get)('/api/messages/debug/user-info');
    }
};
