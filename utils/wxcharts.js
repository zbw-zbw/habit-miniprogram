/*
 * wxcharts.js v1.0
 * 微信小程序图表工具
 * 简化版，仅支持线图和柱状图
 */

// 默认配置
const defaultConfig = {
  fontSize: 11,
  backgroundColor: '#ffffff',
  padding: 10,
  xAxisHeight: 20,
  yAxisWidth: 30,
  dataPointShape: false,
  dataPointSize: 2,
  dataPointShapeType: 'solid', // 'hollow'
  dataPointColor: '#4F7CFF',
  animation: true,
  animationDuration: 1000,
  timing: 'easeInOut',
  rotate: false,
  colors: ['#4F7CFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#3498DB'],
  enableScroll: false,
  legend: {
    show: false,
    position: 'bottom',
    height: 30,
    padding: 10,
    margin: 5
  },
  title: {
    name: '',
    fontSize: 15,
    color: '#303133',
    marginBottom: 10
  },
  tooltip: {
    show: true,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    fontColor: '#ffffff',
    fontSize: 11,
    padding: 5,
    borderRadius: 3
  }
};

// 动画函数
const Timing = {
  easeIn: function(pos) {
    return Math.pow(pos, 3);
  },
  easeOut: function(pos) {
    return Math.pow(pos - 1, 3) + 1;
  },
  easeInOut: function(pos) {
    if ((pos /= 0.5) < 1) {
      return 0.5 * Math.pow(pos, 3);
    } else {
      return 0.5 * (Math.pow((pos - 2), 3) + 2);
    }
  },
  linear: function(pos) {
    return pos;
  }
};

// 工具函数
const util = {
  toFixed: function(num, digit = 2) {
    return Number(num.toFixed(digit));
  },
  isInRange: function(point, area) {
    return point.x >= area.x && point.x <= (area.x + area.width) && 
           point.y >= area.y && point.y <= (area.y + area.height);
  },
  createAnimation: function(opts) {
    const { timing, duration, onProcess, onFinish } = opts;
    const startTime = Date.now();
    const timingFunction = Timing[timing] || Timing.linear;
    
    const step = function() {
      const timeUsed = Date.now() - startTime;
      const progress = timeUsed / duration;
      
      if (progress >= 1) {
        onProcess(1);
        onFinish && onFinish();
        return;
      }
      
      onProcess(timingFunction(progress));
      requestAnimationFrame(step);
    };
    
    step();
  }
};

// 图表基类
class Chart {
  constructor(opts) {
    this.opts = Object.assign({}, defaultConfig, opts);
    this.context = wx.createCanvasContext(opts.canvasId, opts.componentInstance);
    this.chartData = {};
    this.event = {};
    this.scrollOption = {
      currentOffset: 0,
      startTouchX: 0,
      distance: 0
    };
    
    this.init();
  }
  
  init() {
    const { width, height, padding } = this.opts;
    
    this.width = width;
    this.height = height;
    this.padding = padding;
    this.chartWidth = width - 2 * padding;
    this.chartHeight = height - 2 * padding;
    
    this.yAxisWidth = this.opts.yAxis.disabled ? 0 : this.opts.yAxisWidth;
    this.xAxisHeight = this.opts.xAxis && this.opts.xAxis.disabled ? 0 : this.opts.xAxisHeight;
    
    // 计算图表区域
    const legendHeight = this.opts.legend.show ? this.opts.legend.height : 0;
    const titleHeight = this.opts.title.name ? this.opts.title.fontSize + this.opts.title.marginBottom : 0;
    
    this.chartArea = {
      x: this.padding + this.yAxisWidth,
      y: this.padding + titleHeight,
      width: this.chartWidth - this.yAxisWidth,
      height: this.chartHeight - this.xAxisHeight - legendHeight - titleHeight
    };
    
    // 准备数据
    this.prepareData();
    
    // 绘制
    this.draw();
  }
  
  prepareData() {
    const { series, yAxis, categories } = this.opts;
    
    // 计算Y轴范围
    let minY = yAxis.min !== undefined ? yAxis.min : Infinity;
    let maxY = yAxis.max !== undefined ? yAxis.max : -Infinity;
    
    if (minY === Infinity || maxY === -Infinity) {
      series.forEach(item => {
        const data = item.data;
        const min = Math.min(...data);
        const max = Math.max(...data);
        
        if (min < minY) minY = min;
        if (max > maxY) maxY = max;
      });
    }
    
    // 确保最小值不大于0
    if (minY > 0) minY = 0;
    
    // 计算Y轴刻度
    const yAxisTicks = this.calculateYAxisTicks(minY, maxY);
    
    this.chartData.yAxisMin = yAxisTicks.min;
    this.chartData.yAxisMax = yAxisTicks.max;
    this.chartData.yAxisTicks = yAxisTicks.ticks;
    
    // 计算X轴数据
    this.chartData.categories = categories;
    this.chartData.series = series;
    
    // 计算每个数据点的位置
    this.calculateDataPoints();
  }
  
