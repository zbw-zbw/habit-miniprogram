"use strict";
/**
 * API服务
 * 导出所有API模块
 */
exports.__esModule = true;
exports.dashboardAPI = exports.settingsAPI = exports.notificationAPI = exports.communityAPI = exports.analyticsAPI = exports.checkinAPI = exports.habitAPI = exports.userAPI = exports.authAPI = void 0;
var auth_api_1 = require("./auth-api");
exports.authAPI = auth_api_1.authAPI;
var user_api_1 = require("./user-api");
exports.userAPI = user_api_1.userAPI;
var habit_api_1 = require("./habit-api");
exports.habitAPI = habit_api_1.habitAPI;
var checkin_api_1 = require("./checkin-api");
exports.checkinAPI = checkin_api_1.checkinAPI;
var analytics_api_1 = require("./analytics-api");
exports.analyticsAPI = analytics_api_1.analyticsAPI;
var community_api_1 = require("./community-api");
exports.communityAPI = community_api_1.communityAPI;
var notification_api_1 = require("./notification-api");
exports.notificationAPI = notification_api_1.notificationAPI;
var settings_api_1 = require("./settings-api");
exports.settingsAPI = settings_api_1.settingsAPI;
var dashboard_1 = require("./dashboard");
exports.dashboardAPI = dashboard_1.dashboardAPI;
exports["default"] = {
    auth: auth_api_1.authAPI,
    user: user_api_1.userAPI,
    habit: habit_api_1.habitAPI,
    checkin: checkin_api_1.checkinAPI,
    analytics: analytics_api_1.analyticsAPI,
    community: community_api_1.communityAPI,
    notification: notification_api_1.notificationAPI,
    settings: settings_api_1.settingsAPI,
    dashboard: dashboard_1.dashboardAPI
};
// 导出API服务
// export * from './habit';
// export * from './checkin';
// export * from './user';
// export * from './dashboard'; 
