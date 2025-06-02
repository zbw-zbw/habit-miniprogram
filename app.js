/**
 * 习惯打卡小程序应用入口
 */
App({
  /**
   * 全局数据
   */
  globalData: {
    userInfo: null,
    hasLogin: false,
    systemInfo: null,
    theme: 'light',
    version: '0.1.0',
    unlockedAchievement: null,
    showAchievementUnlock: false,
    apiBaseUrl: 'http://localhost:3000', // API服务基础URL
    apiAvailable: false, // API服务是否可用
    token: null, // 用户认证令牌
    refreshToken: null // 刷新令牌
  },
  
  // 成就解锁回调函数
  achievementUnlockCallbacks: [],
  
  // 主题变化回调函数
  themeChangeCallbacks: [],

  // 登录状态变化回调函数
  loginStateChangeCallbacks: [],

  /**
   * 当小程序初始化完成时触发
   */
  onLaunch() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    
    // 检查更新
    this.checkUpdate();
    
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'development-xxx', // 替换为实际环境ID
        traceUser: true,
      });
    }
    
    // 从本地存储加载令牌
    this.loadTokenFromStorage();
    
    // 设置API服务始终可用，不再使用本地数据
    this.globalData.apiAvailable = true;
    
    // 检查API服务是否可用
    this.checkApiAvailability();
    
    // 初始化同步管理器
    this.initSyncManager();
  },
  
  /**
   * 当小程序从后台进入前台显示时触发
   */
  onShow() {
    // 从本地存储加载令牌
    this.loadTokenFromStorage();
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 设置API服务始终可用
    this.globalData.apiAvailable = true;
    
    // 如果有令牌，验证令牌有效性
    if (this.globalData.token) {
      this.verifyToken();
    }
  },
  
  /**
   * 从本地存储加载令牌
   */
  loadTokenFromStorage() {
    try {
      const token = wx.getStorageSync('token');
      const refreshToken = wx.getStorageSync('refreshToken');
      
      if (token) {
        this.globalData.token = token;
      }
      
      if (refreshToken) {
        this.globalData.refreshToken = refreshToken;
      }
    } catch (e) {
      console.error('加载令牌失败:', e);
    }
  },
  
  /**
   * 检查API服务可用性
   */
  checkApiAvailability() {
      wx.request({
        url: `${this.globalData.apiBaseUrl}/api/health`,
        method: 'GET',
      timeout: 3000,
        success: (res) => {
          if (res.statusCode === 200) {
            console.log('API服务可用:', res.data);
            this.globalData.apiAvailable = true;
          } else {
          console.warn('API服务响应异常:', res.statusCode);
          // 即使API服务响应异常，也保持apiAvailable为true，强制使用服务器数据
          this.globalData.apiAvailable = true;
          }
        },
        fail: (err) => {
        console.error('API服务请求失败:', err);
        // 即使API服务请求失败，也保持apiAvailable为true，强制使用服务器数据
        this.globalData.apiAvailable = true;
        }
      });
  },
  
  /**
   * 验证令牌有效性
   */
  verifyToken() {
    wx.request({
      url: `${this.globalData.apiBaseUrl}/api/auth/verify-token`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          console.log('令牌有效');
          
          // 如果服务器返回了用户信息，更新本地用户信息
          if (res.data && res.data.success && res.data.data && res.data.data.user) {
            this.globalData.userInfo = res.data.data.user;
            this.globalData.hasLogin = true;
            
            // 保存到本地存储
            try {
              wx.setStorageSync('userInfo', this.globalData.userInfo);
            } catch (e) {
              console.error('保存用户信息失败:', e);
            }
          }
        } else if (res.statusCode === 401) {
          console.log('令牌已过期，尝试刷新');
          this.refreshAuthToken();
        } else if (res.statusCode === 404) {
          // 如果API端点不存在，假设令牌有效，记录警告但不清除登录状态
          console.warn('验证令牌API端点不存在(404)，假设令牌有效');
        } else {
          console.warn('验证令牌失败:', res.statusCode);
          this.clearAuthData();
        }
      },
      fail: (err) => {
        console.error('验证令牌请求失败:', err);
      }
    });
  },
  
  /**
   * 刷新认证令牌
   */
  refreshAuthToken() {
    if (!this.globalData.refreshToken) {
      console.error('没有可用的刷新令牌');
      this.clearAuthData();
      return;
    }
    
    wx.request({
      url: `${this.globalData.apiBaseUrl}/api/auth/refresh-token`,
      method: 'POST',
      data: {
        refreshToken: this.globalData.refreshToken
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.token) {
          console.log('令牌刷新成功');
          this.globalData.token = res.data.token;
          
          if (res.data.refreshToken) {
            this.globalData.refreshToken = res.data.refreshToken;
          }
          
          // 保存到本地存储
          try {
            wx.setStorageSync('token', this.globalData.token);
            if (res.data.refreshToken) {
              wx.setStorageSync('refreshToken', this.globalData.refreshToken);
            }
          } catch (e) {
            console.error('保存令牌失败:', e);
          }
        } else {
          console.warn('刷新令牌失败:', res.statusCode);
          this.clearAuthData();
        }
      },
      fail: (err) => {
        console.error('刷新令牌请求失败:', err);
        this.clearAuthData();
      }
    });
  },
  
  /**
   * 清除认证数据
   */
  clearAuthData() {
    this.globalData.token = null;
    this.globalData.refreshToken = null;
    this.globalData.userInfo = null;
    this.globalData.hasLogin = false;
    
    // 清除本地存储
    try {
      wx.removeStorageSync('token');
      wx.removeStorageSync('refreshToken');
      wx.removeStorageSync('userInfo');
    } catch (e) {
      console.error('清除本地存储失败:', e);
    }
  },
  
  /**
   * 显示API服务不可用提示
   */
  showApiUnavailableMessage() {
    wx.showToast({
      title: 'API服务不可用，将使用本地数据',
      icon: 'none',
      duration: 3000
    });
  },
  
  /**
   * 初始化成就服务
   */
  initAchievementService() {
    // 导入成就服务
    const { achievementService } = require('./utils/achievement');
    
    // 初始化成就服务
    achievementService.init();
    
    // 注册成就解锁回调
    achievementService.onAchievementUnlock(this.onAchievementUnlocked.bind(this));
  },
  
  /**
   * 成就解锁处理函数
   * 当成就被解锁时，此方法会被成就服务调用
   */
  onAchievementUnlocked(achievement) {
    console.log('成就解锁:', achievement);
    
    // 保存解锁的成就
    this.globalData.unlockedAchievement = achievement;
    
    // 显示成就解锁通知
    this.showAchievementUnlockNotification(achievement);
    
    // 调用注册的回调函数
    this.achievementUnlockCallbacks.forEach(callback => {
      try {
        callback(achievement);
      } catch (error) {
        console.error('成就解锁回调执行失败:', error);
      }
    });
  },
  
  /**
   * 注册成就解锁回调
   * 页面可以通过此方法注册回调函数，在成就解锁时接收通知
   */
  onAchievementUnlock(callback) {
    if (typeof callback === 'function') {
      this.achievementUnlockCallbacks.push(callback);
    }
  },
  
  /**
   * 注册主题变化回调
   */
  onThemeChange(callback) {
    if (typeof callback === 'function') {
      this.themeChangeCallbacks.push(callback);
    }
  },
  
  /**
   * 显示成就解锁通知
   */
  showAchievementUnlockNotification(achievement) {
    this.globalData.showAchievementUnlock = true;
    
    // 3秒后自动隐藏
    setTimeout(() => {
      this.globalData.showAchievementUnlock = false;
    }, 3000);
  },
  
  /**
   * 检查小程序更新
   */
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate(function(res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function(res) {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
          
          updateManager.onUpdateFailed(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本下载失败，请检查网络后重试',
              showCancel: false
            });
          });
        }
      });
    }
  },
  
  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    try {
      // 获取用户信息和令牌
      const userInfo = wx.getStorageSync('userInfo');
      const token = wx.getStorageSync('token');
      const refreshToken = wx.getStorageSync('refreshToken');
      
      // 只有在有令牌的情况下才设置登录状态
      if (userInfo && token) {
        this.globalData.userInfo = userInfo;
        this.globalData.hasLogin = true;
        this.globalData.token = token;
        
        if (refreshToken) {
          this.globalData.refreshToken = refreshToken;
        }
        
        console.log('已恢复登录状态，用户:', userInfo.nickname);
      } else {
        // 如果没有令牌，清除登录状态
        this.clearAuthData();
      }
    } catch (e) {
      console.error('检查登录状态失败:', e);
      this.clearAuthData();
    }
  },
  
  /**
   * 用户登录
   */
  login(userInfo, callback) {
    // 获取微信登录凭证
    wx.login({
      success: (res) => {
        if (res.code) {
          // 将凭证发送到服务端
          wx.request({
            url: `${this.globalData.apiBaseUrl}/api/auth/wx-login`,
            method: 'POST',
            data: {
              code: res.code,
              userInfo: userInfo
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data && res.data.success) {
                // 保存令牌和用户信息
                const responseData = res.data.data;
                this.globalData.token = responseData.token;
                this.globalData.refreshToken = responseData.refreshToken || null;
                this.globalData.userInfo = responseData.user;
                this.globalData.hasLogin = true;
                
                console.log('登录成功，获取到token:', this.globalData.token);
                
                // 保存到本地存储
                try {
                  wx.setStorageSync('token', this.globalData.token);
                  if (this.globalData.refreshToken) {
                    wx.setStorageSync('refreshToken', this.globalData.refreshToken);
                  }
                  wx.setStorageSync('userInfo', this.globalData.userInfo);
                } catch (e) {
                  console.error('保存登录状态失败', e);
                }
                
                // 通知所有页面登录状态已变更
                this.notifyLoginStateChanged();
                
                if (callback) {
                  callback(true);
                }
              } else {
                console.error('登录失败:', res.statusCode, res.data);
                if (callback) {
                  callback(false);
                }
              }
            },
            fail: (err) => {
              console.error('登录请求失败:', err);
              if (callback) {
                callback(false);
              }
            }
          });
        } else {
          console.error('获取登录凭证失败:', res.errMsg);
          if (callback) {
            callback(false);
          }
        }
      },
      fail: (err) => {
        console.error('微信登录失败:', err);
        if (callback) {
          callback(false);
        }
      }
    });
  },
  
  /**
   * 用户登出
   */
  logout(callback) {
    // 如果API可用且有令牌，向服务器发送登出请求
    if (this.globalData.apiAvailable && this.globalData.token) {
      wx.request({
        url: `${this.globalData.apiBaseUrl}/api/auth/logout`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${this.globalData.token}`
        },
        complete: () => {
          // 无论请求成功或失败，都清除本地认证数据
          this.clearAuthData();
          
          // 通知所有页面登录状态已变更
          this.notifyLoginStateChanged();
          
          if (callback) {
            callback();
          }
        }
      });
    } else {
      // 如果API不可用或没有令牌，只清除本地数据
      this.clearAuthData();
      
      // 通知所有页面登录状态已变更
      this.notifyLoginStateChanged();
      
      if (callback) {
        callback();
      }
    }
  },
  
  /**
   * 加载主题设置
   */
  loadThemeSetting() {
    try {
      const theme = wx.getStorageSync('theme');
      if (theme) {
        this.globalData.theme = theme;
      }
    } catch (e) {
      console.error('读取主题设置失败', e);
    }
  },
  
  /**
   * 设置主题
   */
  setTheme(theme) {
    this.globalData.theme = theme;
    
    try {
      wx.setStorageSync('theme', theme);
    } catch (e) {
      console.error('保存主题设置失败', e);
    }
    
    // 通知主题变化
    this.themeChangeCallbacks.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('主题变化回调执行失败:', error);
      }
    });
  },
  
  /**
   * 初始化同步管理器
   */
  initSyncManager() {
    // 动态导入同步管理器
    const SyncManager = require('./utils/sync-manager').SyncManager;
    SyncManager.init();
  },

  /**
   * 注册登录状态变化监听
   */
  onLoginStateChange(callback) {
    if (typeof callback === 'function') {
      this.loginStateChangeCallbacks.push(callback);
    }
  },

  /**
   * 通知所有页面登录状态已变更
   */
  notifyLoginStateChanged() {
    // 通知所有注册的回调
    this.loginStateChangeCallbacks.forEach(callback => {
      try {
        callback({
          userInfo: this.globalData.userInfo,
          hasLogin: this.globalData.hasLogin
        });
      } catch (error) {
        console.error('登录状态变化回调执行失败:', error);
      }
    });
  }
}); 
