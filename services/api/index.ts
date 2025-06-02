/**
 * API服务
 * 导出所有API模块
 */

import { authAPI } from './auth-api';
import { userAPI } from './user-api';
import { habitAPI } from './habit-api';
import { checkinAPI } from './checkin-api';
import { analyticsAPI } from './analytics-api';
import { communityAPI } from './community-api';
import { notificationAPI } from './notification-api';
import { settingsAPI } from './settings-api';
import { dashboardAPI } from './dashboard';
import { messageAPI } from './message-api';

export {
  authAPI,
  userAPI,
  habitAPI,
  checkinAPI,
  analyticsAPI,
  communityAPI,
  notificationAPI,
  settingsAPI,
  dashboardAPI,
  messageAPI
};

export default {
  auth: authAPI,
  user: userAPI,
  habit: habitAPI,
  checkin: checkinAPI,
  analytics: analyticsAPI,
  community: communityAPI,
  notification: notificationAPI,
  settings: settingsAPI,
  dashboard: dashboardAPI,
  message: messageAPI
}; 

// 导出API服务
// export * from './habit';
// export * from './checkin';
// export * from './user';
// export * from './dashboard'; 
