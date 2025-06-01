"use strict";
exports.__esModule = true;
exports.authAPI = void 0;
/**
 * 认证相关API
 */
var request_1 = require("../../utils/request");
exports.authAPI = {
    /**
     * 用户注册
     * @param userData 用户数据
     * @returns Promise
     */
    register: function (userData) {
        return (0, request_1.post)('/api/auth/register', userData);
    },
    /**
     * 用户登录
     * @param credentials 登录凭证
     * @returns Promise
     */
    login: function (credentials) {
        return (0, request_1.post)('/api/auth/login', credentials);
    },
    /**
     * 微信登录
     * @param wxData 微信登录数据
     * @returns Promise
     */
    wxLogin: function (wxData) {
        return (0, request_1.post)('/api/auth/wx-login', wxData);
    },
    /**
     * 刷新令牌
     * @param refreshToken 刷新令牌
     * @returns Promise
     */
    refreshToken: function (refreshToken) {
        return (0, request_1.post)('/api/auth/refresh-token', { refreshToken: refreshToken });
    },
    /**
     * 登出
     * @returns Promise
     */
    logout: function () {
        return (0, request_1.post)('/api/auth/logout');
    }
};
