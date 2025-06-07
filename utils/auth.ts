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

  // 获取微信登录凭证
  wx.login({
    success: (loginRes) => {
      if (loginRes.code) {
        // 直接使用登录凭证进行登录，不再调用 getUserProfile
        // 由于微信限制，getUserProfile 只能由用户点击手势触发
        silentLogin(loginRes.code, callback);
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '登录失败',
          icon: 'error',
        });

        if (typeof callback === 'function') {
          callback(false);
        }
      }
    },
    fail: (err) => {
      console.error('wx.login 失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '登录失败',
        icon: 'error',
      });

      if (typeof callback === 'function') {
        callback(false);
      }
    },
  });
}

/**
 * 静默登录方法，不获取用户详细信息
 * @param code 微信登录凭证
 * @param callback 登录回调
 */
function silentLogin(
  code: string,
  callback?: (success: boolean) => void
): void {
  const app = getApp<IAppOption>();
  
  // 创建基础用户信息
  const userInfo = {
    id: 'temp_' + Date.now(),
    nickName: '微信用户',
    avatarUrl: '/assets/images/default-avatar.png',
    createdAt: new Date().toISOString(),
  } as IUserInfo;

  // 获取API基础URL
  const apiBaseUrl = app.globalData.apiBaseUrl || '';
  
  // 调用后端API进行登录
  wx.request({
    url: `${apiBaseUrl}/api/auth/wx-login`,
    method: 'POST',
    data: {
      code: code,
      userInfo: userInfo,
    },
    success: (res: any) => {
      if (res.statusCode === 200 && res.data && res.data.success) {
        // 保存令牌和用户信息
        const responseData = res.data.data;
        app.globalData.token = responseData.token;
        app.globalData.refreshToken = responseData.refreshToken || null;
        app.globalData.userInfo = responseData.user;
        app.globalData.hasLogin = true;
        app.globalData.lastLoginTime = Date.now(); // 记录登录时间戳

        // 保存到本地存储
        try {
          wx.setStorageSync('token', app.globalData.token);
          if (app.globalData.refreshToken) {
            wx.setStorageSync('refreshToken', app.globalData.refreshToken);
          }
          wx.setStorageSync('userInfo', app.globalData.userInfo);
        } catch (e) {
          console.error('保存登录信息失败:', e);
        }

        // 通知登录状态变化
        app.notifyLoginStateChanged();

        wx.showToast({
          title: '登录成功',
          icon: 'success',
        });

        // 不再需要在这里刷新页面数据
        // 因为通过notifyLoginStateChanged已经触发了onLoginStateChange
        // 而onLoginStateChange中会根据需要调用loadData
        // app.refreshCurrentPageData && app.refreshCurrentPageData();

        if (callback) {
          callback(true);
        }
      } else {
        console.error('后端登录接口返回错误:', res);
        wx.showToast({
          title: '登录失败',
          icon: 'error',
        });

        if (callback) {
          callback(false);
        }
      }
    },
    fail: (err) => {
      console.error('请求后端登录接口失败:', err);
      wx.showToast({
        title: '登录失败',
        icon: 'error',
      });

      if (callback) {
        callback(false);
      }
    },
    complete: () => {
      wx.hideLoading();
    },
  });
}

/**
 * 获取用户信息并登录（保留但不再使用，仅用于参考）
 * 由于微信限制，getUserProfile 只能由用户点击手势触发
 * @param code 微信登录凭证
 * @param callback 登录回调
 */
function getUserProfile(
  code: string,
  callback?: (success: boolean) => void
): void {
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

      // 获取API基础URL
      const apiBaseUrl = app.globalData.apiBaseUrl || '';
      
      // 调用后端API进行登录
      wx.request({
        url: `${apiBaseUrl}/api/auth/wx-login`,
        method: 'POST',
        data: {
          code: code,
          userInfo: userInfo,
        },
        success: (res: any) => {
          if (res.statusCode === 200 && res.data && res.data.success) {
            // 保存令牌和用户信息
            const responseData = res.data.data;
            app.globalData.token = responseData.token;
            app.globalData.refreshToken = responseData.refreshToken || null;
            app.globalData.userInfo = responseData.user;
            app.globalData.hasLogin = true;

            // 保存到本地存储
            try {
              wx.setStorageSync('token', app.globalData.token);
              if (app.globalData.refreshToken) {
                wx.setStorageSync('refreshToken', app.globalData.refreshToken);
              }
              wx.setStorageSync('userInfo', app.globalData.userInfo);
            } catch (e) {
              console.error('保存登录信息失败:', e);
            }

            // 通知登录状态变化
            app.notifyLoginStateChanged();

            wx.showToast({
              title: '登录成功',
              icon: 'success',
            });

            // 刷新当前页面数据
            app.refreshCurrentPageData && app.refreshCurrentPageData();

            if (callback) {
              callback(true);
            }
          } else {
            console.error('后端登录接口返回错误:', res);
            wx.showToast({
              title: '登录失败',
              icon: 'error',
            });

            if (callback) {
              callback(false);
            }
          }
        },
        fail: (err) => {
          console.error('请求后端登录接口失败:', err);
          wx.showToast({
            title: '登录失败',
            icon: 'error',
          });

          if (callback) {
            callback(false);
          }
        },
        complete: () => {
          wx.hideLoading();
        },
      });
    },
    fail: (err) => {
      console.error('wx.getUserProfile 失败:', err);
      wx.hideLoading();
      
      // 根据错误类型提供更具体的提示
      if (err.errMsg && err.errMsg.includes('cancel')) {
      wx.showToast({
        title: '已取消',
        icon: 'none',
      });
      } else {
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'error',
        });
      }

      if (callback) {
        callback(false);
      }
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
