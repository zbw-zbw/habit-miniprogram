"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.del = exports.put = exports.post = exports.get = exports.request = void 0;
// API基础URL
const BASE_URL = 'http://localhost:3000';
// 默认请求头
const DEFAULT_HEADER = {
    'content-type': 'application/json'
};
// 请求队列
const requestQueue = [];
// 是否正在刷新令牌
let isRefreshingToken = false;
// 等待令牌刷新的请求队列
const refreshQueue = [];
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
const showErrorToast = (message) => {
    wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
    });
};
/**
 * 请求拦截器
 * @param options 请求参数
 * @returns 处理后的请求参数
 */
const requestInterceptor = (options) => {
    // 获取全局应用实例
    const app = getApp();
    // 添加token
    if (app.globalData.token) {
        options.header = {
            ...options.header,
            'Authorization': `Bearer ${app.globalData.token}`
        };
    }
    return options;
};
/**
 * 响应拦截器
 * @param response 响应数据
 * @returns 处理后的响应数据
 */
const responseInterceptor = (response, options) => {
    const { statusCode, data } = response;
    const app = getApp();
    // 请求成功
    if (statusCode >= 200 && statusCode < 300) {
        // 业务状态码正常 - 后端可能返回success: true或code: 0表示成功
        if (data.success === true || data.code === 0 || (data.code && data.code >= 200 && data.code < 300) || !data.code) {
            // 处理返回数据，将MongoDB的_id字段映射为id
            let processedData = data.data !== undefined ? data.data : data;
            
            // 处理数组
            if (Array.isArray(processedData)) {
                processedData = processedData.map(item => processMongoDBId(item));
            } 
            // 处理单个对象
            else if (processedData && typeof processedData === 'object') {
                processedData = processMongoDBId(processedData);
            }
            
            return Promise.resolve(processedData);
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
 * 处理MongoDB的_id字段，将其映射为id
 * @param {Object} obj 需要处理的对象
 * @returns {Object} 处理后的对象
 */
const processMongoDBId = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result = { ...obj };
    
    // 如果对象有_id字段但没有id字段，则添加id字段
    if (result._id && !result.id) {
        result.id = result._id;
    }
    
    // 处理嵌套对象
    Object.keys(result).forEach(key => {
        if (result[key] && typeof result[key] === 'object') {
            if (Array.isArray(result[key])) {
                // 处理数组
                result[key] = result[key].map(item => 
                    typeof item === 'object' ? processMongoDBId(item) : item
                );
            } else {
                // 处理嵌套对象
                result[key] = processMongoDBId(result[key]);
            }
        }
    });
    
    return result;
};
/**
 * 处理未授权错误 (401)
 * @param options 原始请求参数
 * @returns Promise
 */
const handleUnauthorized = (options) => {
    const app = getApp();
    // 如果没有刷新令牌，则清除登录状态并跳转到登录页
    if (!app.globalData.refreshToken) {
        app.clearAuthData();
        wx.navigateTo({
            url: '/pages/login/login'
        });
        return Promise.reject(new Error('登录已过期，请重新登录'));
    }
    // 创建一个新的Promise，加入刷新队列
    return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject, options });
        // 如果已经在刷新令牌，则等待刷新完成
        if (isRefreshingToken) {
            return;
        }
        // 标记正在刷新令牌
        isRefreshingToken = true;
        // 调用刷新令牌接口
        wx.request({
            url: `${app.globalData.apiBaseUrl}/api/auth/refresh-token`,
            method: 'POST',
            data: {
                refreshToken: app.globalData.refreshToken
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data && res.data.token) {
                    // 更新令牌
                    app.globalData.token = res.data.token;
                    if (res.data.refreshToken) {
                        app.globalData.refreshToken = res.data.refreshToken;
                    }
                    // 保存到本地存储
                    try {
                        wx.setStorageSync('token', app.globalData.token);
                        if (res.data.refreshToken) {
                            wx.setStorageSync('refreshToken', app.globalData.refreshToken);
                        }
                    }
                    catch (e) {
                        console.error('保存令牌失败:', e);
                    }
                    // 重新发送所有等待的请求
                    refreshQueue.forEach(({ resolve, reject, options }) => {
                        (0, exports.request)(options).then(resolve).catch(reject);
                    });
                }
                else {
                    // 刷新令牌失败，清除登录状态
                    app.clearAuthData();
                    // 拒绝所有等待的请求
                    refreshQueue.forEach(({ reject }) => {
                        reject(new Error('刷新令牌失败，请重新登录'));
                    });
                    // 跳转到登录页
                    wx.navigateTo({
                        url: '/pages/login/login'
                    });
                }
            },
            fail: () => {
                // 请求失败，清除登录状态
                app.clearAuthData();
                // 拒绝所有等待的请求
                refreshQueue.forEach(({ reject }) => {
                    reject(new Error('刷新令牌请求失败，请重新登录'));
                });
                // 跳转到登录页
                wx.navigateTo({
                    url: '/pages/login/login'
                });
            },
            complete: () => {
                // 清空刷新队列
                refreshQueue.length = 0;
                // 重置刷新标记
                isRefreshingToken = false;
            }
        });
    });
};
/**
 * 请求方法
 * @param options 请求参数
 * @returns Promise
 */
const request = (options) => {
    const app = getApp();
    // 处理请求参数
    options = requestInterceptor(options);
    
    // 移除本地数据处理逻辑，始终使用服务器数据
    
    // 添加请求到队列
    const requestId = Date.now().toString();
    requestQueue.push(requestId);
    // 显示加载提示
    if (options.showLoading !== false) {
        showLoadingToast(options.loadingText);
    }
    // 发起请求
    return new Promise((resolve, reject) => {
        wx.request({
            url: options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
            method: options.method || 'GET',
            data: options.data,
            header: { ...DEFAULT_HEADER, ...options.header },
            timeout: options.timeout || 30000,
            success: (response) => {
                // 处理响应
                responseInterceptor(response, options)
                    .then(resolve)
                    .catch(reject);
            },
            fail: (error) => {
                // 直接返回错误，不再尝试本地数据回退
                reject(new Error(`网络请求失败: ${error.errMsg}`));
            },
            complete: () => {
                // 从队列中移除请求
                const index = requestQueue.indexOf(requestId);
                if (index !== -1) {
                    requestQueue.splice(index, 1);
                }
                // 隐藏加载提示
                if (options.showLoading !== false) {
                    hideLoadingToast();
                }
            }
        });
    });
};
exports.request = request;
/**
 * GET请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
const get = (url, data, options) => {
    return (0, exports.request)({
        url,
        method: 'GET',
        data,
        ...options
    });
};
exports.get = get;
/**
 * POST请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
const post = (url, data, options) => {
    return (0, exports.request)({
        url,
        method: 'POST',
        data,
        ...options
    });
};
exports.post = post;
/**
 * PUT请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
const put = (url, data, options) => {
    return (0, exports.request)({
        url,
        method: 'PUT',
        data,
        ...options
    });
};
exports.put = put;
/**
 * DELETE请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
const del = (url, data, options) => {
    return (0, exports.request)({
        url,
        method: 'DELETE',
        data,
        ...options
    });
};
exports.del = del;
