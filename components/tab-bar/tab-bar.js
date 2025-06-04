Component({
  properties: {
    tabs: {
      type: Array,
      value: []
    },
    activeTab: {
      type: Number,
      value: 0
    },
    scrollable: {
      type: Boolean,
      value: true
    }
  },

  observers: {
    'tabs': function(tabs) {
      // 可以在这里添加tabs变化时的处理逻辑
    }
  },

  methods: {
    onTabClick(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({
        activeTab: index
      });
      this.triggerEvent('tabchange', { index, tab: this.data.tabs[index] });
    }
  }
}) 
 