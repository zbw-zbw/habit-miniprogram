"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsAPI = void 0;
/**
 * 数据分析相关API
 */
const request_1 = require("../../utils/request");
exports.analyticsAPI = {
    /**
     * 获取仪表盘数据
     * @returns Promise<{habitCount: number; completedToday: number; streak: number; completion: number;}>
     */
    getDashboard: () => {
        return (0, request_1.get)('/api/analytics/dashboard');
    },
    /**
     * 获取完成率数据
     * @param params 查询参数
     * @returns Promise<{labels: string[]; data: number[]; average: number;}>
     */
    getCompletionRate: (params) => {
        return (0, request_1.get)('/api/analytics/completion-rate', params);
    },
    /**
     * 获取习惯统计数据
     * @param habitId 习惯ID
     * @returns Promise<{totalCompletions: number; completionRate: number; currentStreak: number; longestStreak: number; bestDayOfWeek: string; bestTimeOfDay: string;}>
     */
    getHabitStats: (habitId) => {
        return (0, request_1.get)(`/api/analytics/habits/${habitId}/stats`);
    },
    /**
     * 获取月度报告
     * @param params 查询参数
     * @returns Promise
     */
    getMonthlyReport: (params) => {
        return (0, request_1.get)('/api/analytics/monthly-report', params);
    },
    /**
     * 获取周报告
     * @param params 查询参数
     * @returns Promise
     */
    getWeeklyReport: (params) => {
        return (0, request_1.get)('/api/analytics/weekly-report', params);
    },
    /**
     * 获取综合报告数据
     * @returns Promise
     */
    getReport: () => {
        return (0, request_1.get)('/api/analytics/report');
    }
};
