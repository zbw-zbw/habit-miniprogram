/**
 * 登录提示组件
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否固定在底部
    fixed: {
      type: Boolean,
      value: true
    },
    // 提示文本
    tipText: {
      type: String,
      value: '登录后查看更多内容'
    },
    // 按钮文本
    buttonText: {
      type: String,
      value: '登录/注册'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 点击登录按钮
     */
    onLoginTap() {
      // 触发登录事件
      this.triggerEvent('login');
      
      // 默认跳转到登录页面
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }
  }
}); 
