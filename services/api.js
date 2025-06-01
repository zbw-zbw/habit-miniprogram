"use strict";
/**
 * API服务 (兼容层)
 * 这个文件是为了保持向后兼容，新代码应该直接使用services/api/目录下的模块化API
 * @deprecated 请使用services/api/目录下的模块化API
 */
exports.__esModule = true;
exports.settingsAPI = exports.notificationAPI = exports.communityAPI = exports.analyticsAPI = exports.checkinAPI = exports.habitAPI = exports.userAPI = exports.authAPI = void 0;
var index_1 = require("./api/index");
// 重导出各个模块的API
exports.authAPI = index_1["default"].auth;
exports.userAPI = index_1["default"].user;
exports.habitAPI = index_1["default"].habit;
exports.checkinAPI = index_1["default"].checkin;
exports.analyticsAPI = index_1["default"].analytics;
exports.communityAPI = index_1["default"].community;
exports.notificationAPI = index_1["default"].notification;
exports.settingsAPI = index_1["default"].settings;
// 默认导出所有API
exports["default"] = index_1["default"];
