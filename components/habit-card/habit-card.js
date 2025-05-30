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
        isCompleted: false,
        categoryName: '',
        // 分类中英文映射
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
        }
    },
    /**
     * 组件的生命周期
     */
    lifetimes: {
        attached() {
            this.checkTodayStatus();
            
            // 确保stats对象有默认值
            if (!this.properties.stats || typeof this.properties.stats !== 'object') {
                this.setData({
                    'stats': {
                        completionRate: 0,
                        currentStreak: 0,
                        totalCompletions: 0
                    }
                });
            }
        }
    },
    /**
     * 数据监听器
     */
    observers: {
        'habit,stats': function(habit, stats) {
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
            if (!habit) return;
            
            // 确保习惯有id字段
            const habitId = habit.id || habit._id;
            if (!habitId) {
                console.error('习惯对象缺少ID:', habit);
                return;
            }
            
            // 导入日期工具函数
            const { getCurrentDate } = require('../../utils/date');
            const { shouldDoHabitOnDate } = require('../../utils/habit');
            
            const today = getCurrentDate();
            const shouldDoToday = shouldDoHabitOnDate(habit, today);
            
            // 使用stats判断是否已完成
            const stats = this.properties.stats || {};
            let isCompleted = false;
            
            // 如果有lastCompletedDate且与今天相同，则认为已完成
            if (stats.lastCompletedDate) {
                const lastCompletedDate = stats.lastCompletedDate.split('T')[0]; // 处理可能的ISO格式日期
                isCompleted = lastCompletedDate === today;
            }
            
            // 如果完成率是100%，也认为已完成
            if (stats.completionRate === 100) {
                isCompleted = true;
            }
            
            // 设置分类名称
            const category = habit.category || 'other';
            const categoryName = this.data.categoryMap[category] || category;
            
            this.setData({
                isToday: true,
                shouldDoToday,
                isCompleted,
                categoryName
            });
        },
        /**
         * 点击打卡
         */
        onCheckin() {
            const habit = this.properties.habit;
            if (!habit) return;
            
            // 确保习惯有id字段
            const habitId = habit.id || habit._id;
            if (!habitId) {
                console.error('习惯对象缺少ID:', habit);
                return;
            }
            
            // 检查是否已经完成
            if (this.data.isCompleted) {
                wx.showToast({
                    title: '今日已完成',
                    icon: 'none'
                });
                return;
            }
            
            // 跳转到打卡页面
            wx.navigateTo({
                url: `/pages/checkin/checkin?habitId=${habitId}&habitName=${encodeURIComponent(habit.name)}`
            });
            // 不再直接触发打卡事件，改为在打卡页面中完成
        },
        /**
         * 点击查看详情
         */
        onViewDetail() {
            const habit = this.properties.habit;
            console.log('点击查看详情', habit);
            if (!habit) {
                console.error('习惯对象不存在', habit);
                return;
            }
            
            // 确保习惯有id字段
            const habitId = habit.id || habit._id;
            if (!habitId) {
                console.error('习惯对象缺少ID:', habit);
                return;
            }
            
            wx.navigateTo({
                url: `/pages/habits/detail/detail?id=${habitId}`
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
            if (!habit) return;
            
            // 确保习惯有id字段
            const habitId = habit.id || habit._id;
            if (!habitId) {
                console.error('习惯对象缺少ID:', habit);
                return;
            }
            
            wx.navigateTo({
                url: `/pages/habits/create/create?id=${habitId}`
            });
            // 隐藏操作菜单
            this.hideActions();
        },
        /**
         * 点击删除
         */
        onDelete() {
            const habit = this.properties.habit;
            if (!habit) return;
            
            // 确保习惯有id字段
            const habitId = habit.id || habit._id;
            if (!habitId) {
                console.error('习惯对象缺少ID:', habit);
                return;
            }
            
            wx.showModal({
                title: '确认删除',
                content: `确定要删除习惯"${habit.name}"吗？`,
                confirmText: '删除',
                confirmColor: '#F56C6C',
                success: (res) => {
                    if (res.confirm) {
                        this.triggerEvent('delete', { habitId: habitId });
                    }
                }
            });
            // 隐藏操作菜单
            this.hideActions();
        }
    }
});
