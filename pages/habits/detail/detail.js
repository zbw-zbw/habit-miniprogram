"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_1 = require("../../../utils/date");
const api_1 = require("../../../services/api");
Page({
    data: {
        habitId: '',
        habit: null,
        checkins: [],
        stats: null,
        completionRateFormatted: '0',
        todayFormatted: (0, date_1.formatDate)(new Date()),
        activeTab: 'overview',
        currentMonth: '',
        calendarDays: [],
        loading: {
            habit: true,
            checkins: true,
            stats: true
        },
        error: {
            habit: '',
            checkins: '',
            stats: ''
        },
        apiAvailable: true,
        // 分类中英文映射
        categoryMap: {},
        // 随机科学洞察
        randomInsight: '养成习惯需要21-66天不等，坚持是关键。',
        // 周统计数据
        weeklyStats: {
            completionRate: 0,
            trend: 0,
            averageDuration: 0
        },
        // 详细统计数据
        statsData: {
            averageDuration: 0,
            maxDuration: 0
        },
        // 热图数据
        heatmapData: [],
        heatmapStartDate: '',
        heatmapEndDate: '',
        // 是否显示分析助手
        showAnalysisAssistant: false
    },
    onLoad(options) {
        const app = getApp();
        this.setData({
            apiAvailable: app.globalData.apiAvailable,
            // 初始化分类映射
            categoryMap: {
                'learning': '学习',
                'health': '健康',
                'work': '工作',
                'social': '社交',
                'finance': '财务',
                'other': '其他',
                'reading': '阅读',
                'exercise': '运动',
                'diet': '饮食',
                'sleep': '睡眠',
                'meditation': '冥想'
            },
            // 设置热图日期范围
            heatmapStartDate: (0, date_1.formatDate)(new Date(new Date().setMonth(new Date().getMonth() - 6))),
            heatmapEndDate: (0, date_1.formatDate)(new Date())
        });
        // 设置随机科学洞察
        this.setRandomInsight();
        if (options.id) {
            this.setData({
                habitId: options.id
            });
            this.loadHabitDetail();
            this.loadCheckins();
            this.loadStats();
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
    // 页面显示时重新加载数据
    onShow() {
        if (this.data.habitId) {
            this.loadCheckins();
            this.loadStats();
        }
    },
    // 加载习惯详情
    async loadHabitDetail() {
        this.setData({
            'loading.habit': true,
            'error.habit': ''
        });
        try {
            const habit = await api_1.habitAPI.getHabit(this.data.habitId);
            this.setData({
                habit,
                'loading.habit': false
            });
            // 初始化日历（在获取习惯信息后）
            this.updateCalendar();
        }
        catch (error) {
            console.error('加载习惯详情失败:', error);
            this.setData({
                'loading.habit': false,
                'error.habit': '加载习惯详情失败'
            });
        }
    },
    // 加载打卡记录
    async loadCheckins() {
        this.setData({
            'loading.checkins': true,
            'error.checkins': ''
        });
        try {
            // 获取习惯的打卡记录
            const baseCheckins = await api_1.checkinAPI.getCheckins({ habitId: this.data.habitId });
            // 处理打卡记录，添加格式化的时间和持续时间
            const checkins = baseCheckins.map((checkin) => ({
                ...checkin,
                formattedTime: new Date(checkin.createdAt).toTimeString().substring(0, 5),
                duration: checkin.duration || Math.floor(Math.random() * 30) + 15 // 模拟持续时间数据，实际应从服务器获取
            }));
            this.setData({
                checkins,
                'loading.checkins': false
            });
            // 更新日历上的打卡记录
            this.updateCalendar();
            // 计算周统计和详细统计
            this.calculateWeeklyStats();
            this.calculateDetailedStats();
            // 生成热图数据
            this.generateHeatmapData();
        }
        catch (error) {
            console.error('加载打卡记录失败:', error);
            this.setData({
                'loading.checkins': false,
                'error.checkins': '加载打卡记录失败'
            });
        }
    },
    // 加载统计数据
    async loadStats() {
        this.setData({
            'loading.stats': true,
            'error.stats': ''
        });
        try {
            const stats = await api_1.habitAPI.getHabitStats(this.data.habitId);
            // 确保完成率是正确的百分比值（0-100）
            // 如果 completionRate 已经是百分比形式（0-100），不需要再乘以100
            // 如果 completionRate 是小数形式（0-1），则需要乘以100
            let completionRate = stats.completionRate;
            if (completionRate > 1 && completionRate <= 100) {
                // 已经是百分比形式，保持不变
                completionRate = Math.min(completionRate, 100); // 限制最大值为100%
            }
            else if (completionRate > 0 && completionRate <= 1) {
                // 小数形式，转换为百分比
                completionRate = completionRate * 100;
            }
            else if (completionRate > 100) {
                // 异常值，限制为100%
                completionRate = 100;
            }
            // 预先计算格式化的完成率
            const completionRateFormatted = Math.round(completionRate).toString();
            // 更新统计数据
            this.setData({
                stats: {
                    ...stats,
                    completionRate: completionRate // 更新为标准化的完成率
                },
                completionRateFormatted,
                'loading.stats': false
            });
            console.log('习惯统计数据：', stats);
            console.log('格式化后的完成率：', completionRateFormatted);
        }
        catch (error) {
            console.error('加载统计数据失败:', error);
            this.setData({
                'loading.stats': false,
                'error.stats': '加载统计数据失败'
            });
        }
    },
    // 计算周统计数据
    calculateWeeklyStats() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const oneWeekAgoStr = (0, date_1.formatDate)(oneWeekAgo);
        const twoWeeksAgoStr = (0, date_1.formatDate)(twoWeeksAgo);
        // 本周打卡记录
        const thisWeekCheckins = this.data.checkins.filter(c => new Date(c.date) >= oneWeekAgo && c.isCompleted);
        // 上周打卡记录
        const lastWeekCheckins = this.data.checkins.filter(c => new Date(c.date) >= twoWeeksAgo &&
            new Date(c.date) < oneWeekAgo &&
            c.isCompleted);
        // 计算本周完成率
        const daysInThisWeek = 7;
        const uniqueDaysThisWeek = new Set(thisWeekCheckins.map(c => c.date)).size;
        const completionRateThisWeek = Math.round((uniqueDaysThisWeek / daysInThisWeek) * 100);
        // 计算上周完成率
        const daysInLastWeek = 7;
        const uniqueDaysLastWeek = new Set(lastWeekCheckins.map(c => c.date)).size;
        const completionRateLastWeek = Math.round((uniqueDaysLastWeek / daysInLastWeek) * 100);
        // 计算趋势
        const trend = completionRateThisWeek - completionRateLastWeek;
        // 计算平均时长
        let totalDuration = 0;
        let count = 0;
        thisWeekCheckins.forEach(c => {
            if (c.duration) {
                totalDuration += c.duration;
                count++;
            }
        });
        const averageDuration = count > 0 ? Math.round(totalDuration / count) : 0;
        this.setData({
            weeklyStats: {
                completionRate: completionRateThisWeek,
                trend: trend,
                averageDuration: averageDuration
            }
        });
    },
    // 计算详细统计数据
    calculateDetailedStats() {
        let totalDuration = 0;
        let count = 0;
        let maxDuration = 0;
        this.data.checkins.forEach(c => {
            if (c.duration) {
                totalDuration += c.duration;
                count++;
                if (c.duration > maxDuration) {
                    maxDuration = c.duration;
                }
            }
        });
        const averageDuration = count > 0 ? Math.round(totalDuration / count) : 0;
        this.setData({
            statsData: {
                averageDuration: averageDuration,
                maxDuration: maxDuration
            }
        });
    },
    // 生成热图数据
    generateHeatmapData() {
        // 生成过去6个月的热图数据
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 6);
        const heatmapData = [];
        // 将打卡记录转换为热图数据格式
        this.data.checkins.forEach(checkin => {
            if (checkin.isCompleted) {
                const checkDate = new Date(checkin.date);
                if (checkDate >= startDate && checkDate <= endDate) {
                    heatmapData.push({
                        date: checkin.date,
                        count: 1
                    });
                }
            }
        });
        this.setData({
            heatmapData
        });
    },
    // 设置随机科学洞察
    setRandomInsight() {
        const insights = [
            '养成习惯需要21-66天不等，坚持是关键。',
            '将新习惯与已有习惯关联，可以提高成功率。',
            '设定具体的时间和地点，让习惯更容易坚持。',
            '小步快走比大幅改变更容易成功。',
            '记录进度可以增加成就感，提高坚持率。',
            '环境提示能有效触发习惯行为。',
            '奖励自己有助于强化习惯的养成。'
        ];
        const randomIndex = Math.floor(Math.random() * insights.length);
        this.setData({
            randomInsight: insights[randomIndex]
        });
    },
    // 显示分析助手
    showAnalysisAssistant() {
        this.setData({
            showAnalysisAssistant: true
        });
    },
    // 隐藏分析助手
    hideAnalysisAssistant() {
        this.setData({
            showAnalysisAssistant: false
        });
    },
    // 处理应用建议
    handleApplySuggestion(e) {
        const { suggestion } = e.detail;
        console.log('应用建议:', suggestion);
        wx.showToast({
            title: '已应用建议',
            icon: 'success'
        });
        this.hideAnalysisAssistant();
    },
    // 更新日历
    updateCalendar() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const currentMonth = `${year}年${month + 1}月`;
        // 获取当月第一天是周几
        const firstDay = new Date(year, month, 1).getDay();
        // 获取当月天数
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // 上个月的天数
        const prevMonthDays = new Date(year, month, 0).getDate();
        const calendarDays = [];
        // 上个月的日期
        for (let i = 0; i < firstDay; i++) {
            const day = prevMonthDays - firstDay + i + 1;
            const date = (0, date_1.formatDate)(new Date(year, month - 1, day));
            calendarDays.push({
                date,
                day,
                isCurrentMonth: false,
                isCompleted: this.isDateCompleted(date),
                isToday: this.isToday(date)
            });
        }
        // 当月的日期
        const today = now.getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = (0, date_1.formatDate)(new Date(year, month, i));
            calendarDays.push({
                date,
                day: i,
                isCurrentMonth: true,
                isCompleted: this.isDateCompleted(date),
                isToday: this.isToday(date)
            });
        }
        // 下个月的日期
        const remainingDays = 42 - calendarDays.length; // 6行7列
        for (let i = 1; i <= remainingDays; i++) {
            const date = (0, date_1.formatDate)(new Date(year, month + 1, i));
            calendarDays.push({
                date,
                day: i,
                isCurrentMonth: false,
                isCompleted: this.isDateCompleted(date),
                isToday: this.isToday(date)
            });
        }
        this.setData({
            currentMonth,
            calendarDays
        });
    },
    // 检查日期是否已完成打卡
    isDateCompleted(date) {
        return this.data.checkins.some(c => c.date === date && c.isCompleted);
    },
    // 检查是否是今天
    isToday(date) {
        return date === this.data.todayFormatted;
    },
    // 切换标签
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({
            activeTab: tab
        });
    },
    // 前往打卡页面
    goToCheckin() {
        if (!this.data.habit)
            return;
        wx.navigateTo({
            url: `/pages/checkin/checkin?habitId=${this.data.habitId}&habitName=${encodeURIComponent(this.data.habit.name)}`
        });
    },
    // 分享
    onShareAppMessage() {
        const habitName = this.data.habit?.name || '习惯养成';
        return {
            title: `我正在坚持「${habitName}」，一起来打卡吧！`,
            path: `/pages/index/index?share=habit&id=${this.data.habitId}`
        };
    },
    // 切换月份
    changeMonth(e) {
        const { direction } = e.currentTarget.dataset;
        // 暂时在前端未实现月份切换功能，可以在这里添加
        wx.showToast({
            title: `切换到${direction === 'prev' ? '上' : '下'}个月`,
            icon: 'none'
        });
    },
    // 编辑习惯
    editHabit() {
        wx.navigateTo({
            url: `/pages/habits/create/create?id=${this.data.habitId}`
        });
    },
    // 归档习惯
    archiveHabit() {
        if (!this.data.habit)
            return;
        const isArchived = this.data.habit.isArchived;
        const actionText = isArchived ? '取消归档' : '归档';
        wx.showModal({
            title: `${actionText}习惯`,
            content: isArchived ?
                '取消归档后，习惯将重新显示在习惯列表中' :
                '归档后，习惯将不再显示在主列表中，但不会被删除',
            confirmColor: '#4F7CFF',
            success: async (res) => {
                if (res.confirm) {
                    wx.showLoading({
                        title: `${actionText}中...`,
                        mask: true
                    });
                    try {
                        // 更新习惯状态
                        await api_1.habitAPI.updateHabit(this.data.habitId, {
                            isArchived: !isArchived
                        });
                        // 重新加载习惯数据
                        await this.loadHabitDetail();
                        wx.hideLoading();
                        wx.showToast({
                            title: `${actionText}成功`,
                            icon: 'success'
                        });
                    }
                    catch (error) {
                        console.error(`${actionText}习惯失败:`, error);
                        wx.hideLoading();
                        wx.showToast({
                            title: `${actionText}失败`,
                            icon: 'error'
                        });
                    }
                }
            }
        });
    },
    // 删除习惯
    deleteHabit() {
        wx.showModal({
            title: '删除习惯',
            content: '删除后将无法恢复，确定要删除吗？',
            confirmColor: '#F56C6C',
            success: async (res) => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '删除中...',
                        mask: true
                    });
                    try {
                        // 删除习惯
                        await api_1.habitAPI.deleteHabit(this.data.habitId);
                        wx.hideLoading();
                        wx.showToast({
                            title: '删除成功',
                            icon: 'success'
                        });
                        // 返回上一页
                        setTimeout(() => {
                            wx.navigateBack();
                        }, 1500);
                    }
                    catch (error) {
                        console.error('删除习惯失败:', error);
                        wx.hideLoading();
                        wx.showToast({
                            title: '删除失败',
                            icon: 'error'
                        });
                    }
                }
            }
        });
    }
});
