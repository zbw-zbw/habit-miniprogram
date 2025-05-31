/**
 * Jest测试环境设置
 * 模拟小程序API和全局对象
 */

// 模拟微信小程序API
global.wx = {
  // 基础
  getSystemInfoSync: jest.fn().mockReturnValue({
    SDKVersion: '2.20.0',
    batteryLevel: 100,
    benchmarkLevel: 1,
    brand: 'devtools',
    deviceOrientation: 'portrait',
    devicePixelRatio: 2,
    fontSizeSetting: 16,
    language: 'zh_CN',
    model: 'iPhone X',
    pixelRatio: 2,
    platform: 'devtools',
    screenHeight: 812,
    screenWidth: 375,
    statusBarHeight: 44,
    system: 'iOS 10.0.1',
    version: '8.0.5',
    safeArea: {
      bottom: 812,
      height: 768,
      left: 0,
      right: 375,
      top: 44,
      width: 375
    }
  }),

  // 存储
  getStorageSync: jest.fn().mockImplementation((key) => {
    const mockStorage = {
      'userInfo': {
        id: 'test_user_id',
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.png',
        gender: 1,
        province: '广东',
        city: '深圳',
        country: '中国'
      },
      'token': 'mock_token',
      'theme': 'light'
    };
    return mockStorage[key] || '';
  }),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  clearStorageSync: jest.fn(),

  // 导航
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  reLaunch: jest.fn(),
  redirectTo: jest.fn(),

  // 交互
  showToast: jest.fn(),
  hideToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn().mockReturnValue({ confirm: true }),
  showActionSheet: jest.fn(),
  setNavigationBarTitle: jest.fn(),

  // 网络
  request: jest.fn(),

  // 定时器
  nextTick: jest.fn(callback => callback()),

  // 其他常用API
  getMenuButtonBoundingClientRect: jest.fn().mockReturnValue({
    width: 87,
    height: 32,
    top: 48,
    right: 369,
    bottom: 80,
    left: 282
  }),
  createSelectorQuery: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    selectViewport: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    boundingClientRect: jest.fn().mockReturnThis(),
    scrollOffset: jest.fn().mockReturnThis(),
    fields: jest.fn().mockReturnThis(),
    exec: jest.fn(callback => callback([{
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100
    }]))
  })
};

// 模拟小程序全局函数
global.App = jest.fn();
global.Page = jest.fn();
global.Component = jest.fn();
global.getApp = jest.fn().mockReturnValue({
  globalData: {
    userInfo: {
      id: 'test_user_id',
      nickName: '测试用户',
      avatarUrl: 'https://example.com/avatar.png',
      gender: 1,
      province: '广东',
      city: '深圳',
      country: '中国'
    },
    hasLogin: true,
    theme: 'light',
    apiBaseUrl: 'http://localhost:3000',
    apiAvailable: true
  },
  onAchievementUnlock: jest.fn(),
  onThemeChange: jest.fn(),
  login: jest.fn(),
  logout: jest.fn()
});

// 模拟日期时间
jest.spyOn(global.Date, 'now').mockImplementation(() => 1682822400000); // 2023-04-30 00:00:00

// 禁用控制台警告
console.warn = jest.fn(); 