  calculateYAxisTicks(min, max) {
    const { yAxis } = this.opts;
    const tickCount = yAxis.splitNumber || 5;
    
    // 计算合适的刻度间隔
    const range = max - min;
    const roughStep = range / (tickCount - 1);
    const pow = Math.floor(Math.log10(roughStep));
    const magnitude = Math.pow(10, pow);
    const normalizedStep = roughStep / magnitude;
    
    let step;
    if (normalizedStep < 1.5) {
      step = 1;
    } else if (normalizedStep < 3.5) {
      step = 2;
    } else if (normalizedStep < 7.5) {
      step = 5;
    } else {
      step = 10;
    }
    step *= magnitude;
    
    // 调整最小值和最大值
    const adjustedMin = Math.floor(min / step) * step;
    const adjustedMax = Math.ceil(max / step) * step;
    
    // 生成刻度值
    const ticks = [];
    for (let i = adjustedMin; i <= adjustedMax; i += step) {
      ticks.push(i);
    }
    
    return {
      min: adjustedMin,
      max: adjustedMax,
      ticks
    };
  }
  
  calculateDataPoints() {
    const { chartArea, chartData } = this;
    const { series, categories } = this.opts;
    
    const xStep = chartArea.width / (categories.length - 1 || 1);
    const yRange = chartData.yAxisMax - chartData.yAxisMin;
    
    // 计算每个数据系列的点
    this.chartData.points = series.map((item, seriesIndex) => {
      return item.data.map((value, index) => {
        const x = chartArea.x + index * xStep;
        const y = chartArea.y + chartArea.height - (value - chartData.yAxisMin) / yRange * chartArea.height;
        
        return { x, y, value, seriesIndex, index };
      });
    });
  }
  
