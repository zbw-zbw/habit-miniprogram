"use strict";
/**
 * 图片处理工具函数
 */
exports.__esModule = true;
exports.getThumbnailUrl = exports.getFullImageUrl = void 0;
/**
 * 处理图片URL，确保它包含完整的URL路径
 * @param url 图片URL
 * @returns 完整的图片URL
 */
function getFullImageUrl(url) {
    if (!url)
        return '';
    // 如果已经是完整URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // 如果是本地路径，直接返回
    if (url.startsWith('/assets/')) {
        return url;
    }
    // 如果是相对路径，添加baseURL
    var baseUrl = getBaseUrl();
    if (url.startsWith('/')) {
        return baseUrl + url;
    }
    // 其他情况，假设是相对于baseURL的路径
    return baseUrl + '/' + url;
}
exports.getFullImageUrl = getFullImageUrl;
/**
 * 获取基础URL
 * @returns 基础URL
 */
function getBaseUrl() {
    try {
        // @ts-ignore
        return wx.getStorageSync('apiBaseUrl') || '';
    }
    catch (e) {
        return '';
    }
}
/**
 * 获取图片的缩略图URL
 * @param url 原图URL
 * @param width 宽度
 * @param height 高度
 * @returns 缩略图URL
 */
function getThumbnailUrl(url, width, height) {
    if (width === void 0) { width = 200; }
    if (height === void 0) { height = 200; }
    var fullUrl = getFullImageUrl(url);
    // 如果是本地资源，直接返回
    if (fullUrl.startsWith('/assets/')) {
        return fullUrl;
    }
    // 这里可以根据实际情况添加缩略图处理逻辑
    // 例如：return `${fullUrl}?width=${width}&height=${height}`;
    return fullUrl;
}
exports.getThumbnailUrl = getThumbnailUrl;
