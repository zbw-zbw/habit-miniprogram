"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 习惯列表页面
 */
const api_1 = require("../../services/api");
const habit_1 = require("../../utils/habit");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        habits: [],
        habitStats: {},
        loading: true,
        activeTab: 0,
        categories: ['全部', '学习', '健康', '工作', '生活'],
        showCategoryModal: false,
        showSortModal: false,
        sortType: 'default',
        sortOrder: 'asc',
        error: '',
        apiAvailable: true,
        userInfo: {},
        hasLogin: false
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        // 页面加载时执行
        const app = getApp();
        this.setData({
            apiAvailable: app.globalData.apiAvailable
        });
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 从App获取最新的登录状态
        const app = getApp();
        this.setData({
            userInfo: app.globalData.userInfo,
            hasLogin: app.globalData.hasLogin
        });
        
        // 加载习惯列表
        this.loadHabits();
    },
    /**
     * 加载习惯数据
     */
    loadHabits() {
        // 设置加载状态
        this.setData({
            loading: true,
            error: ''
        });
        const app = getApp();
        // 获取习惯列表
        api_1.habitAPI.getHabits()
            .then(habits => {
            // 获取所有打卡记录
            return api_1.checkinAPI.getCheckins()
                .then(checkins => {
                // 计算习惯统计数据
                const habitStats = {};
                habits.forEach(habit => {
                    const habitCheckins = checkins.filter(c => c.habitId === habit.id);
                    habitStats[habit.id] = (0, habit_1.generateHabitStats)(habit, habitCheckins);
                });
                // 根据当前标签筛选习惯
                let filteredHabits = this.filterHabits(habits);
                // 根据当前排序方式排序习惯
                const sortedHabits = this.sortHabits(filteredHabits, habitStats);
                // 更新数据
                this.setData({
                    habits: sortedHabits,
                    habitStats,
                    loading: false,
                    apiAvailable: true
                });
            });
        })
            .catch(error => {
            console.error('获取习惯数据失败:', error);
            this.setData({
                loading: false,
                error: '获取数据失败，请稍后重试',
                apiAvailable: app.globalData.apiAvailable
            });
            wx.showToast({
                title: '获取数据失败',
                icon: 'none'
            });
        });
    },
    /**
     * 根据类别筛选习惯
     */
    filterHabits(habits) {
        const { activeTab, categories } = this.data;
        // 如果是"全部"标签，则不进行筛选
        if (activeTab === 0) {
            return habits.filter(habit => !habit.isArchived);
        }
        // 根据类别筛选
        const category = categories[activeTab];
        return habits.filter(habit => !habit.isArchived && habit.category === category);
    },
    /**
     * 根据排序方式排序习惯
     */
    sortHabits(habits, habitStats) {
        const { sortType, sortOrder } = this.data;
        const sortedHabits = [...habits];
        switch (sortType) {
            case 'name':
                sortedHabits.sort((a, b) => {
                    const result = a.name.localeCompare(b.name);
                    return sortOrder === 'asc' ? result : -result;
                });
                break;
            case 'createdAt':
                sortedHabits.sort((a, b) => {
                    const result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    return sortOrder === 'asc' ? result : -result;
                });
                break;
            case 'completionRate':
                sortedHabits.sort((a, b) => {
                    const rateA = habitStats[a.id]?.completionRate || 0;
                    const rateB = habitStats[b.id]?.completionRate || 0;
                    const result = rateA - rateB;
                    return sortOrder === 'asc' ? result : -result;
                });
                break;
            default:
                // 默认排序，不做任何操作
                break;
        }
        return sortedHabits;
    },
    /**
     * 切换标签
     */
    onTabChange(e) {
        const activeTab = e.currentTarget.dataset.index;
        this.setData({ activeTab }, () => {
            this.loadHabits();
        });
    },
    /**
     * 打开类别选择模态框
     */
    openCategoryModal() {
        this.setData({ showCategoryModal: true });
    },
    /**
     * 关闭类别选择模态框
     */
    closeCategoryModal() {
        this.setData({ showCategoryModal: false });
    },
    /**
     * 打开排序模态框
     */
    openSortModal() {
        this.setData({ showSortModal: true });
    },
    /**
     * 关闭排序模态框
     */
    closeSortModal() {
        this.setData({ showSortModal: false });
    },
    /**
     * 设置排序方式
     */
    setSortType(e) {
        const { type, order } = e.currentTarget.dataset;
        this.setData({
            sortType: type,
            sortOrder: order,
            showSortModal: false
        }, () => {
            this.loadHabits();
        });
    },
    /**
     * 创建新习惯
     */
    createHabit() {
        wx.navigateTo({
            url: '/pages/habits/create/create'
        });
    },
    /**
     * 打卡习惯
     */
    onCheckin(e) {
        const { habitId } = e.detail;
        if (!habitId)
            return;
        // 获取习惯信息，用于传递到打卡页面
        const habit = this.data.habits.find(h => h.id === habitId);
        if (!habit)
            return;
        // 跳转到打卡页面
        wx.navigateTo({
            url: `/pages/checkin/checkin?habitId=${habitId}&habitName=${encodeURIComponent(habit.name)}`
        });
    },
    /**
     * 删除习惯
     */
    onDeleteHabit(e) {
        const { habitId } = e.detail;
        if (!habitId)
            return;
        wx.showModal({
            title: '确认删除',
            content: '删除后将无法恢复，确定要删除吗？',
            success: (res) => {
                if (res.confirm) {
                    // 设置加载状态
                    wx.showLoading({
                        title: '删除中...',
                        mask: true
                    });
                    // 调用API删除习惯
                    api_1.habitAPI.deleteHabit(habitId)
                        .then(() => {
                        // 重新加载习惯数据
                        this.loadHabits();
                        wx.hideLoading();
                        wx.showToast({
                            title: '删除成功',
                            icon: 'success'
                        });
                    })
                        .catch(error => {
                        console.error('删除习惯失败:', error);
                        wx.hideLoading();
                        wx.showToast({
                            title: '删除失败',
                            icon: 'none'
                        });
                    });
                }
            }
        });
    },
    /**
     * 重试加载
     */
    onRetry() {
        this.loadHabits();
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '我的习惯养成计划',
            path: '/pages/index/index'
        };
    }
});
