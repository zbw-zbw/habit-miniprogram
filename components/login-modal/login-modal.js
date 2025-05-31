"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../utils/auth");
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        show: {
            type: Boolean,
            value: false
        },
        message: {
            type: String,
            value: '请先登录以使用此功能'
        }
    },
    /**
     * 组件的初始数据
     */
    data: {},
    /**
     * 组件的方法列表
     */
    methods: {
        // 阻止滑动穿透
        preventTouchMove() {
            return false;
        },
        // 点击遮罩关闭
        onClickMask() {
            this.onClose();
        },
        // 关闭模态框
        onClose() {
            this.triggerEvent('close');
        },
        // 点击登录按钮
        onLogin() {
            (0, auth_1.login)((success) => {
                if (success) {
                    this.triggerEvent('success');
                }
                else {
                    this.triggerEvent('fail');
                }
                this.triggerEvent('close');
            });
        }
    }
});
