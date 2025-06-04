"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 习惯卡片组件
 */
const date_1 = require("../../utils/date");
const habit_1 = require("../../utils/habit");
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        habit: {
            type: Object,
            value: {},
        },
        stats: {
            type: Object,
            value: {},
        },
        showActions: {
            type: Boolean,
            value: false,
        },
        showCheckinButton: {
            type: Boolean,
            value: true,
        },
        mode: {
            type: String,
            value: 'normal', // 可选值：normal, compact, simple
        },
    },
    /**
     * 组件的初始数据
     */
    data: {
        isToday: false,
        shouldDoToday: false,
        isCompleted: false,
        categoryName: '',
        completionRateFormatted: '0',
        // 分类中英文映射
        categoryMap: {
            learning: '学习',
            health: '健康',
            work: '工作',
            social: '社交',
            finance: '财务',
            other: '其他',
            reading: '阅读',
            exercise: '运动',
            diet: '饮食',
            sleep: '睡眠',
            meditation: '冥想',
        },
    },
    /**
     * 组件的生命周期
     */
    lifetimes: {
        attached() {
            this.checkTodayStatus();
        },
    },
    /**
     * 数据监听器
     */
    observers: {
        habit: function (habit) {
            // 当habit属性变化时重新检查状态
            this.checkTodayStatus();
        },
        stats: function (stats) {
            // 当stats属性变化时重新格式化完成率
            this.formatCompletionRate();
        },
    },
    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 格式化完成率
         */
        formatCompletionRate() {
            const stats = this.properties.stats || {};
            let completionRate = stats.completionRate || 0;
            // 规范化完成率值
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
            // 格式化为整数字符串
            const completionRateFormatted = Math.round(completionRate).toString();
            this.setData({
                completionRateFormatted,
            });
        },
        /**
         * 检查今日状态
         */
        checkTodayStatus() {
            const habit = this.properties.habit;
            if (!habit)
                return;
            // 获取习惯ID
            const habitId = habit._id || habit.id;
            if (!habitId)
                return;
            // 处理服务端goal字段到前端targetValue和unit字段的转换
            if (habit.goal && habit.goal.value !== undefined) {
                // 如果没有targetValue或unit，则从goal中提取
                if (habit.targetValue === undefined) {
                    habit.targetValue = habit.goal.value;
                }
                if (!habit.unit && habit.goal.unit) {
                    habit.unit = habit.goal.unit;
                }
            }
            const today = (0, date_1.getCurrentDate)();
            const shouldDoToday = (0, habit_1.shouldDoHabitOnDate)(habit, today);
            // 检查习惯是否已完成
            let isCompleted = false;
            // 如果有stats属性中的lastCompletedDate与今天相同，则表示已完成
            const stats = this.properties.stats || {};
            if (stats.lastCompletedDate) {
                // 修复日期比较逻辑，确保正确处理日期格式
                const lastCompletedDateStr = typeof stats.lastCompletedDate === 'string'
                    ? stats.lastCompletedDate.split('T')[0] // 处理ISO格式日期
                    : '';
                // 比较日期字符串，而不是对象
                isCompleted = lastCompletedDateStr === today;
            }
            // 获取分类的中文名称
            const category = habit.category || 'other';
            const categoryName = this.data.categoryMap[category] || category;
            this.setData({
                isToday: true,
                shouldDoToday,
                isCompleted,
                categoryName,
            });
            // 格式化完成率
            this.formatCompletionRate();
        },
        /**
         * 点击打卡
         */
        onCheckin() {
            const habit = this.properties.habit;
            if (!habit)
                return;
            // 获取习惯ID
            const habitId = habit._id || habit.id;
            if (!habitId)
                return;
            // 检查是否已经完成
            const isCompleted = this.data.isCompleted;
            // 如果已完成，则不允许再次打卡
            if (isCompleted) {
                wx.showToast({
                    title: '今日已完成',
                    icon: 'none',
                });
                return;
            }
            // 触发打卡事件
            this.triggerEvent('checkin', { habitId });
        },
        /**
         * 点击查看详情
         */
        onViewDetail() {
            const habit = this.properties.habit;
            if (!habit) {
                console.error('习惯对象不存在', habit);
                return;
            }
            // 获取习惯ID
            const habitId = habit._id || habit.id;
            if (!habitId) {
                console.error('习惯对象缺少ID', habit);
                return;
            }
            wx.navigateTo({
                url: `/pages/habits/detail/detail?id=${habitId}`,
            });
        },
        /**
         * 显示操作菜单
         */
        showActions() {
            this.setData({
                showActions: true,
            });
        },
        /**
         * 隐藏操作菜单
         */
        hideActions() {
            this.setData({
                showActions: false,
            });
        },
        /**
         * 阻止事件冒泡
         */
        stopPropagation() {
            // 阻止事件冒泡，保持菜单打开
        },
        /**
         * 点击编辑
         */
        onEdit() {
            const habit = this.properties.habit;
            if (!habit)
                return;
            // 获取习惯ID
            const habitId = habit._id || habit.id;
            if (!habitId)
                return;
            wx.navigateTo({
                url: `/pages/habits/create/create?id=${habitId}`,
            });
            // 隐藏操作菜单
            this.hideActions();
        },
        /**
         * 点击删除
         */
        onDelete() {
            const habit = this.properties.habit;
            if (!habit)
                return;
            // 获取习惯ID
            const habitId = habit._id || habit.id;
            if (!habitId)
                return;
            wx.showModal({
                title: '确认删除',
                content: `确定要删除习惯"${habit.name}"吗？`,
                confirmText: '删除',
                confirmColor: '#F56C6C',
                success: (res) => {
                    if (res.confirm) {
                        this.triggerEvent('delete', { habitId });
                    }
                },
            });
            // 隐藏操作菜单
            this.hideActions();
        },
    },
});
