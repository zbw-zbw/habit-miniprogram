/**
 * 打卡时间分布图表组件
 * 用于展示用户在一天中不同时间段的打卡分布情况
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 打卡记录数据，需要包含time字段
    checkinData: {
      type: Array,
      value: [],
      observer: function(newVal) {
        if (newVal && newVal.length > 0) {
          this.processData();
        }
      }
    },
    // 主题颜色
    themeColor: {
      type: String,
      value: '#4F7CFF'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    timeSlots: [
      {name: '凌晨', start: 0, end: 6, count: 0},
      {name: '上午', start: 6, end: 12, count: 0},
      {name: '下午', start: 12, end: 18, count: 0},
      {name: '晚上', start: 18, end: 24, count: 0}
    ],
    maxCount: 0,
    hasData: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理数据，计算各个时间段的打卡次数
     */
    processData() {
      const { checkinData } = this.properties;
      if (!checkinData || checkinData.length === 0) {
        this.setData({ hasData: false });
        return;
      }

      // 重置时间段计数
      const timeSlots = this.data.timeSlots.map(slot => ({...slot, count: 0}));
      
      // 统计每个时间段的打卡次数
      checkinData.forEach(record => {
        if (!record.time) return;
        
        let hour = 0;
        
        // 处理不同格式的时间数据
        if (typeof record.time === 'string') {
          // 字符串格式 "HH:MM"
          const timeParts = record.time.split(':');
          if (timeParts.length >= 1) {
            hour = parseInt(timeParts[0], 10);
          }
        } else if (typeof record.time === 'object' && record.time && record.time.start) {
          // 对象格式 {start: Date}
          const date = new Date(record.time.start);
          if (!isNaN(date.getTime())) {
            hour = date.getHours();
          }
        } else if (record.formattedTime) {
          // 使用格式化后的时间
          const timeParts = record.formattedTime.split(':');
          if (timeParts.length >= 1) {
            hour = parseInt(timeParts[0], 10);
          }
        }

        // 找到对应的时间段并增加计数
        for (let i = 0; i < timeSlots.length; i++) {
          if (hour >= timeSlots[i].start && hour < timeSlots[i].end) {
            timeSlots[i].count++;
            break;
          }
        }
      });

      // 计算最大计数，用于图表高度计算
      const maxCount = Math.max(...timeSlots.map(slot => slot.count), 1);

      this.setData({
        timeSlots,
        maxCount,
        hasData: maxCount > 0
      });
    }
  }
}); 