  draw() {
    const { context: ctx, opts, chartArea } = this;
    
    // 清空画布
    ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    if (opts.backgroundColor) {
      ctx.setFillStyle(opts.backgroundColor);
      ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // 绘制标题
    if (opts.title.name) {
      ctx.setFontSize(opts.title.fontSize);
      ctx.setFillStyle(opts.title.color);
      ctx.setTextAlign('center');
      ctx.fillText(opts.title.name, this.width / 2, this.padding + opts.title.fontSize / 2);
    }
    
    // 绘制Y轴
    this.drawYAxis();
    
    // 绘制X轴
    this.drawXAxis();
    
    // 绘制图表内容
    if (opts.type === 'line') {
      this.drawLineChart();
    } else if (opts.type === 'column') {
      this.drawColumnChart();
    }
    
    // 绘制图例
    if (opts.legend.show) {
      this.drawLegend();
    }
    
    // 提交绘制
    ctx.draw();
  }
  
  drawYAxis() {
    if (this.opts.yAxis.disabled) return;
    
    const { context: ctx, chartArea, chartData, opts } = this;
    const { yAxisTicks } = chartData;
    
    // 绘制Y轴线
    ctx.beginPath();
    ctx.setStrokeStyle('#DCDFE6');
    ctx.setLineWidth(1);
    ctx.moveTo(chartArea.x, chartArea.y);
    ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.stroke();
    
    // 绘制Y轴刻度和网格线
    const tickCount = yAxisTicks.length;
    
    for (let i = 0; i < tickCount; i++) {
      const y = chartArea.y + chartArea.height - (yAxisTicks[i] - chartData.yAxisMin) / (chartData.yAxisMax - chartData.yAxisMin) * chartArea.height;
      
      // 绘制刻度线
      ctx.beginPath();
      ctx.moveTo(chartArea.x - 3, y);
      ctx.lineTo(chartArea.x, y);
      ctx.stroke();
      
      // 绘制网格线
      if (opts.yAxis.gridLines !== false) {
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(chartArea.x, y);
        ctx.lineTo(chartArea.x + chartArea.width, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // 绘制刻度值
      ctx.setFontSize(opts.fontSize);
      ctx.setTextAlign('right');
      ctx.setTextBaseline('middle');
      ctx.setFillStyle('#909399');
      
      let formatVal = yAxisTicks[i];
      if (opts.yAxis.format && typeof opts.yAxis.format === 'function') {
        formatVal = opts.yAxis.format(yAxisTicks[i]);
      }
      
      ctx.fillText(formatVal, chartArea.x - 5, y);
    }
    
    // 绘制Y轴标题
    if (opts.yAxis.title) {
      ctx.save();
      ctx.setFontSize(opts.fontSize);
      ctx.setFillStyle('#606266');
      ctx.translate(this.padding, chartArea.y + chartArea.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.setTextAlign('center');
      ctx.fillText(opts.yAxis.title, 0, 0);
      ctx.restore();
    }
  }
  
  drawXAxis() {
    if (this.opts.xAxis && this.opts.xAxis.disabled) return;
    
    const { context: ctx, chartArea, chartData, opts } = this;
    const { categories } = chartData;
    
    // 绘制X轴线
    ctx.beginPath();
    ctx.setStrokeStyle('#DCDFE6');
    ctx.setLineWidth(1);
    ctx.moveTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.stroke();
    
    // 绘制X轴刻度和标签
    const step = chartArea.width / (categories.length - 1 || 1);
    
    categories.forEach((item, index) => {
      const x = chartArea.x + index * step;
      
      // 绘制刻度线
      ctx.beginPath();
      ctx.moveTo(x, chartArea.y + chartArea.height);
      ctx.lineTo(x, chartArea.y + chartArea.height + 3);
      ctx.stroke();
      
      // 绘制标签
      ctx.setFontSize(opts.fontSize);
      ctx.setTextAlign('center');
      ctx.setTextBaseline('top');
      ctx.setFillStyle('#909399');
      ctx.fillText(item, x, chartArea.y + chartArea.height + 5);
    });
  }
  
  drawLineChart() {
    const { context: ctx, chartData, opts } = this;
    const { points } = chartData;
    
    // 绘制每个数据系列
    points.forEach((seriesPoints, seriesIndex) => {
      const color = opts.colors[seriesIndex % opts.colors.length];
      
      // 绘制线条
      ctx.beginPath();
      ctx.setStrokeStyle(color);
      ctx.setLineWidth(2);
      
      if (opts.extra && opts.extra.lineStyle === 'curve') {
        // 绘制曲线
        for (let i = 0; i < seriesPoints.length; i++) {
          if (i === 0) {
            ctx.moveTo(seriesPoints[i].x, seriesPoints[i].y);
          } else {
            const prevPoint = seriesPoints[i - 1];
            const currentPoint = seriesPoints[i];
            
            // 计算控制点
            const controlX = (prevPoint.x + currentPoint.x) / 2;
            
            ctx.bezierCurveTo(
              controlX, prevPoint.y,
              controlX, currentPoint.y,
              currentPoint.x, currentPoint.y
            );
          }
        }
      } else {
        // 绘制折线
        seriesPoints.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
      }
      
      ctx.stroke();
      
      // 绘制数据点
      if (opts.dataPointShape) {
        seriesPoints.forEach(point => {
          ctx.beginPath();
          ctx.setFillStyle(opts.dataPointColor || color);
          ctx.arc(point.x, point.y, opts.dataPointSize, 0, 2 * Math.PI);
          
          if (opts.dataPointShapeType === 'hollow') {
            ctx.setStrokeStyle(opts.dataPointColor || color);
            ctx.setLineWidth(1);
            ctx.stroke();
          } else {
            ctx.fill();
          }
        });
      }
    });
  }
  
  drawColumnChart() {
    const { context: ctx, chartArea, chartData, opts } = this;
    const { points, series } = chartData;
    
    // 计算柱子宽度
    const seriesCount = series.length;
    const categoryCount = opts.categories.length;
    const categoryWidth = chartArea.width / categoryCount;
    const columnWidth = categoryWidth * 0.6 / seriesCount;
    const columnGap = categoryWidth * 0.4 / (seriesCount + 1);
    
    // 绘制每个数据系列
    points.forEach((seriesPoints, seriesIndex) => {
      const color = opts.colors[seriesIndex % opts.colors.length];
      
      seriesPoints.forEach((point, index) => {
        const x = chartArea.x + index * categoryWidth + columnGap * (seriesIndex + 1) + columnWidth * seriesIndex;
        const y = point.y;
        const height = chartArea.y + chartArea.height - y;
        
        ctx.beginPath();
        ctx.setFillStyle(color);
        ctx.rect(x, y, columnWidth, height);
        ctx.fill();
      });
    });
  }
  
  drawLegend() {
    const { context: ctx, opts, chartData } = this;
    const { series } = chartData;
    const { legend } = opts;
    
    const legendY = this.height - legend.height;
    const legendItemWidth = this.width / series.length;
    
    series.forEach((item, index) => {
      const x = index * legendItemWidth + legendItemWidth / 2;
      const y = legendY + legend.padding;
      const color = opts.colors[index % opts.colors.length];
      
      // 绘制图例标记
      ctx.beginPath();
      ctx.setFillStyle(color);
      ctx.rect(x - 15, y, 10, 10);
      ctx.fill();
      
      // 绘制图例文字
      ctx.setFontSize(opts.fontSize);
      ctx.setTextAlign('left');
      ctx.setTextBaseline('middle');
      ctx.setFillStyle('#606266');
      ctx.fillText(item.name, x, y + 5);
    });
  }
}

// 导出图表类
module.exports = function(opts) {
  return new Chart(opts);
}; 
