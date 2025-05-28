"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 成就详情页面
 */
const achievement_1 = require("../../../../utils/achievement");
Page({
    data: {
        achievement: null,
        milestones: [],
        relatedHabits: [],
        loading: true
    },
    onLoad(options) {
        const { id } = options;
        if (id) {
            this.loadAchievementDetail(id);
        }
        else {
            wx.showToast({
                title: '参数错误',
                icon: 'error'
            });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }
    },
    onShareAppMessage() {
        const { achievement } = this.data;
        if (!achievement) {
            return {
                title: '我的成就',
                path: '/pages/profile/achievements/achievements'
            };
        }
        return {
            title: `我解锁了「${achievement.title}」成就！`,
            path: `/pages/profile/achievements/detail/detail?id=${achievement.id}`,
            imageUrl: '/images/share-achievement.png' // 分享图片，需要自行准备
        };
    },
    /**
     * 加载成就详情
     */
    async loadAchievementDetail(id) {
        this.setData({ loading: true });
        try {
            // 获取成就详情
            const achievement = await achievement_1.achievementService.getAchievementById(id);
            if (!achievement) {
                throw new Error('成就不存在');
            }
            // 获取成就里程碑
            const milestones = await achievement_1.achievementService.getMilestones(id);
            // 获取相关习惯
            const relatedHabits = await achievement_1.achievementService.getRelatedHabits(id);
            this.setData({
                achievement,
                milestones,
                relatedHabits,
                loading: false
            });
        }
        catch (error) {
            console.error('加载成就详情失败:', error);
            this.setData({
                loading: false,
                achievement: null
            });
            wx.showToast({
                title: '加载失败',
                icon: 'error'
            });
        }
    },
    /**
     * 跳转到习惯详情
     */
    navigateToHabit(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/habits/detail/detail?id=${id}`
        });
    }
});
