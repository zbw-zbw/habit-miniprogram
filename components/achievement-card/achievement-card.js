"use strict";
/**
 * 成就卡片组件
 * 用于展示用户获得的成就和进度
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
        showDetails: {
            type: Boolean,
            value: false
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        progressPercent: '0%',
        isNew: false
    },
    /**
     * 组件的生命周期
     */
    lifetimes: {
        attached() {
            this.initAchievement();
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 初始化成就数据
         */
        initAchievement() {
            const achievement = this.properties.achievement;
            if (!achievement || !achievement.id)
                return;
            // 计算进度百分比
            const progressPercent = `${achievement.progress}%`;
            // 判断是否为新获得的成就（7天内）
            let isNew = false;
            if (achievement.completedAt) {
                const completedDate = new Date(achievement.completedAt);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - completedDate.getTime()) / (24 * 60 * 60 * 1000));
                isNew = diffDays <= 7;
            }
            this.setData({
                progressPercent,
                isNew
            });
        },
        /**
         * 查看成就详情
         */
        viewDetail() {
            const { achievement } = this.properties;
            this.triggerEvent('view', { achievementId: achievement.id });
        }
    }
});
