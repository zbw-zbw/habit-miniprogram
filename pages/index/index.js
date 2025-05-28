"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 首页
 */
const date_1 = require("../../utils/date");
const habit_1 = require("../../utils/habit");
const storage_1 = require("../../utils/storage");
const util_1 = require("../../utils/util");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        todayHabits: [],
        habitStats: {},
        loading: true,
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
        unlockedAchievement: null
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        const today = (0, date_1.getCurrentDate)();
        const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdayNames[new Date(today).getDay()];
        this.setData({
            today,
            weekday
        });
        // 获取激励语
        this.getRandomMotto();
        // 获取用户信息
        const app = getApp();
        this.setData({
            userInfo: app.globalData.userInfo,
            hasLogin: app.globalData.hasLogin
        });
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
        this.loadTodayHabits();
    },
    /**
     * 加载今日习惯
     */
    loadTodayHabits() {
        this.setData({ loading: true });
        // 获取所有习惯
        const habits = (0, storage_1.getHabits)();
        // 过滤出今日需要执行的习惯
        const today = (0, date_1.getCurrentDate)();
        const todayHabits = habits.filter(habit => !habit.isArchived && (0, habit_1.shouldDoHabitOnDate)(habit, today));
        // 计算习惯统计数据
        const habitStats = {};
        let completedCount = 0;
        todayHabits.forEach(habit => {
            const checkins = (0, storage_1.getCheckinsByHabitId)(habit.id);
            const stats = (0, habit_1.generateHabitStats)(habit, checkins);
            habitStats[habit.id] = stats;
            // 检查今日是否已完成
            const todayCheckin = checkins.find(c => c.date === today);
            if (todayCheckin?.isCompleted) {
                completedCount++;
            }
        });
        // 计算总体完成率
        const totalCount = todayHabits.length;
        const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        const completionRateDisplay = Math.floor(completionRate).toString();
        // 计算当前连续天数（取所有习惯中的最大值）
        const currentStreak = Object.values(habitStats).reduce((max, stats) => Math.max(max, stats.currentStreak), 0);
        this.setData({
            todayHabits,
            habitStats,
            loading: false,
            completedCount,
            totalCount,
            completionRate,
            completionRateDisplay,
            currentStreak
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
        // 获取所有打卡记录
        const checkins = (0, storage_1.getCheckins)();
        const today = (0, date_1.getCurrentDate)();
        // 查找今日是否已有打卡记录
        let todayCheckin = checkins.find(c => c.habitId === habitId && c.date === today);
        if (todayCheckin) {
            // 更新打卡状态
            todayCheckin.isCompleted = !todayCheckin.isCompleted;
            // 使用类型断言避免类型错误
            todayCheckin.updatedAt = new Date().toISOString();
        }
        else {
            // 创建新的打卡记录
            todayCheckin = {
                id: (0, util_1.generateUUID)(),
                habitId,
                date: today,
                isCompleted: true,
                createdAt: new Date().toISOString()
            };
            checkins.push(todayCheckin);
        }
        // 保存打卡记录
        wx.setStorageSync('checkins', checkins);
        // 重新加载今日习惯
        this.loadTodayHabits();
        // 显示提示
        wx.showToast({
            title: todayCheckin.isCompleted ? '打卡成功' : '已取消打卡',
            icon: todayCheckin.isCompleted ? 'success' : 'none'
        });
    },
    /**
     * 跳转到习惯列表
     */
    goToHabits() {
        wx.switchTab({
            url: '/pages/habits/habits'
        });
    },
    /**
     * 跳转到创建习惯
     */
    goToCreateHabit() {
        wx.navigateTo({
            url: '/pages/habits/create/create'
        });
    },
    /**
     * 跳转到数据分析
     */
    goToAnalytics() {
        wx.switchTab({
            url: '/pages/analytics/analytics'
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '习惯打卡小程序，养成好习惯，成就好人生',
            path: '/pages/index/index'
        };
    },
    /**
     * 处理成就解锁事件
     */
    onAchievementUnlock(achievement) {
        this.setData({
            unlockedAchievement: achievement,
            showAchievementUnlock: true
        });
    },
    /**
     * 隐藏成就解锁通知
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
        const { achievementId } = e.detail;
        wx.navigateTo({
            url: `/pages/profile/achievements/detail/detail?id=${achievementId}`
        });
    },
    /**
     * 测试成就解锁功能
     */
    testAchievementUnlock() {
        // 导入成就服务
        const { achievementService, IAchievement } = require('../../utils/achievement');
        // 选择一个成就进行解锁测试
        achievementService.getAllAchievements().then((achievements) => {
            if (achievements && achievements.length > 0) {
                // 获取第一个未完成的成就
                const achievement = achievements.find((a) => !a.isCompleted) || achievements[0];
                // 将成就进度设为100%并标记为已完成
                achievement.progress = 100;
                achievement.isCompleted = true;
                achievement.completedAt = new Date().toISOString().split('T')[0]; // 当前日期
                console.log('测试成就解锁:', achievement);
                // 直接在页面上显示成就解锁通知
                this.setData({
                    unlockedAchievement: achievement,
                    showAchievementUnlock: true
                });
                // 保存更新的成就
                achievementService.updateAchievement(achievement).then(() => {
                    wx.showToast({
                        title: '测试成就解锁成功',
                        icon: 'success'
                    });
                }).catch((error) => {
                    console.error('测试成就解锁失败:', error);
                    wx.showToast({
                        title: '测试失败',
                        icon: 'error'
                    });
                });
            }
            else {
                wx.showToast({
                    title: '没有可用的成就',
                    icon: 'none'
                });
            }
        });
    }
});
