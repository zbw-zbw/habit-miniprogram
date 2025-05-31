"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsAPI = void 0;
/**
 * 设置相关API
 */
const request_1 = require("../../utils/request");
exports.settingsAPI = {
    /**
     * 获取用户设置
     * @returns Promise<{theme: 'light' | 'dark' | 'system'; language: 'zh_CN' | 'en_US'; notification: boolean; sound: boolean; vibration: boolean;}>
     */
    getSettings: () => {
        return (0, request_1.get)('/api/settings');
    },
    /**
     * 更新用户设置
     * @param settings 设置数据
     * @returns Promise<{ success: boolean }>
     */
    updateSettings: (settings) => {
        return (0, request_1.put)('/api/settings', settings);
    }
};
