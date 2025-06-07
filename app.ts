/**
 * 小程序入口文件
 */
// 导入类型定义
import { IAppOption, IUserInfo, IAchievement } from './typings/index';

// 登录状态变化监听器
const loginStateListeners: Array<
  (loginState: { userInfo: IUserInfo | null; hasLogin: boolean }) => void
> = [];

// 成就解锁监听器
const achievementUnlockListeners: Array<(achievement: IAchievement) => void> =
  [];

// 主题变化监听器
const themeChangeListeners: Array<(theme: 'light' | 'dark' | 'system') => void> = [];

// API基础URL
const API_BASE_URL = 'http://localhost:3000'; // 本地开发环境API地址

App<IAppOption>({
  globalData: {
    userInfo: null,
    hasLogin: false,
    systemInfo: undefined,
    theme: 'light',
    unlockedAchievement: null,
    showAchievementUnlock: false,
    apiBaseUrl: API_BASE_URL,
    apiAvailable: true,
    token: '',
    refreshToken: '',
    settings: {
      notification: true,
      sound: true,
      vibration: true,
      language: 'zh_CN',
      autoBackup: false
    },
    isDarkMode: false
  },

  onLaunch() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;

    // 检查本地存储的登录状态
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');

    if (userInfo && token) {
      try {
        // 确保userInfo是字符串并且是有效的JSON
        this.globalData.userInfo =
          typeof userInfo === 'string'
            ? JSON.parse(userInfo)
            : typeof userInfo === 'object'
            ? userInfo
            : null;
        this.globalData.token = token;
        this.globalData.hasLogin = true;
      } catch (e) {
        console.error('解析用户信息失败:', e);
        // 清除无效的存储数据
        wx.removeStorageSync('userInfo');
        this.globalData.userInfo = null;
        this.globalData.hasLogin = false;
      }
    }

    // 加载设置
    this.loadSettings();
  },

  // 加载用户设置
  loadSettings() {
    // 从统一的settings对象加载所有设置
    const settings = wx.getStorageSync('settings');
    
    if (settings) {
      // 更新全局设置
      this.globalData.settings = {
        ...this.globalData.settings,
        ...settings
      };
      
      // 设置主题
      if (settings.theme) {
        this.globalData.theme = settings.theme;
        this.applyTheme(settings.theme);
      }
    } else {
      // 如果没有存储的设置，使用默认设置
      const defaultTheme = 'light';
      this.globalData.theme = defaultTheme;
      this.applyTheme(defaultTheme);
    }
  },

  login(userInfo: IUserInfo, callback: (success: boolean) => void) {
    this.globalData.userInfo = userInfo;
    this.globalData.hasLogin = true;

    // 存储登录信息
    wx.setStorageSync('userInfo', JSON.stringify(userInfo));

    // 通知登录状态变化
    this.notifyLoginStateChanged();

    // 调用回调函数
    callback(true);
  },

  logout(callback: () => void) {
    this.globalData.userInfo = null;
    this.globalData.hasLogin = false;
    this.globalData.token = '';

    // 清除本地存储的登录信息
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
    
    // 清空各个页面数据
    // 获取当前页面栈
    const pages = getCurrentPages();
    
    // 遍历所有页面，调用其clearPageData方法（如果存在）
    pages.forEach(page => {
      if (page && typeof page.clearPageData === 'function') {
        page.clearPageData();
      }
    });

    // 通知登录状态变化
    this.notifyLoginStateChanged();

    callback();
  },

  // 设置主题并通知监听器
  setTheme(theme: 'light' | 'dark' | 'system') {
    this.globalData.theme = theme;
    
    // 更新settings对象中的主题设置
    if (this.globalData.settings) {
      this.globalData.settings.theme = theme;
      
      // 保存更新后的settings对象
      wx.setStorageSync('settings', this.globalData.settings);
    }
    
    this.applyTheme(theme);
    
    // 通知主题变化
    themeChangeListeners.forEach(listener => {
      listener(theme);
    });
  },

  // 应用主题到UI
  applyTheme(theme: 'light' | 'dark' | 'system') {
    let actualTheme = theme;
    
    // 如果是跟随系统，则获取系统主题
    if (theme === 'system') {
      const systemInfo = this.globalData.systemInfo || wx.getSystemInfoSync();
      actualTheme = systemInfo.theme === 'dark' ? 'dark' : 'light';
    }
    
    // 设置导航栏颜色
    if (actualTheme === 'dark') {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#222222'
      });
      
      // 为整个应用应用深色模式样式
      wx.setBackgroundColor({
        backgroundColor: '#121212',
        backgroundColorTop: '#121212',
        backgroundColorBottom: '#121212'
      });
      
      // 添加深色模式类名到页面
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        if (currentPage && typeof currentPage.setData === 'function') {
          currentPage.setData({ darkMode: true });
        }
      }
      
      // 在全局数据中记录深色模式状态
      this.globalData.isDarkMode = true;
      
      // 通知所有页面切换到深色模式
      this.updateAllPagesTheme('dark');
    } else {
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      });
      
      // 为整个应用应用浅色模式样式
      wx.setBackgroundColor({
        backgroundColor: '#f4f5f7',
        backgroundColorTop: '#f4f5f7',
        backgroundColorBottom: '#f4f5f7'
      });
      
      // 移除深色模式类名
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        if (currentPage && typeof currentPage.setData === 'function') {
          currentPage.setData({ darkMode: false });
        }
      }
      
      // 在全局数据中记录深色模式状态
      this.globalData.isDarkMode = false;
      
      // 通知所有页面切换到浅色模式
      this.updateAllPagesTheme('light');
    }
  },
  
  // 更新所有页面的主题
  updateAllPagesTheme(theme: 'light' | 'dark') {
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page && typeof page.setData === 'function') {
        page.setData({ darkMode: theme === 'dark' });
      }
    });
  },

  // 注册主题变化监听
  onThemeChange(callback: (theme: 'light' | 'dark' | 'system') => void) {
    themeChangeListeners.push(callback);
    
    // 立即调用一次回调，传递当前主题
    callback(this.globalData.theme);
  },

  // 设置语言
  setLanguage(language: 'zh_CN' | 'en_US') {
    if (this.globalData.settings) {
      this.globalData.settings.language = language;
      
      // 保存更新后的settings对象
      wx.setStorageSync('settings', this.globalData.settings);
    }
  },

  // 播放提示音
  playNotificationSound() {
    // 检查是否启用了声音
    if (this.globalData.settings.sound) {
      const innerAudioContext = wx.createInnerAudioContext();
      innerAudioContext.src = '/assets/sounds/notification.mp3';
      innerAudioContext.play();
    }
  },

  // 触发震动
  vibrate() {
    // 检查是否启用了震动
    if (this.globalData.settings.vibration) {
      wx.vibrateShort({
        type: 'medium'
      });
    }
  },

  // 发送通知
  sendNotification(title: string, content: string) {
    // 检查是否启用了通知
    if (this.globalData.settings.notification) {
      // 播放声音
      this.playNotificationSound();
      
      // 触发震动
      this.vibrate();
      
      // 显示通知
      wx.showToast({
        title: title,
        icon: 'none',
        duration: 2000
      });
    }
  },

  onLoginStateChange(
    callback: (loginState: {
      userInfo: IUserInfo | null;
      hasLogin: boolean;
    }) => void
  ) {
    loginStateListeners.push(callback);

    // 立即调用一次回调，传递当前登录状态
    callback({
      userInfo: this.globalData.userInfo,
      hasLogin: this.globalData.hasLogin,
    });
  },

  notifyLoginStateChanged() {
    const loginState = {
      userInfo: this.globalData.userInfo,
      hasLogin: this.globalData.hasLogin,
    };

    loginStateListeners.forEach((listener) => {
      listener(loginState);
    });
  },

  // 成就解锁相关方法
  onAchievementUnlock(callback: (achievement: IAchievement) => void) {
    achievementUnlockListeners.push(callback);
  },

  onAchievementUnlocked(achievement: IAchievement) {
    this.globalData.unlockedAchievement = achievement;
    this.globalData.showAchievementUnlock = true;

    achievementUnlockListeners.forEach((listener) => {
      listener(achievement);
    });
    
    // 使用通知系统显示成就解锁
    this.sendNotification('解锁成就', `恭喜解锁成就：${achievement.title}`);
  },

  showAchievementUnlockNotification(achievement: IAchievement) {
    // 显示成就解锁通知
    this.sendNotification('解锁成就', `恭喜解锁成就：${achievement.title}`);
  },

  // API相关方法
  checkApiAvailability() {
    wx.request({
      url: this.globalData.apiBaseUrl + '/api/health',
      method: 'GET',
      success: () => {
        this.globalData.apiAvailable = true;
      },
      fail: () => {
        this.globalData.apiAvailable = false;
        this.showApiUnavailableMessage();
      },
    });
  },

  showApiUnavailableMessage() {
    wx.showToast({
      title: '服务器连接失败',
      icon: 'error',
      duration: 2000,
    });
  },

  clearAuthData() {
    this.globalData.userInfo = null;
    this.globalData.hasLogin = false;
    this.globalData.token = '';
    this.globalData.refreshToken = '';

    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
    wx.removeStorageSync('refreshToken');
  },

  loadTokenFromStorage() {
    const token = wx.getStorageSync('token');
    const refreshToken = wx.getStorageSync('refreshToken');

    if (token) {
      this.globalData.token = token;
      this.globalData.refreshToken = refreshToken || '';
    }
  },

  refreshCurrentPageData() {
    // 获取当前页面
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 如果没有当前页面，直接返回
    if (!currentPage) {
      console.log('没有找到当前页面，跳过数据刷新');
      return;
    }
    
    // 记录当前页面路径，方便调试
    const route = currentPage.route || (currentPage as any).__route__;
    console.log('当前页面:', route);
    
    // 如果当前页面有loadData方法，只刷新当前页面数据
    // 其他页面在切换tab时会自动通过onShow加载
    if (currentPage && typeof currentPage.loadData === 'function') {
      console.log('刷新当前页面数据:', route);
      try {
        currentPage.loadData();
      } catch (error) {
        console.error('刷新页面数据出错:', error);
      }
    }
  }
});
