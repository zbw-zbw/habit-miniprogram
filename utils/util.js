"use strict";
/**
 * 通用工具函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNetworkStatus = exports.getCurrentPagePath = exports.copyToClipboard = exports.formatFileSize = exports.throttle = exports.debounce = exports.generateRandomColor = exports.generateUUID = void 0;
/**
 * 生成UUID
 * @returns UUID字符串
 */
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
exports.generateUUID = generateUUID;
/**
 * 生成随机颜色
 * @returns 十六进制颜色值
 */
const generateRandomColor = () => {
    // 预定义的颜色数组，符合设计规范
    const colors = [
        '#4F7CFF',
        '#67C23A',
        '#E6A23C',
        '#F56C6C',
        '#909399',
        '#5E72E4',
        '#11CDEF',
        '#FB6340',
        '#2DCE89',
        '#F5365C', // 红色
    ];
    // 随机选择一个颜色
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
};
exports.generateRandomColor = generateRandomColor;
/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
const debounce = (func, wait) => {
    let timeout = null;
    return function (...args) {
        const context = this;
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
};
exports.debounce = debounce;
/**
 * 节流函数
 * @param func 要执行的函数
 * @param wait 间隔时间（毫秒）
 * @returns 节流处理后的函数
 */
const throttle = (func, wait) => {
    let timeout = null;
    let previous = 0;
    return function (...args) {
        const context = this;
        const now = Date.now();
        const remaining = wait - (now - previous);
        if (remaining <= 0 || remaining > wait) {
            if (timeout !== null) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(context, args);
        }
        else if (timeout === null) {
            timeout = setTimeout(() => {
                previous = Date.now();
                timeout = null;
                func.apply(context, args);
            }, remaining);
        }
    };
};
exports.throttle = throttle;
/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小
 */
const formatFileSize = (bytes) => {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
exports.formatFileSize = formatFileSize;
/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise
 */
const copyToClipboard = (text) => {
    return new Promise((resolve, reject) => {
        wx.setClipboardData({
            data: text,
            success: () => {
                wx.showToast({
                    title: '复制成功',
                    icon: 'success',
                    duration: 1500
                });
                resolve();
            },
            fail: (error) => {
                wx.showToast({
                    title: '复制失败',
                    icon: 'none',
                    duration: 1500
                });
                reject(error);
            }
        });
    });
};
exports.copyToClipboard = copyToClipboard;
/**
 * 获取当前页面路径
 * @returns 当前页面路径
 */
const getCurrentPagePath = () => {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    return currentPage.route;
};
exports.getCurrentPagePath = getCurrentPagePath;
/**
 * 检查网络状态
 * @returns Promise<boolean> 是否有网络连接
 */
const checkNetworkStatus = () => {
    return new Promise((resolve) => {
        wx.getNetworkType({
            success: (res) => {
                resolve(res.networkType !== 'none');
            },
            fail: () => {
                resolve(false);
            }
        });
    });
};
exports.checkNetworkStatus = checkNetworkStatus;
