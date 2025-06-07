/**
 * 请求方法类型
 */
type Method =
  | 'OPTIONS'
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'TRACE'
  | 'CONNECT';

// 引入存储模块
import * as storage from './storage';
// 引入配置模块
import { config } from './config';

/**
 * 获取基础URL
 */
const getBaseUrl = (): string => {
  try {
    // 从配置中获取API基础URL
    return config.API_BASE_URL;
  } catch (e) {
    console.error('获取API基础URL失败', e);
    // 默认值
    return 'http://localhost:3000';
  }
};

/**
 * 获取完整URL路径
 * @param path 相对路径或完整URL
 * @returns 完整URL
 */
export const getFullUrl = (path: string): string => {
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 获取当前基础URL
  const baseUrl = getBaseUrl();
  
  // 如果是相对路径且以/开头，拼接基础URL
  if (path.startsWith('/')) {
    return `${baseUrl}${path}`;
  }
  
  // 其他情况，确保路径以/开头
  return `${baseUrl}/${path}`;
};

/**
 * 生成UUID
 * @returns UUID字符串
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
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
  'content-type': 'application/json',
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
    mask: true,
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
    duration: 2000,
  });
};

// 应用全局选项接口扩展，包含mockLogin方法
interface ExtendedAppOption extends IAppOption {
  mockLogin?: (userInfo: any, callback: () => void) => void;
}

// 将对象转换为查询字符串
const objectToQueryString = (params: Record<string, any>): string => {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
};

// 请求拦截器
const requestInterceptor = (options: RequestOptions): RequestOptions => {
  // 获取全局应用实例
  const app = getApp<IAppOption>();

  // 添加token
  if (app && app.globalData && app.globalData.token) {
    options.header = {
      ...options.header,
      Authorization: `Bearer ${app.globalData.token}`,
    };
  }

  // 清理请求参数，移除undefined和null值
  if (options.data && typeof options.data === 'object' && !Array.isArray(options.data)) {
    const cleanData: Record<string, any> = {};
    Object.keys(options.data).forEach(key => {
      if (options.data[key] !== undefined && options.data[key] !== null) {
        cleanData[key] = options.data[key];
      }
    });
    options.data = cleanData;
  }

  // 如果是GET请求，清理URL参数中的undefined和null值
  if (options.method === 'GET' || !options.method) {
    // 解析URL和查询参数
    const urlParts = options.url.split('?');
    if (urlParts.length > 1) {
      const baseUrl = urlParts[0];
      const queryString = urlParts[1];
      
      // 解析查询参数
      const params: Record<string, string> = {};
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (value !== 'undefined' && value !== 'null') {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
      
      // 重建URL
      const cleanQueryString = objectToQueryString(params);
      options.url = cleanQueryString ? `${baseUrl}?${cleanQueryString}` : baseUrl;
    }
  }

  // 强制使用API服务，不使用本地数据
  options.useLocalData = false;
  options.localDataFallback = false;

  return options;
};

// 响应拦截器
const responseInterceptor = <T>(
  response: RequestResponse<ApiResponse<T>>,
  options: RequestOptions
): Promise<T> => {
  const { statusCode, data } = response;
  const app = getApp<IAppOption>();

  // 请求成功
  if (statusCode >= 200 && statusCode < 300) {
    // 业务状态码正常 - 后端可能返回success: true或code: 0表示成功
    if (
      data.success === true ||
      data.code === 0 ||
      (data.code && data.code >= 200 && data.code < 300) ||
      !data.code
    ) {
      // 返回数据可能直接在data中，或者在data.data中
      return Promise.resolve(
        data.data !== undefined ? data.data : (data as any)
      );
    }

    // 业务逻辑错误，创建自定义错误对象，包含服务端返回的错误信息
    const error = new Error(data.message || '请求失败');
    (error as any).response = data;
    (error as any).message = data.message || '请求失败';
    return Promise.reject(error);
  }

  // 处理401未授权错误
  if (statusCode === 401) {
    return handleUnauthorized(options);
  }

  // 其他HTTP错误，创建自定义错误对象，包含服务端返回的错误信息
  const error = new Error(`网络请求失败，状态码：${statusCode}`);
  (error as any).response = data;
  (error as any).statusCode = statusCode;
  (error as any).message = data.message || `网络请求失败，状态码：${statusCode}`;
  return Promise.reject(error);
};

// 处理未授权错误 (401)
const handleUnauthorized = <T>(options: RequestOptions): Promise<T> => {
  const app = getApp<ExtendedAppOption>();

  // 检查API服务是否可用
  if (app && app.globalData && !app.globalData.apiAvailable) {
    

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
        refreshToken,
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
            
          }

          // 重新发送所有等待的请求
          const requestsToRetry = [...refreshQueue];

          // 清空队列
          refreshQueue.length = 0;

          // 重试所有请求
          requestsToRetry.forEach((item) => {
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
      },
    });
  } else {
    // 已经在刷新中，只添加请求到队列
    refreshQueue.push({ options });
  }

  // 无论如何，当前请求都返回错误
  return Promise.reject(new Error('登录已过期，请重新登录')) as Promise<T>;
};

// 请求方法
export const request = <T>(options: RequestOptions): Promise<T> => {
  // 添加请求到队列
  const requestId = generateUUID();
  requestQueue.push(requestId);

  // 检查请求URL是否包含API基础URL
  const url = options.url;
  const app = getApp<IAppOption>();
  const apiBaseUrl = app?.globalData?.apiBaseUrl || '';

  // 应用请求拦截器
  options = requestInterceptor(options);

  // 记录请求日志
  

  // 是否显示加载提示
  if (options.showLoading) {
    showLoadingToast(options.loadingText);
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
        

        // 请求成功，应用响应拦截器
        responseInterceptor(res, options)
          .then((data: any) => resolve(data as T))
          .catch((error) => {
            
            reject(error);
          });
      },
      fail: (error) => {
        

        // 检查是否为网络错误
        if (
          error.errMsg &&
          (error.errMsg.includes('timeout') ||
            error.errMsg.includes('fail') ||
            error.errMsg.includes('abort'))
        ) {
          // 标记API服务不可用
          if (app && app.globalData) {
            app.globalData.apiAvailable = false;
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
      },
    });
  });
};

// GET请求
export const get = <T>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<T> => {
  // 处理查询参数
  if (data) {
    // 移除undefined和null值
    const cleanData: Record<string, any> = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        cleanData[key] = data[key];
      }
    });
    
    // 构建查询字符串
    const queryString = objectToQueryString(cleanData);
    
    // 添加查询字符串到URL
    if (queryString) {
      url = url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    }
    
    // 使用处理后的URL，不传递data
    return request<T>({
      url,
      method: 'GET',
      ...options,
    });
  }
  
  return request<T>({
    url,
    method: 'GET',
    data,
    ...options,
  });
};

// POST请求
export const post = <T>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...options,
  });
};

// PUT请求
export const put = <T>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<T> => {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...options,
  });
};

// DELETE请求
export const del = <T>(
  url: string,
  data?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<T> => {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    ...options,
  });
};

// 上传文件
export const upload = <T>(
  url: string,
  filePath: string,
  options?: {
    name?: string;
    header?: Record<string, any>;
    formData?: Record<string, any>;
    timeout?: number;
  }
): Promise<T> => {
  // 获取全局应用实例
  const app = getApp<IAppOption>();

  // 构建请求头
  const header = {
    ...(options?.header || {}),
  };

  // 添加token
  if (app && app.globalData && app.globalData.token) {
    header.Authorization = `Bearer ${app.globalData.token}`;
  }

  return new Promise<T>((resolve, reject) => {
    wx.uploadFile({
      url: getFullUrl(url),
      filePath,
      name: options?.name || 'file',
      header,
      formData: options?.formData,
      timeout: options?.timeout,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (error) {
            resolve(res.data as unknown as T);
          }
        } else {
          reject({
            statusCode: res.statusCode,
            message: res.errMsg
          });
        }
      },
      fail: (err) => {
        reject({
          statusCode: -1,
          message: err.errMsg
        });
      }
    });
  });
};
