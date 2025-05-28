"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.del = exports.put = exports.post = exports.get = exports.request = void 0;
// API基础URL
const BASE_URL = 'https://api.example.com';
// 默认请求头
const DEFAULT_HEADER = {
    'content-type': 'application/json'
};
// 请求队列
const requestQueue = [];
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
    // 添加token
    const token = wx.getStorageSync('token');
    if (token) {
        options.header = {
            ...options.header,
            'Authorization': `Bearer ${token}`
        };
    }
    return options;
};
/**
 * 响应拦截器
 * @param response 响应数据
 * @returns 处理后的响应数据
 */
const responseInterceptor = (response) => {
    const { statusCode, data } = response;
    // 请求成功
    if (statusCode >= 200 && statusCode < 300) {
        // 业务状态码正常
        if (data.code === 0) {
            return Promise.resolve(data.data);
        }
        // 登录过期
        if (data.code === 401) {
            // 清除登录状态
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            // 跳转到登录页
            wx.navigateTo({
                url: '/pages/login/login'
            });
            return Promise.reject(new Error('登录已过期，请重新登录'));
        }
        // 其他业务错误
        return Promise.reject(new Error(data.message || '请求失败'));
    }
    // 请求失败
    return Promise.reject(new Error(`网络请求失败，状态码：${statusCode}`));
};
/**
 * 发送请求
 * @param options 请求参数
 * @returns Promise
 */
const request = (options) => {
    // 处理请求参数
    const { url, method = 'GET', data, header = {}, timeout = 10000, showLoading = true, loadingText = '加载中...', hideErrorToast = false } = requestInterceptor(options);
    // 显示加载提示
    if (showLoading) {
        requestQueue.push(url);
        showLoadingToast(loadingText);
    }
    // 发送请求
    return new Promise((resolve, reject) => {
        wx.request({
            url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
            method,
            data,
            header: { ...DEFAULT_HEADER, ...header },
            timeout,
            success: (res) => {
                try {
                    responseInterceptor(res)
                        .then(resolve)
                        .catch(error => {
                        if (!hideErrorToast) {
                            showErrorToast(error.message);
                        }
                        reject(error);
                    });
                }
                catch (error) {
                    if (!hideErrorToast) {
                        showErrorToast('数据解析失败');
                    }
                    reject(error);
                }
            },
            fail: (error) => {
                if (!hideErrorToast) {
                    showErrorToast('网络请求失败');
                }
                reject(error);
            },
            complete: () => {
                // 移除请求队列
                const index = requestQueue.indexOf(url);
                if (index > -1) {
                    requestQueue.splice(index, 1);
                }
                // 隐藏加载提示
                if (showLoading) {
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
