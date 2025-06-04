"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.habitAPI = void 0;
/**
 * 习惯相关API
 */
const request_1 = require("../../utils/request");
exports.habitAPI = {
    /**
     * 获取所有习惯
     * @param params 查询参数
     * @returns Promise<IHabit[]>
     */
    getHabits: (params) => {
        return (0, request_1.get)('/api/habits', params);
    },
    /**
     * 获取习惯详情
     * @param habitId 习惯ID
     * @returns Promise<IHabit>
     */
    getHabit: (habitId) => {
        return (0, request_1.get)(`/api/habits/${habitId}`);
    },
    /**
     * 获取习惯详情及统计数据（聚合API）
     * @param habitId 习惯ID
     * @returns Promise<{habit: IHabit, stats: IHabitStats}>
     */
    getHabitWithStats: (habitId) => {
        return (0, request_1.get)(`/api/habits/${habitId}/with-stats`);
    },
    /**
     * 获取多个习惯及其统计数据（聚合API）
     * @param params 查询参数
     * @returns Promise<{habits: IHabitWithStats[]}>
     */
    getHabitsWithStats: (params) => {
        return (0, request_1.get)('/api/habits/with-stats', params);
    },
    /**
     * 创建习惯
     * @param habitData 习惯数据
     * @returns Promise<IHabit>
     */
    createHabit: (habitData) => {
        return (0, request_1.post)('/api/habits', habitData);
    },
    /**
     * 更新习惯
     * @param habitId 习惯ID
     * @param habitData 习惯数据
     * @returns Promise<IHabit>
     */
    updateHabit: (habitId, habitData) => {
        return (0, request_1.put)(`/api/habits/${habitId}`, habitData);
    },
    /**
     * 删除习惯
     * @param habitId 习惯ID
     * @returns Promise<void>
     */
    deleteHabit: (habitId) => {
        return (0, request_1.del)(`/api/habits/${habitId}`).then(() => undefined);
    },
    /**
     * 归档习惯
     * @param habitId 习惯ID
     * @returns Promise<IHabit>
     */
    archiveHabit: (habitId) => {
        return (0, request_1.post)(`/api/habits/${habitId}/archive`);
    },
    /**
     * 取消归档习惯
     * @param habitId 习惯ID
     * @returns Promise<IHabit>
     */
    unarchiveHabit: (habitId) => {
        return (0, request_1.post)(`/api/habits/${habitId}/unarchive`);
    },
    /**
     * 获取习惯统计数据
     * @param habitId 习惯ID
     * @returns Promise<IHabitStats>
     */
    getHabitStats: (habitId) => {
        if (!habitId) {
            return Promise.reject(new Error('习惯ID不能为空'));
        }
        return (0, request_1.get)(`/api/habits/${habitId}/stats`);
    },
    /**
     * 获取习惯分类
     * @returns Promise<{ id: string; name: string; icon: string; }[]>
     */
    getCategories: () => {
        return (0, request_1.get)('/api/habits/categories');
    },
    /**
     * 获取习惯模板
     * @returns Promise<IHabit[]>
     */
    getTemplates: () => {
        return (0, request_1.get)('/api/habits/templates');
    },
    /**
     * 从模板创建习惯
     * @param templateId 模板ID
     * @returns Promise<IHabit>
     */
    createFromTemplate: (templateId) => {
        return (0, request_1.post)(`/api/habits/from-template/${templateId}`);
    }
};
