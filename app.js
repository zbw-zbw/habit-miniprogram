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
    showAchievementUnlock: false
  },
  
  // 成就解锁回调函数
  achievementUnlockCallbacks: [],
  
  // 主题变化回调函数
  themeChangeCallbacks: [],

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
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 加载主题设置
    this.loadThemeSetting();
    
    // 初始化成就服务
    this.initAchievementService();
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
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
        this.globalData.hasLogin = true;
      }
    } catch (e) {
      console.error('读取登录状态失败', e);
    }
  },
  
  /**
   * 用户登录
   */
  login(userInfo, callback) {
    // 模拟登录过程
    setTimeout(() => {
      // 添加用户ID
      userInfo.id = 'user_' + Date.now();
      
      // 保存用户信息
      this.globalData.userInfo = userInfo;
      this.globalData.hasLogin = true;
      
      try {
        wx.setStorageSync('userInfo', userInfo);
      } catch (e) {
        console.error('保存用户信息失败', e);
      }
      
      if (callback) {
        callback(true);
      }
    }, 500);
  },
  
  /**
   * 用户登出
   */
  logout(callback) {
    // 清除用户信息
    this.globalData.userInfo = null;
    this.globalData.hasLogin = false;
    
    try {
      wx.removeStorageSync('userInfo');
    } catch (e) {
      console.error('清除用户信息失败', e);
    }
    
    if (callback) {
      callback();
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
  }
}); 
