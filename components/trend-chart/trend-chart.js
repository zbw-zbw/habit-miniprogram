/**
 * 习惯完成趋势图表组件
 * 用于展示用户习惯完成率的变化趋势
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 打卡记录数据
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
    },
    // 分析周期（月）
    months: {
      type: Number,
      value: 3
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    trendData: [],
    hasData: false,
    monthLabels: [],
    maxRate: 100,
    connectorLines: [] // 存储连接线的位置和角度
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理数据，按月计算完成率趋势
     */
    processData() {
      const { checkinData, months } = this.properties;
      if (!checkinData || checkinData.length === 0) {
        this.setData({ hasData: false });
        return;
      }

      // 获取当前日期
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // 准备月份数据
      const trendData = [];
      const monthLabels = [];
      
      // 计算过去几个月的数据
      for (let i = months - 1; i >= 0; i--) {
        // 计算目标月份
        let targetMonth = currentMonth - i;
        let targetYear = currentYear;
        
        // 处理月份溢出
        while (targetMonth < 0) {
          targetMonth += 12;
          targetYear--;
        }
        
        // 获取月份标签
        const monthLabel = `${targetYear}-${(targetMonth + 1).toString().padStart(2, '0')}`;
        monthLabels.push((targetMonth + 1) + '月');
        
        // 过滤出当月的打卡记录
        const monthCheckins = checkinData.filter(record => {
          if (!record.date) return false;
          
          const recordDate = new Date(record.date);
          return recordDate.getFullYear() === targetYear && 
                 recordDate.getMonth() === targetMonth;
        });
        
        // 计算当月的天数
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        
        // 计算完成的天数（去重）
        const completedDates = new Set();
        monthCheckins.forEach(record => {
          if (record.isCompleted) {
            completedDates.add(record.date);
          }
        });
        
        // 计算完成率
        const completionRate = completedDates.size > 0 
          ? Math.round((completedDates.size / daysInMonth) * 100)
          : 0;
        
        trendData.push({
          month: monthLabel,
          rate: completionRate
        });
      }
      
      // 计算最大完成率（最小为50，确保图表有合适的高度）
      const maxRate = Math.max(...trendData.map(item => item.rate), 50);
      
      // 预先计算连接线的位置和角度
      const connectorLines = [];
      for (let i = 0; i < trendData.length - 1; i++) {
        const startRate = trendData[i].rate;
        const endRate = trendData[i+1].rate;
        
        // 每个点在X轴上的距离百分比
        const pointWidth = 100 / trendData.length;
        
        // 计算连接线的角度（弧度）
        const angleRad = Math.atan2(
          (endRate - startRate) * (100 / maxRate), 
          pointWidth
        );
        
        // 转换为角度
        const angleDeg = angleRad * (180 / Math.PI);
        
        // 连接线的长度 (基于勾股定理)
        const height = Math.abs(endRate - startRate) * (100 / maxRate);
        const length = Math.sqrt(Math.pow(pointWidth, 2) + Math.pow(height, 2));
        
        // 计算线的位置和角度
        connectorLines.push({
          left: (i * pointWidth) + (pointWidth / 2),
          width: length,
          bottom: startRate * (100 / maxRate),
          angle: angleDeg,
          heightPercent: height
        });
      }
      
      // 确保至少有两个月的数据可以绘制趋势
      const hasEnoughData = trendData.length >= 2 && trendData.some(item => item.rate > 0);
      
      this.setData({
        trendData,
        monthLabels,
        maxRate,
        connectorLines,
        hasData: hasEnoughData
      });
    }
  }
}); 
