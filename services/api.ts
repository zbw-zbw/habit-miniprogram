/**
 * API服务 (兼容层)
 * 这个文件是为了保持向后兼容，新代码应该直接使用services/api/目录下的模块化API
 * @deprecated 请使用services/api/目录下的模块化API
 */

import apiModules from './api/index';

// 重导出各个模块的API
export const authAPI = apiModules.auth;
export const userAPI = apiModules.user;
export const habitAPI = apiModules.habit;
export const checkinAPI = apiModules.checkin;
export const analyticsAPI = apiModules.analytics;
export const communityAPI = apiModules.community;
export const notificationAPI = apiModules.notification;
export const settingsAPI = apiModules.settings;

// 默认导出所有API
export default apiModules; 
 