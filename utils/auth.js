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
            app.login(userInfo, (success) => {
                if (success) {
                    wx.showToast({
                        title: '登录成功',
                        icon: 'success',
                    });
                }
                else {
                    wx.showToast({
                        title: '登录失败',
                        icon: 'error',
                    });
                }
                // 调用回调函数传递登录结果
                if (typeof callback === 'function') {
                    callback(success);
                }
            });
        },
        fail: () => {
            wx.showToast({
                title: '已取消',
                icon: 'none',
            });
            // 调用回调函数并传递失败结果
            if (typeof callback === 'function') {
                callback(false);
            }
        },
        complete: () => {
            wx.hideLoading();
        },
    });
}
exports.login = login;
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
