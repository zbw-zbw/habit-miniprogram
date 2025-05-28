"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 数据分析-洞察页面
 * 提供个性化的习惯分析和建议
 */
const storage_1 = require("../../../utils/storage");
const date_1 = require("../../../utils/date");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        loading: true,
        insights: [],
        bestHabit: null,
        needsImprovement: null,
        patterns: {
            mostProductiveDay: '',
            mostProductiveTime: '',
            bestStreak: 0
        },
        recommendations: []
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
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
        // 生成洞察
        this.generateInsights(habits, checkins);
        // 找出最好的习惯
        this.findBestHabit(habits, checkins);
        // 找出需要改进的习惯
        this.findHabitNeedsImprovement(habits, checkins);
        // 分析模式
        this.analyzePatterns(habits, checkins);
        // 生成建议
        this.generateRecommendations(habits, checkins);
        this.setData({ loading: false });
    },
    /**
     * 生成洞察
     */
    generateInsights(habits, checkins) {
        const insights = [];
        const today = new Date();
        const todayStr = (0, date_1.formatDate)(today);
        // 检查是否有连续打卡超过7天的习惯
        habits.forEach(habit => {
            const habitCheckins = checkins.filter(c => c.habitId === habit.id && c.isCompleted);
            // 计算连续天数
            let streak = 0;
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const dateStr = (0, date_1.formatDate)(date);
                if (habitCheckins.some(c => c.date === dateStr)) {
                    streak++;
                }
                else {
                    break;
                }
            }
            if (streak >= 7) {
                insights.push({
                    id: `streak-${habit.id}`,
                    title: '连续打卡成就',
                    description: `你的"${habit.name}"习惯已经连续打卡${streak}天了，太棒了！`,
                    type: 'success',
                    habitId: habit.id
                });
            }
        });
        // 检查是否有习惯完成率低于30%
        habits.filter(h => !h.isArchived).forEach(habit => {
            const habitCheckins = checkins.filter(c => c.habitId === habit.id);
            const totalDays = (0, date_1.getDaysBetween)(new Date(habit.createdAt), today);
            const completedDays = habitCheckins.filter(c => c.isCompleted).length;
            const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
            if (completionRate < 30 && totalDays >= 7) {
                insights.push({
                    id: `low-completion-${habit.id}`,
                    title: '需要关注的习惯',
                    description: `你的"${habit.name}"习惯完成率较低(${Math.round(completionRate)}%)，可以尝试调整目标或设置提醒。`,
                    type: 'warning',
                    habitId: habit.id
                });
            }
        });
        // 检查今日是否有未完成的习惯
        const todayUncompleted = habits.filter(h => !h.isArchived && !checkins.some(c => c.habitId === h.id && c.date === todayStr && c.isCompleted));
        if (todayUncompleted.length > 0) {
            insights.push({
                id: 'today-uncompleted',
                title: '今日待完成',
                description: `你今天还有${todayUncompleted.length}个习惯未完成，加油！`,
                type: 'info'
            });
        }
        this.setData({ insights });
    },
    /**
     * 找出最好的习惯
     */
    findBestHabit(habits, checkins) {
        if (habits.length === 0) {
            return;
        }
        let bestHabit = null;
        let highestCompletionRate = 0;
        let longestStreak = 0;
        habits.forEach(habit => {
            const habitCheckins = checkins.filter(c => c.habitId === habit.id);
            const totalDays = 30; // 简化为最近30天
            const completedDays = habitCheckins.filter(c => c.isCompleted).length;
            const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
            // 计算连续天数
            let streak = 0;
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const dateStr = (0, date_1.formatDate)(date);
                if (habitCheckins.some(c => c.date === dateStr && c.isCompleted)) {
                    streak++;
                }
                else {
                    break;
                }
            }
            if (completionRate > highestCompletionRate ||
                (completionRate === highestCompletionRate && streak > longestStreak)) {
                highestCompletionRate = completionRate;
                longestStreak = streak;
                bestHabit = {
                    id: habit.id,
                    name: habit.name,
                    completionRate: Math.round(completionRate),
                    streak: streak
                };
            }
        });
        this.setData({ bestHabit });
    },
    /**
     * 找出需要改进的习惯
     */
    findHabitNeedsImprovement(habits, checkins) {
        if (habits.length === 0) {
            return;
        }
        let needsImprovement = null;
        let lowestCompletionRate = 100;
        habits.filter(h => !h.isArchived).forEach(habit => {
            const habitCheckins = checkins.filter(c => c.habitId === habit.id);
            const totalDays = 30; // 简化为最近30天
            const completedDays = habitCheckins.filter(c => c.isCompleted).length;
            const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
            // 找出最后一次完成的日期
            const sortedCheckins = [...habitCheckins].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const lastCompleted = sortedCheckins.length > 0 ? sortedCheckins[0].date : '从未完成';
            if (completionRate < lowestCompletionRate && totalDays >= 7) {
                lowestCompletionRate = completionRate;
                needsImprovement = {
                    id: habit.id,
                    name: habit.name,
                    completionRate: Math.round(completionRate),
                    lastCompleted: lastCompleted
                };
            }
        });
        this.setData({ needsImprovement });
    },
    /**
     * 分析模式
     */
    analyzePatterns(habits, checkins) {
        if (checkins.length === 0) {
            return;
        }
        // 分析最高产的星期几
        const dayCount = [0, 0, 0, 0, 0, 0, 0]; // 周日到周六
        checkins.filter(c => c.isCompleted).forEach(checkin => {
            const date = new Date(checkin.date);
            dayCount[date.getDay()]++;
        });
        const mostProductiveDayIndex = dayCount.indexOf(Math.max(...dayCount));
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const mostProductiveDay = days[mostProductiveDayIndex];
        // 分析最高产的时间段
        const timeCount = [0, 0, 0, 0]; // 早晨、下午、晚上、深夜
        checkins.filter(c => c.isCompleted && c.time).forEach(checkin => {
            const hour = parseInt(checkin.time.split(':')[0]);
            if (hour >= 5 && hour < 12) {
                timeCount[0]++; // 早晨
            }
            else if (hour >= 12 && hour < 18) {
                timeCount[1]++; // 下午
            }
            else if (hour >= 18 && hour < 23) {
                timeCount[2]++; // 晚上
            }
            else {
                timeCount[3]++; // 深夜
            }
        });
        const mostProductiveTimeIndex = timeCount.indexOf(Math.max(...timeCount));
        const times = ['早晨', '下午', '晚上', '深夜'];
        const mostProductiveTime = times[mostProductiveTimeIndex];
        // 计算最佳连续打卡记录
        let bestStreak = 0;
        habits.forEach(habit => {
            const habitCheckins = checkins.filter(c => c.habitId === habit.id && c.isCompleted);
            // 按日期排序
            const sortedDates = [...new Set(habitCheckins.map(c => c.date))].sort();
            let currentStreak = 1;
            let maxStreak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const prevDate = new Date(sortedDates[i - 1]);
                const currDate = new Date(sortedDates[i]);
                // 检查是否为连续日期
                const diffTime = currDate.getTime() - prevDate.getTime();
                const diffDays = diffTime / (1000 * 3600 * 24);
                if (diffDays === 1) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                }
                else {
                    currentStreak = 1;
                }
            }
            bestStreak = Math.max(bestStreak, maxStreak);
        });
        this.setData({
            'patterns.mostProductiveDay': mostProductiveDay,
            'patterns.mostProductiveTime': mostProductiveTime,
            'patterns.bestStreak': bestStreak
        });
    },
    /**
     * 生成建议
     */
    generateRecommendations(habits, checkins) {
        const recommendations = [];
        // 基于当前习惯数量给出建议
        const activeHabits = habits.filter(h => !h.isArchived);
        if (activeHabits.length === 0) {
            recommendations.push({
                title: '开始你的第一个习惯',
                description: '从一个简单的习惯开始，例如每天喝足够的水或冥想5分钟。'
            });
        }
        else if (activeHabits.length < 3) {
            recommendations.push({
                title: '逐步增加习惯',
                description: '你正在培养一些好习惯，可以考虑增加一个新的小习惯来丰富你的日常。'
            });
        }
        else if (activeHabits.length > 7) {
            recommendations.push({
                title: '关注核心习惯',
                description: '你有很多习惯在追踪，考虑专注于最重要的几个，以提高完成质量。'
            });
        }
        // 基于打卡时间给出建议
        const { patterns } = this.data;
        if (patterns.mostProductiveTime === '早晨') {
            recommendations.push({
                title: '利用晨间黄金时段',
                description: '你在早晨完成习惯的效率最高，考虑将更多重要习惯安排在这个时间段。'
            });
        }
        else if (patterns.mostProductiveTime === '晚上') {
            recommendations.push({
                title: '建立良好的晚间习惯',
                description: '你在晚上更容易坚持习惯，可以建立一个放松的晚间流程，帮助第二天更有精力。'
            });
        }
        // 通用建议
        recommendations.push({
            title: '习惯叠加法',
            description: '将新习惯与已有习惯"叠加"，例如"喝咖啡后冥想5分钟"，提高坚持几率。'
        });
        recommendations.push({
            title: '习惯追踪可视化',
            description: '使用习惯日历或进度条等可视化方式，让习惯养成过程更有成就感。'
        });
        this.setData({ recommendations });
    },
    /**
     * 跳转到习惯详情
     */
    navigateToHabit(e) {
        const habitId = e.currentTarget.dataset.habitId;
        if (habitId) {
            wx.navigateTo({
                url: `/pages/habits/detail/detail?id=${habitId}`
            });
        }
    }
});
