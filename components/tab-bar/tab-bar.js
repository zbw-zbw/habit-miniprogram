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
      console.log('tab-bar组件接收到tabs:', tabs);
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
 