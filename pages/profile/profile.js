"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../services/api");
const auth_1 = require("../../utils/auth");
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
            longestStreak: 0,
        },
        achievements: [],
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        this.loadUserInfo();
        this.loadProfileData();
    },
    /**
     * 加载用户信息
     */
    loadUserInfo() {
        const app = getApp();
        this.setData({
            userInfo: app.globalData.userInfo,
            hasLogin: app.globalData.hasLogin,
            'settings.theme': app.globalData.theme || 'light',
        });
        // 监听主题变化
        if (typeof app.onThemeChange === 'function') {
            app.onThemeChange((theme) => {
                this.setData({
                    'settings.theme': theme,
                });
            });
        }
    },
    /**
     * 加载个人资料数据
     */
    loadProfileData() {
        this.setData({ loading: true });
        // 检查是否已登录，未登录则不请求数据
        if (!this.data.hasLogin) {
            this.setData({
                loading: false,
                stats: {
                    totalHabits: 0,
                    completedToday: 0,
                    totalCheckins: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                },
                achievements: [],
            });
            return;
        }
        // 使用新的聚合API获取所有数据
        api_1.userAPI
            .getProfileAll()
            .then((data) => {
            // 更新统计数据
            this.setData({
                'stats.totalHabits': data.stats.totalHabits,
                'stats.completedToday': data.stats.completedToday,
                'stats.totalCheckins': data.stats.totalCheckins,
                'stats.currentStreak': data.stats.currentStreak,
                'stats.longestStreak': data.stats.longestStreak,
                // 更新成就数据
                achievements: data.achievements,
                loading: false,
            });
        })
            .catch((error) => {
            this.setData({ loading: false });
        });
    },
    /**
     * 用户登录
     */
    login() {
        // 使用公共登录方法
        (0, auth_1.login)((success) => {
            if (success) {
                // 登录成功后，获取最新的用户信息
                const app = getApp();
                this.setData({
                    userInfo: app.globalData.userInfo,
                    hasLogin: true,
                });
                // 登录成功后重新加载数据
                this.loadProfileData();
            }
        });
    },
    /**
     * 用户登出
     */
    logout() {
        // 使用公共登出方法
        (0, auth_1.logout)(() => {
            this.setData({
                userInfo: null,
                hasLogin: false,
                stats: {
                    totalHabits: 0,
                    completedToday: 0,
                    totalCheckins: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                },
                achievements: [],
            });
        });
    },
    /**
     * 导航到指定页面
     */
    navigateTo(e) {
        const url = e.currentTarget.dataset.url;
        wx.navigateTo({ url });
    },
    /**
     * 导航到成就详情页
     */
    navigateToAchievement(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/profile/achievements/detail/detail?id=${id}`,
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '我的习惯养成进度',
            path: '/pages/index/index',
            imageUrl: '/assets/images/share-profile.png',
        };
    },
});
