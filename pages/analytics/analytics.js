"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 数据分析页面
 */
const date_1 = require("../../utils/date");
const api_1 = require("../../services/api");
// 导入微信图表库
const wxCharts = require('../../utils/wxcharts');
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
        habitsMap: {},
        chartData: {
            dates: [],
            values: [],
            completionRates: []
        },
        // 日历相关数据
        calendarTitle: '',
        calendarMonth: new Date().getMonth(),
        calendarYear: new Date().getFullYear(),
        calendarDays: [],
        // 存储打卡数据
        checkins: [],
        error: ''
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        // 页面加载时执行
        console.log('初始化analytics页面tabList:', this.data.tabList);
        this.updateCalendar();
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        this.loadData();
        this.updateCalendar();
    },
    /**
     * 加载数据
     */
    loadData() {
        this.setData({
            loading: true,
            error: ''
        });
        // 创建默认数据，作为API不可用时的备选
        const defaultHabits = [
            {
                id: 'sample1',
                name: '阅读',
                description: '每天阅读30分钟',
                category: 'learning',
                icon: 'book',
                color: '#4F7CFF',
                frequency: { type: 'daily' },
                startDate: '2023-01-01',
                reminder: { enabled: true, time: '20:00' },
                isArchived: false,
                createdAt: '2023-01-01'
            },
            {
                id: 'sample2',
                name: '锻炼',
                description: '每天锻炼30分钟',
                category: 'health',
                icon: 'run',
                color: '#67C23A',
                frequency: { type: 'daily' },
                startDate: '2023-01-01',
                reminder: { enabled: true, time: '18:00' },
                isArchived: false,
                createdAt: '2023-01-01'
            }
        ];
        const today = (0, date_1.formatDate)(new Date());
        const last30Days = (0, date_1.getPastDates)(30);
        // 生成默认打卡数据
        const defaultCheckins = [];
        defaultHabits.forEach(habit => {
            // 为每个习惯生成随机打卡记录
            last30Days.forEach(date => {
                // 70%的概率完成
                const isCompleted = Math.random() > 0.3;
                if (isCompleted && habit.id) {
                    defaultCheckins.push({
                        id: `${habit.id}-${date}`,
                        habitId: habit.id,
                        date,
                        isCompleted: true,
                        createdAt: date + 'T08:00:00.000Z'
                    });
                }
            });
        });
        // 检查是否有本地缓存数据
        const cachedHabits = wx.getStorageSync('cachedHabits');
        const cachedCheckins = wx.getStorageSync('cachedCheckins');
        const cacheTime = wx.getStorageSync('analyticsCacheTime');
        const now = Date.now();
        // 如果缓存时间超过1小时，则视为无效
        const cacheExpired = !cacheTime || (now - cacheTime) > 3600000;
        // 如果有有效缓存，先使用缓存数据快速显示
        if (cachedHabits && cachedCheckins && !cacheExpired) {
            // 使用缓存数据先显示
            this.calculateOverallStats(cachedHabits, cachedCheckins);
            this.calculateHabitStats(cachedHabits, cachedCheckins);
            this.generateChartData(cachedHabits, cachedCheckins);
            this.setData({
                checkins: cachedCheckins,
                loading: false
            });
            // 更新日历数据
            this.updateCalendar();
        }
        // 无论是否有缓存，都尝试从API获取最新数据
        Promise.all([
            api_1.habitAPI.getHabits().catch((error) => {
                console.error('获取习惯数据失败:', error);
                // 如果有缓存则使用缓存，否则使用默认数据
                return cachedHabits || defaultHabits;
            }),
            api_1.checkinAPI.getCheckins().catch((error) => {
                console.error('获取打卡数据失败:', error);
                // 如果有缓存则使用缓存，否则使用默认数据
                return cachedCheckins || defaultCheckins;
            })
        ])
            .then(([habitsResponse, checkinsResponse]) => {
            // 处理API响应格式 (有些API会返回 {success, data} 格式)
            const habits = habitsResponse.data ? habitsResponse.data : habitsResponse;
            const checkins = checkinsResponse.data ? checkinsResponse.data : checkinsResponse;
            // 标准化习惯数据格式，确保有id字段
            const normalizedHabits = habits.map((habit) => ({
                ...habit,
                id: habit.id || habit._id
            }));
            // 标准化打卡数据格式
            const normalizedCheckins = checkins.map((checkin) => {
                // 确保habitId字段存在
                if (!checkin.habitId && checkin.habit) {
                    if (typeof checkin.habit === 'string') {
                        checkin.habitId = checkin.habit;
                    }
                    else if (typeof checkin.habit === 'object' && checkin.habit._id) {
                        checkin.habitId = checkin.habit._id;
                    }
                }
                return checkin;
            });
           
            // 保存打卡数据到页面数据中
            this.setData({ checkins: normalizedCheckins });
            // 计算总体统计数据
            this.calculateOverallStats(normalizedHabits, normalizedCheckins);
            // 计算各习惯统计数据
            this.calculateHabitStats(normalizedHabits, normalizedCheckins);
            // 生成图表数据
            this.generateChartData(normalizedHabits, normalizedCheckins);
            this.setData({ loading: false });
            // 更新日历数据
            this.updateCalendar();
        })
            .catch((error) => {
            console.error('加载数据失败:', error);
            // 如果之前没有使用过缓存数据，则现在使用
            if (!cachedHabits || !cachedCheckins || cacheExpired) {
                // 使用默认数据
                this.calculateOverallStats(defaultHabits, defaultCheckins);
                this.calculateHabitStats(defaultHabits, defaultCheckins);
                this.generateChartData(defaultHabits, defaultCheckins);
                this.setData({
                    checkins: defaultCheckins,
                    loading: false,
                    error: '加载数据失败，显示示例数据'
                });
                // 更新日历数据
                this.updateCalendar();
            }
            else {
                this.setData({
                    error: '无法获取最新数据，显示缓存数据'
                });
            }
        });
    },
    /**
     * 计算总体统计数据
     */
    calculateOverallStats(habits, checkins) {
        const today = (0, date_1.formatDate)(new Date());
        const activeHabits = habits.filter(h => !h.isArchived);
        const completedToday = checkins.filter(c => c.date === today && c.isCompleted).length;
        // 直接计算完成率，不再依赖异步API调用
        this.calculateDirectCompletionRate(activeHabits, checkins);
        // 获取所有习惯的统计数据
        const statsPromises = activeHabits
            .filter(habit => !!habit.id) // 过滤掉没有有效ID的习惯
            .map(habit => api_1.habitAPI.getHabitStats(habit.id)
            .catch(error => {
            console.error(`获取习惯 ${habit.name || habit.id} 的统计数据失败:`, error);
            // 返回默认统计数据
            return {
                totalCompletions: 0,
                totalDays: 0,
                currentStreak: 0,
                longestStreak: 0,
                completionRate: 0,
                lastCompletedDate: null
            };
        }));
        Promise.all(statsPromises)
            .then(statsArray => {
            // 计算最大连续天数
            let maxCurrentStreak = 0;
            let maxLongestStreak = 0;
            statsArray.forEach(stats => {
                maxCurrentStreak = Math.max(maxCurrentStreak, stats.currentStreak);
                maxLongestStreak = Math.max(maxLongestStreak, stats.longestStreak);
            });
            this.setData({
                'stats.currentStreak': maxCurrentStreak,
                'stats.longestStreak': maxLongestStreak || 1 // 确保不为0，避免进度条计算错误
            });
        })
            .catch(error => {
            console.error('计算总体统计数据失败:', error);
        });
    },
    /**
     * 直接计算完成率，不依赖API调用
     */
    calculateDirectCompletionRate(habits, checkins) {
        try {
            // 获取今天的日期
            const today = (0, date_1.formatDate)(new Date());
            // 过滤出活跃习惯
            const activeHabits = habits.filter(h => !h.isArchived);
            // 对象保护，确保处理空数组
            if (!activeHabits.length || !checkins.length) {
                this.setData({
                    'stats.totalHabits': habits.length,
                    'stats.activeHabits': 0,
                    'stats.completedToday': 0,
                    'stats.completionRate': 0,
                    'stats.totalCheckins': 0
                });
                return;
            }
            // 统计今日完成的习惯
            let completedToday = 0;
            // 总共应该打卡的次数
            let totalRequiredCheckins = 0;
            // 总共完成的次数
            let totalCompletedCheckins = 0;
            // 遍历每个习惯
            activeHabits.forEach(habit => {
                // 处理ID，支持_id和id两种形式
                const habitId = habit._id || habit.id;
                if (!habitId)
                    return;
                // 获取该习惯的所有打卡记录
                const habitCheckins = checkins.filter(checkin => {
                    const checkinHabitId = checkin.habitId ||
                        (checkin.habit && typeof checkin.habit === 'object' ? checkin.habit._id : checkin.habit);
                    return checkinHabitId === habitId;
                });
                // 获取该习惯的已完成打卡记录
                const completedCheckins = habitCheckins.filter(checkin => checkin.isCompleted);
                // 累加已完成打卡次数
                totalCompletedCheckins += completedCheckins.length;
                // 累加应该打卡的次数
                // 如果习惯是每日习惯，则简单计算天数
                // 如果习惯有特定频率，需要考虑频率
                if (habit.frequency.type === 'daily') {
                    // 每日习惯，计算从习惯开始日期到今天的总天数
                    const startDate = new Date(habit.startDate);
                    const today = new Date();
                    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
                    totalRequiredCheckins += Math.max(0, daysDiff);
                }
                else if (habit.frequency.type === 'weekly' && habit.frequency.days) {
                    // 每周特定日期习惯，计算从习惯开始日期到今天应该打卡的总次数
                    const startDate = new Date(habit.startDate);
                    const today = new Date();
                    const date = new Date(startDate);
                    let count = 0;
                    while (date <= today) {
                        const dayOfWeek = date.getDay(); // 0是周日，1-6是周一到周六
                        if (habit.frequency.days.includes(dayOfWeek)) {
                            count++;
                        }
                        date.setDate(date.getDate() + 1);
                    }
                    totalRequiredCheckins += count;
                }
                else {
                    // 其他类型习惯，目前简单处理为与打卡记录数相同
                    totalRequiredCheckins += habitCheckins.length;
                }
                // 检查今天是否已完成
                if (completedCheckins.some(checkin => checkin.date === today)) {
                    completedToday++;
                }
            });
            // 计算完成率 - 基于打卡记录计算：已完成的打卡 / 应该打卡的总次数
            const completionRate = totalRequiredCheckins > 0 ?
                Math.round((totalCompletedCheckins / totalRequiredCheckins) * 100) : 0;
            console.log('完成率计算:', {
                totalCompletedCheckins,
                totalRequiredCheckins,
                completionRate
            });
            this.setData({
                'stats.totalHabits': habits.length,
                'stats.activeHabits': activeHabits.length,
                'stats.completedToday': completedToday,
                'stats.completionRate': Math.min(100, completionRate),
                'stats.totalCheckins': totalCompletedCheckins
            });
        }
        catch (error) {
            console.error('计算完成率失败:', error);
            // 错误时设为0%而不是默认的100%
            this.setData({
                'stats.completionRate': 0
            });
        }
    },
    /**
     * 判断某个习惯在某日是否应该打卡
     */
    shouldDoHabitOnDate(habit, date) {
        if (!habit.frequency)
            return false;
        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay(); // 0是周日，1-6是周一到周六
        switch (habit.frequency.type) {
            case 'daily':
                return true;
            case 'weekly':
                // 检查是否匹配当前星期几
                if ('days' in habit.frequency && Array.isArray(habit.frequency.days)) {
                    return habit.frequency.days.includes(dayOfWeek);
                }
                return false;
            case 'custom':
                // 如果是自定义日期，检查是否包含该日期
                if ('customDates' in habit.frequency && Array.isArray(habit.frequency.customDates)) {
                    return habit.frequency.customDates.includes(date);
                }
                return false;
            default:
                return false;
        }
    },
    /**
     * 计算各习惯统计数据
     */
    calculateHabitStats(habits, checkins) {
        console.log('开始计算habitStats，习惯数量:', habits.length);
        const activeHabits = habits.filter(h => !h.isArchived);
        console.log('活跃习惯数量:', activeHabits.length);
        const habitStatsList = [];
        const habitsMap = {};
        // 为每个习惯计算统计数据
        activeHabits.forEach(habit => {
            console.log('处理习惯:', habit.name, habit.id || habit._id);
            const habitId = habit.id || habit._id;
            if (!habitId)
                return;
            // 添加到habitsMap
            habitsMap[habitId] = habit;
            // 获取该习惯的所有打卡记录
            const habitCheckins = checkins.filter(c => {
                const checkinHabitId = c.habitId ||
                    (c.habit && typeof c.habit === 'object' ? c.habit._id : c.habit);
                return checkinHabitId === habitId;
            });
            // 计算打卡次数
            const totalCheckins = habitCheckins.filter(c => c.isCompleted).length;
            // 计算完成率
            let completionRate = 0;
            // 如果习惯有内置统计数据，使用它
            if (habit.stats &&
                typeof habit.stats.completedDays === 'number' &&
                typeof habit.stats.totalDays === 'number') {
                const { completedDays, totalDays } = habit.stats;
                completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
            }
            else {
                // 简单计算完成率
                completionRate = habitCheckins.length > 0 ?
                    Math.round((totalCheckins / habitCheckins.length) * 100) : 0;
            }
            // 计算连续打卡天数
            let streak = 0;
            if (habit.stats && typeof habit.stats.currentStreak === 'number') {
                streak = habit.stats.currentStreak;
            }
            habitStatsList.push({
                id: habitId,
                name: habit.name || '未命名习惯',
                color: habit.color || '#4F7CFF',
                icon: habit.icon || 'star',
                completionRate: completionRate,
                streak: streak,
                totalCheckins: totalCheckins
            });
        });
        console.log('生成的habitStatsList:', habitStatsList);
        // 按完成率排序
        habitStatsList.sort((a, b) => b.completionRate - a.completionRate);
        this.setData({ habitStats: habitStatsList, habitsMap });
        console.log('设置完成后的habitStats:', this.data.habitStats);
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
            let completedCount = 0;
            let habitCount = 0;
            // 处理API返回的不同数据结构
            activeHabits.forEach(habit => {
                const habitId = habit.id || habit._id;
                if (!habitId)
                    return;
                // 对每个习惯检查该日期是否需要打卡
                // 简化处理，假设所有习惯每天都需要打卡
                habitCount++;
                // 检查是否完成打卡
                const isCompleted = checkins.some(c => {
                    const checkinHabitId = c.habitId ||
                        (c.habit && typeof c.habit === 'object' ? c.habit._id : c.habit);
                    return checkinHabitId === habitId && c.date === date && c.isCompleted;
                });
                if (isCompleted) {
                    completedCount++;
                }
            });
            values.push(completedCount);
            // 计算完成率，避免除以零
            const rate = habitCount > 0 ? Math.round((completedCount / habitCount) * 100) : 0;
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
        }, () => {
            // 数据设置完成后绘制图表
            this.drawCharts();
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
        this.setData({
            tabIndex: index,
            activeTab: activeTab
        });
        // 切换到日历标签时更新日历
        if (activeTab === 'calendar') {
            this.updateCalendar();
        }
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
                isToday: this.isToday(date)
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
                isToday: this.isToday(date)
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
                isToday: this.isToday(date)
            });
        }
        this.setData({
            calendarTitle,
            calendarDays
        });
    },
    /**
     * 检查日期是否已完成打卡
     */
    isDateCompleted(date) {
        // 使用页面中存储的打卡记录来判断日期是否已完成
        return this.data.checkins.some(checkin => checkin.date === date && checkin.isCompleted);
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
            calendarMonth
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
            icon: 'none'
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
            const { chartData } = this.data;
            
            // 确保有数据可以绘制
            if (!chartData.dates || chartData.dates.length === 0) {
                console.log('没有图表数据可绘制');
                // 创建空图表，显示"暂无数据"
                this.drawEmptyCharts();
                return;
            }
            
            console.log('开始绘制图表，数据:', chartData);
            
            // 绘制完成率趋势图表
            new wxCharts({
                canvasId: 'completionChart',
                type: 'line',
                categories: chartData.dates,
                series: [{
                    name: '完成率',
                    data: chartData.completionRates,
                    format: function(val) {
                        return val.toFixed(0) + '%';
                    }
                }],
                yAxis: {
                    title: '完成率(%)',
                    min: 0,
                    max: 100,
                    format: function(val) {
                        return val.toFixed(0) + '%';
                    }
                },
                width: 320,
                height: 200,
                dataLabel: false, // 关闭数据标签避免重叠
                legend: false,
                extra: {
                    lineStyle: 'curve', // 使用曲线而非折线
                    pointShape: true    // 显示数据点
                }
            });
            
            // 绘制打卡次数图表
            new wxCharts({
                canvasId: 'checkinsChart',
                type: 'column',
                categories: chartData.dates,
                series: [{
                    name: '打卡次数',
                    data: chartData.values,
                    format: function(val) {
                        // 确保只显示整数
                        return Math.round(val);
                    }
                }],
                yAxis: {
                    title: '次数',
                    min: 0,
                    // 设置步长为1，确保只显示整数
                    format: function(val) {
                        return Math.round(val);
                    },
                    // 只显示整数刻度
                    splitNumber: Math.max(1, Math.ceil(Math.max(...chartData.values))),
                    disableGrid: false
                },
                width: 320,
                height: 200,
                dataLabel: true,
                legend: false,
                extra: {
                    column: {
                        width: 20 // 设置柱状图宽度，避免过宽
                    }
                }
            });
            
            console.log('图表绘制完成');
        } catch (error) {
            console.error('绘制图表失败:', error);
        }
    },
    /**
     * 绘制空图表（无数据时）
     */
    drawEmptyCharts() {
        try {
            const wxCharts = require('../../utils/wxcharts');
            // 创建默认日期和数据
            const dates = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            const values = [0, 0, 0, 0, 0, 0, 0];
            
            // 绘制完成率趋势图表
            new wxCharts({
                canvasId: 'completionChart',
                type: 'line',
                categories: dates,
                series: [{
                    name: '完成率',
                    data: values,
                    format: function(val) {
                        return val.toFixed(0) + '%';
                    }
                }],
                yAxis: {
                    title: '完成率(%)',
                    min: 0,
                    max: 100,
                    format: function(val) {
                        return val.toFixed(0) + '%';
                    }
                },
                width: 320,
                height: 200,
                dataLabel: false,
                legend: false,
                extra: {
                    lineStyle: 'curve'
                }
            });
            
            // 绘制打卡次数图表
            new wxCharts({
                canvasId: 'checkinsChart',
                type: 'column',
                categories: dates,
                series: [{
                    name: '打卡次数',
                    data: values,
                    format: function(val) {
                        return Math.round(val);
                    }
                }],
                yAxis: {
                    title: '次数',
                    min: 0,
                    max: 5,
                    format: function(val) {
                        return Math.round(val);
                    },
                    splitNumber: 5
                },
                width: 320,
                height: 200,
                dataLabel: false,
                legend: false,
                extra: {
                    column: {
                        width: 20
                    }
                }
            });
            
            console.log('空图表绘制完成');
        } catch (error) {
            console.error('绘制空图表失败:', error);
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
    }
});
