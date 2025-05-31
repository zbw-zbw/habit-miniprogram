"use strict";
/**
 * API服务
 * 导出所有API模块
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsAPI = exports.notificationAPI = exports.communityAPI = exports.analyticsAPI = exports.checkinAPI = exports.habitAPI = exports.userAPI = exports.authAPI = void 0;
const auth_api_1 = require("./auth-api");
Object.defineProperty(exports, "authAPI", { enumerable: true, get: function () { return auth_api_1.authAPI; } });
const user_api_1 = require("./user-api");
Object.defineProperty(exports, "userAPI", { enumerable: true, get: function () { return user_api_1.userAPI; } });
const habit_api_1 = require("./habit-api");
Object.defineProperty(exports, "habitAPI", { enumerable: true, get: function () { return habit_api_1.habitAPI; } });
const checkin_api_1 = require("./checkin-api");
Object.defineProperty(exports, "checkinAPI", { enumerable: true, get: function () { return checkin_api_1.checkinAPI; } });
const analytics_api_1 = require("./analytics-api");
Object.defineProperty(exports, "analyticsAPI", { enumerable: true, get: function () { return analytics_api_1.analyticsAPI; } });
const community_api_1 = require("./community-api");
Object.defineProperty(exports, "communityAPI", { enumerable: true, get: function () { return community_api_1.communityAPI; } });
const notification_api_1 = require("./notification-api");
Object.defineProperty(exports, "notificationAPI", { enumerable: true, get: function () { return notification_api_1.notificationAPI; } });
const settings_api_1 = require("./settings-api");
Object.defineProperty(exports, "settingsAPI", { enumerable: true, get: function () { return settings_api_1.settingsAPI; } });
exports.default = {
    auth: auth_api_1.authAPI,
    user: user_api_1.userAPI,
    habit: habit_api_1.habitAPI,
    checkin: checkin_api_1.checkinAPI,
    analytics: analytics_api_1.analyticsAPI,
    community: community_api_1.communityAPI,
    notification: notification_api_1.notificationAPI,
    settings: settings_api_1.settingsAPI
};
