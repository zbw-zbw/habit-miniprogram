"use strict";
exports.__esModule = true;
exports.dashboardAPI = void 0;
/**
 * 仪表盘数据API服务
 * 聚合所有前端需要的数据，减少网络请求
 *
 * 后端已实现聚合API端点：
 * 1. `/api/dashboard` - 获取仪表盘数据
 * 2. `/api/habits/all` - 获取所有习惯数据
 * 3. `/api/analytics` - 获取分析数据
 */
var request_1 = require("../../utils/request");
var date_1 = require("../../utils/date");
/**
 * 仪表盘API
 */
exports.dashboardAPI = {
    /**
     * 获取仪表盘数据
     * 聚合了习惯、打卡记录和统计数据
     * @param date 日期，默认为今天
     * @param options 附加选项
     * @returns 仪表盘数据
     */
    getDashboard: function (date, options) {
        if (date === void 0) { date = (0, date_1.getCurrentDate)(); }
        if (options === void 0) { options = {}; }
        var _a = options.includeCheckins, includeCheckins = _a === void 0 ? true : _a, _b = options.days, days = _b === void 0 ? 7 : _b;
        // 使用后端聚合API
        return (0, request_1.request)({
            url: '/api/dashboard',
            method: 'GET',
            data: {
                date: date,
                days: includeCheckins ? days : 0
            }
        }).then(function (response) {
            // 确保返回的数据符合接口定义
            // 这里已经得到的是response.data，因为request模块已经处理过了
            if (typeof response === 'object' && response !== null) {
                return response.data || response;
            }
            return response;
        });
    },
    /**
     * 获取所有习惯列表（为习惯页面专门设计）
     * 包括所有历史习惯，不限于今天需要执行的习惯
     * @param options 可选参数
     * @returns 所有习惯及相关数据
     */
    getAllHabits: function (options) {
        if (options === void 0) { options = {}; }
        var _a = options.includeArchived, includeArchived = _a === void 0 ? true : _a, _b = options.includeStats, includeStats = _b === void 0 ? true : _b, _c = options.includeCheckins, includeCheckins = _c === void 0 ? false : _c, _d = options.days, days = _d === void 0 ? 7 : _d;
        // 使用后端聚合API
        return (0, request_1.request)({
            url: '/api/habits',
            method: 'GET',
            data: {
                includeArchived: includeArchived,
                includeStats: includeStats,
                includeCheckins: includeCheckins,
                days: days
            }
        }).then(function (response) {
            // 确保返回的数据符合接口定义
            if (typeof response === 'object' && response !== null) {
                return response.data || response;
            }
            return response;
        });
    },
    /**
     * 获取分析数据（专为分析页面设计）
     * @param options 可选参数
     * @returns 分析数据
     */
    getAnalytics: function (options) {
        if (options === void 0) { options = {}; }
        var _a = options.startDate, startDate = _a === void 0 ? (0, date_1.formatDate)(new Date(new Date().setMonth(new Date().getMonth() - 1))) : _a, _b = options.endDate, endDate = _b === void 0 ? (0, date_1.getCurrentDate)() : _b, _c = options.timeRange, timeRange = _c === void 0 ? 'month' : _c;
        // 使用后端聚合API
        return (0, request_1.request)({
            url: '/api/analytics',
            method: 'GET',
            data: {
                startDate: startDate,
                endDate: endDate,
                timeRange: timeRange
            }
        }).then(function (response) {
            // 确保返回的数据符合接口定义
            if (typeof response === 'object' && response !== null) {
                return response.data || response;
            }
            return response;
        });
    }
};
