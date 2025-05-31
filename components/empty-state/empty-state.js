"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const use_auth_1 = require("../../utils/use-auth");
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        title: {
            type: String,
            value: '暂无数据'
        },
        description: {
            type: String,
            value: '暂时没有任何内容可以显示'
        },
        icon: {
            type: String,
            value: '/assets/images/empty.png'
        },
        actionText: {
            type: String,
            value: '添加内容'
        },
        showAction: {
            type: Boolean,
            value: true
        },
        hasLogin: {
            type: Boolean,
            value: false
        },
        showLoginButton: {
            type: Boolean,
            value: true
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        // 本地登录状态，从全局获取
        localHasLogin: false
    },
    /**
     * 组件生命周期
     */
    lifetimes: {
        attached() {
            // 初始化时获取一次登录状态
            const authState = (0, use_auth_1.getAuthState)();
            this.setData({
                localHasLogin: authState.hasLogin
            });
            // 注册登录状态变化监听
            const app = getApp();
            if (typeof app.onLoginStateChange === 'function') {
                app.onLoginStateChange(this.onAuthStateChange.bind(this));
            }
        },
        detached() {
            // 组件销毁时，可以清理监听器，但这里无法直接访问回调函数引用
            // 因此依赖于App实例在页面销毁时自动清理
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 登录状态变化回调
         */
        onAuthStateChange(authState) {
            this.setData({
                localHasLogin: authState.hasLogin
            });
        },
        /**
         * 点击操作按钮
         */
        onActionTap() {
            this.triggerEvent('action');
        },
        /**
         * 点击登录按钮
         */
        onLoginTap() {
            this.triggerEvent('login');
        }
    }
});
