"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 数据分析页面
 */
const date_1 = require("../../utils/date");
const api_1 = require("../../services/api");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        activeTab: 'overview',
        timeRange: 'week',
        loading: true,
        stats: {
            totalHabits: 0,
            activeHabits: 0,
            completedToday: 0,
            completionRate: 0,
            totalCheckins: 0,
            currentStreak: 0,
            longestStreak: 0
        },
        habitStats: [],
        chartData: {
            dates: [],
            values: [],
            completionRates: []
        }
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        // 页面加载时执行
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        this.loadData();
    },
    /**
     * 加载数据
     */
    loadData() {
        this.setData({ loading: true });
        // 获取习惯和打卡数据
        Promise.all([
            api_1.habitAPI.getHabits(),
            api_1.checkinAPI.getCheckins()
        ])
            .then(([habits, checkins]) => {
            // 计算总体统计数据
            this.calculateOverallStats(habits, checkins);
            // 计算各习惯统计数据
            this.calculateHabitStats(habits, checkins);
            // 生成图表数据
            this.generateChartData(habits, checkins);
            this.setData({ loading: false });
        })
            .catch(error => {
            console.error('加载数据失败:', error);
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            });
            this.setData({ loading: false });
        });
    },
    /**
     * 计算总体统计数据
     */
    calculateOverallStats(habits, checkins) {
        const today = (0, date_1.formatDate)(new Date());
        const activeHabits = habits.filter(h => !h.isArchived);
        const completedToday = checkins.filter(c => c.date === today && c.isCompleted).length;
        // 获取所有习惯的统计数据
        const statsPromises = activeHabits.map(habit => api_1.habitAPI.getHabitStats(habit.id));
        Promise.all(statsPromises)
            .then(statsArray => {
            // 计算总体完成率
            let totalCompletions = 0;
            let totalDays = 0;
            let maxCurrentStreak = 0;
            let maxLongestStreak = 0;
            statsArray.forEach(stats => {
                totalCompletions += stats.totalCompletions;
                totalDays += stats.totalDays;
                maxCurrentStreak = Math.max(maxCurrentStreak, stats.currentStreak);
                maxLongestStreak = Math.max(maxLongestStreak, stats.longestStreak);
            });
            const completionRate = totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100) : 0;
            this.setData({
                'stats.totalHabits': habits.length,
                'stats.activeHabits': activeHabits.length,
                'stats.completedToday': completedToday,
                'stats.completionRate': completionRate,
                'stats.totalCheckins': checkins.filter(c => c.isCompleted).length,
                'stats.currentStreak': maxCurrentStreak,
                'stats.longestStreak': maxLongestStreak
            });
        })
            .catch(error => {
            console.error('计算总体统计数据失败:', error);
        });
    },
    /**
     * 计算各习惯统计数据
     */
    calculateHabitStats(habits, checkins) {
        const activeHabits = habits.filter(h => !h.isArchived);
        // 获取每个习惯的统计数据
        const statsPromises = activeHabits.map(habit => api_1.habitAPI.getHabitStats(habit.id)
            .then(stats => {
            const habitCheckins = checkins.filter(c => c.habitId === habit.id);
            const totalCheckins = habitCheckins.filter(c => c.isCompleted).length;
            return {
                id: habit.id,
                name: habit.name,
                color: habit.color,
                icon: habit.icon,
                completionRate: Math.round(stats.completionRate * 100),
                streak: stats.currentStreak,
                totalCheckins
            };
        }));
        Promise.all(statsPromises)
            .then(habitStats => {
            // 按完成率排序
            habitStats.sort((a, b) => b.completionRate - a.completionRate);
            this.setData({ habitStats });
        })
            .catch(error => {
            console.error('计算习惯统计数据失败:', error);
        });
    },
    /**
     * 生成图表数据
     */
    generateChartData(habits, checkins) {
        const { timeRange } = this.data;
        let days = 7;
        switch (timeRange) {
            case 'week':
                days = 7;
                break;
            case 'month':
                days = 30;
                break;
            case 'year':
                days = 365;
                break;
        }
        // 获取过去几天的日期
        const dates = (0, date_1.getPastDates)(days);
        const activeHabits = habits.filter(h => !h.isArchived);
        // 计算每天的完成情况
        const values = [];
        const completionRates = [];
        for (const date of dates) {
            let totalHabits = 0;
            let completedHabits = 0;
            activeHabits.forEach(habit => {
                // 简化逻辑，实际应调用 shouldDoHabitOnDate
                totalHabits++;
                // 检查是否完成
                if (checkins.some(c => c.habitId === habit.id && c.date === date && c.isCompleted)) {
                    completedHabits++;
                }
            });
            values.push(completedHabits);
            const rate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
            completionRates.push(rate);
        }
        // 格式化日期为短格式
        const formattedDates = dates.map(date => {
            const parts = date.split('-');
            return `${parts[1]}/${parts[2]}`;
        });
        this.setData({
            'chartData.dates': formattedDates,
            'chartData.values': values,
            'chartData.completionRates': completionRates
        });
    },
    /**
     * 切换标签
     */
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ activeTab: tab });
    },
    /**
     * 切换时间范围
     */
    switchTimeRange(e) {
        const range = e.currentTarget.dataset.range;
        this.setData({ timeRange: range }, () => {
            // 重新加载数据
            this.loadData();
        });
    },
    /**
     * 查看习惯详情
     */
    viewHabitDetail(e) {
        const habitId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/habits/detail/detail?id=${habitId}`
        });
    },
    /**
     * 生成报告
     */
    generateReport() {
        wx.showLoading({
            title: '生成报告中'
        });
        setTimeout(() => {
            wx.hideLoading();
            wx.showModal({
                title: '报告已生成',
                content: '您的习惯分析报告已生成，可以在"我的-报告"中查看',
                showCancel: false
            });
        }, 1500);
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '我的习惯分析报告',
            path: '/pages/analytics/analytics',
            imageUrl: '/images/share-analytics.png'
        };
    },
    /**
     * 跳转到习惯洞察页面
     */
    navigateToInsights() {
        wx.navigateTo({
            url: '/packageAnalytics/pages/insights/insights'
        });
    }
});
