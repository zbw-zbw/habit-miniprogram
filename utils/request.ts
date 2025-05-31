/**
 * 请求方法类型
 */
type Method = 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT';

// 引入存储模块
import * as storage from './storage';

/**
 * 生成UUID
 * @returns UUID字符串
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 请求参数接口
 */
interface RequestOptions {
  url: string;
  method?: Method;
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
  showLoading?: boolean;
  loadingText?: string;
  hideErrorToast?: boolean;
  useLocalData?: boolean; // 是否使用本地数据（即使API可用）
  localDataFallback?: boolean; // API不可用时是否回退到本地数据
}

/**
 * 请求响应接口
 */
interface RequestResponse<T = any> {
  data: T;
  statusCode: number;
  header: Record<string, string>;
  errMsg: string;
}

/**
 * API响应接口
 */
interface ApiResponse<T = any> {
  code?: number;
  message?: string;
  data?: T;
  success?: boolean;
  [key: string]: any; // 允许其他字段
}

// 默认请求头
const DEFAULT_HEADER = {
  'content-type': 'application/json'
};

// 请求队列
const requestQueue: string[] = [];

// 是否正在刷新令牌
let isRefreshingToken = false;

// 等待令牌刷新的请求队列
const refreshQueue: { options: RequestOptions }[] = [];

// 显示加载提示
const showLoadingToast = (text = '加载中...') => {
  wx.showLoading({
    title: text,
    mask: true
  });
};

// 隐藏加载提示
const hideLoadingToast = () => {
  if (requestQueue.length === 0) {
    wx.hideLoading();
  }
};

// 显示错误提示
const showErrorToast = (message: string) => {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
};

/**
 * 应用全局选项接口扩展，包含mockLogin方法
 */
interface ExtendedAppOption extends IAppOption {
  mockLogin?: (userInfo: any, callback: () => void) => void;
}

/**
 * 请求拦截器
 * @param options 请求参数
 * @returns 处理后的请求参数
 */
