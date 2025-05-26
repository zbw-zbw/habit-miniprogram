/**
 * 创建习惯页面
 */
import { getHabits, saveHabits } from '../../../utils/storage';
import { generateUUID } from '../../../utils/util';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    description: '',
    category: '学习',
    icon: 'habit',
    color: '#4F7CFF',
    frequency: 'daily',
    customDays: [1, 2, 3, 4, 5, 6, 0], // 周日-周六 (0-6)
    reminderTime: '08:00',
    isReminderEnabled: false,
    goalValue: 1,
    goalUnit: '次',
    categories: ['学习', '健康', '工作', '生活'],
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
  onLoad() {
    
  },

  /**
   * 输入框变化事件
   */
  onInput(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [field]: value
    });
  },

  /**
   * 切换提醒开关
   */
  onSwitchReminder(e: any) {
    this.setData({
      isReminderEnabled: e.detail.value
    });
  },

  /**
   * 选择提醒时间
   */
  onTimeChange(e: any) {
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
  selectIcon(e: any) {
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
  selectColor(e: any) {
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
  selectFrequency(e: any) {
    const { frequency } = e.currentTarget.dataset;
    
    // 根据选择的频率设置自定义天数
    let customDays: number[] = [];
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
  toggleCustomDay(e: any) {
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
    } else {
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
  selectCategory(e: any) {
    const { category } = e.currentTarget.dataset;
    this.setData({
      category,
      showCategoryPicker: false
    });
  },

  /**
   * 表单提交
   */
  async onSubmit() {
    // 表单验证
    if (!this.data.name.trim()) {
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
    
    try {
      // 获取现有习惯
      const habits = getHabits();
      
      // 创建新习惯
      const newHabit: IHabit = {
        id: generateUUID(),
        name: this.data.name.trim(),
        description: this.data.description.trim(),
        category: this.data.category,
        icon: this.data.icon,
        color: this.data.color,
        frequency: {
          type: this.data.frequency as 'daily' | 'weekly' | 'custom' | 'monthly',
          days: this.data.customDays
        },
        reminder: {
          enabled: this.data.isReminderEnabled,
          time: this.data.reminderTime
        },
        goalValue: this.data.goalValue,
        goalUnit: this.data.goalUnit,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 添加到习惯列表
      habits.push(newHabit);
      
      // 保存习惯列表
      saveHabits(habits);
      
      // 显示成功提示
      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });
      
      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('创建习惯失败', error);
      wx.showToast({
        title: '创建失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({
        isSubmitting: false
      });
    }
  },

  /**
   * 取消创建
   */
  onCancel() {
    wx.navigateBack();
  }
}); 
