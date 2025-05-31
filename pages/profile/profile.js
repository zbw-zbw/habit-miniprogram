"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 个人中心页面
 */
const date_1 = require("../../utils/date");
const api_1 = require("../../services/api");
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
        Promise.all([
            api_1.habitAPI.getHabits(),
            api_1.checkinAPI.getCheckins()
        ])
            .then(([habits, checkins]) => {
            const today = (0, date_1.formatDate)(new Date());
            // 计算总习惯数
            const totalHabits = habits.length;
            // 计算今日完成数
            const completedToday = checkins.filter(c => c.date === today && c.isCompleted).length;
            // 计算总打卡次数
            const totalCheckins = checkins.filter(c => c.isCompleted).length;
            // 获取所有习惯的统计数据
            const activeHabits = habits.filter(h => !h.isArchived);
            const statsPromises = activeHabits.map(habit => {
                // 确保习惯ID不为undefined
                const habitId = habit.id || habit._id;
                if (!habitId) {
                    console.error('习惯ID不存在:', habit);
                    return Promise.resolve({
                        totalCompletions: 0,
                        totalDays: 0,
                        completionRate: 0,
                        currentStreak: 0,
                        longestStreak: 0,
                        lastCompletedDate: null
                    });
                }
                return api_1.habitAPI.getHabitStats(habitId);
            });
            return Promise.all([
                Promise.resolve(totalHabits),
                Promise.resolve(completedToday),
                Promise.resolve(totalCheckins),
                Promise.all(statsPromises)
            ]);
        })
            .then(([totalHabits, completedToday, totalCheckins, statsArray]) => {
            // 计算最大连续天数和当前连续天数
            let maxCurrentStreak = 0;
            let maxLongestStreak = 0;
            statsArray.forEach(stats => {
                maxCurrentStreak = Math.max(maxCurrentStreak, stats.currentStreak || 0);
                maxLongestStreak = Math.max(maxLongestStreak, stats.longestStreak || 0);
            });
            this.setData({
                'stats.totalHabits': totalHabits,
                'stats.completedToday': completedToday,
                'stats.totalCheckins': totalCheckins,
                'stats.currentStreak': maxCurrentStreak,
                'stats.longestStreak': maxLongestStreak,
                loading: false
            });
        })
            .catch(error => {
            console.error('加载统计数据失败:', error);
            this.setData({ loading: false });
        });
    },
    /**
     * 加载成就数据
     */
    async loadAchievements() {
        try {
            // 获取用户成就
            const achievements = await api_1.userAPI.getAchievements();
            // 只显示前3个成就
            const topAchievements = achievements.slice(0, 3);
            this.setData({ achievements: topAchievements });
        }
        catch (error) {
            console.error('加载成就数据失败:', error);
            // 错误处理，不显示默认成就
            this.setData({ achievements: [] });
            // 显示错误提示
            wx.showToast({
                title: '获取成就失败',
                icon: 'none'
            });
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
                        // 登录成功后重新加载数据
                        this.loadStats();
                        this.loadAchievements();
                        // 注意：登录状态变化会通过app.notifyLoginStateChanged()通知所有页面，
                        // 包括首页，无需手动更新其他页面
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
