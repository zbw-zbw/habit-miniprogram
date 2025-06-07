/**
 * 个人中心-设置页面
 */
import { getStorage, setStorage } from '../../../utils/storage';
import { useAuth } from '../../../utils/use-auth';
import { IAppOption } from '../../../typings/index';

interface IPageData {
  settings: {
    notification: boolean;
    theme: 'light' | 'dark' | 'system';
    language: 'zh_CN' | 'en_US';
    sound: boolean;
    vibration: boolean;
    autoBackup: boolean;
  };
  themeOptions: Array<{
    value: 'light' | 'dark' | 'system';
    label: string;
  }>;
  languageOptions: Array<{
    value: 'zh_CN' | 'en_US';
    label: string;
  }>;
  currentThemeLabel: string;
  currentLanguageLabel: string;
  showThemeModal: boolean;
  showLanguageModal: boolean;
  showClearModal: boolean;
  showLogoutModal: boolean;
  hasLogin: boolean;
  userInfo: any;
  darkMode: boolean; // 是否深色模式
}

interface IPageMethods {
  loadSettings(): void;
  saveSettings(): void;
  switchSetting(e: WechatMiniprogram.SwitchChange): void;
  showThemeModal(): void;
  hideThemeModal(): void;
  selectTheme(e: WechatMiniprogram.TouchEvent): void;
  showLanguageModal(): void;
  hideLanguageModal(): void;
  selectLanguage(e: WechatMiniprogram.TouchEvent): void;
  showClearModal(): void;
  hideClearModal(): void;
  clearCache(): void;
  showLogoutModal(): void;
  hideLogoutModal(): void;
  logout(): void;
  navigateToAbout(): void;
  navigateToFeedback(): void;
  testNotification(): void; // 测试通知功能
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    settings: {
      notification: true,
      theme: 'light',
      language: 'zh_CN',
      sound: true,
      vibration: true,
      autoBackup: false
    },
    themeOptions: [
      { value: 'light', label: '浅色模式' },
      { value: 'dark', label: '深色模式' },
      { value: 'system', label: '跟随系统' }
    ],
    languageOptions: [
      { value: 'zh_CN', label: '简体中文' },
      { value: 'en_US', label: 'English' }
    ],
    currentThemeLabel: '浅色模式',
    currentLanguageLabel: '简体中文',
    showThemeModal: false,
    showLanguageModal: false,
    showClearModal: false,
    showLogoutModal: false,
    hasLogin: false,
    userInfo: null,
    darkMode: false // 默认为浅色模式
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    useAuth(this);
    this.loadSettings();
    
