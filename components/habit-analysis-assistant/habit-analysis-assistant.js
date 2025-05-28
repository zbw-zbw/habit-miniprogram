Component({
  /**
   * 组件的属性列表
   */
  properties: {
    habit: {
      type: Object,
      value: null,
      observer: function(newVal) {
        if (newVal) {
          this.analyzeHabit(newVal);
        }
      }
    },
    checkInRecords: {
      type: Array,
      value: []
    },
    visible: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    loading: false,
    analysis: null,
    insights: [],
    suggestions: [],
    scientificReferences: [],
    showFullAnalysis: false,
    analysisCategories: [
      { id: 'consistency', name: '一致性', icon: 'calendar' },
      { id: 'timing', name: '时间模式', icon: 'clock' },
      { id: 'progress', name: '进度', icon: 'chart' },
      { id: 'obstacles', name: '障碍', icon: 'warning' },
      { id: 'science', name: '科学依据', icon: 'science' }
    ],
    selectedCategory: 'consistency'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 分析习惯数据
     */
    analyzeHabit(habit) {
      this.setData({ loading: true });
      
      // 模拟AI分析过程
      setTimeout(() => {
        const analysis = this.generateAnalysis(habit);
        
        this.setData({
          loading: false,
          analysis: analysis,
          insights: analysis.insights,
          suggestions: analysis.suggestions,
          scientificReferences: analysis.scientificReferences
        });
      }, 1000);
    },
    
    /**
     * 生成习惯分析
     * 在实际应用中，这里应该调用后端API进行真实的AI分析
     */
    generateAnalysis(habit) {
      // 模拟习惯分析结果
      const checkInRecords = this.properties.checkInRecords;
      const mockAnalysis = {
        overallScore: Math.floor(Math.random() * 40) + 60, // 60-100分
        consistencyScore: Math.floor(Math.random() * 40) + 60,
        consistencyAnalysis: this.getConsistencyAnalysis(habit, checkInRecords),
        timingAnalysis: this.getTimingAnalysis(habit, checkInRecords),
        progressAnalysis: this.getProgressAnalysis(habit, checkInRecords),
        obstaclesAnalysis: this.getObstaclesAnalysis(habit, checkInRecords),
        scientificAnalysis: this.getScientificAnalysis(habit),
        insights: this.generateInsights(habit, checkInRecords),
        suggestions: this.generateSuggestions(habit, checkInRecords),
        scientificReferences: this.getScientificReferences(habit)
      };
      
      return mockAnalysis;
    },
    
    /**
     * 获取一致性分析
     */
    getConsistencyAnalysis(habit, records) {
      const mockAnalysisText = [
        "根据你的习惯记录，你在工作日的完成率为82%，周末为65%。整体保持了良好的一致性，但周末表现略有下降。",
        "在过去30天中，你有24天完成了这个习惯，连续最长完成天数为9天。相比上个月提高了15%，保持稳定增长。",
        "习惯养成的前21天是关键期，你已经成功度过了这个阶段，习惯正在逐渐形成。",
        "你的习惯执行时间相对固定，有助于建立神经通路和自动化行为模式。研究表明，固定时间执行的习惯比随机时间执行的习惯更容易形成。"
      ];
      
      return mockAnalysisText;
    },
    
    /**
     * 获取时间模式分析
     */
    getTimingAnalysis(habit, records) {
      const mockAnalysisText = [
        "你最常在晚上9点-10点之间完成这个习惯，这个时间段的完成率高达95%。",
        "数据显示，你在早上执行这个习惯的完成质量评分平均为4.7分（满分5分），而晚上仅为3.9分。建议尝试调整到早上执行。",
        "工作日和周末的执行时间差异较大，可能影响习惯的一致性。建议尝试统一执行时间。",
        "你的习惯形成曲线符合BJ Fogg博士的'微习惯理论'，先从小目标开始，逐渐扩展习惯的规模和复杂度，是科学的习惯养成方式。"
      ];
      
      return mockAnalysisText;
    },
    
    /**
     * 获取进度分析
     */
    getProgressAnalysis(habit, records) {
      const mockAnalysisText = [
        "过去三个月的完成率呈现稳步上升趋势：第一个月65%，第二个月78%，第三个月85%。",
        "你的习惯质量评分（根据打卡内容丰富度、时长等）也有所提升，从平均3.6分提高到4.2分。",
        "与类似用户相比，你的进步速度位于前30%，表现优秀。",
        "根据习惯养成的反馈闭环理论，你的进步速率处于健康区间，能够为大脑提供足够的奖励感，同时避免倦怠。"
      ];
      
      return mockAnalysisText;
    },
    
    /**
     * 获取障碍分析
     */
    getObstaclesAnalysis(habit, records) {
      const mockAnalysisText = [
        "从你的打卡记录中，我们发现在出差和周末容易中断习惯，这是需要特别关注的时期。",
        "情绪记录显示，当你感到疲惫时，完成率降至40%，远低于平均水平。",
        "通常在连续执行7天后，你会有一次中断。这可能是倦怠期的表现，建议设置阶段性小目标和奖励。",
        "根据实施意图理论（Implementation Intention），你可以制定特定的"如果-那么"计划来应对这些障碍。例如："如果我出差，那么我就在酒店房间利用5分钟做简化版的习惯。""
      ];
      
      return mockAnalysisText;
    },

    /**
     * 获取科学分析
     */
    getScientificAnalysis(habit) {
      const mockAnalysisText = [
        "根据James Clear的《原子习惯》理论，习惯形成的四个阶段是提示、渴望、反应和奖励。你的习惯已经建立了稳定的提示阶段，但奖励机制有待加强。",
        "斯坦福大学BJ Fogg博士的行为模型表明，行为发生需要动机、能力和触发器三个因素同时存在。你的习惯中触发器表现良好，但能力因素波动较大。",
        "哈佛大学心理学家的研究表明，习惯形成的平均时间是66天，而不是通常认为的21天。你已坚持30天，处于关键期，需继续保持。",
        "霍尔特学习理论（Hull's Drive Theory）指出，习惯强度是由驱动力、刺激强度、反应潜力和奖励价值共同决定的。建议增加你的习惯奖励机制，提高驱动力。"
      ];
      
      return mockAnalysisText;
    },
    
    /**
     * 生成科学参考文献
     */
    getScientificReferences(habit) {
      const references = [
        {
          id: 1,
          title: '习惯形成的神经科学基础',
          authors: 'Ann M. Graybiel, Kyle S. Smith',
          publication: 'Neuron, 2016',
          link: 'https://pubmed.ncbi.nlm.nih.gov/27657449/'
        },
        {
          id: 2,
          title: '习惯形成的时间研究',
          authors: 'Phillippa Lally, Cornelia H. M. van Jaarsveld',
          publication: 'European Journal of Social Psychology, 2010',
          link: 'https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674'
        },
        {
          id: 3,
          title: '行为模型：简单的习惯培养方法',
          authors: 'BJ Fogg',
          publication: 'Tiny Habits, 2020',
          link: 'https://www.tinyhabits.com/about'
        },
        {
          id: 4,
          title: '原子习惯：如何养成好习惯，戒除坏习惯',
          authors: 'James Clear',
          publication: '2018',
          link: 'https://jamesclear.com/atomic-habits'
        }
      ];
      
      return references;
    },
    
    /**
     * 生成洞察
     */
    generateInsights(habit, records) {
      const insights = [
        {
          id: 1,
          category: 'consistency',
          title: '晨间执行效果最佳',
          description: '你在早上6:00-8:00之间执行习惯的完成质量评分最高，平均为4.8分（满分5分）。这与人体皮质醇水平在早晨较高的生理规律相符。'
        },
        {
          id: 2,
          category: 'timing',
          title: '发现最佳习惯链',
          description: '数据显示，当你先完成"冥想"再执行此习惯时，完成率提高了23%。这符合习惯叠加理论，即在已有习惯后立即添加新习惯。'
        },
        {
          id: 3,
          category: 'progress',
          title: '里程碑达成',
          description: '恭喜！你已连续完成此习惯超过21天，习惯养成的关键期已经成功度过。根据神经可塑性理论，新的神经通路正在形成。'
        },
        {
          id: 4,
          category: 'obstacles',
          title: '周末是弱点',
          description: '周末的完成率（62%）明显低于工作日（86%），这是需要重点关注的环节。可以使用实施意图策略来克服周末的环境变化。'
        },
        {
          id: 5,
          category: 'science',
          title: '习惯养成的神经科学',
          description: '基底神经节在习惯形成中起关键作用，重复的行为会逐渐将信号从前额叶皮质（有意识决策）转移到基底神经节（自动化行为）。'
        }
      ];
      
      return insights;
    },
    
    /**
     * 生成建议
     */
    generateSuggestions(habit, records) {
      const suggestions = [
        {
          id: 1,
          title: '建立习惯链',
          description: '将这个习惯与你每天都会做的事情（如刷牙后）链接在一起，提高自动触发概率。这基于BJ Fogg博士的习惯叠加理论。',
          actionable: true,
          action: '设置触发器'
        },
        {
          id: 2,
          title: '调整习惯时间',
          description: '尝试在早上6:00-8:00执行此习惯，这个时段你的完成质量最高。这与人体生理节律和皮质醇水平相符。',
          actionable: true,
          action: '更改提醒时间'
        },
        {
          id: 3,
          title: '设置渐进目标',
          description: '将大目标分解为小步骤，逐步提高难度，保持动力和成就感。这基于卡罗尔·德韦克的增长心态理论。',
          actionable: true,
          action: '调整目标'
        },
        {
          id: 4,
          title: '找到习惯伙伴',
          description: '与朋友一起执行相同习惯，互相监督，可提高坚持率约45%。这利用了社会支持和责任感的心理机制。',
          actionable: true,
          action: '邀请好友'
        },
        {
          id: 5,
          title: '创建环境触发器',
          description: '在环境中设置视觉提示，如在床头放运动鞋可增加晨练概率。环境设计是习惯养成的关键因素之一。',
          actionable: true,
          action: '设置提示物'
        }
      ];
      
      return suggestions;
    },
    
    /**
     * 切换分析类别
     */
    switchCategory(e) {
      const category = e.currentTarget.dataset.category;
      this.setData({
        selectedCategory: category
      });
    },
    
    /**
     * 切换全部/简化分析视图
     */
    toggleFullAnalysis() {
      this.setData({
        showFullAnalysis: !this.data.showFullAnalysis
      });
    },
    
    /**
     * 关闭助手
     */
    closeAssistant() {
      this.triggerEvent('close');
    },
    
    /**
     * 应用建议
     */
    applySuggestion(e) {
      const suggestionId = e.currentTarget.dataset.id;
      const suggestion = this.data.suggestions.find(item => item.id === suggestionId);
      
      if (suggestion) {
        this.triggerEvent('applySuggestion', { suggestion });
      }
    },
    
    /**
     * 分享分析
     */
    shareAnalysis() {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    },

    /**
     * 打开科学参考文献
     */
    openReference(e) {
      const referenceId = e.currentTarget.dataset.id;
      const reference = this.data.scientificReferences.find(item => item.id === referenceId);
      
      if (reference) {
        // 在实际应用中可能需要打开内置浏览器或显示详细内容
        wx.showModal({
          title: reference.title,
          content: `作者：${reference.authors}\n发表于：${reference.publication}`,
          confirmText: '复制链接',
          success: (res) => {
            if (res.confirm) {
              wx.setClipboardData({
                data: reference.link,
                success: () => {
                  wx.showToast({
                    title: '链接已复制',
                    icon: 'success'
                  });
                }
              });
            }
          }
        });
      }
    }
  }
}) 
