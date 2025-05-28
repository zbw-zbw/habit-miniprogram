"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 个人中心页面
 */
const storage_1 = require("../../utils/storage");
const achievement_1 = require("../../utils/achievement");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        userInfo: null,
        hasLogin: false,
        loading: true,
        stats: {
            totalHabits: 0,
            completedToday: 0,
            totalCheckins: 0,
            currentStreak: 0,
            longestStreak: 0
        },
        achievements: [],
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        this.loadUserInfo();
        this.loadStats();
        this.loadAchievements();
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 每次显示页面时加载最新数据
        this.loadUserInfo();
        this.loadStats();
    },
    /**
     * 加载用户信息
     */
    loadUserInfo() {
        const app = getApp();
        this.setData({
            userInfo: app.globalData.userInfo,
            hasLogin: app.globalData.hasLogin,
            'settings.theme': app.globalData.theme || 'light'
        });
        // 监听主题变化
        if (typeof app.onThemeChange === 'function') {
            app.onThemeChange((theme) => {
                this.setData({
                    'settings.theme': theme
                });
            });
        }
    },
    /**
     * 加载统计数据
     */
    loadStats() {
        this.setData({ loading: true });
        // 获取习惯和打卡数据
        const habits = (0, storage_1.getHabits)();
        const checkins = (0, storage_1.getCheckins)();
        // 计算总习惯数
        const totalHabits = habits.length;
        // 计算今日完成数
        const today = new Date();
        const todayStr = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');
        const completedToday = checkins.filter(c => c.date === todayStr && c.isCompleted).length;
        // 计算总打卡次数
        const totalCheckins = checkins.filter(c => c.isCompleted).length;
        // 计算连续天数（简化实现）
        const currentStreak = 5; // 模拟数据
        const longestStreak = 12; // 模拟数据
        this.setData({
            'stats.totalHabits': totalHabits,
            'stats.completedToday': completedToday,
            'stats.totalCheckins': totalCheckins,
            'stats.currentStreak': currentStreak,
            'stats.longestStreak': longestStreak,
            loading: false
        });
    },
    /**
     * 加载成就数据
     */
    async loadAchievements() {
        try {
            // 获取所有成就
            const achievements = await achievement_1.achievementService.getAllAchievements();
            // 只显示前4个成就
            const topAchievements = achievements.slice(0, 4);
            this.setData({ achievements: topAchievements });
        }
        catch (error) {
            console.error('加载成就数据失败:', error);
            this.setData({ achievements: [] });
        }
    },
    /**
     * 用户登录
     */
    login() {
        wx.showLoading({
            title: '登录中'
        });
        // 获取用户信息
        wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (res) => {
                const app = getApp();
                // 添加ID属性以满足IUserInfo接口要求
                const userInfo = {
                    ...res.userInfo,
                    id: 'temp_' + Date.now()
                };
                app.login(userInfo, (success) => {
                    if (success) {
                        this.setData({
                            userInfo: app.globalData.userInfo,
                            hasLogin: true
                        });
                        wx.showToast({
                            title: '登录成功',
                            icon: 'success'
                        });
                    }
                    else {
                        wx.showToast({
                            title: '登录失败',
                            icon: 'error'
                        });
                    }
                });
            },
            fail: () => {
                wx.showToast({
                    title: '已取消',
                    icon: 'none'
                });
            },
            complete: () => {
                wx.hideLoading();
            }
        });
    },
    /**
     * 用户登出
     */
    logout() {
        wx.showModal({
            title: '确认退出',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    const app = getApp();
                    app.logout(() => {
                        this.setData({
                            userInfo: null,
                            hasLogin: false
                        });
                        wx.showToast({
                            title: '已退出登录',
                            icon: 'success'
                        });
                    });
                }
            }
        });
    },
    /**
     * 页面导航
     */
    navigateTo(e) {
        const { url } = e.currentTarget.dataset;
        wx.navigateTo({ url });
    },
    /**
     * 成就详情导航
     */
    navigateToAchievement(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/profile/achievements/detail/detail?id=${id}`
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '习惯打卡小程序',
            path: '/pages/index/index'
        };
    }
});
