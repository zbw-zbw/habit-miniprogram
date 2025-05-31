"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 创建习惯页面
 */
const api_1 = require("../../../services/api");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        id: '',
        isEdit: false,
        name: '',
        description: '',
        category: 'learning',
        categoryName: '学习',
        icon: 'habit',
        color: '#4F7CFF',
        frequency: 'daily',
        customDays: [1, 2, 3, 4, 5, 6, 0],
        reminderTime: '08:00',
        isReminderEnabled: false,
        goalValue: 1,
        goalUnit: '次',
        // 分类显示用的中文名称
        categoryOptions: [
            { id: 'learning', name: '学习', icon: 'book' },
            { id: 'health', name: '健康', icon: 'heart' },
            { id: 'work', name: '工作', icon: 'briefcase' },
            { id: 'social', name: '社交', icon: 'users' },
            { id: 'finance', name: '财务', icon: 'dollar-sign' },
            { id: 'other', name: '其他', icon: 'more-horizontal' }
        ],
        icons: ['habit', 'book', 'run', 'work', 'sleep', 'water', 'food', 'meditation', 'gym'],
        colors: ['#4F7CFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9C27B0', '#FF9800', '#795548', '#00BCD4'],
        frequencyOptions: [
            { value: 'daily', label: '每天' },
            { value: 'weekly', label: '每周' },
            { value: 'workdays', label: '工作日' },
            { value: 'weekends', label: '周末' },
            { value: 'custom', label: '自定义' }
        ],
        weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        showIconPicker: false,
        showColorPicker: false,
        showFrequencyPicker: false,
        showCategoryPicker: false,
        isSubmitting: false
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 检查是否为编辑模式并立即设置页面标题
        if (options.id) {
            // 编辑模式
            this.setData({
                id: options.id,
                isEdit: true
            });
            // 立即设置导航栏标题
            wx.setNavigationBarTitle({
                title: '编辑习惯'
            });
            // 加载习惯详情
            this.loadHabitDetail(options.id);
        }
        else {
            // 创建模式 - 确保标题是正确的
            wx.setNavigationBarTitle({
                title: '创建习惯'
            });
        }
        // 加载分类列表
        this.loadCategories();
    },
    /**
     * 加载分类列表
     */
    async loadCategories() {
        try {
            // 使用any类型暂时绕过类型检查，因为API响应格式可能与类型定义不一致
            const response = await api_1.habitAPI.getCategories();
            // API响应格式为 { success: boolean, data: HabitCategory[] }
            if (response && response.success && Array.isArray(response.data)) {
                this.setData({
                    categoryOptions: response.data
                });
                // 如果有分类数据，更新当前选中的分类名称
                const currentCategory = this.data.category;
                const categoryOption = response.data.find((item) => item.id === currentCategory);
                if (categoryOption) {
                    this.setData({
                        categoryName: categoryOption.name
                    });
                }
            }
        }
        catch (error) {
            console.error('加载分类列表失败:', error);
            // 出错时使用默认分类列表
            const defaultCategories = [
                { id: 'learning', name: '学习', icon: 'book' },
                { id: 'health', name: '健康', icon: 'heart' },
                { id: 'work', name: '工作', icon: 'briefcase' },
                { id: 'social', name: '社交', icon: 'users' },
                { id: 'finance', name: '财务', icon: 'dollar-sign' },
                { id: 'other', name: '其他', icon: 'more-horizontal' }
            ];
            this.setData({
                categoryOptions: defaultCategories
            });
        }
    },
    /**
     * 加载习惯详情
     */
    async loadHabitDetail(habitId) {
        wx.showLoading({
            title: '加载中'
        });
        try {
            const habit = await api_1.habitAPI.getHabit(habitId);
            // 查找分类对应的中文名称
            const categoryOption = this.data.categoryOptions.find(item => item.id === habit.category);
            const categoryName = categoryOption ? categoryOption.name : '其他';
            // 设置表单数据
            this.setData({
                name: habit.name,
                description: habit.description || '',
                category: habit.category,
                categoryName: categoryName,
                icon: habit.icon,
                color: habit.color,
                isReminderEnabled: habit.reminder?.enabled || false,
                reminderTime: habit.reminder?.time || '08:00',
                goalValue: habit.target || 1,
                goalUnit: habit.unit || '次'
            });
            // 设置频率
            if (habit.frequency) {
                let frequency = 'daily';
                let customDays = [0, 1, 2, 3, 4, 5, 6];
                if (habit.frequency.type === 'weekly' && habit.frequency.days) {
                    const days = habit.frequency.days;
                    // 检查是否是工作日
                    if (days.length === 5 && days.includes(1) && days.includes(2) &&
                        days.includes(3) && days.includes(4) && days.includes(5) &&
                        !days.includes(0) && !days.includes(6)) {
                        frequency = 'workdays';
                    }
                    // 检查是否是周末
                    else if (days.length === 2 && days.includes(0) && days.includes(6) &&
                        !days.includes(1) && !days.includes(2) && !days.includes(3) &&
                        !days.includes(4) && !days.includes(5)) {
                        frequency = 'weekends';
                    }
                    // 检查是否是每周一次
                    else if (days.length === 1) {
                        frequency = 'weekly';
                    }
                    // 其他情况为自定义
                    else {
                        frequency = 'custom';
                    }
                    customDays = days;
                }
                this.setData({
                    frequency,
                    customDays
                });
            }
            wx.hideLoading();
        }
        catch (error) {
            console.error('加载习惯详情失败:', error);
            wx.hideLoading();
            wx.showToast({
                title: '加载失败',
                icon: 'error'
            });
        }
    },
    /**
     * 输入框变化事件
     */
    onInput(e) {
        const { field } = e.currentTarget.dataset;
        const { value } = e.detail;
        this.setData({
            [field]: value
        });
    },
    /**
     * 切换提醒开关
     */
    onSwitchReminder(e) {
        this.setData({
            isReminderEnabled: e.detail.value
        });
    },
    /**
     * 选择提醒时间
     */
    onTimeChange(e) {
        this.setData({
            reminderTime: e.detail.value
        });
    },
    /**
     * 打开图标选择器
     */
    openIconPicker() {
        this.setData({
            showIconPicker: true
        });
    },
    /**
     * 关闭图标选择器
     */
    closeIconPicker() {
        this.setData({
            showIconPicker: false
        });
    },
    /**
     * 选择图标
     */
    selectIcon(e) {
        const { icon } = e.currentTarget.dataset;
        this.setData({
            icon,
            showIconPicker: false
        });
    },
    /**
     * 打开颜色选择器
     */
    openColorPicker() {
        this.setData({
            showColorPicker: true
        });
    },
    /**
     * 关闭颜色选择器
     */
    closeColorPicker() {
        this.setData({
            showColorPicker: false
        });
    },
    /**
     * 选择颜色
     */
    selectColor(e) {
        const { color } = e.currentTarget.dataset;
        this.setData({
            color,
            showColorPicker: false
        });
    },
    /**
     * 打开频率选择器
     */
    openFrequencyPicker() {
        this.setData({
            showFrequencyPicker: true
        });
    },
    /**
     * 关闭频率选择器
     */
    closeFrequencyPicker() {
        this.setData({
            showFrequencyPicker: false
        });
    },
    /**
     * 选择频率
     */
    selectFrequency(e) {
        const { frequency } = e.currentTarget.dataset;
        // 根据选择的频率设置自定义天数
        let customDays = [];
        switch (frequency) {
            case 'daily':
                customDays = [0, 1, 2, 3, 4, 5, 6]; // 每天
                break;
            case 'workdays':
                customDays = [1, 2, 3, 4, 5]; // 工作日
                break;
            case 'weekends':
                customDays = [0, 6]; // 周末
                break;
            case 'weekly':
                customDays = [1]; // 默认周一
                break;
            case 'custom':
                customDays = this.data.customDays; // 保持原有选择
                break;
        }
        this.setData({
            frequency,
            customDays,
            showFrequencyPicker: false
        });
    },
    /**
     * 选择自定义天数
     */
    toggleCustomDay(e) {
        const { day } = e.currentTarget.dataset;
        const dayIndex = parseInt(day);
        const customDays = [...this.data.customDays];
        // 检查是否已选择
        const index = customDays.indexOf(dayIndex);
        if (index > -1) {
            // 如果只剩一天，不允许取消
            if (customDays.length === 1) {
                return;
            }
            // 取消选择
            customDays.splice(index, 1);
        }
        else {
            // 添加选择
            customDays.push(dayIndex);
            // 排序
            customDays.sort((a, b) => a - b);
        }
        this.setData({
            customDays
        });
    },
    /**
     * 打开分类选择器
     */
    openCategoryPicker() {
        this.setData({
            showCategoryPicker: true
        });
    },
    /**
     * 关闭分类选择器
     */
    closeCategoryPicker() {
        this.setData({
            showCategoryPicker: false
        });
    },
    /**
     * 选择分类
     */
    onSelectCategory(e) {
        const { id, name } = e.currentTarget.dataset;
        this.setData({
            category: id,
            categoryName: name,
            showCategoryPicker: false
        });
    },
    /**
     * 提交表单
     */
    async onSubmit() {
        const { id, isEdit, name, description, category, // 使用英文ID
        icon, color, frequency, customDays, isReminderEnabled, reminderTime, goalValue, goalUnit } = this.data;
        // 表单验证
        if (!name.trim()) {
            wx.showToast({
                title: '请输入习惯名称',
                icon: 'none'
            });
            return;
        }
        // 防止重复提交
        if (this.data.isSubmitting) {
            return;
        }
        this.setData({
            isSubmitting: true
        });
        wx.showLoading({
            title: isEdit ? '保存中' : '创建中'
        });
        try {
            // 准备习惯数据
            const habitData = {
                name: name.trim(),
                description: description.trim(),
                category,
                icon,
                color,
                frequency: {
                    type: frequency === 'daily' ? 'daily' : 'weekly',
                    days: frequency === 'daily' ? undefined : customDays
                },
                reminder: {
                    enabled: isReminderEnabled,
                    time: reminderTime
                },
                target: Number(goalValue),
                unit: goalUnit,
                startDate: new Date().toISOString().split('T')[0]
            };
            if (isEdit) {
                // 更新习惯
                await api_1.habitAPI.updateHabit(id, habitData);
            }
            else {
                // 创建习惯
                await api_1.habitAPI.createHabit(habitData);
            }
            wx.hideLoading();
            wx.showToast({
                title: isEdit ? '保存成功' : '创建成功',
                icon: 'success'
            });
            // 返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }
        catch (error) {
            console.error(isEdit ? '更新习惯失败:' : '创建习惯失败:', error);
            wx.hideLoading();
            wx.showToast({
                title: isEdit ? '保存失败' : '创建失败',
                icon: 'error'
            });
            this.setData({
                isSubmitting: false
            });
        }
    },
    /**
     * 取消
     */
    onCancel() {
        wx.navigateBack();
    },
    /**
     * 切换分类选择器
     */
    toggleCategoryPicker() {
        this.setData({
            showCategoryPicker: !this.data.showCategoryPicker
        });
    },
    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
        // 阻止事件冒泡
    }
});
