'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.userAPI = void 0;
/**
 * 用户相关API
 */
const request_1 = require('../../utils/request');
exports.userAPI = {
  /**
   * 获取当前用户信息
   * @returns Promise<IUserInfo>
   */
  getCurrentUser: () => {
    return (0, request_1.get)('/api/users/me');
  },
  /**
   * 更新用户资料
   * @param userData 用户数据
   * @returns Promise<IUserInfo>
   */
  updateProfile: (userData) => {
    return (0, request_1.put)('/api/users/me', userData);
  },
  /**
   * 更新用户头像
   * @param avatarFile 头像文件
   * @returns Promise<{avatarUrl: string}>
   */
  updateAvatar: (avatarFile) => {
    // 使用wx.uploadFile上传文件
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: 'http://localhost:3001/api/users/me/avatar',
        filePath: avatarFile,
        name: 'avatar',
        header: {
          Authorization: `Bearer ${wx.getStorageSync('token')}`,
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(res.data);
              resolve(data);
            } catch (error) {
              reject(new Error('上传头像失败：数据解析错误'));
            }
          } else {
            reject(new Error(`上传头像失败：${res.statusCode}`));
          }
        },
        fail: () => {
          reject(new Error('上传头像失败：网络错误'));
        },
      });
    });
  },
  /**
   * 获取用户成就
   * @returns Promise<Array<{id: string; title: string; description: string; icon: string; progress: number; isCompleted: boolean;}>>
   */
  getAchievements: () => {
    return (0, request_1.get)('/api/users/me/achievements').catch((error) => {
      console.error('获取用户成就失败:', error);
      return [];
    });
  },
  /**
   * 获取用户信息
   * @returns Promise<IUserInfo>
   */
  getUserInfo: () => {
    return (0, request_1.get)('/api/user/info');
  },
  /**
   * 更新用户信息
   * @param data 用户信息
   * @returns Promise<IUserInfo>
   */
  updateUserInfo: (data) => {
    return (0, request_1.put)('/api/user/info', data);
  },
};
