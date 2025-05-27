/**
 * 浮动操作按钮组件
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    icon: {
      type: String,
      value: 'add'
    },
    type: {
      type: String,
      value: 'primary' // primary, secondary
    },
    position: {
      type: String,
      value: 'bottom-right' // bottom-right, bottom-center, bottom-left
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
     * 点击按钮
     */
    onClick() {
      this.triggerEvent('click');
    }
  }
}); 
