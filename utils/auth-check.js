"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLoginCheck = exports.checkLogin = void 0;
/**
 * 检查用户是否已登录，如果未登录则显示登录提示
 * @param page 页面实例
 * @param message 登录提示信息
 * @param onSuccess 登录成功后的回调函数
 * @returns 用户是否已登录
 */
function checkLogin(page, message = '请先登录以使用此功能', onSuccess = null) {
    const app = getApp();
    if (!app.globalData.hasLogin) {
        // 如果未登录，显示登录提示模态框
        page.setData({
            'loginModal.show': true,
            'loginModal.message': message
        });
        // 设置登录成功的回调
        page.loginSuccess = onSuccess || undefined;
        return false;
    }
    // 已登录，可以执行后续操作
    return true;
}
exports.checkLogin = checkLogin;
/**
 * 在页面中集成登录检查功能
 * @param page 页面实例
 */
function setupLoginCheck(page) {
    // 混入登录模态框处理方法
    if (!page.onLoginModalClose) {
        page.onLoginModalClose = function () {
            this.setData({
                'loginModal.show': false
            });
        };
    }
    if (!page.onLoginSuccess) {
        page.onLoginSuccess = function () {
            if (typeof this.loginSuccess === 'function') {
                this.loginSuccess();
            }
        };
    }
    if (!page.onLoginFail) {
        page.onLoginFail = function () {
            console.log('用户登录失败或取消');
        };
    }
    // 确保页面初始数据中包含loginModal
    if (!page.data.loginModal) {
        page.setData({
            loginModal: {
                show: false,
                message: '请先登录以使用此功能'
            }
        });
    }
}
exports.setupLoginCheck = setupLoginCheck;
