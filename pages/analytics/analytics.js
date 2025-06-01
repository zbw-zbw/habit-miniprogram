"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 数据分析页面
 */
const date_1 = require("../../utils/date");
// 导入仪表盘API
const dashboard_1 = require("../../services/api/dashboard");
// 导入微信图表库
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
const wxCharts = require('../../utils/wxcharts');
const use_auth_1 = require("../../utils/use-auth");
const auth_1 = require("../../utils/auth");
/**
 * 格式化日期为指定格式
 * @param date 日期对象
 * @param format 格式字符串，支持'YYYY-MM-DD'或'MM-dd'
 * @returns 格式化后的日期字符串
 */
function formatDateCustom(date, format = 'YYYY-MM-DD') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (format === 'MM-dd') {
        return `${month}-${day}`;
    }
    return `${year}-${month}-${day}`;
}
Page({
    /**
     * 页面的初始数据
     */
    data: {
        activeTab: 'overview',
        tabList: ['总览', '习惯', '日历'],
        tabIndex: 0,
        timeRange: 'week',
        loading: true,
        chartLoading: false,
        stats: {
            totalHabits: 0,
            activeHabits: 0,
            completedToday: 0,
            completionRate: 0,
            totalCheckins: 0,
            currentStreak: 0,
            longestStreak: 0,
        },
        habitStats: [],
        habitsMap: {},
        chartData: {
            dates: [],
            values: [],
            completionRates: [],
        },
        // 日历相关数据
        calendarTitle: '',
        calendarMonth: new Date().getMonth(),
        calendarYear: new Date().getFullYear(),
        calendarDays: [],
        // 存储打卡数据
        checkins: [],
        error: '',
        // 分析数据
        categoryData: [],
        heatmapData: [],
        weeklyTrend: 0,
        bestCategory: '',
        timelineData: [],
        hasLogin: false,
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        // 使用useAuth获取登录状态
        (0, use_auth_1.useAuth)(this, {
            onChange: (authState) => {
                console.log('登录状态变化:', authState);
                // 如果登录状态发生变化，重新加载数据
                if (this.data.hasLogin !== authState.hasLogin) {
                    this.setData({ hasLogin: authState.hasLogin });
                    if (authState.hasLogin) {
                        // 已登录，加载数据
                        this.loadData();
                        this.updateCalendar();
                    }
                    else {
                        // 未登录，重置数据
                        this.resetStatsData();
                    }
                }
            }
        });
        // 设置初始tabIndex
        let tabIndex = 0;
        switch (this.data.activeTab) {
            case 'overview':
                tabIndex = 0;
                break;
            case 'habits':
                tabIndex = 1;
                break;
            case 'calendar':
                tabIndex = 2;
                break;
        }
        this.setData({ tabIndex });
        // 加载数据
        this.loadData();
        // 初始化日历
        this.updateCalendar();
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 未登录时重置数据
        if (!this.data.hasLogin) {
            this.resetStatsData();
            return;
        }
        this.loadData();
        this.updateCalendar();
    },
    /**
     * 加载数据
     */
    loadData() {
        this.setData({
            loading: true,
            chartLoading: true,
            error: '',
        });
        // 确定时间范围
        let startDate, endDate;
        const today = (0, date_1.formatDate)(new Date());
        switch (this.data.timeRange) {
            case 'week':
                // 过去一周
                startDate = (0, date_1.formatDate)(new Date(new Date().setDate(new Date().getDate() - 7)));
                endDate = today;
                break;
            case 'month':
                // 过去一个月
                startDate = (0, date_1.formatDate)(new Date(new Date().setMonth(new Date().getMonth() - 1)));
                endDate = today;
                break;
            case 'year':
                // 过去一年
                startDate = (0, date_1.formatDate)(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
                endDate = today;
                break;
            default:
                // 默认过去一周
                startDate = (0, date_1.formatDate)(new Date(new Date().setDate(new Date().getDate() - 7)));
                endDate = today;
        }
        // 使用新的聚合API获取分析数据
        dashboard_1.dashboardAPI
            .getAnalytics({
            startDate,
            endDate,
            timeRange: this.data.timeRange,
        })
            .then((data) => {
            console.log('获取分析数据成功:', data);
            // 处理数据
            this.processAnalyticsData(data);
        })
            .catch((error) => {
            console.error('获取分析数据失败:', error);
            // 加载失败
            this.setData({
                loading: false,
                chartLoading: false,
                error: '加载数据失败，请稍后重试',
            });
            // 绘制空图表
            this.drawEmptyCharts();
        });
    },
    /**
     * 处理分析数据
     */
    processAnalyticsData(data) {
        // 确保data是有效对象
        if (!data || typeof data !== 'object') {
            console.error('分析数据无效:', data);
            this.setData({
                loading: false,
                chartLoading: false,
                error: '数据格式错误',
            });
            return;
        }
        console.log('处理分析数据:', data);
        // 从聚合API的响应中提取数据
        let summary = data.summary || {};
        // 确保API响应可能包含在data字段中
        if (data.data && typeof data.data === 'object') {
            // 尝试从嵌套的data字段中获取数据
            const nestedData = data.data;
            summary = nestedData.summary || summary;
            // 如果外层没有habitStats但嵌套数据有，则使用嵌套数据的
            if (!data.habitStats && nestedData.habitStats) {
                data.habitStats = nestedData.habitStats;
            }
            // 同样处理其他字段
            if (!data.timelineData && nestedData.timelineData) {
                data.timelineData = nestedData.timelineData;
            }
            if (!data.categoryData && nestedData.categoryData) {
                data.categoryData = nestedData.categoryData;
            }
            if (!data.heatmapData && nestedData.heatmapData) {
                data.heatmapData = nestedData.heatmapData;
            }
        }
        // 从聚合API的响应中提取数据
        const { habitStats, categoryData, timelineData, heatmapData } = data;
        // 将习惯统计转换为habitStats数组格式，用于展示
        const habits = [];
        const habitsMap = {};
        // 构建习惯Map - 类型安全的方式
        if (habitStats && typeof habitStats === 'object') {
            Object.keys(habitStats).forEach((key) => {
                const statData = habitStats[key];
                if (statData && statData.habit) {
                    const habit = statData.habit;
                    habits.push(habit);
                    // 使用一致的ID字段
                    const habitId = habit.id || habit._id;
                    if (habitId) {
                        habitsMap[habitId] = habit;
                    }
                }
            });
        }
        console.log('提取的习惯数量:', habits.length);
        console.log('习惯Map:', habitsMap);
        // 检查今天的日期
        const today = (0, date_1.formatDate)(new Date());
        console.log('今天日期:', today);
        // 检查timelineData中今天的数据
        let completedToday = Number(summary.completedToday || 0);
        let todayCompletionRate = 0;
        if (Array.isArray(timelineData)) {
            // 查找今天的数据
            const todayData = timelineData.find((item) => item.date === today);
            console.log('今天的时间线数据:', todayData);
            if (todayData) {
                // 如果API返回的completedToday为0但时间线数据显示今天有完成的习惯，则使用时间线数据
                if (completedToday === 0 && todayData.totalCompleted > 0) {
                    completedToday = todayData.totalCompleted;
                    console.log('从时间线数据更新今日完成数:', completedToday);
                }
                todayCompletionRate = todayData.completionRate || 0;
            }
        }
        // 尝试从heatmapData获取今日完成的习惯数
        if (completedToday === 0 && Array.isArray(heatmapData)) {
            const todayHeatmap = heatmapData.find((item) => item.date === today);
            if (todayHeatmap && todayHeatmap.count > 0) {
                completedToday = todayHeatmap.count;
                console.log('从热图数据更新今日完成数:', completedToday);
            }
        }
        // 尝试计算最长连续打卡天数和当前连续天数
        let currentStreak = Number(summary.currentStreak || 0);
        let longestStreak = Number(summary.bestStreak || 0);
        // 从习惯统计数据中提取连续打卡天数
        if (habits.length > 0 && currentStreak === 0) {
            // 累加所有习惯的连续打卡天数
            habits.forEach((habit) => {
                // 使用类型断言和可选链处理stats属性
                const habitStats = habit.stats;
                if (habitStats === null || habitStats === void 0 ? void 0 : habitStats.currentStreak) {
                    currentStreak = Math.max(currentStreak, habitStats.currentStreak);
                }
            });
            // 同样计算最长连续打卡天数
            if (longestStreak === 0) {
                habits.forEach((habit) => {
                    // 使用类型断言和可选链处理stats属性
                    const habitStats = habit.stats;
                    if (habitStats === null || habitStats === void 0 ? void 0 : habitStats.longestStreak) {
                        longestStreak = Math.max(longestStreak, habitStats.longestStreak);
                    }
                });
            }
            console.log('从习惯统计数据更新连续打卡天数:', currentStreak, longestStreak);
        }
        // 处理统计数据，确保数字类型
        const totalHabits = Number(summary.totalHabits || 0);
        const activeHabits = Number(summary.activeHabits || 0);
        const completionRate = Number(summary.averageCompletionRate || todayCompletionRate || 0);
        const totalCheckins = Number(summary.totalCheckins || 0);
        console.log('处理后的统计数据:', {
            totalHabits,
            activeHabits,
            completedToday,
            completionRate,
            totalCheckins,
            currentStreak,
            longestStreak,
        });
        // 更新数据
        this.setData({
            stats: {
                totalHabits,
                activeHabits,
                completedToday,
                completionRate,
                totalCheckins,
                currentStreak,
                longestStreak,
            },
            categoryData: categoryData || [],
            timelineData: timelineData || [],
            heatmapData: heatmapData || [],
            weeklyTrend: Number(summary.weeklyTrend || 0),
            bestCategory: summary.bestCategory || '',
            habitsMap,
            loading: false,
            chartLoading: false,
            error: '',
        });
        // 生成图表数据
        if (Array.isArray(timelineData) && timelineData.length > 0) {
            this.generateChartData(timelineData);
        }
        else {
            console.warn('无时间线数据，无法生成图表');
            this.setData({ chartLoading: false });
            this.drawEmptyCharts();
        }
        // 更新日历数据
        this.updateCalendar();
        // 绘制图表
        setTimeout(() => {
            try {
                this.drawCharts();
            }
            catch (error) {
                console.error('绘制图表失败:', error);
                this.drawEmptyCharts();
            }
        }, 300);
        // 计算习惯统计数据 - 用于展示
        this.calculateHabitStats(habits, []);
    },
    /**
     * 计算习惯统计数据
     */
    calculateHabitStats(habits, checkins) {
        // 使用habitStats数据构建UI需要的习惯统计数组
        const habitStatsData = [];
        // 遍历习惯Map，获取每个习惯的统计数据
        Object.entries(this.data.habitsMap).forEach(([habitId, habit]) => {
            // 尝试从页面数据中获取统计信息
            const stats = this.data.habitStats
                ? this.data.habitStats[habitId]
                : null;
            habitStatsData.push({
                id: habitId,
                name: habit.name,
                color: habit.color || '#4F7CFF',
                icon: habit.icon || 'unknown',
                completionRate: stats ? stats.completionRate : 0,
                streak: stats ? stats.currentStreak : 0,
                totalCheckins: stats ? stats.totalCompletions : 0,
            });
        });
        // 按完成率降序排序
        habitStatsData.sort((a, b) => b.completionRate - a.completionRate);
        this.setData({ habitStats: habitStatsData });
    },
    /**
     * 生成图表数据
     */
    generateChartData(timelineData) {
        if (!Array.isArray(timelineData)) {
            console.error('时间线数据不是数组:', timelineData);
            this.setData({
                chartData: {
                    dates: [],
                    values: [],
                    completionRates: [],
                },
                chartLoading: false,
            });
            return;
        }
        // 对于年视图，需要按月份重新整理数据
        if (this.data.timeRange === 'year') {
            this.generateYearChartData(timelineData);
        }
        else {
            // 处理周和月视图
            const dates = timelineData.map((item) => formatDateCustom(new Date(item.date), 'MM-dd'));
            const completionRates = timelineData.map((item) => item.completionRate);
            const values = timelineData.map((item) => item.totalCompleted);
            this.setData({
                chartData: {
                    dates,
                    values,
                    completionRates,
                },
                chartLoading: false,
            });
            // 绘制图表
            setTimeout(() => {
                this.drawCharts();
            }, 300);
        }
    },
    /**
     * 为年视图生成图表数据
     */
    generateYearChartData(timelineData) {
        // 按月份分组数据
        const monthlyData = {};
        // 遍历时间线数据，按月份分组
        timelineData.forEach((item) => {
            const date = new Date(item.date);
            const month = date.getMonth() + 1; // 获取月份（1-12）
            const monthKey = month.toString().padStart(2, '0');
            // 初始化该月份的数据
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    totalCompleted: 0,
                    completionRate: 0,
                    count: 0,
                };
            }
            // 累加该月份的数据
            monthlyData[monthKey].totalCompleted += item.totalCompleted || 0;
            monthlyData[monthKey].completionRate += item.completionRate || 0;
            monthlyData[monthKey].count += 1;
        });
        // 创建1-12月的数据数组
        const allMonths = [
            '01',
            '02',
            '03',
            '04',
            '05',
            '06',
            '07',
            '08',
            '09',
            '10',
            '11',
            '12',
        ];
        // 构建图表数据
        const dates = allMonths.map((month) => month + '月');
        const values = allMonths.map((month) => {
            if (monthlyData[month]) {
                // 如果有该月的数据，则计算平均值
                return monthlyData[month].totalCompleted;
            }
            return 0; // 没有数据则返回0
        });
        const completionRates = allMonths.map((month) => {
            if (monthlyData[month] && monthlyData[month].count > 0) {
                // 计算该月的平均完成率
                return Math.round(monthlyData[month].completionRate / monthlyData[month].count);
            }
            return 0; // 没有数据则返回0
        });
        console.log('年视图处理后的数据:', { dates, values, completionRates });
        // 更新图表数据
        this.setData({
            chartData: {
                dates,
                values,
                completionRates,
            },
            chartLoading: false,
        });
        // 绘制图表
        setTimeout(() => {
            this.drawCharts();
        }, 300);
    },
    /**
     * 切换标签
     */
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ activeTab: tab }, () => {
            // 当切换到总览标签时，重新绘制图表
            if (tab === 'overview') {
                this.setData({ chartLoading: true }); // 显示图表加载状态
                setTimeout(() => {
                    this.drawCharts(); // 延迟执行以确保视图已更新
                }, 100);
            }
        });
    },
    /**
     * 处理Tab组件的标签变化
     */
    onTabChange(e) {
        const index = e.detail.index;
        let activeTab;
        switch (index) {
            case 0:
                activeTab = 'overview';
                break;
            case 1:
                activeTab = 'habits';
                break;
            case 2:
                activeTab = 'calendar';
                break;
            default:
                activeTab = 'overview';
        }
        console.log('Tab切换到:', activeTab, '索引:', index);
        // 先设置标签，再处理图表
        this.setData({
            tabIndex: index,
            activeTab: activeTab,
            // 只有在切换到总览时才设置图表加载状态
            chartLoading: activeTab === 'overview',
        }, () => {
            // 使用setTimeout避免在当前事件循环中更新状态和绘制图表
            setTimeout(() => {
                // 当切换到总览标签时，重新绘制图表
                if (activeTab === 'overview') {
                    try {
                        console.log('切换到总览标签，重新绘制图表');
                        // 检查图表数据是否有效
                        if (this.data.chartData &&
                            Array.isArray(this.data.chartData.dates) &&
                            this.data.chartData.dates.length > 0) {
                            this.drawCharts();
                        }
                        else {
                            console.log('无图表数据，绘制空图表');
                            // 如果没有数据，绘制空图表
                            this.drawEmptyCharts();
                        }
                    }
                    catch (error) {
                        console.error('绘制图表失败:', error);
                        this.drawEmptyCharts();
                    }
                    finally {
                        // 确保关闭加载状态
                        setTimeout(() => {
                            this.setData({ chartLoading: false });
                        }, 300);
                    }
                }
                // 切换到日历标签时更新日历
                if (activeTab === 'calendar') {
                    this.updateCalendar();
                }
            }, 200);
        });
    },
    /**
     * 切换时间范围
     */
    switchTimeRange(e) {
        const range = e.currentTarget.dataset.range;
        if (this.data.timeRange === range) {
            return; // 如果是相同的范围，不做任何操作
        }
        console.log('切换时间范围:', range);
        this.setData({
            timeRange: range,
            chartLoading: true
        });
        // 如果用户未登录，不发送请求，只重置数据
        if (!this.data.hasLogin) {
            this.resetStatsData();
            return;
        }
        // 加载新的时间范围数据
        this.loadData();
    },
    /**
     * 重置统计数据到默认状态
     */
    resetStatsData() {
        this.setData({
            loading: false,
            chartLoading: false,
            stats: {
                totalHabits: 0,
                activeHabits: 0,
                completedToday: 0,
                completionRate: 0,
                totalCheckins: 0,
                currentStreak: 0,
                longestStreak: 0
            },
            chartData: {
                dates: [],
                values: [],
                completionRates: []
            },
            habitStats: [],
            habitsMap: {},
            error: '请先登录以查看数据统计'
        });
        // 绘制空图表
        this.drawEmptyCharts();
    },
    /**
     * 查看习惯详情
     */
    viewHabitDetail(e) {
        const habitId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/habits/detail/detail?id=${habitId}`,
        });
    },
    /**
     * 生成报告
     */
    generateReport() {
        wx.navigateTo({
            url: `/pages/analytics/report/report`,
        });
    },
    /**
     * 跳转到习惯洞察页面
     */
    navigateToInsights() {
        wx.navigateTo({
            url: '/pages/analytics/insights/insights',
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '我的习惯分析报告',
            path: '/pages/analytics/analytics',
            imageUrl: '/images/share-analytics.png',
        };
    },
    /**
     * 更新日历
     */
    updateCalendar() {
        const { calendarYear, calendarMonth } = this.data;
        const calendarTitle = `${calendarYear}年${calendarMonth + 1}月`;
        // 获取当月第一天是周几
        const firstDay = new Date(calendarYear, calendarMonth, 1).getDay() || 7; // 转换为周一为1，周日为7
        const firstDayIndex = firstDay === 7 ? 0 : firstDay; // 调整为数组索引
        // 获取当月天数
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        // 上个月的天数
        const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();
        const calendarDays = [];
        const today = (0, date_1.formatDate)(new Date());
        // 上个月的日期
        for (let i = 0; i < firstDayIndex; i++) {
            const day = prevMonthDays - firstDayIndex + i + 1;
            const date = (0, date_1.formatDate)(new Date(calendarYear, calendarMonth - 1, day));
            calendarDays.push({
                date,
                day,
                isCurrentMonth: false,
                isCompleted: this.isDateCompleted(date),
                isToday: this.isToday(date),
            });
        }
        // 当月的日期
        for (let i = 1; i <= daysInMonth; i++) {
            const date = (0, date_1.formatDate)(new Date(calendarYear, calendarMonth, i));
            calendarDays.push({
                date,
                day: i,
                isCurrentMonth: true,
                isCompleted: this.isDateCompleted(date),
                isToday: this.isToday(date),
            });
        }
        // 下个月的日期
        const remainingDays = 42 - calendarDays.length; // 6行7列
        for (let i = 1; i <= remainingDays; i++) {
            const date = (0, date_1.formatDate)(new Date(calendarYear, calendarMonth + 1, i));
            calendarDays.push({
                date,
                day: i,
                isCurrentMonth: false,
                isCompleted: this.isDateCompleted(date),
                isToday: this.isToday(date),
            });
        }
        this.setData({
            calendarTitle,
            calendarDays,
        });
    },
    /**
     * 检查日期是否已完成打卡
     */
    isDateCompleted(date) {
        // 使用页面中存储的打卡记录和习惯数据来判断日期是否已完成
        const habitsMap = this.data.habitsMap;
        const habits = Object.values(habitsMap);
        return this.isDateFullyCompleted(date, habits, this.data.checkins);
    },
    /**
     * 检查特定日期是否所有习惯都已完成
     * @param date 日期字符串
     * @param habits 习惯列表
     * @param checkins 打卡记录列表
     */
    isDateFullyCompleted(date, habits, checkins) {
        // 如果没有习惯或打卡记录，直接返回false
        if (!habits || habits.length === 0)
            return false;
        if (!checkins || checkins.length === 0)
            return false;
        // 筛选出指定日期应该执行的习惯
        const habitsForDate = habits.filter((habit) => {
            // 检查习惯是否在指定日期应该执行
            // 需要确保习惯在日期之前创建
            const habitCreatedAt = new Date(habit.createdAt);
            const targetDate = new Date(date);
            if (habitCreatedAt > targetDate)
                return false;
            // 已归档的习惯不计入
            if (habit.isArchived)
                return false;
            // 根据习惯频率判断是否应该在该日期执行
            // 这里简化处理，假设所有习惯都是每天执行
            return true;
        });
        // 如果没有应该执行的习惯，直接返回false
        if (habitsForDate.length === 0)
            return false;
        // 筛选出指定日期的打卡记录
        const checkinsForDate = checkins.filter((checkin) => checkin.date === date);
        // 检查每个习惯是否都有完成的打卡记录
        const completedHabits = habitsForDate.filter((habit) => {
            // 获取习惯ID，支持多种属性名
            const habitId = typeof habit === 'object' ? habit.id || habit._id || '' : '';
            // 检查是否有该习惯的完成打卡记录
            return checkinsForDate.some((checkin) => {
                const checkinHabitId = checkin.habitId ||
                    (checkin.habit && typeof checkin.habit === 'object'
                        ? checkin.habit.id || checkin.habit._id || ''
                        : '');
                return checkinHabitId === habitId && checkin.isCompleted;
            });
        });
        // 所有习惯都有完成的打卡记录才算完成
        return completedHabits.length === habitsForDate.length;
    },
    /**
     * 检查是否是今天
     */
    isToday(date) {
        return date === (0, date_1.formatDate)(new Date());
    },
    /**
     * 切换月份
     */
    changeMonth(e) {
        const { direction } = e.currentTarget.dataset;
        let { calendarYear, calendarMonth } = this.data;
        if (direction === 'prev') {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
        }
        else {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
        }
        this.setData({
            calendarYear,
            calendarMonth,
        }, () => {
            this.updateCalendar();
        });
    },
    /**
     * 查看日期详情
     */
    viewDayDetail(e) {
        const { date } = e.currentTarget.dataset;
        wx.showToast({
            title: `查看${date}的记录`,
            icon: 'none',
        });
        // 实际项目中可以跳转到日期详情页
        // wx.navigateTo({
        //   url: `/pages/date-detail/date-detail?date=${date}`
        // });
    },
    /**
     * 在数据加载完成后绘制图表
     */
    drawCharts() {
        try {
            const { chartData, timeRange } = this.data;
            // 确保有数据可以绘制
            if (!chartData.dates || chartData.dates.length === 0) {
                console.log('没有图表数据可绘制');
                // 创建空图表，显示"暂无数据"
                this.drawEmptyCharts();
                return;
            }
            console.log('开始绘制图表，数据:', chartData);
            // 设置图表的公共配置
            const chartConfig = {
                width: 320,
                height: 200,
                color: '#4F7CFF',
                xAxisRotate: 0,
                pointShape: true,
                displayDates: [...chartData.dates],
            };
            // 根据时间范围调整配置
            if (timeRange === 'month') {
                // 月视图每4天显示一个标签
                chartConfig.displayDates = chartData.dates.map((date, index) => {
                    return index % 4 === 0 ? date : '';
                });
                chartConfig.xAxisRotate = 45; // 月视图旋转X轴标签
                chartConfig.pointShape = false; // 不显示点
            }
            else if (timeRange === 'year') {
                // 年视图下，displayDates已经在generateYearChartData中正确设置为月份标签
                chartConfig.xAxisRotate = 0; // 年视图不需要旋转标签
                chartConfig.pointShape = false; // 不显示点
            }
            try {
                // 先清除可能存在的旧图表，避免内存泄漏
                wx.createCanvasContext('completionChart').draw();
                wx.createCanvasContext('checkinsChart').draw();
            }
            catch (e) {
                console.log('清除旧图表失败:', e);
            }
            // 绘制完成率趋势图表
            new wxCharts({
                canvasId: 'completionChart',
                type: 'line',
                categories: chartConfig.displayDates,
                series: [
                    {
                        name: '完成率',
                        data: chartData.completionRates,
                        format: function (val) {
                            return val.toFixed(0) + '%';
                        },
                        color: chartConfig.color, // 确保颜色是蓝色
                    },
                ],
                yAxis: {
                    title: '',
                    min: 0,
                    max: 100,
                    format: function (val) {
                        return val.toFixed(0) + '%';
                    },
                    fontColor: '#909399',
                    titleFontColor: '#909399',
                    disabled: false,
                    gridColor: '#E4E7ED',
                    titleFontSize: 10,
                    fontWeight: 'normal',
                    padding: 30,
                    splitNumber: 5, // 将Y轴分为5个等分
                },
                xAxis: {
                    fontColor: '#909399',
                    rotate: chartConfig.xAxisRotate,
                    itemCount: timeRange === 'year' ? 12 : timeRange === 'month' ? 8 : 7,
                    boundaryGap: true,
                    disableGrid: true, // 禁用X轴网格线以减少视觉干扰
                },
                width: chartConfig.width,
                height: chartConfig.height,
                dataLabel: timeRange === 'week',
                legend: false,
                extra: {
                    lineStyle: 'curve',
                    yAxis: {
                        gridType: 'dash',
                        dashLength: 4, // 虚线长度
                    },
                    point: {
                        display: chartConfig.pointShape, // 控制是否显示数据点
                    },
                },
            });
            // 计算打卡次数图表的最大值，确保至少为1
            const maxValue = Math.max(...chartData.values, 1);
            console.log('打卡次数最大值:', maxValue);
            // 创建Y轴刻度数组
            const yAxisMax = maxValue < 5 ? 5 : Math.ceil(maxValue * 1.2); // 为数据留出一些空间
            const yAxisItems = [];
            // 如果最大值小于5，使用0-5的固定刻度
            if (maxValue < 5) {
                for (let i = 0; i <= 5; i++) {
                    yAxisItems.push(i);
                }
            }
            else {
                // 计算合适的步长
                const step = this.calculateYAxisStep(maxValue);
                for (let i = 0; i <= yAxisMax; i += step) {
                    yAxisItems.push(i);
                }
            }
            console.log('打卡次数Y轴刻度:', yAxisItems);
            // 绘制打卡次数图表
            setTimeout(() => {
                try {
                    new wxCharts({
                        canvasId: 'checkinsChart',
                        type: 'column',
                        categories: chartConfig.displayDates,
                        series: [
                            {
                                name: '打卡次数',
                                data: chartData.values,
                                format: function (val) {
                                    return Math.round(val); // 确保打卡次数显示为整数
                                },
                                color: chartConfig.color, // 使用蓝色，与完成率图表保持一致
                            },
                        ],
                        yAxis: {
                            title: '',
                            min: 0,
                            max: yAxisMax,
                            format: function (val) {
                                return Math.round(val); // 确保Y轴刻度显示为整数
                            },
                            fontColor: '#909399',
                            titleFontColor: '#909399',
                            disabled: false,
                            gridColor: '#E4E7ED',
                            fontWeight: 'normal',
                            padding: 30,
                            items: yAxisItems, // 自定义Y轴刻度值
                        },
                        xAxis: {
                            fontColor: '#909399',
                            rotate: chartConfig.xAxisRotate,
                            itemCount: timeRange === 'year' ? 12 : timeRange === 'month' ? 8 : 7,
                            boundaryGap: true,
                            disableGrid: true, // 禁用X轴网格线以减少视觉干扰
                        },
                        width: chartConfig.width,
                        height: chartConfig.height,
                        dataLabel: timeRange === 'week',
                        legend: false,
                        extra: {
                            column: {
                                width: timeRange === 'year' ? 20 : timeRange === 'month' ? 10 : 15, // 根据时间范围调整柱形宽度
                            },
                            yAxis: {
                                gridType: 'dash',
                                dashLength: 4, // 虚线长度
                            },
                        },
                    });
                }
                catch (error) {
                    console.error('绘制打卡次数图表失败:', error);
                }
                // 图表绘制完成后，设置加载状态为false
                setTimeout(() => {
                    this.setData({ chartLoading: false });
                }, 100); // 给一点延迟，让用户能够看到加载动画
            }, 50); // 稍微延迟绘制第二个图表，避免冲突
            console.log('图表绘制完成');
        }
        catch (error) {
            console.error('绘制图表失败:', error);
            this.drawEmptyCharts(); // 出错时绘制空图表
            this.setData({ chartLoading: false }); // 出错时也要关闭加载状态
        }
    },
    /**
     * 计算合适的Y轴步长
     */
    calculateYAxisStep(maxValue) {
        if (maxValue <= 5)
            return 1; // 如果最大值小于等于5，步长为1
        if (maxValue <= 10)
            return 2; // 如果最大值小于等于10，步长为2
        if (maxValue <= 20)
            return 4; // 如果最大值小于等于20，步长为4
        if (maxValue <= 50)
            return 10; // 如果最大值小于等于50，步长为10
        return Math.ceil(maxValue / 5); // 其他情况下，大致分5个刻度
    },
    /**
     * 绘制空图表（无数据时）
     */
    drawEmptyCharts() {
        try {
            // 创建默认日期和数据
            const dates = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            const values = [0, 0, 0, 0, 0, 0, 0];
            const chartColor = '#4F7CFF';
            try {
                // 先清除可能存在的旧图表
                wx.createCanvasContext('completionChart').draw();
                wx.createCanvasContext('checkinsChart').draw();
            }
            catch (e) {
                console.log('清除旧图表失败:', e);
            }
            // 绘制完成率趋势图表
            new wxCharts({
                canvasId: 'completionChart',
                type: 'line',
                categories: dates,
                series: [
                    {
                        name: '完成率',
                        data: values,
                        format: function (val) {
                            return val.toFixed(0) + '%';
                        },
                        color: chartColor, // 确保颜色是蓝色
                    },
                ],
                yAxis: {
                    title: '',
                    min: 0,
                    max: 100,
                    format: function (val) {
                        return val.toFixed(0) + '%';
                    },
                    fontColor: '#909399',
                    titleFontColor: '#909399',
                    disabled: false,
                    gridColor: '#E4E7ED',
                    titleFontSize: 10,
                    fontWeight: 'normal',
                    padding: 30,
                    splitNumber: 5, // 将Y轴分为5个等分
                },
                width: 320,
                height: 200,
                dataLabel: false,
                legend: false,
                extra: {
                    lineStyle: 'curve',
                    yAxis: {
                        gridType: 'dash',
                        dashLength: 4, // 虚线长度
                    },
                },
            });
            // 稍微延迟绘制第二个图表
            setTimeout(() => {
                try {
                    // 绘制打卡次数图表
                    new wxCharts({
                        canvasId: 'checkinsChart',
                        type: 'column',
                        categories: dates,
                        series: [
                            {
                                name: '打卡次数',
                                data: values,
                                format: function (val) {
                                    return Math.round(val); // 确保打卡次数显示为整数
                                },
                                color: chartColor, // 使用蓝色，与完成率图表保持一致
                            },
                        ],
                        yAxis: {
                            title: '',
                            min: 0,
                            max: 5,
                            format: function (val) {
                                return Math.round(val); // 确保Y轴刻度显示为整数
                            },
                            fontColor: '#909399',
                            titleFontColor: '#909399',
                            disabled: false,
                            gridColor: '#E4E7ED',
                            titleFontSize: 10,
                            fontWeight: 'normal',
                            padding: 30,
                            items: [0, 1, 2, 3, 4, 5], // 自定义Y轴刻度值，明确指定值
                        },
                        width: 320,
                        height: 200,
                        dataLabel: false,
                        legend: false,
                        extra: {
                            column: {
                                width: 15, // 调整柱形宽度
                            },
                            yAxis: {
                                gridType: 'dash',
                                dashLength: 4, // 虚线长度
                            },
                        },
                    });
                }
                catch (error) {
                    console.error('绘制空打卡次数图表失败:', error);
                }
            }, 50);
            console.log('空图表绘制完成');
            // 图表绘制完成后，设置加载状态为false
            setTimeout(() => {
                this.setData({ chartLoading: false });
            }, 300); // 给一点延迟，让用户能够看到加载动画
        }
        catch (error) {
            console.error('绘制空图表失败:', error);
            this.setData({ chartLoading: false }); // 出错时也要关闭加载状态
        }
    },
    /**
     * 连续打卡进度条计算
     * 获取当前进度比例，处理除以零的情况
     */
    getStreakProgressWidth() {
        const { currentStreak, longestStreak } = this.data.stats;
        if (longestStreak <= 0)
            return '0%'; // 避免除以零
        return Math.min(100, (currentStreak / longestStreak) * 100) + '%';
    },
    /**
     * 登录方法
     */
    login() {
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
});
