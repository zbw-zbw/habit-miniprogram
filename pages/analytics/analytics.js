"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 数据分析页面
 */
const date_1 = require("../../utils/date");
const storage_1 = require("../../utils/storage");
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
        // 确保有测试数据
        (0, storage_1.createTestData)();
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
        const habits = (0, storage_1.getHabits)();
        const checkins = (0, storage_1.getCheckins)();
        // 计算总体统计数据
        this.calculateOverallStats(habits, checkins);
        // 计算各习惯统计数据
        this.calculateHabitStats(habits, checkins);
        // 生成图表数据
        this.generateChartData(habits, checkins);
        this.setData({ loading: false });
    },
    /**
     * 计算总体统计数据
     */
    calculateOverallStats(habits, checkins) {
        const today = (0, date_1.formatDate)(new Date());
        const activeHabits = habits.filter(h => !h.isArchived);
        const completedToday = checkins.filter(c => c.date === today && c.isCompleted).length;
        // 计算总体完成率
        let totalDays = 0;
        let completedDays = 0;
        activeHabits.forEach(habit => {
            const habitCheckins = checkins.filter(c => c.habitId === habit.id);
            // 获取该习惯应该执行的天数
            const startDate = new Date(habit.createdAt);
            const now = new Date();
            for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
                const dateStr = (0, date_1.formatDate)(d);
                // 简化逻辑，实际应调用 shouldDoHabitOnDate
                totalDays++;
                // 检查是否完成
                if (habitCheckins.some(c => c.date === dateStr && c.isCompleted)) {
                    completedDays++;
                }
            }
        });
        const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        // 计算当前连续天数和最长连续天数
        // 简化实现，实际应考虑更复杂的逻辑
        let currentStreak = 0;
        let longestStreak = 0;
        // 模拟数据
        currentStreak = 5;
        longestStreak = 12;
        this.setData({
            'stats.totalHabits': habits.length,
            'stats.activeHabits': activeHabits.length,
            'stats.completedToday': completedToday,
            'stats.completionRate': completionRate,
            'stats.totalCheckins': checkins.filter(c => c.isCompleted).length,
            'stats.currentStreak': currentStreak,
            'stats.longestStreak': longestStreak
        });
    },
    /**
     * 计算各习惯统计数据
     */
    calculateHabitStats(habits, checkins) {
        const habitStats = habits
            .filter(h => !h.isArchived)
            .map(habit => {
            const habitCheckins = checkins.filter(c => c.habitId === habit.id);
            const totalCheckins = habitCheckins.filter(c => c.isCompleted).length;
            // 计算完成率
            const totalDays = 30; // 简化为最近30天
            const completedDays = habitCheckins.filter(c => c.isCompleted).length;
            const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
            // 计算连续天数
            // 简化实现，实际应考虑更复杂的逻辑
            const streak = Math.floor(Math.random() * 10) + 1; // 模拟数据
            return {
                id: habit.id,
                name: habit.name,
                color: habit.color,
                icon: habit.icon,
                completionRate,
                streak,
                totalCheckins
            };
        })
            .sort((a, b) => b.completionRate - a.completionRate);
        this.setData({ habitStats });
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
        // 获取过去n天的日期
        const dates = (0, date_1.getPastDates)(days);
        // 计算每天的打卡次数
        const values = dates.map(date => {
            return checkins.filter(c => c.date === date && c.isCompleted).length;
        });
        // 计算每天的完成率
        const completionRates = dates.map(date => {
            const totalHabits = habits.filter(h => !h.isArchived).length;
            const completed = checkins.filter(c => c.date === date && c.isCompleted).length;
            return totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;
        });
        this.setData({
            'chartData.dates': dates,
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
            // 重新生成图表数据
            const habits = (0, storage_1.getHabits)();
            const checkins = (0, storage_1.getCheckins)();
            this.generateChartData(habits, checkins);
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
     * 生成详细报告
     */
    generateReport() {
        wx.showToast({
            title: '正在生成报告...',
            icon: 'loading'
        });
        setTimeout(() => {
            wx.navigateTo({
                url: '/packageAnalytics/pages/report/report'
            });
        }, 1500);
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '我的习惯数据分析',
            path: '/pages/analytics/analytics'
        };
    },
    /**
     * 导航到习惯洞察页面
     */
    navigateToInsights() {
        wx.navigateTo({
            url: '/packageAnalytics/pages/insights/insights'
        });
    }
});
