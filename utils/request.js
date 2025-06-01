"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.del = exports.put = exports.post = exports.get = exports.request = void 0;
/**
 * 生成UUID
 * @returns UUID字符串
 */
var generateUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
// 默认请求头
var DEFAULT_HEADER = {
    'content-type': 'application/json'
};
// 请求队列
var requestQueue = [];
// 是否正在刷新令牌
var isRefreshingToken = false;
// 等待令牌刷新的请求队列
var refreshQueue = [];
// 显示加载提示
var showLoadingToast = function (text) {
    if (text === void 0) { text = '加载中...'; }
    wx.showLoading({
        title: text,
        mask: true
    });
};
// 隐藏加载提示
var hideLoadingToast = function () {
    if (requestQueue.length === 0) {
        wx.hideLoading();
    }
};
// 显示错误提示
var showErrorToast = function (message) {
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
var requestInterceptor = function (options) {
    // 获取全局应用实例
    var app = getApp();
    // 添加token
    if (app && app.globalData && app.globalData.token) {
        options.header = __assign(__assign({}, options.header), { Authorization: "Bearer ".concat(app.globalData.token) });
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
var responseInterceptor = function (response, options) {
    var statusCode = response.statusCode, data = response.data;
    var app = getApp();
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
        // 其他业务错误
        return Promise.reject(new Error(data.message || '请求失败'));
    }
    // 处理401未授权错误
    if (statusCode === 401) {
        return handleUnauthorized(options);
    }
    // 其他HTTP错误
    return Promise.reject(new Error("\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25\uFF0C\u72B6\u6001\u7801\uFF1A".concat(statusCode)));
};
/**
 * 处理未授权错误 (401)
 * @param options 原始请求参数
 * @returns Promise
 */
var handleUnauthorized = function (options) {
    var app = getApp();
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
        refreshQueue.push({ options: options });
        // 标记正在刷新令牌
        isRefreshingToken = true;
        // 获取API基础URL和刷新令牌
        var apiBaseUrl = app && app.globalData ? app.globalData.apiBaseUrl : '';
        var refreshToken = app.globalData.refreshToken;
        // 调用刷新令牌接口
        wx.request({
            url: "".concat(apiBaseUrl, "/api/auth/refresh-token"),
            method: 'POST',
            data: {
                refreshToken: refreshToken
            },
            success: function (res) {
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
                        console.error('保存令牌失败:', e);
                    }
                    // 重新发送所有等待的请求
                    var requestsToRetry = __spreadArray([], refreshQueue, true);
                    // 清空队列
                    refreshQueue.length = 0;
                    // 重试所有请求
                    requestsToRetry.forEach(function (item) {
                        (0, exports.request)(item.options)["catch"](function () {
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
            fail: function () {
                // 请求失败，清除登录状态
                if (app && typeof app.clearAuthData === 'function') {
                    app.clearAuthData();
                }
                // 尝试使用本地模式
                if (app && app.globalData) {
                    app.globalData.apiAvailable = false;
                    // 如果有用户信息，尝试使用本地模式登录
                    if (app.globalData.userInfo && typeof app.mockLogin === 'function') {
                        app.mockLogin(app.globalData.userInfo, function () {
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
            complete: function () {
                // 重置刷新标记
                isRefreshingToken = false;
            }
        });
    }
    else {
        // 已经在刷新中，只添加请求到队列
        refreshQueue.push({ options: options });
    }
    // 无论如何，当前请求都返回错误
    return Promise.reject(new Error('登录已过期，请重新登录'));
};
/**
 * 请求方法
 * @param options 请求参数
 * @returns Promise
 */
var request = function (options) {
    var _a, _b;
    // 添加请求到队列
    var requestId = generateUUID();
    requestQueue.push(requestId);
    // 检查请求URL是否包含API基础URL
    var url = options.url;
    var apiBaseUrl = ((_b = (_a = getApp()) === null || _a === void 0 ? void 0 : _a.globalData) === null || _b === void 0 ? void 0 : _b.apiBaseUrl) || '';
    // 应用请求拦截器
    options = requestInterceptor(options);
    // 记录请求日志
    console.log("[API\u8BF7\u6C42] ".concat(options.method || 'GET', " ").concat(url), options.data);
    // 是否显示加载提示
    if (options.showLoading) {
        showLoadingToast(options.loadingText);
    }
    // 发送请求
    return new Promise(function (resolve, reject) {
        wx.request({
            url: apiBaseUrl + url,
            method: options.method || 'GET',
            data: options.data,
            header: options.header || DEFAULT_HEADER,
            timeout: options.timeout || 30000,
            success: function (res) {
                // 记录响应日志
                console.log("[API\u54CD\u5E94] ".concat(options.method || 'GET', " ").concat(url), res.data);
                // 请求成功，应用响应拦截器
                responseInterceptor(res, options)
                    .then(function (data) { return resolve(data); })["catch"](function (error) {
                    console.error("[API\u9519\u8BEF] ".concat(options.method || 'GET', " ").concat(url), error);
                    reject(error);
                });
            },
            fail: function (error) {
                console.error("[API\u5931\u8D25] ".concat(options.method || 'GET', " ").concat(url), error);
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
            complete: function () {
                // 从请求队列中移除
                var index = requestQueue.indexOf(requestId);
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
exports.request = request;
/**
 * GET请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
var get = function (url, data, options) {
    return (0, exports.request)(__assign({ url: url, method: 'GET', data: data }, options));
};
exports.get = get;
/**
 * POST请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
var post = function (url, data, options) {
    return (0, exports.request)(__assign({ url: url, method: 'POST', data: data }, options));
};
exports.post = post;
/**
 * PUT请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
var put = function (url, data, options) {
    return (0, exports.request)(__assign({ url: url, method: 'PUT', data: data }, options));
};
exports.put = put;
/**
 * DELETE请求
 * @param url 请求地址
 * @param data 请求参数
 * @param options 其他选项
 * @returns Promise
 */
var del = function (url, data, options) {
    return (0, exports.request)(__assign({ url: url, method: 'DELETE', data: data }, options));
};
exports.del = del;
