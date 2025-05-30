/**
 * API测试页面
 */
import api from '../../services/api';

interface TestResult {
  id: string;
  name: string;
  success: boolean;
  message: string;
  data: any;
  time: string;
}

interface PageData {
  testResults: TestResult[];
  loading: boolean;
  username: string;
  password: string;
  token: string;
  showLoginForm: boolean;
  debugMode: boolean;
}

interface PageInstance {
  data: PageData;
  addTestResult(name: string, success: boolean, message: string, data?: any): void;
  debugApiRequest(url: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<void>;
  testGetUserInfoDebug(): void;
  testGetHabitsDebug(): void;
  testGetTemplatesDebug(): void;
  testRegister(): Promise<void>;
  testLogin(): Promise<void>;
  testGetUserInfo(): Promise<void>;
  testGetHabits(): Promise<void>;
  testGetTemplates(): Promise<void>;
  testCreateHabit(): Promise<void>;
  testGetCheckins(): Promise<void>;
  testGetAnalytics(): Promise<void>;
  clearTestResults(): void;
  logout(): void;
  inputUsername(e: WechatMiniprogram.Input): void;
  inputPassword(e: WechatMiniprogram.Input): void;
  toggleDebugMode(e: WechatMiniprogram.SwitchChange): void;
}

Page<PageData, PageInstance>({
  /**
   * 页面的初始数据
   */
  data: {
    testResults: [],
    loading: false,
    username: 'testuser',
    password: 'password123',
    token: '',
    showLoginForm: true,
    debugMode: true // 添加调试模式开关
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查是否已有token
    const token = wx.getStorageSync('token');
    if (token) {
      this.setData({
        token,
        showLoginForm: false
      });
    }
  },

  /**
   * 添加测试结果
   */
  addTestResult: function (name: string, success: boolean, message: string, data: any = null) {
    const testResults = this.data.testResults;
    testResults.unshift({
      id: Date.now().toString(),
      name,
      success,
      message,
      data,
      time: new Date().toLocaleTimeString()
    });
    this.setData({
      testResults
    });
  },

  /**
   * 调试API请求
   * 直接发送请求并查看原始响应
   */
  debugApiRequest: async function (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data: any = null) {
    this.setData({ loading: true });
    try {
      // 构建请求选项
      const options: WechatMiniprogram.RequestOption = {
        url: `http://localhost:3001${url}`,
        method,
        header: {
          'content-type': 'application/json'
        }
      };
      
      // 添加token
      const token = wx.getStorageSync('token');
      if (token) {
        options.header = options.header || {};
        options.header['Authorization'] = `Bearer ${token}`;
      }
      
      // 添加请求体
      if (data) {
        options.data = data;
      }
      
      // 发送请求
      const result = await new Promise<WechatMiniprogram.RequestSuccessCallbackResult>((resolve, reject) => {
        wx.request({
          ...options,
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
      });
      
      // 显示完整响应
      this.addTestResult(`调试 ${method} ${url}`, true, '请求成功', {
        statusCode: result.statusCode,
        headers: result.header,
        data: result.data
      });
    } catch (error) {
      this.addTestResult(`调试 ${method} ${url}`, false, (error as Error).message || '请求失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 测试获取用户信息(调试模式)
   */
  testGetUserInfoDebug: function() {
    this.debugApiRequest('/api/users/me');
  },

  /**
   * 测试获取习惯列表(调试模式)
   */
  testGetHabitsDebug: function() {
    this.debugApiRequest('/api/habits');
  },

  /**
   * 测试获取习惯模板(调试模式)
   */
  testGetTemplatesDebug: function() {
    this.debugApiRequest('/api/habits/templates');
  },

  /**
   * 注册测试
   */
  testRegister: async function () {
    this.setData({ loading: true });
    try {
      const { username, password } = this.data;
      const nickname = `测试用户_${Date.now().toString().slice(-4)}`;
      
      const result = await api.auth.register({
        username,
        password,
        nickname
      });
      
      this.addTestResult('用户注册', true, '注册成功', result);
      // 保存token
      if (result.token) {
        wx.setStorageSync('token', result.token);
        this.setData({
          token: result.token,
          showLoginForm: false
        });
      }
    } catch (error) {
      this.addTestResult('用户注册', false, (error as Error).message || '注册失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 登录测试
   */
  testLogin: async function () {
    this.setData({ loading: true });
    try {
      const { username, password } = this.data;
      
      const result = await api.auth.login({
        username,
        password
      });
      
      this.addTestResult('用户登录', true, '登录成功', result);
      // 保存token
      if (result.token) {
        wx.setStorageSync('token', result.token);
        this.setData({
          token: result.token,
          showLoginForm: false
        });
      }
    } catch (error) {
      this.addTestResult('用户登录', false, (error as Error).message || '登录失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 获取用户信息测试
   */
  testGetUserInfo: async function () {
    this.setData({ loading: true });
    try {
      const result = await api.user.getCurrentUser();
      this.addTestResult('获取用户信息', true, '获取成功', result);
    } catch (error) {
      this.addTestResult('获取用户信息', false, (error as Error).message || '获取失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 获取习惯列表测试
   */
  testGetHabits: async function () {
    this.setData({ loading: true });
    try {
      const result = await api.habit.getHabits();
      this.addTestResult('获取习惯列表', true, '获取成功', result);
    } catch (error) {
      this.addTestResult('获取习惯列表', false, (error as Error).message || '获取失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 获取习惯模板测试
   */
  testGetTemplates: async function () {
    this.setData({ loading: true });
    try {
      const result = await api.habit.getTemplates();
      this.addTestResult('获取习惯模板', true, '获取成功', result);
    } catch (error) {
      this.addTestResult('获取习惯模板', false, (error as Error).message || '获取失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 创建习惯测试
   */
  testCreateHabit: async function () {
    this.setData({ loading: true });
    try {
      const habitData = {
        name: `测试习惯_${Date.now().toString().slice(-4)}`,
        description: '这是一个测试习惯',
        category: 'health',
        frequency: {
          type: 'daily' as const
        },
        target: 1,
        unit: '次',
        color: '#4F7CFF'
      };
      
      const result = await api.habit.createHabit(habitData);
      this.addTestResult('创建习惯', true, '创建成功', result);
    } catch (error) {
      this.addTestResult('创建习惯', false, (error as Error).message || '创建失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 获取打卡记录测试
   */
  testGetCheckins: async function () {
    this.setData({ loading: true });
    try {
      const result = await api.checkin.getCheckins();
      this.addTestResult('获取打卡记录', true, '获取成功', result);
    } catch (error) {
      this.addTestResult('获取打卡记录', false, (error as Error).message || '获取失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 获取数据分析测试
   */
  testGetAnalytics: async function () {
    this.setData({ loading: true });
    try {
      const result = await api.analytics.getDashboard();
      this.addTestResult('获取数据分析', true, '获取成功', result);
    } catch (error) {
      this.addTestResult('获取数据分析', false, (error as Error).message || '获取失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 清除所有测试结果
   */
  clearTestResults: function () {
    this.setData({
      testResults: []
    });
  },

  /**
   * 退出登录
   */
  logout: function () {
    wx.removeStorageSync('token');
    this.setData({
      token: '',
      showLoginForm: true
    });
    this.addTestResult('退出登录', true, '已退出登录');
  },

  /**
   * 输入用户名
   */
  inputUsername: function (e: WechatMiniprogram.Input) {
    this.setData({
      username: e.detail.value
    });
  },

  /**
   * 输入密码
   */
  inputPassword: function (e: WechatMiniprogram.Input) {
    this.setData({
      password: e.detail.value
    });
  },

  /**
   * 切换调试模式
   */
  toggleDebugMode: function (e: WechatMiniprogram.SwitchChange) {
    this.setData({
      debugMode: e.detail.value
    });
  }
}); 
 