    // 初始化深色模式状态
    const app = getApp<IAppOption>();
    if (app.globalData && app.globalData.isDarkMode !== undefined) {
      this.setData({ darkMode: app.globalData.isDarkMode });
    } else if (this.data.settings.theme === 'dark') {
      this.setData({ darkMode: true });
    } else if (this.data.settings.theme === 'system') {
      // 如果是跟随系统，则获取系统主题
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ darkMode: systemInfo.theme === 'dark' });
    }
  },

  /**
   * 加载设置
   */
  loadSettings() {
    const app = getApp<IAppOption>();
    
    // 从本地存储或全局状态获取设置
    const storedSettings = getStorage('settings', this.data.settings);
    
    // 如果有存储的设置，使用存储的设置
    if (storedSettings) {
      this.setData({ settings: storedSettings });
    } else {
      // 如果没有存储的设置，使用全局设置或默认设置
      if (app.globalData.settings) {
        this.setData({
          settings: {
            ...this.data.settings,
            ...app.globalData.settings
          }
        });
      }
      
      // 保存默认设置
      setStorage('settings', this.data.settings);
    }
    
    // 同步主题设置
    if (app.globalData && app.globalData.theme) {
      this.setData({
        'settings.theme': app.globalData.theme as 'light' | 'dark' | 'system'
      });
    }
    
    // 更新主题和语言标签
    const currentTheme = this.data.themeOptions.find(
      option => option.value === this.data.settings.theme
    );
    
    const currentLanguage = this.data.languageOptions.find(
      option => option.value === this.data.settings.language
    );
    
    this.setData({
      currentThemeLabel: currentTheme ? currentTheme.label : '浅色模式',
      currentLanguageLabel: currentLanguage ? currentLanguage.label : '简体中文'
    });
  },

  /**
   * 保存设置
   */
  saveSettings() {
    const app = getApp<IAppOption>();
    
    // 只保存统一的settings对象，避免数据冗余和不一致
    setStorage('settings', this.data.settings);
    
    // 更新全局设置
    if (app.globalData.settings) {
      app.globalData.settings = {
        ...app.globalData.settings,
        ...this.data.settings
      };
    }
    
    // 应用主题设置
    if (app.setTheme) {
      app.setTheme(this.data.settings.theme);
    }
    
    // 应用语言设置
    if (app.setLanguage) {
      app.setLanguage(this.data.settings.language);
    }
  },

  /**
   * 切换设置项
   */
  switchSetting(e: WechatMiniprogram.SwitchChange) {
    const key = e.currentTarget.dataset.key as keyof IPageData['settings'];
    const value = e.detail.value;
    const app = getApp<IAppOption>();
    
    this.setData({
      [`settings.${key}`]: value
    }, () => {
      this.saveSettings();
      
      // 特殊处理通知权限
      if (key === 'notification' && value) {
        wx.requestSubscribeMessage({
          tmplIds: ['habit_reminder_template_id'],
          success: (res) => {
            if (res['habit_reminder_template_id'] === 'reject') {
              this.setData({
                'settings.notification': false
              }, () => {
                this.saveSettings();
                wx.showToast({
                  title: '请在设置中打开通知权限',
                  icon: 'none'
                });
              });
            } else {
              // 测试通知
              if (app.sendNotification) {
                app.sendNotification('通知已开启', '您将收到习惯提醒通知');
              }
            }
          }
        });
      }
      
      // 特殊处理声音设置
      if (key === 'sound' && value) {
        // 测试声音
        if (app.playNotificationSound) {
          app.playNotificationSound();
        }
      }
      
      // 特殊处理震动设置
      if (key === 'vibration' && value) {
        // 测试震动
        if (app.vibrate) {
          app.vibrate();
        }
      }
    });
  },

  /**
   * 显示主题选择模态框
   */
  showThemeModal() {
    this.setData({ showThemeModal: true });
  },

  /**
   * 隐藏主题选择模态框
   */
  hideThemeModal() {
    this.setData({ showThemeModal: false });
  },

  /**
   * 选择主题
   */
  selectTheme(e: WechatMiniprogram.TouchEvent) {
    const theme = e.currentTarget.dataset.value as 'light' | 'dark' | 'system';
    const app = getApp<IAppOption>();
    
    // 找到对应的主题标签
    const currentTheme = this.data.themeOptions.find(
      option => option.value === theme
    );
    
    // 确定是否应该启用深色模式
    let isDarkMode = false;
    if (theme === 'dark') {
      isDarkMode = true;
    } else if (theme === 'system') {
      // 如果是跟随系统，则获取系统主题
      const systemInfo = wx.getSystemInfoSync();
      isDarkMode = systemInfo.theme === 'dark';
    }
    
    this.setData({
      'settings.theme': theme,
      currentThemeLabel: currentTheme ? currentTheme.label : '浅色模式',
      showThemeModal: false,
      darkMode: isDarkMode
    }, () => {
      this.saveSettings();
      
      // 应用主题
      if (app.setTheme) {
        app.setTheme(theme);
      }
      
      wx.showToast({
        title: '主题已更新',
        icon: 'success'
      });
    });
  },

  /**
   * 显示语言选择模态框
   */
  showLanguageModal() {
    this.setData({ showLanguageModal: true });
  },

  /**
   * 隐藏语言选择模态框
   */
  hideLanguageModal() {
    this.setData({ showLanguageModal: false });
  },

  /**
   * 选择语言
   */
  selectLanguage(e: WechatMiniprogram.TouchEvent) {
    const language = e.currentTarget.dataset.value as 'zh_CN' | 'en_US';
    const app = getApp<IAppOption>();
    
    // 找到对应的语言标签
    const currentLanguage = this.data.languageOptions.find(
      option => option.value === language
    );
    
    this.setData({
      'settings.language': language,
      currentLanguageLabel: currentLanguage ? currentLanguage.label : '简体中文',
      showLanguageModal: false
    }, () => {
      this.saveSettings();
      
      // 应用语言
      if (app.setLanguage) {
        app.setLanguage(language);
      }
      
      wx.showToast({
        title: '语言已更新',
        icon: 'success'
      });
    });
  },

  /**
   * 显示清除缓存确认模态框
   */
  showClearModal() {
    this.setData({ showClearModal: true });
  },

  /**
   * 隐藏清除缓存确认模态框
   */
  hideClearModal() {
    this.setData({ showClearModal: false });
  },

  /**
   * 清除缓存
   */
  clearCache() {
    // 保留登录信息和设置，清除其他缓存
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    const refreshToken = wx.getStorageSync('refreshToken');
    const settings = wx.getStorageSync('settings');
    
    // 清除所有缓存
    wx.clearStorageSync();
    
    // 恢复登录信息和设置
    if (userInfo) wx.setStorageSync('userInfo', userInfo);
    if (token) wx.setStorageSync('token', token);
    if (refreshToken) wx.setStorageSync('refreshToken', refreshToken);
    if (settings) wx.setStorageSync('settings', settings);
    
      this.setData({ showClearModal: false });
      
      wx.showToast({
        title: '缓存已清除',
      icon: 'success',
      duration: 2000
      });
  },

  /**
   * 显示退出登录确认模态框
   */
  showLogoutModal() {
    this.setData({ showLogoutModal: true });
  },

  /**
   * 隐藏退出登录确认模态框
   */
  hideLogoutModal() {
    this.setData({ showLogoutModal: false });
  },

  /**
   * 退出登录
   */
  logout() {
    const app = getApp<IAppOption>();
    
    app.logout(() => {
      this.setData({ showLogoutModal: false });
      
      wx.showToast({
        title: '已退出登录',
        icon: 'success',
        duration: 2000
      });
      
      // 返回到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    });
  },

  /**
   * 跳转到关于我们页面
   */
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/profile/about/about'
    });
  },

  /**
   * 跳转到意见反馈页面
   */
  navigateToFeedback() {
    wx.navigateTo({
      url: '/pages/profile/feedback/feedback'
    });
  },
  
  /**
   * 测试通知功能
   */
  testNotification() {
    const app = getApp<IAppOption>();
    
    if (app.sendNotification) {
      app.sendNotification('测试通知', '这是一条测试通知');
    }
  }
}); 
 