const requestInterceptor = (options: RequestOptions): RequestOptions => {
  // 获取全局应用实例
  const app = getApp<IAppOption>();
  
  // 添加token
  if (app && app.globalData && app.globalData.token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${app.globalData.token}`
    };
  }
  
  // 强制使用API服务，不使用本地数据
  options.useLocalData = false;
  options.localDataFallback = false;
  
  return options;
};

/**
 * 响应拦截器
 * @param response 响应数据
 * @returns 处理后的响应数据
 */
const responseInterceptor = <T>(response: RequestResponse<ApiResponse<T>>, options: RequestOptions): Promise<T> => {
  const { statusCode, data } = response;
  const app = getApp<IAppOption>();
  
  // 请求成功
  if (statusCode >= 200 && statusCode < 300) {
    // 业务状态码正常 - 后端可能返回success: true或code: 0表示成功
    if (data.success === true || data.code === 0 || (data.code && data.code >= 200 && data.code < 300) || !data.code) {
      // 返回数据可能直接在data中，或者在data.data中
      return Promise.resolve(data.data !== undefined ? data.data : data as any);
    }
    
    // 其他业务错误
    return Promise.reject(new Error(data.message || '请求失败'));
  }
  
  // 处理401未授权错误
  if (statusCode === 401) {
    return handleUnauthorized(options);
  }
  
  // 其他HTTP错误
  return Promise.reject(new Error(`网络请求失败，状态码：${statusCode}`));
};

/**
 * 处理未授权错误 (401)
 * @param options 原始请求参数
 * @returns Promise
 */
const handleUnauthorized = <T>(options: RequestOptions): Promise<T> => {
  const app = getApp<ExtendedAppOption>();
  
  // 检查API服务是否可用
  if (app && app.globalData && !app.globalData.apiAvailable) {
    console.log('API服务不可用，使用本地数据模式处理未授权错误');
    
    // 清除认证数据
    if (app && typeof app.clearAuthData === 'function') {
      app.clearAuthData();
    }
    
    // 不再自动跳转，而是通知应用状态已变更
    if (app && typeof app.notifyLoginStateChanged === 'function') {
      app.notifyLoginStateChanged();
    }
    
    return Promise.reject(new Error('登录已过期，请重新登录')) as Promise<T>;
  }
  
  // 如果没有刷新令牌，则清除登录状态，但不再自动跳转
  if (!app || !app.globalData || !app.globalData.refreshToken) {
    if (app && typeof app.clearAuthData === 'function') {
      app.clearAuthData();
    }
    
    // 通知应用登录状态已变更
    if (app && typeof app.notifyLoginStateChanged === 'function') {
      app.notifyLoginStateChanged();
    }
    
    return Promise.reject(new Error('登录已过期，请重新登录')) as Promise<T>;
  }
  
  // 如果当前没有刷新令牌操作，则启动刷新
  if (!isRefreshingToken) {
    // 添加请求到队列
    refreshQueue.push({ options });
    
    // 标记正在刷新令牌
    isRefreshingToken = true;
    
    // 获取API基础URL和刷新令牌
    const apiBaseUrl = app && app.globalData ? app.globalData.apiBaseUrl : '';
    const refreshToken = app.globalData.refreshToken;
    
    // 调用刷新令牌接口
    wx.request({
      url: `${apiBaseUrl}/api/auth/refresh-token`,
      method: 'POST',
      data: {
        refreshToken
      },
      success: (res: any) => {
        if (res.statusCode === 200 && res.data && res.data.token) {
          // 更新令牌
          if (app && app.globalData) {
            app.globalData.token = res.data.token;
            if (res.data.refreshToken) {
              app.globalData.refreshToken = res.data.refreshToken;
            }
          }
          
          // 保存到本地存储
          try {
            wx.setStorageSync('token', res.data.token);
            if (res.data.refreshToken) {
              wx.setStorageSync('refreshToken', res.data.refreshToken);
            }
          } catch (e) {
            console.error('保存令牌失败:', e);
          }
          
          // 重新发送所有等待的请求
          const requestsToRetry = [...refreshQueue];
          
          // 清空队列
          refreshQueue.length = 0;
          
          // 重试所有请求
          requestsToRetry.forEach(item => {
            request(item.options).catch(() => {
              // 忽略错误，已经在原始Promise中处理
            });
          });
        } else {
          // 刷新令牌失败，清除登录状态
          if (app && typeof app.clearAuthData === 'function') {
            app.clearAuthData();
          }
          
          // 清空队列
          refreshQueue.length = 0;
          
          // 通知应用登录状态已变更
          if (app && typeof app.notifyLoginStateChanged === 'function') {
            app.notifyLoginStateChanged();
          }
        }
      },
      fail: () => {
        // 请求失败，清除登录状态
        if (app && typeof app.clearAuthData === 'function') {
          app.clearAuthData();
        }
        
        // 尝试使用本地模式
        if (app && app.globalData) {
          app.globalData.apiAvailable = false;
          
          // 如果有用户信息，尝试使用本地模式登录
          if (app.globalData.userInfo && typeof app.mockLogin === 'function') {
            app.mockLogin(app.globalData.userInfo, () => {
              console.log('令牌刷新失败，已自动切换到本地模式登录');
            });
          }
        }
        
        // 清空队列
        refreshQueue.length = 0;
        
        // 通知应用登录状态已变更
        if (app && typeof app.notifyLoginStateChanged === 'function') {
          app.notifyLoginStateChanged();
        }
      },
      complete: () => {
        // 重置刷新标记
        isRefreshingToken = false;
      }
    });
  } else {
    // 已经在刷新中，只添加请求到队列
    refreshQueue.push({ options });
  }
  
  // 无论如何，当前请求都返回错误
  return Promise.reject(new Error('登录已过期，请重新登录')) as Promise<T>;
};

/**
 * 请求方法
 * @param options 请求参数
 * @returns Promise
 */
export const request = <T>(options: RequestOptions): Promise<T> => {
  // 添加请求到队列
  const requestId = generateUUID();
  requestQueue.push(requestId);
  
  // 检查请求URL是否包含API基础URL
  const url = options.url;
  const apiBaseUrl = getApp<IAppOption>()?.globalData?.apiBaseUrl || '';
  
  // 应用请求拦截器
  options = requestInterceptor(options);
  
  // 记录请求日志
  console.log(`[API请求] ${options.method || 'GET'} ${url}`, options.data);
  
  // 是否显示加载提示
  if (options.showLoading) {
    showLoadingToast(options.loadingText);
  }
  
  // 检查API是否可用，如果不可用且支持本地数据，则使用本地数据
  const app = getApp<IAppOption>();
  if (options.useLocalData || (options.localDataFallback && app && app.globalData && !app.globalData.apiAvailable)) {
    return handleLocalRequest(options);
  }
  
  // 发送请求
  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: apiBaseUrl + url,
      method: options.method || 'GET',
      data: options.data,
      header: options.header || DEFAULT_HEADER,
      timeout: options.timeout || 30000,
      success: (res: any) => {
        // 记录响应日志
        console.log(`[API响应] ${options.method || 'GET'} ${url}`, res.data);
        
        // 请求成功，应用响应拦截器
        responseInterceptor(res, options)
          .then((data: any) => resolve(data as T))
          .catch(error => {
            console.error(`[API错误] ${options.method || 'GET'} ${url}`, error);
            reject(error);
          });
      },
      fail: (error) => {
        console.error(`[API失败] ${options.method || 'GET'} ${url}`, error);
        
        // 检查是否为网络错误
        if (error.errMsg && (error.errMsg.includes('timeout') || error.errMsg.includes('fail') || error.errMsg.includes('abort'))) {
          // 标记API服务不可用
          if (app && app.globalData) {
            app.globalData.apiAvailable = false;
          }
          
          // 如果支持本地数据回退，则使用本地数据
          if (options.localDataFallback) {
            handleLocalRequest(options)
              .then((data: any) => resolve(data as T))
              .catch(reject);
            return;
          }
        }
        
        // 不显示错误提示
        if (!options.hideErrorToast) {
          showErrorToast('网络错误，请检查网络连接');
        }
        
        reject(new Error(error.errMsg || '网络请求失败'));
      },
      complete: () => {
        // 从请求队列中移除
        const index = requestQueue.indexOf(requestId);
        if (index > -1) {
          requestQueue.splice(index, 1);
        }
        
        // 如果队列为空且正在显示加载提示，则隐藏
        if (options.showLoading && requestQueue.length === 0) {
          hideLoadingToast();
        }
      }
    });
  });
};

/**
 * 处理本地请求（当API不可用时使用）
 * @param options 请求参数
 * @returns Promise
 */
const handleLocalRequest = <T>(options: RequestOptions): Promise<T> => {
  console.log('使用本地数据处理请求:', options.url);
  
  const { url, method = 'GET', data } = options;
  
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        // 处理不同的API请求
        if (url.includes('/api/habits')) {
          // 处理习惯相关请求
          const habitId = url.match(/\/api\/habits\/([^/]+)/)?.[1];
          
          if (method === 'GET') {
            if (habitId) {
              if (url.includes('/stats')) {
                // 获取习惯统计
                const stats = storage.getHabitStats(habitId);
                if (stats) {
                  resolve(stats as unknown as T);
                } else {
                  // 生成临时统计数据
                  const habits = storage.getHabits();
                  const habit = habits.find(h => h.id === habitId);
                  if (habit) {
                    const checkins = storage.getCheckins().filter(c => c.habitId === habitId);
                    const completedCheckins = checkins.filter(c => c.isCompleted);
                    const tempStats: IHabitStats = {
                      totalCompletions: completedCheckins.length,
                      totalDays: 30,
                      completionRate: 0,
                      currentStreak: 3,
                      longestStreak: 7,
                      lastCompletedDate: completedCheckins.length > 0 
                        ? completedCheckins.sort((a, b) => 
                            new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
                        : null
                    };
                    tempStats.completionRate = tempStats.totalDays > 0 
                      ? (tempStats.totalCompletions / tempStats.totalDays) * 100 
                      : 0;
                    storage.saveHabitStats(habitId, tempStats);
                    resolve(tempStats as unknown as T);
                  } else {
                    reject(new Error(`习惯不存在: ${habitId}`));
                  }
                }
              } else if (url.includes('/checkins')) {
                // 获取习惯打卡记录
                const checkins = storage.getCheckins().filter(c => c.habitId === habitId);
                resolve(checkins as unknown as T);
              } else {
                // 获取单个习惯
                const habits = storage.getHabits();
                const habit = habits.find(h => h.id === habitId);
                if (habit) {
                  resolve(habit as unknown as T);
                } else {
                  reject(new Error(`习惯不存在: ${habitId}`));
                }
              }
            } else {
              // 获取所有习惯
              const habits = storage.getHabits();
              resolve(habits as unknown as T);
            }
          } else if (method === 'POST') {
            // 创建习惯
            const habits = storage.getHabits();
            const newHabit = {
              id: `habit-${Date.now()}`,
              ...data,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            habits.push(newHabit);
            storage.saveHabits(habits);
            resolve(newHabit as unknown as T);
          } else if (method === 'PUT') {
            if (habitId) {
              // 更新习惯
              const habits = storage.getHabits();
              const index = habits.findIndex(h => h.id === habitId);
              if (index !== -1) {
                habits[index] = {
                  ...habits[index],
                  ...data,
                  updatedAt: new Date().toISOString()
                };
                storage.saveHabits(habits);
                resolve(habits[index] as unknown as T);
              } else {
                reject(new Error(`习惯不存在: ${habitId}`));
              }
            } else {
              reject(new Error('更新习惯需要提供ID'));
            }
          } else if (method === 'DELETE') {
            if (habitId) {
              // 删除习惯
              const habits = storage.getHabits();
              const filteredHabits = habits.filter(h => h.id !== habitId);
              if (filteredHabits.length < habits.length) {
                storage.saveHabits(filteredHabits);
                resolve({ success: true } as unknown as T);
              } else {
                reject(new Error(`习惯不存在: ${habitId}`));
              }
            } else {
              reject(new Error('删除习惯需要提供ID'));
            }
          }
        } else if (url.includes('/api/checkins')) {
          // 处理打卡相关请求
          const checkinId = url.match(/\/api\/checkins\/([^/]+)/)?.[1];
          
          if (method === 'GET') {
            if (checkinId) {
              // 获取单个打卡记录
              const checkins = storage.getCheckins();
              const checkin = checkins.find(c => c.id === checkinId);
              if (checkin) {
                resolve(checkin as unknown as T);
              } else {
                reject(new Error(`打卡记录不存在: ${checkinId}`));
              }
            } else {
              // 获取打卡记录列表，可能有查询参数
              let checkins = storage.getCheckins();
              
              // 处理查询参数
              if (data) {
                if (data.habitId) {
                  checkins = checkins.filter(c => c.habitId === data.habitId);
                }
                if (data.startDate) {
                  checkins = checkins.filter(c => c.date >= data.startDate);
                }
                if (data.endDate) {
                  checkins = checkins.filter(c => c.date <= data.endDate);
                }
              }
              
              resolve(checkins as unknown as T);
            }
          } else if (method === 'POST') {
            // 创建打卡记录
            const checkins = storage.getCheckins();
            const newCheckin = {
              id: `checkin-${Date.now()}`,
              ...data,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            checkins.push(newCheckin);
            storage.saveCheckins(checkins);
            resolve(newCheckin as unknown as T);
          } else if (method === 'PUT') {
            if (checkinId) {
              // 更新打卡记录
              const checkins = storage.getCheckins();
              const index = checkins.findIndex(c => c.id === checkinId);
              if (index !== -1) {
                checkins[index] = {
                  ...checkins[index],
                  ...data,
                  updatedAt: new Date().toISOString()
                };
                storage.saveCheckins(checkins);
                resolve(checkins[index] as unknown as T);
              } else {
                reject(new Error(`打卡记录不存在: ${checkinId}`));
              }
            } else {
              reject(new Error('更新打卡记录需要提供ID'));
            }
          } else if (method === 'DELETE') {
            if (checkinId) {
              // 删除打卡记录
              const checkins = storage.getCheckins();
              const filteredCheckins = checkins.filter(c => c.id !== checkinId);
              if (filteredCheckins.length < checkins.length) {
                storage.saveCheckins(filteredCheckins);
                resolve({ success: true } as unknown as T);
              } else {
                reject(new Error(`打卡记录不存在: ${checkinId}`));
              }
            } else {
              reject(new Error('删除打卡记录需要提供ID'));
            }
          }
        } else if (url.includes('/api/users/me')) {
          // 处理用户相关请求
          if (method === 'GET') {
            const userInfo = storage.getUserInfo();
            if (userInfo) {
              resolve(userInfo as unknown as T);
            } else {
              reject(new Error('用户未登录'));
            }
          } else if (method === 'PUT') {
            // 更新用户信息
            const userInfo = storage.getUserInfo();
            if (userInfo) {
              const updatedUserInfo = { ...userInfo, ...data };
              storage.saveUserInfo(updatedUserInfo);
              resolve(updatedUserInfo as unknown as T);
            } else {
              reject(new Error('用户未登录'));
            }
          }
        } else if (url.includes('/api/auth/refresh-token')) {
          // 模拟刷新令牌
          reject(new Error('本地模式不支持刷新令牌'));
        } else if (url.includes('/api/auth/logout')) {
          // 模拟登出
          resolve({ success: true } as unknown as T);
        } else if (url.includes('/api/health')) {
          // 健康检查
          resolve({ status: 'ok', timestamp: new Date().toISOString() } as unknown as T);
        } else {
          // 其他未处理的请求
          reject(new Error(`本地模式不支持此请求: ${url}`));
        }
      } catch (error) {
        console.error('本地数据处理失败:', error);
        reject(new Error(`本地数据处理失败: ${error}`));
      }
    }, 100);
  });
};

/**
 * GET请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
export const get = <T>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<T> => {
  return request<T>({
    url,
    method: 'GET',
    data,
    ...options
  });
};

/**
 * POST请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
export const post = <T>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...options
  });
};

/**
 * PUT请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
export const put = <T>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<T> => {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...options
  });
};

/**
 * DELETE请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
export const del = <T>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<T> => {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    ...options
  });
}; 
