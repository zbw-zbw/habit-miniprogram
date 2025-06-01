"use strict";
exports.__esModule = true;
exports.habitAPI = void 0;
/**
 * 习惯相关API
 */
var request_1 = require("../../utils/request");
exports.habitAPI = {
    /**
     * 获取所有习惯
     * @param params 查询参数
     * @returns Promise<IHabit[]>
     */
    getHabits: function (params) {
        return (0, request_1.get)('/api/habits', params);
    },
    /**
     * 获取习惯详情
     * @param habitId 习惯ID
     * @returns Promise<IHabit>
     */
    getHabit: function (habitId) {
        return (0, request_1.get)("/api/habits/".concat(habitId));
    },
    /**
     * 创建习惯
     * @param habitData 习惯数据
     * @returns Promise<IHabit>
     */
    createHabit: function (habitData) {
        return (0, request_1.post)('/api/habits', habitData);
    },
    /**
     * 更新习惯
     * @param habitId 习惯ID
     * @param habitData 习惯数据
     * @returns Promise<IHabit>
     */
    updateHabit: function (habitId, habitData) {
        return (0, request_1.put)("/api/habits/".concat(habitId), habitData);
    },
    /**
     * 删除习惯
     * @param habitId 习惯ID
     * @returns Promise<void>
     */
    deleteHabit: function (habitId) {
        return (0, request_1.del)("/api/habits/".concat(habitId)).then(function () { return undefined; });
    },
    /**
     * 归档习惯
     * @param habitId 习惯ID
     * @returns Promise<IHabit>
     */
    archiveHabit: function (habitId) {
        return (0, request_1.post)("/api/habits/".concat(habitId, "/archive"));
    },
    /**
     * 取消归档习惯
     * @param habitId 习惯ID
     * @returns Promise<IHabit>
     */
    unarchiveHabit: function (habitId) {
        return (0, request_1.post)("/api/habits/".concat(habitId, "/unarchive"));
    },
    /**
     * 获取习惯统计数据
     * @param habitId 习惯ID
     * @returns Promise<IHabitStats>
     */
    getHabitStats: function (habitId) {
        if (!habitId) {
            return Promise.reject(new Error('习惯ID不能为空'));
        }
        return (0, request_1.get)("/api/habits/".concat(habitId, "/stats"));
    },
    /**
     * 获取习惯分类
     * @returns Promise<{ id: string; name: string; icon: string; }[]>
     */
    getCategories: function () {
        return (0, request_1.get)('/api/habits/categories');
    },
    /**
     * 获取习惯模板
     * @returns Promise<IHabit[]>
     */
    getTemplates: function () {
        return (0, request_1.get)('/api/habits/templates');
    },
    /**
     * 从模板创建习惯
     * @param templateId 模板ID
     * @returns Promise<IHabit>
     */
    createFromTemplate: function (templateId) {
        return (0, request_1.post)("/api/habits/from-template/".concat(templateId));
    }
};
