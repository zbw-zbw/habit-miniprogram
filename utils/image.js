"use strict";
/**
 * 图片处理工具函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImageError = exports.getThumbnailUrl = exports.getFullImageUrl = void 0;
const config_1 = require("./config");
/**
 * 获取完整的图片URL
 * @param url 相对路径或完整URL
 * @returns 完整图片URL
 */
const getFullImageUrl = (url) => {
    // 如果已经是完整URL或本地资源，直接返回
    if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/assets/')) {
        return url;
    }
    // 如果是以/uploads开头的相对路径
    if (url.startsWith('/uploads/')) {
        return `${config_1.config.IMAGE_BASE_URL}${url.substring(8)}`; // 移除/uploads前缀
    }
    // 其他情况，拼接图片基础URL
    return `${config_1.config.IMAGE_BASE_URL}/${url}`;
};
exports.getFullImageUrl = getFullImageUrl;
/**
 * 获取图片的缩略图URL
 * @param url 原图URL
 * @param width 宽度
 * @param height 高度
 * @returns 缩略图URL
 */
const getThumbnailUrl = (url, width = 200, height = 200) => {
    const fullUrl = (0, exports.getFullImageUrl)(url);
    // 如果是本地资源，直接返回
    if (!fullUrl || fullUrl.startsWith('/assets/')) {
        return fullUrl;
    }
    // 这里可以根据实际情况添加缩略图处理逻辑
    // 例如：return `${fullUrl}?width=${width}&height=${height}`;
    return fullUrl;
};
exports.getThumbnailUrl = getThumbnailUrl;
/**
 * 处理图片加载错误
 * @param e 错误事件
 * @param defaultImage 默认图片路径
 */
const handleImageError = (e, defaultImage = '/assets/images/default-avatar.png') => {
    // 设置为默认图片
    if (e && e.currentTarget) {
        e.currentTarget.src = defaultImage;
    }
};
exports.handleImageError = handleImageError;
