/**
 * 日历热图组件
 * 用于可视化展示用户习惯打卡的连续性和强度
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 打卡记录数据，格式为 {date: '2023-05-01', value: 1}
    checkInData: {
      type: Array,
      value: [],
      observer: function(newVal) {
        if (newVal && newVal.length > 0) {
          this.processData();
        }
      }
    },
    // 起始日期，格式为 'YYYY-MM-DD'
    startDate: {
      type: String,
      value: '',
      observer: function(newVal) {
        if (newVal) {
          this.generateCalendarData();
        }
      }
    },
    // 结束日期，格式为 'YYYY-MM-DD'
    endDate: {
      type: String,
      value: '',
      observer: function(newVal) {
        if (newVal) {
          this.generateCalendarData();
        }
      }
    },
    // 热图颜色主题
    colorTheme: {
      type: String,
      value: 'blue' // blue, green, purple
    },
    // 是否显示月份标签
    showMonthLabels: {
      type: Boolean,
      value: true
    },
    // 是否显示日期标签
    showDayLabels: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    calendarData: [], // 日历数据
    monthLabels: [], // 月份标签
    dayLabels: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'], // 星期标签
    colorLevels: [], // 颜色等级
    maxValue: 0, // 最大值
    weeks: [] // 周数据
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached() {
      this.initColorLevels();
      this.generateCalendarData();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化颜色等级
     */
    initColorLevels() {
      let colors = [];
      
      switch (this.properties.colorTheme) {
        case 'green':
          colors = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];
          break;
        case 'purple':
          colors = ['#ebedf0', '#d8b9ff', '#b76eff', '#8f3bff', '#6200ea'];
          break;
        default: // blue
          colors = ['#ebedf0', '#C8E1FF', '#79B8FF', '#2188FF', '#0366D6'];
      }
      
      this.setData({
        colorLevels: colors
      });
    },
    
    /**
     * 处理数据
     */
    processData() {
      const checkInData = this.properties.checkInData;
      
      // 计算最大值
      let maxValue = 0;
      checkInData.forEach(item => {
        if (item.value > maxValue) {
          maxValue = item.value;
        }
      });
      
      this.setData({
        maxValue: maxValue || 1
      });
      
      this.generateCalendarData();
    },
    
    /**
     * 生成日历数据
     */
    generateCalendarData() {
      const { startDate, endDate, checkInData } = this.properties;
      
      if (!startDate || !endDate || !checkInData) {
        return;
      }
      
      // 解析日期
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // 确保日期有效
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('无效的日期格式');
        return;
      }
      
      // 转换打卡数据为Map，便于快速查找
      const checkInMap = new Map();
      checkInData.forEach(item => {
        checkInMap.set(item.date, item.value);
      });
      
      // 生成日历数据
      const calendarData = [];
      const monthLabels = [];
      const weeks = [];
      
      // 调整起始日期到周日
      const adjustedStart = new Date(start);
      const dayOfWeek = adjustedStart.getDay();
      adjustedStart.setDate(adjustedStart.getDate() - dayOfWeek);
      
      // 当前日期
      const currentDate = new Date(adjustedStart);
      
      // 当前周
      let currentWeek = [];
      
      // 记录上个月
      let lastMonth = -1;
      
      // 计算总周数以适应不同的时间范围
      const totalDays = Math.ceil((end.getTime() - adjustedStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      const totalWeeks = Math.ceil(totalDays / 7);
      
      // 生成数据直到结束日期
      while (currentDate <= end) {
        // 检查是否需要添加月份标签
        const month = currentDate.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            month: currentDate.toLocaleString('zh-CN', { month: 'short' }),
            position: weeks.length
          });
          lastMonth = month;
        }
        
        // 获取当前日期的字符串表示
        const dateString = this.formatDate(currentDate);
        
        // 获取当前日期的打卡值
        const value = checkInMap.get(dateString) || 0;
        
        // 创建日期数据
        const dateData = {
          date: dateString,
          value: value,
          colorLevel: this.getColorLevel(value),
          day: currentDate.getDate(),
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          dayOfWeek: currentDate.getDay()
        };
        
        // 添加到当前周
        currentWeek.push(dateData);
        
        // 如果是周六或者到达结束日期，结束当前周
        if (currentDate.getDay() === 6 || currentDate.getTime() === end.getTime()) {
          weeks.push([...currentWeek]);
          currentWeek = [];
        }
        
        // 添加到日历数据
        calendarData.push(dateData);
        
        // 增加一天
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 更新数据
      this.setData({
        calendarData,
        monthLabels,
        weeks
      });
    },
    
    /**
     * 格式化日期为 'YYYY-MM-DD' 格式
     */
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    },
    
    /**
     * 获取颜色等级
     */
    getColorLevel(value) {
      const { maxValue } = this.data;
      
      if (value === 0) {
        return 0;
      }
      
      // 计算颜色等级 (1-4)
      const level = Math.ceil((value / maxValue) * 4);
      return Math.min(level, 4);
    },
    
    /**
     * 点击日期格子
     */
    onCellTap(e) {
      const { date } = e.currentTarget.dataset;
      const dateData = this.data.calendarData.find(item => item.date === date);
      
      if (dateData) {
        this.triggerEvent('cellTap', { date: dateData });
      }
    }
  }
}); 
