/**
 * 个人中心-设置页面
 */
import { getStorage, setStorage } from '../../../utils/storage';
import { useAuth } from '../../../utils/use-auth';

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
    userInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    useAuth(this);
    this.loadSettings();
  },

  /**
   * 加载设置
   */
  loadSettings() {
    const app = getApp<IAppOption>();
    
    // 从本地存储或全局状态获取设置
    const storedSettings = getStorage('settings', this.data.settings);
    
    if (storedSettings) {
      this.setData({ settings: storedSettings });
    } else {
      // 使用默认设置并保存
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
    
    // 保存到本地存储，使用统一的键名
    setStorage('settings', this.data.settings);
    
    // 同时单独存储各项设置，便于其他页面读取
    wx.setStorageSync('setting_notification', this.data.settings.notification);
    wx.setStorageSync('setting_theme', this.data.settings.theme);
    wx.setStorageSync('setting_language', this.data.settings.language);
    wx.setStorageSync('setting_sound', this.data.settings.sound);
    wx.setStorageSync('setting_vibration', this.data.settings.vibration);
    wx.setStorageSync('setting_autoBackup', this.data.settings.autoBackup);
    
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
            }
          }
        });
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
    
    // 找到对应的主题标签
    const currentTheme = this.data.themeOptions.find(
      option => option.value === theme
    );
    
    this.setData({
      'settings.theme': theme,
      currentThemeLabel: currentTheme ? currentTheme.label : '浅色模式',
      showThemeModal: false
    }, () => {
      this.saveSettings();
      
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
      
      wx.showToast({
        title: '语言已更新',
        icon: 'success'
      });
      
      // 需要重启应用才能完全应用语言设置
      wx.showModal({
        title: '提示',
        content: '语言设置将在重启应用后完全生效',
        showCancel: false
      });
    });
  },

  /**
   * 显示清除缓存模态框
   */
  showClearModal() {
    this.setData({ showClearModal: true });
  },

  /**
   * 隐藏清除缓存模态框
   */
  hideClearModal() {
    this.setData({ showClearModal: false });
  },

  /**
   * 清除缓存
   */
  clearCache() {
    wx.showLoading({
      title: '清除中'
    });
    
    // 模拟清除缓存
    setTimeout(() => {
      wx.hideLoading();
      this.setData({ showClearModal: false });
      
      wx.showToast({
        title: '缓存已清除',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 显示退出登录模态框
   */
  showLogoutModal() {
    this.setData({ showLogoutModal: true });
  },

  /**
   * 隐藏退出登录模态框
   */
  hideLogoutModal() {
    this.setData({ showLogoutModal: false });
  },

  /**
   * 退出登录
   */
  logout() {
    const app = getApp<IAppOption>();
    
    wx.showLoading({
      title: '退出中'
    });
    
    app.logout(() => {
      wx.hideLoading();
      this.setData({ showLogoutModal: false });
      
      wx.showToast({
        title: '已退出登录',
        icon: 'success'
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    });
  },

  /**
   * 跳转到关于页面
   */
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/profile/about/about'
    });
  },

  /**
   * 跳转到反馈页面
   */
  navigateToFeedback() {
    wx.navigateTo({
      url: '/pages/profile/feedback/feedback'
    });
  }
}); 
 