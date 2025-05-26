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
  },

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
  },
  
  /**
   * 检查小程序更新
   */
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(res => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已准备好，是否重启应用？',
              success: res => {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
          
          updateManager.onUpdateFailed(() => {
            wx.showToast({
              title: '更新失败，请稍后再试',
              icon: 'none'
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
    // 从本地存储获取登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.hasLogin = true;
      this.globalData.userInfo = userInfo;
      
      // 验证token有效性
      this.validateToken(token);
    }
  },
  
  /**
   * 验证token有效性
   * @param {string} token 用户令牌
   */
  validateToken(token) {
    // TODO: 实现token验证逻辑
    // 向服务器发送请求验证token
    // 如果token无效，清除登录状态
  },
  
  /**
   * 加载主题设置
   */
  loadThemeSetting() {
    const theme = wx.getStorageSync('theme') || 'light';
    this.globalData.theme = theme;
    
    // 设置导航栏颜色
    if (theme === 'dark') {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#303133',
      });
    }
  },
  
  /**
   * 切换主题
   * @param {string} theme 主题名称 ('light'|'dark')
   */
  switchTheme(theme) {
    this.globalData.theme = theme;
    wx.setStorageSync('theme', theme);
    
    // 设置导航栏颜色
    if (theme === 'dark') {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#303133',
      });
    } else {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#4F7CFF',
      });
    }
    
    // 通知页面更新主题
    if (this._themeChangeCallback) {
      this._themeChangeCallback(theme);
    }
  },
  
  /**
   * 监听主题变化
   * @param {Function} callback 回调函数
   */
  onThemeChange(callback) {
    this._themeChangeCallback = callback;
  },
  
  /**
   * 用户登录
   * @param {Object} userInfo 用户信息
   * @param {Function} callback 回调函数
   */
  login(userInfo, callback) {
    // TODO: 实现登录逻辑
    // 向服务器发送登录请求
    // 保存登录状态和用户信息
    
    // 模拟登录成功
    setTimeout(() => {
      this.globalData.hasLogin = true;
      this.globalData.userInfo = userInfo;
      
      // 保存到本地存储
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('token', 'mock_token');
      
      if (callback) {
        callback(true);
      }
    }, 1000);
  },
  
  /**
   * 用户登出
   * @param {Function} callback 回调函数
   */
  logout(callback) {
    // 清除登录状态
    this.globalData.hasLogin = false;
    this.globalData.userInfo = null;
    
    // 清除本地存储
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    
    if (callback) {
      callback();
    }
  }
}); 
