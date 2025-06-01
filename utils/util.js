"use strict";
/**
 * 通用工具函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTimeAgo = exports.formatRelativeTime = exports.formatDate = exports.checkNetworkStatus = exports.getCurrentPagePath = exports.copyToClipboard = exports.formatFileSize = exports.throttle = exports.debounce = exports.generateRandomColor = exports.generateUUID = void 0;
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
/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @param format 格式化模式，默认为'YYYY-MM-DD HH:mm'
 * @returns 格式化后的日期字符串
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm') => {
    const d = typeof date === 'string' ? new Date(date) : date;
    // 处理无效日期
    if (isNaN(d.getTime())) {
        return '无效日期';
    }
    const year = d.getFullYear().toString();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};
exports.formatDate = formatDate;
/**
 * 格式化相对时间（例如"3分钟前"）
 * @param date 日期对象或日期字符串
 * @returns 相对时间字符串
 */
const formatRelativeTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    // 处理无效日期
    if (isNaN(d.getTime())) {
        return '无效日期';
    }
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    // 小于1分钟
    if (diffSec < 60) {
        return '刚刚';
    }
    // 小于1小时
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
        return `${diffMin}分钟前`;
    }
    // 小于1天
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) {
        return `${diffHour}小时前`;
    }
    // 小于30天
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) {
        return `${diffDay}天前`;
    }
    // 小于12个月
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) {
        return `${diffMonth}个月前`;
    }
    // 大于等于12个月
    const diffYear = Math.floor(diffMonth / 12);
    return `${diffYear}年前`;
};
exports.formatRelativeTime = formatRelativeTime;
/**
 * 格式化时间为相对时间（如：5分钟前，1小时前等）
 * @param time 时间字符串或时间戳
 * @returns 格式化后的相对时间字符串
 */
function formatTimeAgo(time) {
    const now = new Date();
    const date = typeof time === 'string' ? new Date(time) : new Date(time);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // 秒数差
    if (diff < 60) {
        return `${diff}秒前`;
    }
    else if (diff < 3600) {
        return `${Math.floor(diff / 60)}分钟前`;
    }
    else if (diff < 86400) {
        return `${Math.floor(diff / 3600)}小时前`;
    }
    else if (diff < 2592000) {
        return `${Math.floor(diff / 86400)}天前`;
    }
    else if (diff < 31536000) {
        return `${Math.floor(diff / 2592000)}个月前`;
    }
    else {
        return `${Math.floor(diff / 31536000)}年前`;
    }
}
exports.formatTimeAgo = formatTimeAgo;
