/**
 * 习惯分析助手组件
 * 提供基于用户习惯数据的智能分析和建议
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    habit: {
      type: Object,
      value: {},
      observer: 'onHabitChange'
    },
    checkins: {
      type: Array,
      value: [],
      observer: 'onCheckinsChange'
    },
    showFullInsights: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    loading: true,
    analysisData: null,
    insights: [],
    recommendations: [],
    performanceLevel: '', // 'excellent', 'good', 'average', 'needsImprovement'
    streakInfo: {},
    bestPeriods: [],
    worstPeriods: [],
    completionTrend: [],
    patternFound: false,
    expandedInsightIndex: -1,
    worker: null, // Web Worker引用
    cachedResults: {}, // 缓存分析结果
    lastAnalysisTimestamp: 0,
    habitPatterns: null, // 新增：习惯模式分析结果
    timeDistribution: null // 新增：时间分布分析结果
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initWorker();
    },
    detached() {
      this.terminateWorker();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化Web Worker
     * 用于在后台线程执行数据分析，避免阻塞UI线程
     */
    initWorker() {
      // 小程序环境不支持Web Worker，使用替代方案
      this.setData({
        worker: {
          postMessage: (data) => {
            setTimeout(() => {
              this.processAnalysisInMainThread(data);
            }, 0);
          }
        }
      });
    },
    
    /**
     * 终止Worker
     */
    terminateWorker() {
      // 清理资源
      this.setData({
        worker: null
      });
    },
    
    /**
     * 在主线程中处理分析
     * 这是Web Worker的替代方案
     */
    processAnalysisInMainThread(data) {
      const { habit, checkins } = data;
      
      // 执行分析
      const analysisResult = this.performAnalysis(habit, checkins);
      
      // 处理分析结果
      this.handleAnalysisResult(analysisResult);
    },
    
    /**
     * 执行习惯数据分析
     */
    performAnalysis(habit, checkins) {
      // 导入所需工具函数
      const { calculateStreak, calculateCompletionRate } = require('../../utils/habit');
      const { getDayOfWeek, formatDate, getCurrentDate, daysBetween } = require('../../utils/date');
      const { analyzePerformanceLevel, analyzeBestPeriods, analyzeHabitPatterns, generateRecommendations } = require('../../utils/habit-analysis');
      
      // 基础分析
      const completedCheckins = checkins.filter(c => c.isCompleted);
      const totalCompletions = completedCheckins.length;
      const currentStreak = calculateStreak(checkins);
      const completionRate = calculateCompletionRate(habit, checkins);
      
      // 性能水平分析
      const performanceLevel = analyzePerformanceLevel(completionRate);
      
      // 最佳时段分析
      const bestPeriods = analyzeBestPeriods(habit, checkins);
      
      // 习惯模式分析
      const habitPatterns = analyzeHabitPatterns(habit, checkins);
      
      // 生成洞察
      const insights = this.generateInsights(habit, checkins, {
        performanceLevel,
        currentStreak,
        completionRate,
        bestPeriods,
        habitPatterns
      });
      
      // 生成建议
      const recommendations = generateRecommendations(habit, {
        performanceLevel,
        currentStreak,
        completionRate,
        bestPeriods,
        patterns: habitPatterns
      });
      
      return {
        performanceLevel,
        currentStreak,
        completionRate,
        bestPeriods,
        habitPatterns,
        insights,
        recommendations
      };
    },
    
    /**
     * 生成洞察
     */
    generateInsights(habit, checkins, analysisData) {
      const insights = [];
      const { performanceLevel, currentStreak, completionRate, bestPeriods, habitPatterns } = analysisData;
      
      // 连续性洞察
      if (currentStreak > 0) {
        insights.push({
          type: 'streak',
          title: '连续记录',
          summary: `你已连续完成该习惯 ${currentStreak} 天`,
          detail: currentStreak >= 7 
            ? '连续坚持一周以上，你的习惯正在稳步形成！' 
            : '继续保持，习惯养成需要至少21天的坚持。',
          icon: 'streak'
        });
      }
      
      // 完成率洞察
      insights.push({
        type: 'completion',
        title: '完成情况',
        summary: `完成率 ${completionRate.toFixed(1)}%`,
        detail: this.getCompletionRateDetail(performanceLevel, completionRate),
        icon: 'completion'
      });
      
      // 最佳时段洞察
      if (bestPeriods && bestPeriods.bestDay) {
        insights.push({
          type: 'bestDay',
          title: '最佳执行日',
          summary: `${bestPeriods.bestDay.day}是你的高效日`,
          detail: `在${bestPeriods.bestDay.day}，你的习惯完成率达到${bestPeriods.bestDay.rate}%，明显高于其他时间。考虑在这一天安排更重要或更困难的习惯。`,
          icon: 'calendar'
        });
      }
      
      // 习惯模式洞察
      if (habitPatterns && habitPatterns.periodicity && habitPatterns.periodicity.hasPattern) {
        const { confidence, dominantDays } = habitPatterns.periodicity;
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dominantDayNames = dominantDays.map(day => dayNames[day]).join('、');
        
        insights.push({
          type: 'pattern',
          title: '习惯模式',
          summary: `你倾向于在${dominantDayNames}执行此习惯`,
          detail: `我们发现你有${confidence.toFixed(0)}%的可能性在${dominantDayNames}执行此习惯。了解自己的习惯模式有助于更好地规划和坚持。`,
          icon: 'pattern'
        });
      }
      
      // 时间分布洞察
      if (habitPatterns && habitPatterns.timeDistribution && habitPatterns.timeDistribution.bestTime) {
        const { bestTime } = habitPatterns.timeDistribution;
        
        insights.push({
          type: 'timeSlot',
          title: '最佳时间段',
          summary: `你通常在${bestTime.name}完成此习惯`,
          detail: `数据显示，你有${bestTime.ratio}%的完成记录发生在${bestTime.name}时段。这可能是你执行此习惯的最佳时间。`,
          icon: 'time'
        });
      }
      
      // 连续记录分析
      if (habitPatterns && habitPatterns.streaks) {
        const { longestStreak, averageStreak } = habitPatterns.streaks;
        
        if (longestStreak > 7) {
          insights.push({
            type: 'longestStreak',
            title: '最长连续记录',
            summary: `你曾连续完成${longestStreak}天`,
            detail: `你的最长连续记录是${longestStreak}天，平均连续${averageStreak}天。连续坚持是习惯养成的关键。`,
            icon: 'trophy'
          });
        }
      }
      
      return insights;
    },
    
    /**
     * 获取完成率详细描述
     */
    getCompletionRateDetail(performanceLevel, completionRate) {
      switch (performanceLevel) {
        case 'excellent':
          return `完成率达到${completionRate.toFixed(1)}%，非常出色！你已经很好地掌握了这个习惯。`;
        case 'good':
          return `完成率为${completionRate.toFixed(1)}%，表现良好。继续保持，你已经在正确的轨道上。`;
        case 'average':
          return `完成率为${completionRate.toFixed(1)}%，表现一般。尝试找出影响你坚持的因素，并针对性改进。`;
        case 'needsImprovement':
          return `完成率为${completionRate.toFixed(1)}%，需要改进。考虑调整目标或设置提醒，让习惯更容易坚持。`;
        default:
          return `完成率为${completionRate.toFixed(1)}%。`;
      }
    },
    
    /**
     * 处理分析结果
     */
    handleAnalysisResult(result) {
      // 更新组件数据
      this.setData({
        loading: false,
        analysisData: result,
        insights: result.insights,
        recommendations: result.recommendations,
        performanceLevel: result.performanceLevel,
        streakInfo: {
          current: result.currentStreak,
          completion: result.completionRate
        },
        bestPeriods: result.bestPeriods,
        habitPatterns: result.habitPatterns,
        patternFound: result.habitPatterns && result.habitPatterns.periodicity && result.habitPatterns.periodicity.hasPattern
      });
      
      // 缓存分析结果
      const habitId = this.properties.habit.id;
      if (habitId) {
        this.data.cachedResults[habitId] = {
          result,
          timestamp: Date.now()
        };
      }
    },
    
    /**
     * 习惯数据变化处理
     */
    onHabitChange(newVal, oldVal) {
      if (newVal && newVal.id && this.properties.checkins && this.properties.checkins.length > 0) {
        this.triggerAnalysis();
      }
    },
    
    /**
     * 打卡记录变化处理
     */
    onCheckinsChange(newVal, oldVal) {
      if (newVal && newVal.length > 0 && this.properties.habit && this.properties.habit.id) {
        this.triggerAnalysis();
      }
    },
    
    /**
     * 触发分析
     */
    triggerAnalysis() {
      const habit = this.properties.habit;
      const checkins = this.properties.checkins;
      
      if (!habit || !habit.id || !checkins || checkins.length === 0) {
        return;
      }
      
      // 检查缓存
      const cachedData = this.data.cachedResults[habit.id];
      const now = Date.now();
      const cacheValidTime = 30 * 60 * 1000; // 30分钟
      
      if (cachedData && (now - cachedData.timestamp) < cacheValidTime) {
        // 使用缓存数据
        this.handleAnalysisResult(cachedData.result);
        return;
      }
      
      // 显示加载状态
      this.setData({
        loading: true
      });
      
      // 发送数据到Worker进行分析
      if (this.data.worker) {
        this.data.worker.postMessage({
          habit,
          checkins
        });
      }
    },
    
    /**
     * 判断某日期是否应该执行习惯
     */
    shouldDoHabitOnDate(habit, date) {
      const { getDayOfWeek } = require('../../utils/date');
      
      // 检查习惯开始日期
      if (new Date(date) < new Date(habit.startDate)) {
        return false;
      }
      
      // 检查习惯结束日期
      if (habit.endDate && new Date(date) > new Date(habit.endDate)) {
        return false;
      }
      
      const dayOfWeek = getDayOfWeek(new Date(date));
      
      // 根据频率类型判断
      switch (habit.frequency.type) {
        case 'daily':
          return true;
        case 'weekly':
          // 检查是否为指定的星期几
          return habit.frequency.days.includes(dayOfWeek - 1); // 转换为0-6
        case 'monthly':
          // 每月固定日期
          return new Date(date).getDate() === habit.frequency.interval;
        default:
          return false;
      }
    },
    
    /**
     * 展开/收起洞察
     */
    toggleInsight(e) {
      const index = e.currentTarget.dataset.index;
      const expandedIndex = this.data.expandedInsightIndex === index ? -1 : index;
      
      this.setData({
        expandedInsightIndex: expandedIndex
      });
    },
    
    /**
     * 处理建议操作
     */
    onRecommendationAction(e) {
      const actionType = e.currentTarget.dataset.action;
      const recommendation = e.currentTarget.dataset.recommendation;
      
      // 触发事件，让父组件处理
      this.triggerEvent('recommendationAction', {
        actionType,
        recommendation
      });
    },
    
    /**
     * 查看完整分析
     */
    viewFullAnalysis() {
      this.triggerEvent('viewFullAnalysis', {
        habit: this.properties.habit,
        analysisData: this.data.analysisData
      });
    }
  }
}); 
