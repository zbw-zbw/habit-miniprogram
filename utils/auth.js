"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = void 0;
/**
 * 统一登录方法
 * @param callback 登录成功或失败的回调函数
 */
function login(callback) {
    wx.showLoading({
        title: '登录中',
    });
    // 获取微信登录凭证
    wx.login({
        success: (loginRes) => {
            if (loginRes.code) {
                // 展示用户信息设置界面
                getUserProfile(loginRes.code, callback);
            }
            else {
                wx.hideLoading();
                wx.showToast({
                    title: '登录失败',
                    icon: 'error',
                });
                if (typeof callback === 'function') {
                    callback(false);
                }
            }
        },
        fail: (err) => {
            wx.hideLoading();
            wx.showToast({
                title: '登录失败',
                icon: 'error',
            });
            if (typeof callback === 'function') {
                callback(false);
            }
        },
    });
}
exports.login = login;
/**
 * 获取用户信息并登录
 * @param code 微信登录凭证
 * @param callback 登录回调
 */
function getUserProfile(code, callback) {
    // 获取用户信息
    wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
            const app = getApp();
            // 添加ID属性以满足IUserInfo接口要求
            const userInfo = {
                ...res.userInfo,
                id: 'temp_' + Date.now(),
                createdAt: new Date().toISOString(),
                nickName: res.userInfo.nickName, // 确保使用正确的属性名
            };
            // 获取API基础URL
            const apiBaseUrl = app.globalData.apiBaseUrl || '';
            // 调用后端API进行登录
            wx.request({
                url: `${apiBaseUrl}/api/auth/wx-login`,
                method: 'POST',
                data: {
                    code: code,
                    userInfo: userInfo,
                },
                success: (res) => {
                    if (res.statusCode === 200 && res.data && res.data.success) {
                        // 保存令牌和用户信息
                        const responseData = res.data.data;
                        app.globalData.token = responseData.token;
                        app.globalData.refreshToken = responseData.refreshToken || null;
                        app.globalData.userInfo = responseData.user;
                        app.globalData.hasLogin = true;
                        // 保存到本地存储
                        try {
                            wx.setStorageSync('token', app.globalData.token);
                            if (app.globalData.refreshToken) {
                                wx.setStorageSync('refreshToken', app.globalData.refreshToken);
                            }
                            wx.setStorageSync('userInfo', app.globalData.userInfo);
                        }
                        catch (e) {
                        }
                        // 通知登录状态变化
                        app.notifyLoginStateChanged();
                        wx.showToast({
                            title: '登录成功',
                            icon: 'success',
                        });
                        // 刷新当前页面数据
                        app.refreshCurrentPageData && app.refreshCurrentPageData();
                        if (callback) {
                            callback(true);
                        }
                    }
                    else {
                        wx.showToast({
                            title: '登录失败',
                            icon: 'error',
                        });
                        if (callback) {
                            callback(false);
                        }
                    }
                },
                fail: (err) => {
                    wx.showToast({
                        title: '登录失败',
                        icon: 'error',
                    });
                    if (callback) {
                        callback(false);
                    }
                },
                complete: () => {
                    wx.hideLoading();
                },
            });
        },
        fail: () => {
            wx.hideLoading();
            wx.showToast({
                title: '已取消',
                icon: 'none',
            });
            if (callback) {
                callback(false);
            }
        },
    });
}
/**
 * 退出登录
 * @param callback 登出后的回调函数
 */
function logout(callback) {
    wx.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
            if (res.confirm) {
                const app = getApp();
                app.logout(() => {
                    wx.showToast({
                        title: '已退出登录',
                        icon: 'success',
                    });
                    // 调用回调函数
                    if (typeof callback === 'function') {
                        callback();
                    }
                });
            }
        },
    });
}
exports.logout = logout;
