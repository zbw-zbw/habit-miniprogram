/**
 * 用户认证相关工具函数
 */
import { IUserInfo, IAppOption } from './types';

/**
 * 统一登录方法
 * @param callback 登录成功或失败的回调函数
 */
export function login(callback?: (success: boolean) => void): void {
  wx.showLoading({
    title: '登录中',
  });

  // 获取用户信息
  wx.getUserProfile({
    desc: '用于完善用户资料',
    success: (res) => {
      const app = getApp<IAppOption>();
      // 添加ID属性以满足IUserInfo接口要求
      const userInfo = {
        ...res.userInfo,
        id: 'temp_' + Date.now(),
        createdAt: new Date().toISOString(), // 添加必需的createdAt字段
        nickName: res.userInfo.nickName, // 确保使用正确的属性名
      } as IUserInfo;

      app.login(userInfo, (success) => {
        if (success) {
          wx.showToast({
            title: '登录成功',
            icon: 'success',
          });
        } else {
          wx.showToast({
            title: '登录失败',
            icon: 'error',
          });
        }
        
        // 调用回调函数传递登录结果
        if (typeof callback === 'function') {
          callback(success);
        }
      });
    },
    fail: () => {
      wx.showToast({
        title: '已取消',
        icon: 'none',
      });
      
      // 调用回调函数并传递失败结果
      if (typeof callback === 'function') {
        callback(false);
      }
    },
    complete: () => {
      wx.hideLoading();
    },
  });
}

/**
 * 退出登录
 * @param callback 登出后的回调函数
 */
export function logout(callback?: () => void): void {
  wx.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        const app = getApp<IAppOption>();
        app.logout(() => {
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
          });
          
          // 调用回调函数
          if (typeof callback === 'function') {
            callback();
          }
        });
      }
    },
  });
} 
