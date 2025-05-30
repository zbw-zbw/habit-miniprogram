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
        apiAvailable: true
    },
    onLoad(options) {
        const app = getApp();
        this.setData({
            apiAvailable: app.globalData.apiAvailable
        });
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
            // 处理打卡记录，添加格式化的时间
            const checkins = baseCheckins.map((checkin) => ({
                ...checkin,
                formattedTime: new Date(checkin.createdAt).toTimeString().substring(0, 5)
            }));
            this.setData({
                checkins,
                'loading.checkins': false
            });
            // 更新日历上的打卡记录
            this.updateCalendar();
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
            // 预先计算格式化的完成率
            const completionRateFormatted = (stats.completionRate * 100).toFixed(0);
            this.setData({
                stats,
                completionRateFormatted,
                'loading.stats': false
            });
        }
        catch (error) {
            console.error('加载统计数据失败:', error);
            this.setData({
                'loading.stats': false,
                'error.stats': '加载统计数据失败'
            });
        }
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
