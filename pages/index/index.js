"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 首页
 */
const date_1 = require("../../utils/date");
const dashboard_1 = require("../../services/api/dashboard");
const auth_1 = require("../../utils/auth");
const auth_check_1 = require("../../utils/auth-check");
const use_auth_1 = require("../../utils/use-auth");
// 修改默认习惯数据以符合新的类型定义
const DEFAULT_HABITS = [
    {
        id: 'sample1',
        name: '阅读',
        description: '每天阅读30分钟',
        category: 'learning',
        icon: 'book',
        color: '#4F7CFF',
        frequency: { type: 'daily' },
        isArchived: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
    },
    {
        id: 'sample2',
        name: '锻炼',
        description: '每天锻炼30分钟',
        category: 'health',
        icon: 'run',
        color: '#67C23A',
        frequency: { type: 'daily' },
        isArchived: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
    },
];
// 默认打卡记录（当API不可用时使用）
const DEFAULT_CHECKINS = [];
Page({
    /**
     * 页面的初始数据
     */
    data: {
        todayHabits: [],
        habitStats: {},
        todayCheckins: [],
        loading: {
            habits: true,
            checkins: true,
            stats: true,
        },
        error: {
            habits: '',
            checkins: '',
            stats: '',
        },
        userInfo: null,
        hasLogin: false,
        today: '',
        weekday: '',
        completedCount: 0,
        totalCount: 0,
        completionRate: 0,
        completionRateDisplay: '0',
        currentStreak: 0,
        motto: '',
        showAchievementUnlock: false,
        unlockedAchievement: null,
        apiAvailable: true,
        loginModal: {
            show: false,
            message: '请先登录以使用此功能',
        },
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        const app = getApp();
        // 获取当前日期和星期
        const today = (0, date_1.getCurrentDate)();
        const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdayNames[new Date(today).getDay()];
        // 获取随机格言
        const motto = this.getRandomMotto();
        // 设置基础数据
        this.setData({
            today,
            weekday,
            userInfo: app.globalData.userInfo,
            hasLogin: app.globalData.hasLogin,
            apiAvailable: app.apiAvailable || true,
        });
        // 使用useAuth工具获取全局登录状态
        (0, use_auth_1.useAuth)(this);
        // 监听成就解锁事件
        if (typeof app.onAchievementUnlock === 'function') {
            app.onAchievementUnlock(this.onAchievementUnlock.bind(this));
        }
        else {
            console.error('App.onAchievementUnlock 方法不存在');
        }
        // 监听登录状态变化
        if (typeof app.onLoginStateChange === 'function') {
            app.onLoginStateChange(this.onLoginStateChange.bind(this));
        }
        else {
            console.error('App.onLoginStateChange 方法不存在');
        }
        // 设置登录检查功能
        (0, auth_check_1.setupLoginCheck)(this);
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        this.loadData();
    },
    /**
     * 加载所有数据
     */
    loadData() {
        const today = (0, date_1.getCurrentDate)();
        // 重置加载状态
        this.setData({
            'loading.habits': true,
            'loading.checkins': true,
            'loading.stats': true,
            'error.habits': '',
            'error.checkins': '',
            'error.stats': '',
        });
        // 如果未登录，则显示默认内容或空状态，不发起API请求
        if (!this.data.hasLogin) {
            // 处理未登录状态，显示默认数据或欢迎信息
            this.setData({
                todayHabits: [],
                todayCheckins: [],
                habitStats: {},
                completedCount: 0,
                totalCount: 0,
                completionRate: 0,
                completionRateDisplay: '0',
                currentStreak: 0,
                'loading.habits': false,
                'loading.checkins': false,
                'loading.stats': false,
            });
            return;
        }
        // 已登录，使用聚合API加载数据
        dashboard_1.dashboardAPI
            .getDashboard(today, { days: 30 })
            .then((dashboardData) => {
            // 处理数据并更新UI
            this.processDashboardData(dashboardData);
        })
            .catch((error) => {
            console.error('加载数据失败:', error);
            // 设置加载失败状态，确保loading被重置
            this.setData({
                'loading.habits': false,
                'loading.checkins': false,
                'loading.stats': false,
                'error.habits': '加载数据失败，请重试',
                'error.checkins': '加载数据失败，请重试',
                'error.stats': '加载数据失败，请重试',
            });
        });
    },
    /**
     * 处理仪表盘数据
     */
    processDashboardData(dashboardData, errorMessage = '') {
        const today = this.data.today;
        // 提取所需数据
        const { todayHabits, completedHabits, stats, habitStats } = dashboardData;
        // 计算完成率
        const completedCount = completedHabits.length;
        const totalCount = todayHabits.length;
        const completionRate = stats.completionRate;
        const completionRateDisplay = Math.floor(completionRate).toString();
        // 处理连续打卡天数
        let currentStreak = stats.currentStreak || 0;
        // 如果API返回的连续打卡天数为0，但是习惯自身的stats中有连续打卡天数，则使用习惯的数据
        if (currentStreak === 0 && habitStats) {
            // 遍历所有习惯统计数据
            Object.values(habitStats).forEach((habitStat) => {
                if (habitStat && habitStat.currentStreak > 0) {
                    // 使用最大的连续打卡天数
                    currentStreak = Math.max(currentStreak, habitStat.currentStreak || 0);
                }
            });
        }
        // 如果还是0，尝试从习惯本身的stats获取
        if (currentStreak === 0 && Array.isArray(todayHabits)) {
            todayHabits.forEach((habit) => {
                if (habit.stats && habit.stats.currentStreak > 0) {
                    currentStreak = Math.max(currentStreak, habit.stats.currentStreak);
                }
            });
        }
        // 设置数据
        this.setData({
            todayHabits,
            todayCheckins: dashboardData.recentCheckins.filter((c) => c.date === today),
            habitStats,
            completedCount,
            totalCount,
            completionRate,
            completionRateDisplay,
            currentStreak,
            'loading.habits': false,
            'loading.checkins': false,
            'loading.stats': false,
            'error.habits': errorMessage,
            'error.checkins': errorMessage,
            'error.stats': errorMessage,
        });
    },
    /**
     * 获取随机激励语
     * @returns 随机选择的激励语
     */
    getRandomMotto() {
        const mottos = [
            '坚持的第一天，是迈向成功的第一步。',
            '每一个习惯，都是未来更好的自己。',
            '不要等待完美时机，现在就行动。',
            '小小的习惯，成就大大的改变。',
            '今天的坚持，是明天的骄傲。',
            '习惯的力量，超乎你的想象。',
            '每天进步一点点，离目标就近一点点。',
            '坚持下去，你会感谢今天努力的自己。',
            '不积跬步，无以至千里。',
            '养成好习惯，成就好人生。',
        ];
        const randomIndex = Math.floor(Math.random() * mottos.length);
        const motto = mottos[randomIndex];
        this.setData({
            motto: motto,
        });
        return motto;
    },
    /**
     * 打卡习惯
     */
    onCheckin(e) {
        const { habitId } = e.detail;
        if (!habitId)
            return;
        // 检查用户是否已登录
        if (!(0, auth_check_1.checkLogin)(this, '请先登录后再打卡', () => {
            // 登录成功后的回调，继续打卡操作
            const habit = this.data.todayHabits.find((h) => h.id === habitId || h._id === habitId);
            if (!habit)
                return;
            // 跳转到打卡页面
            wx.navigateTo({
                url: `/pages/checkin/checkin?habitId=${habitId}&habitName=${encodeURIComponent(habit.name)}`,
            });
        })) {
            return; // 未登录，函数终止
        }
        // 已登录，直接执行打卡操作
        const habit = this.data.todayHabits.find((h) => h.id === habitId || h._id === habitId);
        if (!habit)
            return;
        // 跳转到打卡页面
        wx.navigateTo({
            url: `/pages/checkin/checkin?habitId=${habitId}&habitName=${encodeURIComponent(habit.name)}`,
        });
    },
    /**
     * 重试加载
     */
    onRetry() {
        this.loadData();
    },
    /**
     * 跳转到习惯列表页
     */
    goToHabits() {
        wx.switchTab({
            url: '/pages/habits/habits',
        });
    },
    /**
     * 跳转到创建习惯页
     */
    goToCreateHabit() {
        // 检查用户是否已登录
        if (!(0, auth_check_1.checkLogin)(this, '请先登录后再创建习惯', () => {
            // 登录成功后的回调，继续创建习惯
            wx.navigateTo({
                url: '/pages/habits/create/create',
            });
        })) {
            return; // 未登录，函数终止
        }
        // 已登录，直接跳转
        wx.navigateTo({
            url: '/pages/habits/create/create',
        });
    },
    /**
     * 跳转到数据分析页
     */
    goToAnalytics() {
        wx.switchTab({
            url: '/pages/analytics/analytics',
            fail: (err) => {
                console.error('跳转到数据分析页失败:', err);
                wx.showToast({
                    title: '跳转失败，请稍后再试',
                    icon: 'none',
                });
            },
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '养成好习惯，改变好人生',
            path: '/pages/index/index',
        };
    },
    /**
     * 成就解锁事件处理
     */
    onAchievementUnlock(achievement) {
        this.setData({
            showAchievementUnlock: true,
            unlockedAchievement: achievement,
        });
        // 3秒后自动关闭
        setTimeout(this.hideAchievementUnlock.bind(this), 3000);
    },
    /**
     * 隐藏成就解锁提示
     */
    hideAchievementUnlock() {
        this.setData({
            showAchievementUnlock: false,
        });
    },
    /**
     * 查看成就详情
     */
    viewAchievementDetail(e) {
        if (!this.data.unlockedAchievement)
            return;
        wx.navigateTo({
            url: '/pages/profile/achievements/achievements',
            success: () => {
                this.hideAchievementUnlock();
            },
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
                // 重新加载数据
                this.loadData();
            }
        });
    },
    /**
     * 处理登录状态变化
     */
    onLoginStateChange(loginState) {
        this.setData({
            userInfo: loginState.userInfo,
            hasLogin: loginState.hasLogin,
        });
        // 重新加载数据
        if (loginState.hasLogin) {
            this.loadData();
        }
        else {
            // 用户退出登录时，清空数据
            this.setData({
                todayHabits: [],
                todayCheckins: [],
                habitStats: {},
                completedCount: 0,
                totalCount: 0,
                completionRate: 0,
                completionRateDisplay: '0',
                currentStreak: 0,
            });
        }
    },
    /**
     * 用户下拉刷新
     */
    onPullDownRefresh() {
        // 强制刷新数据
        this.loadData();
        // 完成刷新
        wx.stopPullDownRefresh();
    },
    /**
     * 登录模态框关闭事件
     */
    onLoginModalClose() {
        this.setData({
            'loginModal.show': false,
        });
    },
    /**
     * 登录成功事件
     */
    onLoginSuccess() {
        // 登录成功后执行回调
        if (typeof this.loginSuccess === 'function') {
            this.loginSuccess();
        }
    },
    /**
     * 登录失败事件
     */
    onLoginFail() {
    },
});
