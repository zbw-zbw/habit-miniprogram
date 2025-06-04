"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.del = exports.put = exports.post = exports.get = exports.request = void 0;
// 基础URL
const BASE_URL = 'http://localhost:3001';
/**
 * 生成UUID
 * @returns UUID字符串
 */
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
// 默认请求头
const DEFAULT_HEADER = {
    'content-type': 'application/json',
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
const showErrorToast = (message) => {
    wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000,
    });
};
/**
 * 将对象转换为查询字符串
 * @param params 参数对象
 * @returns 查询字符串
 */
const objectToQueryString = (params) => {
    return Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
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
    if (app && app.globalData && app.globalData.token) {
        options.header = {
            ...options.header,
            Authorization: `Bearer ${app.globalData.token}`,
        };
    }
    // 清理请求参数，移除undefined和null值
    if (options.data && typeof options.data === 'object' && !Array.isArray(options.data)) {
        const cleanData = {};
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
            const params = {};
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
        if (data.success === true ||
            data.code === 0 ||
            (data.code && data.code >= 200 && data.code < 300) ||
            !data.code) {
            // 返回数据可能直接在data中，或者在data.data中
            return Promise.resolve(data.data !== undefined ? data.data : data);
        }
        // 业务逻辑错误，创建自定义错误对象，包含服务端返回的错误信息
        const error = new Error(data.message || '请求失败');
        error.response = data;
        error.message = data.message || '请求失败';
        return Promise.reject(error);
    }
    // 处理401未授权错误
    if (statusCode === 401) {
        return handleUnauthorized(options);
    }
    // 其他HTTP错误，创建自定义错误对象，包含服务端返回的错误信息
    const error = new Error(`网络请求失败，状态码：${statusCode}`);
    error.response = data;
    error.statusCode = statusCode;
    error.message = data.message || `网络请求失败，状态码：${statusCode}`;
    return Promise.reject(error);
};
/**
 * 处理未授权错误 (401)
 * @param options 原始请求参数
 * @returns Promise
 */
const handleUnauthorized = (options) => {
    const app = getApp();
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
        return Promise.reject(new Error('登录已过期，请重新登录'));
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
        return Promise.reject(new Error('登录已过期，请重新登录'));
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
            success: (res) => {
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
                    }
                    catch (e) {
                    }
                    // 重新发送所有等待的请求
                    const requestsToRetry = [...refreshQueue];
                    // 清空队列
                    refreshQueue.length = 0;
                    // 重试所有请求
                    requestsToRetry.forEach((item) => {
                        (0, exports.request)(item.options).catch(() => {
                            // 忽略错误，已经在原始Promise中处理
                        });
                    });
                }
                else {
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
    }
    else {
        // 已经在刷新中，只添加请求到队列
        refreshQueue.push({ options });
    }
    // 无论如何，当前请求都返回错误
    return Promise.reject(new Error('登录已过期，请重新登录'));
};
/**
 * 请求方法
 * @param options 请求参数
 * @returns Promise
 */
const request = (options) => {
    var _a;
    // 添加请求到队列
    const requestId = generateUUID();
    requestQueue.push(requestId);
    // 检查请求URL是否包含API基础URL
    const url = options.url;
    const app = getApp();
    const apiBaseUrl = ((_a = app === null || app === void 0 ? void 0 : app.globalData) === null || _a === void 0 ? void 0 : _a.apiBaseUrl) || '';
    // 应用请求拦截器
    options = requestInterceptor(options);
    // 记录请求日志
    // 是否显示加载提示
    if (options.showLoading) {
        showLoadingToast(options.loadingText);
    }
    // 发送请求
    return new Promise((resolve, reject) => {
        wx.request({
            url: apiBaseUrl + url,
            method: options.method || 'GET',
            data: options.data,
            header: options.header || DEFAULT_HEADER,
            timeout: options.timeout || 30000,
            success: (res) => {
                // 记录响应日志
                // 请求成功，应用响应拦截器
                responseInterceptor(res, options)
                    .then((data) => resolve(data))
                    .catch((error) => {
                    reject(error);
                });
            },
            fail: (error) => {
                // 检查是否为网络错误
                if (error.errMsg &&
                    (error.errMsg.includes('timeout') ||
                        error.errMsg.includes('fail') ||
                        error.errMsg.includes('abort'))) {
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
exports.request = request;
/**
 * GET请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
const get = (url, data, options) => {
    // 处理查询参数
    if (data) {
        // 移除undefined和null值
        const cleanData = {};
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
        return (0, exports.request)({
            url,
            method: 'GET',
            ...options,
        });
    }
    return (0, exports.request)({
        url,
        method: 'GET',
        data,
        ...options,
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
        ...options,
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
        ...options,
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
        ...options,
    });
};
exports.del = del;
/**
 * 上传文件
 * @param url 上传地址
 * @param filePath 文件路径
 * @param options 其他选项
 * @returns Promise
 */
const upload = (url, filePath, options) => {
    // 获取全局应用实例
    const app = getApp();
    // 构建请求头
    const header = {
        ...((options === null || options === void 0 ? void 0 : options.header) || {}),
    };
    // 添加token
    if (app && app.globalData && app.globalData.token) {
        header.Authorization = `Bearer ${app.globalData.token}`;
    }
    return new Promise((resolve, reject) => {
        wx.uploadFile({
            url: BASE_URL + url,
            filePath,
            name: (options === null || options === void 0 ? void 0 : options.name) || 'file',
            header,
            formData: options === null || options === void 0 ? void 0 : options.formData,
            timeout: options === null || options === void 0 ? void 0 : options.timeout,
            success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const data = JSON.parse(res.data);
                        resolve(data);
                    }
                    catch (error) {
                        resolve(res.data);
                    }
                }
                else {
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
exports.upload = upload;
