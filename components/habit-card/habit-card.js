"use strict";
/**
 * 习惯卡片组件
 */
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        habit: {
            type: Object,
            value: {}
        },
        stats: {
            type: Object,
            value: {}
        },
        showActions: {
            type: Boolean,
            value: false
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        isToday: false,
        shouldDoToday: false,
        isCompleted: false
    },
    /**
     * 组件的生命周期
     */
    lifetimes: {
        attached() {
            this.checkTodayStatus();
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 检查今日状态
         */
        checkTodayStatus() {
            const habit = this.properties.habit;
            if (!habit || !habit.id)
                return;
            // 导入日期和习惯工具函数
            const { getCurrentDate } = require('../../utils/date');
            const { shouldDoHabitOnDate } = require('../../utils/habit');
            const { getCheckinsByHabitId } = require('../../utils/storage');
            const today = getCurrentDate();
            const shouldDoToday = shouldDoHabitOnDate(habit, today);
            // 获取今日打卡记录
            const checkins = getCheckinsByHabitId(habit.id);
            const todayCheckin = checkins.find((c) => c.date === today);
            const isCompleted = todayCheckin?.isCompleted || false;
            this.setData({
                isToday: true,
                shouldDoToday,
                isCompleted
            });
        },
        /**
         * 点击打卡
         */
        onCheckin() {
            const habit = this.properties.habit;
            if (!habit || !habit.id)
                return;
            // 跳转到打卡页面
            wx.navigateTo({
                url: `/pages/checkin/checkin?habitId=${habit.id}&habitName=${encodeURIComponent(habit.name)}`
            });
            // 不再直接触发打卡事件，改为在打卡页面中完成
        },
        /**
         * 点击查看详情
         */
        onViewDetail() {
            const habit = this.properties.habit;
            console.log('点击查看详情', habit);
            if (!habit || !habit.id) {
                console.error('习惯对象不存在或缺少ID', habit);
                return;
            }
            wx.navigateTo({
                url: `/pages/habits/detail/detail?id=${habit.id}`
            });
        },
        /**
         * 显示操作菜单
         */
        showActions() {
            this.setData({
                showActions: true
            });
        },
        /**
         * 隐藏操作菜单
         */
        hideActions() {
            this.setData({
                showActions: false
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
            if (!habit || !habit.id)
                return;
            wx.navigateTo({
                url: `/pages/habits/create/create?id=${habit.id}`
            });
            // 隐藏操作菜单
            this.hideActions();
        },
        /**
         * 点击删除
         */
        onDelete() {
            const habit = this.properties.habit;
            if (!habit || !habit.id)
                return;
            wx.showModal({
                title: '确认删除',
                content: `确定要删除习惯"${habit.name}"吗？`,
                confirmText: '删除',
                confirmColor: '#F56C6C',
                success: (res) => {
                    if (res.confirm) {
                        this.triggerEvent('delete', { habitId: habit.id });
                    }
                }
            });
            // 隐藏操作菜单
            this.hideActions();
        }
    }
});
