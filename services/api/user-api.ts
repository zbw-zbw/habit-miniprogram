/**
 * 用户相关API
 */
import { get, post, put, del } from '../../utils/request';
import { IUserInfo, IUserProfileAll } from '../../utils/types';

export const userAPI = {
  /**
   * 获取当前用户信息
   * @returns Promise<IUserInfo>
   */
  getCurrentUser: () => {
    return get<IUserInfo>('/api/users/me');
  },

  /**
   * 更新用户资料
   * @param userData 用户数据
   * @returns Promise<IUserInfo>
   */
  updateProfile: (userData: Partial<IUserInfo>) => {
    return put<IUserInfo>('/api/users/me', userData);
  },

  /**
   * 更新用户头像
   * @param avatarFile 头像文件
   * @returns Promise<{avatarUrl: string}>
   */
  updateAvatar: (avatarFile: WechatMiniprogram.UploadFileOption['filePath']) => {
    // 获取API基础URL
    const app = getApp<IAppOption>();
    const apiBaseUrl = app.globalData.apiBaseUrl;
    
    // 使用wx.uploadFile上传文件
    return new Promise<{ avatarUrl: string }>((resolve, reject) => {
      wx.uploadFile({
        url: `${apiBaseUrl}/api/users/me/avatar`,
        filePath: avatarFile,
        name: 'avatar',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
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
        }
      });
    });
  },

  /**
   * 获取用户成就
   * @returns Promise<Array<{id: string; title: string; description: string; icon: string; progress: number; isCompleted: boolean;}>>
   */
  getAchievements: () => {
    return get<Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      progress: number;
      isCompleted: boolean;
    }>>('/api/users/me/achievements');
  },

  /**
   * 获取用户信息
   * @returns Promise<IUserInfo>
   */
  getUserInfo: (): Promise<IUserInfo> => {
    return get('/api/user/info');
  },
  
  /**
   * 更新用户信息
   * @param data 用户信息
   * @returns Promise<IUserInfo>
   */
  updateUserInfo: (data: Partial<IUserInfo>): Promise<IUserInfo> => {
    return put('/api/user/info', data);
  },
  
  /**
   * 获取用户资料聚合数据（包括基本信息、统计数据和成就）
   * @returns Promise<IUserProfileAll>
   */
  getProfileAll: () => {
    return get<IUserProfileAll>('/api/users/profile/all');
  }
}; 
