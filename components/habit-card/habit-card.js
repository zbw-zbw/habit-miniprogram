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
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    showActions: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 打卡习惯
     */
    onCheckin() {
      this.triggerEvent('checkin', { habitId: this.properties.habit.id });
    },

    /**
     * 查看详情
     */
    onViewDetail() {
      wx.navigateTo({
        url: `/pages/habits/detail/detail?id=${this.properties.habit.id}`
      });
    },

    /**
     * 编辑习惯
     */
    onEdit() {
      wx.navigateTo({
        url: `/pages/habits/edit/edit?id=${this.properties.habit.id}`
      });
      this.hideActions();
    },

    /**
     * 删除习惯
     */
    onDelete() {
      const that = this;
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个习惯吗？删除后无法恢复。',
        confirmColor: '#F56C6C',
        success(res) {
          if (res.confirm) {
            that.triggerEvent('delete', { habitId: that.properties.habit.id });
          }
        },
        complete() {
          that.hideActions();
        }
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
     * 阻止冒泡
     */
    stopPropagation() {
      // 阻止事件冒泡
    }
  }
}); 
