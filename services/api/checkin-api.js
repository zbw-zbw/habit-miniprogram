"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkinAPI = void 0;
/**
 * 打卡相关API
 */
const request_1 = require("../../utils/request");
exports.checkinAPI = {
    /**
     * 获取打卡记录
     * @param params 查询参数
     * @returns Promise<ICheckin[]>
     */
    getCheckins: (params) => {
        return (0, request_1.get)('/api/checkins', params);
    },
    /**
     * 获取习惯打卡记录
     * @param habitId 习惯ID
     * @returns Promise<ICheckin[]>
     */
    getHabitCheckins: (habitId) => {
        return (0, request_1.get)(`/api/habits/${habitId}/checkins`);
    },
    /**
     * 获取单个打卡记录
     * @param id 打卡记录ID
     * @returns Promise<ICheckin>
     */
    getCheckin: (id) => {
        return (0, request_1.get)(`/api/checkins/${id}`);
    },
    /**
     * 创建打卡记录
     * @param checkinData 打卡数据
     * @returns Promise<ICheckin>
     */
    createCheckin: (checkinData) => {
        // 确保habitId或habit至少有一个
        if (!checkinData.habitId && !checkinData.habit) {
            return Promise.reject(new Error('习惯ID不能为空'));
        }
        // 将habitId复制到habit字段，以满足服务器端要求
        const data = { ...checkinData };
        if (!data.habit && data.habitId) {
            data.habit = data.habitId;
        }
        return (0, request_1.post)('/api/checkins', data);
    },
    /**
     * 创建打卡记录并返回相关统计数据（聚合API）
     * @param checkinData 打卡数据
     * @returns Promise<{checkin: ICheckin, stats: IHabitStats, habit: IHabit}>
     */
    createCheckinWithDetails: (checkinData) => {
        // 确保habitId或habit至少有一个
        if (!checkinData.habitId && !checkinData.habit) {
            return Promise.reject(new Error('习惯ID不能为空'));
        }
        // 将habitId复制到habit字段，以满足服务器端要求
        const data = { ...checkinData };
        if (!data.habit && data.habitId) {
            data.habit = data.habitId;
        }
        // 使用聚合API端点
        return (0, request_1.post)('/api/checkins/with-details', data);
    },
    /**
     * 更新打卡记录
     * @param id 打卡记录ID
     * @param checkin 打卡记录数据
     * @returns Promise<ICheckin>
     */
    updateCheckin: (id, checkin) => {
        return (0, request_1.put)(`/api/checkins/${id}`, checkin);
    },
    /**
     * 删除打卡记录
     * @param id 打卡记录ID
     * @returns Promise<void>
     */
    deleteCheckin: (id) => {
        return (0, request_1.del)(`/api/checkins/${id}`);
    }
};
