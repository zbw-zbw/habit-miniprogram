"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 首页
 */
const date_1 = require("../../utils/date");
const habit_1 = require("../../utils/habit");
const api_1 = require("../../services/api");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        todayHabits: [],
        habitStats: {},
        loading: {
            habits: true,
            checkins: true,
            stats: true
        },
        error: {
            habits: '',
            checkins: '',
            stats: ''
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
        apiAvailable: true
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        const today = (0, date_1.getCurrentDate)();
        const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdayNames[new Date(today).getDay()];
        const app = getApp();
        this.setData({
            today,
            weekday,
            userInfo: app.globalData.userInfo,
            hasLogin: app.globalData.hasLogin,
            apiAvailable: app.globalData.apiAvailable
        });
        // 获取激励语
        this.getRandomMotto();
        // 监听成就解锁事件
        if (typeof app.onAchievementUnlock === 'function') {
            app.onAchievementUnlock(this.onAchievementUnlock.bind(this));
        }
        else {
            console.error('App.onAchievementUnlock 方法不存在');
        }
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 从App获取最新的登录状态
        const app = getApp();
        this.setData({
            userInfo: app.globalData.userInfo,
            hasLogin: app.globalData.hasLogin,
            apiAvailable: app.globalData.apiAvailable
        });
        
        // 加载今日习惯
        this.loadTodayHabits();
    },
    /**
     * 加载今日习惯
     */
    loadTodayHabits() {
        this.setData({
            loading: {
                habits: true,
                checkins: true,
                stats: true
            },
            'error.habits': ''
        });
        // 获取今天的日期
        const today = (0, date_1.getCurrentDate)();
        // 获取所有习惯
        api_1.habitAPI.getHabits()
            .then(habits => {
            // 过滤出今日需要执行的习惯
            const todayHabits = habits.filter(habit => !habit.isArchived && (0, habit_1.shouldDoHabitOnDate)(habit, today));
            this.setData({
                todayHabits,
                'loading.habits': false,
                totalCount: todayHabits.length
            });
            // 加载打卡记录和统计数据
            this.loadTodayCheckins(today);
            this.loadHabitStats(todayHabits);
            
            // 如果没有习惯，设置所有加载状态为false
            if (todayHabits.length === 0) {
                this.setData({
                    'loading.checkins': false,
                    'loading.stats': false
                });
            }
        })
            .catch(error => {
            console.error('加载习惯数据失败:', error);
            this.setData({
                'loading.habits': false,
                'loading.checkins': false,
                'loading.stats': false,
                'error.habits': '加载习惯数据失败'
            });
        });
    },
    /**
     * 加载今日打卡记录
     */
    loadTodayCheckins(today) {
        this.setData({
            'loading.checkins': true,
            'error.checkins': ''
        });
        api_1.checkinAPI.getCheckins({
            startDate: today,
            endDate: today
        })
            .then(todayCheckins => {
            // 计算已完成的习惯数量
            const completedCount = todayCheckins.filter(c => c.isCompleted).length;
            // 计算完成率
            const { totalCount } = this.data;
            const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
            const completionRateDisplay = Math.floor(completionRate).toString();
            this.setData({
                completedCount,
                completionRate,
                completionRateDisplay,
                'loading.checkins': false
            });
        })
            .catch(error => {
            console.error('加载打卡记录失败:', error);
            this.setData({
                'loading.checkins': false,
                'error.checkins': '加载打卡记录失败'
            });
        });
    },
    /**
     * 加载习惯统计数据
     */
    loadHabitStats(habits) {
        if (habits.length === 0) {
            this.setData({
                'loading.stats': false,
                habitStats: {},
                currentStreak: 0
            });
            return;
        }
        this.setData({
            'loading.stats': true,
            'error.stats': ''
        });
        const habitStats = {};
        // 处理每个习惯的统计数据
        const statsPromises = habits.map(habit => {
            // 确保习惯有id字段
            const habitId = habit.id || habit._id;
            if (!habitId) {
                console.error('习惯对象缺少ID:', habit);
                return Promise.resolve(); // 跳过没有ID的习惯
            }
            
            return api_1.habitAPI.getHabitStats(habitId)
                .then(stats => {
                    habitStats[habitId] = stats;
                })
                .catch(error => {
                    console.error(`获取习惯 ${habitId} 统计数据失败:`, error);
                });
        });
        // 等待所有统计数据获取完成
        Promise.all(statsPromises)
            .then(() => {
            // 计算当前连续天数（取所有习惯中的最大值）
            const currentStreak = Object.values(habitStats).reduce((max, stats) => Math.max(max, stats?.currentStreak || 0), 0);
            this.setData({
                habitStats,
                currentStreak,
                'loading.stats': false
            });
        })
            .catch(error => {
            console.error('加载统计数据失败:', error);
            this.setData({
                'loading.stats': false,
                'error.stats': '加载统计数据失败'
            });
        });
    },
    /**
     * 获取随机激励语
     */
    getRandomMotto() {
        const mottos = [
            "坚持的第一天，是迈向成功的第一步。",
            "每一个习惯，都是未来更好的自己。",
            "不要等待完美时机，现在就行动。",
            "小小的习惯，成就大大的改变。",
            "今天的坚持，是明天的骄傲。",
            "习惯的力量，超乎你的想象。",
            "每天进步一点点，离目标就近一点点。",
            "坚持下去，你会感谢今天努力的自己。",
            "不积跬步，无以至千里。",
            "养成好习惯，成就好人生。"
        ];
        const randomIndex = Math.floor(Math.random() * mottos.length);
        this.setData({
            motto: mottos[randomIndex]
        });
    },
    /**
     * 打卡习惯
     */
    onCheckin(e) {
        const { habitId } = e.detail;
        if (!habitId)
            return;
        const today = (0, date_1.getCurrentDate)();
        // 显示加载提示
        wx.showLoading({
            title: '处理中',
            mask: true
        });
        // 先查询今日是否已有打卡记录
        api_1.checkinAPI.getCheckins({
            habitId,
            startDate: today,
            endDate: today
        })
            .then(checkins => {
            const todayCheckin = checkins.length > 0 ? checkins[0] : null;
            if (todayCheckin) {
                // 更新打卡状态
                return api_1.checkinAPI.updateCheckin(todayCheckin.id, {
                    isCompleted: !todayCheckin.isCompleted
                }).then(() => !todayCheckin.isCompleted);
            }
            else {
                // 创建新的打卡记录
                return api_1.checkinAPI.createCheckin({
                    habitId,
                    date: today,
                    isCompleted: true
                }).then(() => true);
            }
        })
            .then(isCompleted => {
            wx.hideLoading();
            // 显示操作结果
            wx.showToast({
                title: isCompleted ? '打卡成功' : '已取消打卡',
                icon: 'success'
            });
            // 重新加载数据
            this.loadTodayHabits();
        })
            .catch(error => {
            console.error('打卡操作失败:', error);
            wx.hideLoading();
            wx.showToast({
                title: '操作失败',
                icon: 'error'
            });
        });
    },
    /**
     * 重试加载
     */
    onRetry() {
        this.loadTodayHabits();
    },
    /**
     * 跳转到习惯列表页
     */
    goToHabits() {
        wx.switchTab({
            url: '/pages/habits/habits'
        });
    },
    /**
     * 跳转到创建习惯页
     */
    goToCreateHabit() {
        wx.navigateTo({
            url: '/pages/habits/create/create'
        });
    },
    /**
     * 跳转到数据分析页
     */
    goToAnalytics() {
        wx.navigateTo({
            url: '/pages/analytics/analytics'
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '养成好习惯，改变好人生',
            path: '/pages/index/index'
        };
    },
    /**
     * 成就解锁事件处理
     */
    onAchievementUnlock(achievement) {
        this.setData({
            showAchievementUnlock: true,
            unlockedAchievement: achievement
        });
        // 3秒后自动关闭
        setTimeout(this.hideAchievementUnlock.bind(this), 3000);
    },
    /**
     * 隐藏成就解锁提示
     */
    hideAchievementUnlock() {
        this.setData({
            showAchievementUnlock: false
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
            }
        });
    }
});
