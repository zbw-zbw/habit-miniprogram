"use strict";
/**
 * 登录状态管理工具
 * 提供在组件和页面中方便使用全局登录状态的方法
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.useAuth = exports.getAuthState = void 0;
/**
 * 获取当前登录状态
 * @returns 包含登录状态的对象
 */
function getAuthState() {
    const app = getApp();
    return {
        hasLogin: app.globalData.hasLogin,
        userInfo: app.globalData.userInfo
    };
}
exports.getAuthState = getAuthState;
/**
 * 在页面或组件中使用登录状态
 * @param page 页面或组件实例
 * @param options 配置选项
 */
function useAuth(page, options = {}) {
    const app = getApp();
    const { onChange, autoUpdate = true } = options;
    // 存储初始登录状态，用于比较变化
    const initialLoginState = app.globalData.hasLogin;
    // 为页面或组件添加一个属性来跟踪上一次的登录状态
    page.__previousLoginState = initialLoginState;
    // 初始化页面或组件的登录状态数据
    if (autoUpdate && typeof page.setData === 'function') {
        page.setData({
            hasLogin: initialLoginState,
            userInfo: app.globalData.userInfo
        });
    }
    // 注册登录状态变化监听
    const callback = (authState) => {
        // 获取上一次的登录状态
        const previousLoginState = page.__previousLoginState;
        // 更新页面或组件的登录状态跟踪
        page.__previousLoginState = authState.hasLogin;
        // 自动更新页面或组件的数据
        if (autoUpdate && typeof page.setData === 'function') {
            page.setData({
                hasLogin: authState.hasLogin,
                userInfo: authState.userInfo
            });
        }
        // 只有在登录状态从未登录变为已登录时才调用自定义回调
        // 或者从已登录变为未登录时
        if (onChange && ((!previousLoginState && authState.hasLogin) || (previousLoginState && !authState.hasLogin))) {
            onChange(authState);
        }
    };
    // 注册到全局登录状态变化监听
    if (typeof app.onLoginStateChange === 'function') {
        app.onLoginStateChange(callback);
    }
    // 在页面或组件卸载时移除监听
    const originalOnUnload = page.onUnload;
    const originalDetached = page.detached; // 组件的卸载方法
    if (typeof page.onUnload === 'function' || typeof originalOnUnload === 'function') {
        // 页面卸载
        page.onUnload = function () {
            // 移除监听器
            if (app.loginStateChangeCallbacks && Array.isArray(app.loginStateChangeCallbacks)) {
                const index = app.loginStateChangeCallbacks.findIndex((cb) => cb === callback);
                if (index !== -1) {
                    app.loginStateChangeCallbacks.splice(index, 1);
                }
            }
            // 调用原始的onUnload
            if (originalOnUnload && typeof originalOnUnload === 'function') {
                originalOnUnload.call(this);
            }
        };
    }
    else if (typeof page.detached === 'function' || typeof originalDetached === 'function') {
        // 组件卸载
        page.detached = function () {
            // 移除监听器
            if (app.loginStateChangeCallbacks && Array.isArray(app.loginStateChangeCallbacks)) {
                const index = app.loginStateChangeCallbacks.findIndex((cb) => cb === callback);
                if (index !== -1) {
                    app.loginStateChangeCallbacks.splice(index, 1);
                }
            }
            // 调用原始的detached
            if (originalDetached && typeof originalDetached === 'function') {
                originalDetached.call(this);
            }
        };
    }
}
exports.useAuth = useAuth;
/**
 * 登录方法
 * @param userInfo 用户信息
 * @returns Promise对象
 */
function login(userInfo) {
    return new Promise((resolve) => {
        const app = getApp();
        app.login(userInfo, (success) => {
            resolve(success);
        });
    });
}
exports.login = login;
/**
 * 登出方法
 * @returns Promise对象
 */
function logout() {
    return new Promise((resolve) => {
        const app = getApp();
        app.logout(() => {
            resolve();
        });
    });
}
exports.logout = logout;
