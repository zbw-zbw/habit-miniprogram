Component({
  /**
   * 组件的属性列表
   */
  properties: {
    placeholder: {
      type: String,
      value: '搜索'
    },
    value: {
      type: String,
      value: ''
    },
    showSearchButton: {
      type: Boolean,
      value: true
    },
    focus: {
      type: Boolean,
      value: false
    },
    disabled: {
      type: Boolean,
      value: false
    },
    maxLength: {
      type: Number,
      value: 140
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    inputValue: ''
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached() {
      this.setData({
        inputValue: this.properties.value
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 输入框内容变化事件
    onInput(e) {
      const value = e.detail.value;
      this.setData({
        inputValue: value
      });
      this.triggerEvent('input', { value });
    },

    // 点击搜索按钮事件
    onSearch() {
      this.triggerEvent('search', { value: this.data.inputValue });
    },

    // 点击清除按钮事件
    onClear() {
      this.setData({
        inputValue: ''
      });
      this.triggerEvent('clear');
      this.triggerEvent('input', { value: '' });
    },

    // 输入框获取焦点事件
    onFocus(e) {
      this.triggerEvent('focus', e.detail);
    },

    // 输入框失去焦点事件
    onBlur(e) {
      this.triggerEvent('blur', e.detail);
    },

    // 点击输入框事件
    onClick() {
      this.triggerEvent('click');
    }
  }
}) 
