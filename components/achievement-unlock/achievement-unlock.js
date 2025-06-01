/**
 * 成就解锁通知组件
 * 用于显示用户解锁新成就时的弹窗提示
 */
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        achievement: {
            type: Object,
            value: {}
        },
        visible: {
            type: Boolean,
            value: false
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        animationData: {},
        showConfetti: false,
        isAnimating: false
    },
    /**
     * 组件的生命周期
     */
    lifetimes: {
        attached() {
            this.animation = wx.createAnimation({
                duration: 300,
                timingFunction: 'ease',
            });
        },
        ready() {
            if (this.properties.visible) {
                setTimeout(() => {
                    this.showAnimation();
                }, 100);
            }
        },
        detached() {
            if (this._timer) {
                clearTimeout(this._timer);
            }
        }
    },
    /**
     * 数据监听器
     */
    observers: {
        'visible': function (visible) {
            if (visible) {
                this.showAnimation();
            }
            else {
                this.hideAnimation();
            }
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 显示动画
         */
        showAnimation() {
            if (this.data.isAnimating) {
                return;
            }
            if (!this.animation) {
                this.animation = wx.createAnimation({
                    duration: 300,
                    timingFunction: 'ease',
                });
            }
            this.setData({
                isAnimating: true
            });
            // 重置动画
            this.animation.opacity(0).scale(0.8).step({ duration: 0 });
            // 设置初始状态
            this.setData({
                animationData: this.animation.export()
            });
            // 清理之前的定时器
            if (this._timer) {
                clearTimeout(this._timer);
            }
            // 延迟一帧执行显示动画
            this._timer = setTimeout(() => {
                this.animation.opacity(1).scale(1).step();
                this.setData({
                    animationData: this.animation.export(),
                    showConfetti: true
                });
                // 动画结束后重置标记
                this._timer = setTimeout(() => {
                    this.setData({
                        isAnimating: false
                    });
                }, 300);
            }, 50);
        },
        /**
         * 隐藏动画
         */
        hideAnimation() {
            if (!this.animation) {
                return;
            }
            // 清理之前的定时器
            if (this._timer) {
                clearTimeout(this._timer);
            }
            this.animation.opacity(0).scale(0.8).step();
            this.setData({
                animationData: this.animation.export(),
                showConfetti: false,
                isAnimating: false
            });
        },
        /**
         * 关闭通知
         */
        onClose() {
            this.triggerEvent('close');
        },
        /**
         * 查看详情
         */
        onViewDetail() {
            const { achievement } = this.properties;
            this.triggerEvent('view', { achievementId: achievement.id });
            this.triggerEvent('close');
        },
        /**
         * 分享成就
         */
        onShare() {
            this.triggerEvent('share', { achievement: this.properties.achievement });
        },
        /**
         * 阻止事件冒泡
         */
        stopPropagation() {
            // 阻止事件冒泡
        }
    }
});
