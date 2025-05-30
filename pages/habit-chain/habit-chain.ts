import { HabitChain, HabitRelation, HabitRelationType, RelationStrength, analyzeHabitRelation, generateHabitChains, recommendHabitChains } from '../../utils/habit-chain';
import { IHabit } from '../../utils/types';

// 获取应用实例
const app = getApp<IAppOption>();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'my',
    loading: false,
    analyzing: false,
    chains: [] as HabitChain[],
    allHabits: [] as IHabit[],
    selectedHabits: [] as string[],
    relations: [] as Array<HabitRelation & { sourceHabitName: string; targetHabitName: string }>,
    recommendedChains: [] as Array<HabitChain & { habitDetails: IHabit[] }>,
    analysisResult: '',
    previewChain: null as HabitChain | null,
    canSave: false,
    chainForm: {
      name: '',
      description: '',
      frequency: {
        type: 'daily' as 'daily' | 'weekly' | 'custom',
        days: [1, 2, 3, 4, 5] as number[]
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.loadData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadData();
  },

  /**
   * 切换标签页
   */
  switchTab(e: WechatMiniprogram.BaseEvent) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });

    if (tab === 'create') {
      this.initCreateForm();
    } else if (tab === 'analysis') {
      this.loadRelations();
    }
  },

  /**
   * 加载数据
   */
  async loadData() {
    this.setData({ loading: true });

    try {
      // 加载用户的所有习惯
      const habits = await app.globalData.habitService.getUserHabits();
      
      // 加载用户的习惯链
      const chains = await app.globalData.habitChainService.getUserChains();
      
      // 为习惯链添加习惯详情
      const chainsWithDetails = chains.map(chain => {
        const habitDetails = chain.habits.map(item => {
          const habit = habits.find(h => h.id === item.habitId);
          return {
            ...habit,
            isOptional: item.isOptional
          };
        }).filter(Boolean);
        
        return {
          ...chain,
          habitDetails
        };
      });
      
      this.setData({
        chains: chainsWithDetails,
        allHabits: habits,
        loading: false
      });
    } catch (error) {
      console.error('加载数据失败', error);
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 初始化创建表单
   */
  initCreateForm() {
    this.setData({
      chainForm: {
        name: '',
        description: '',
        frequency: {
          type: 'daily',
          days: [1, 2, 3, 4, 5]
        }
      },
      selectedHabits: [],
      previewChain: null,
      canSave: false
    });
  },

  /**
   * 处理习惯链名称输入
   */
  onNameInput(e: WechatMiniprogram.Input) {
    this.setData({
      'chainForm.name': e.detail.value
    });
    this.updatePreviewChain();
    this.checkCanSave();
  },

  /**
   * 处理习惯链描述输入
   */
  onDescriptionInput(e: WechatMiniprogram.TextareaInput) {
    this.setData({
      'chainForm.description': e.detail.value
    });
    this.updatePreviewChain();
  },

  /**
   * 设置频率类型
   */
  setFrequency(e: WechatMiniprogram.BaseEvent) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'chainForm.frequency.type': type
    });
    this.updatePreviewChain();
  },

  /**
   * 切换星期几
   */
  toggleDay(e: WechatMiniprogram.BaseEvent) {
    const day = parseInt(e.currentTarget.dataset.day);
    const days = [...this.data.chainForm.frequency.days];
    
    const index = days.indexOf(day);
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    
    this.setData({
      'chainForm.frequency.days': days
    });
    this.updatePreviewChain();
  },

  /**
   * 添加习惯
   */
  addHabit() {
    const selectedIds = this.data.selectedHabits;
    const allHabits = this.data.allHabits;
    
    const unselectedHabits = allHabits.filter(h => !selectedIds.includes(h.id));
    
    if (unselectedHabits.length === 0) {
      wx.showToast({
        title: '没有更多可添加的习惯',
        icon: 'none'
      });
      return;
    }
    
    wx.showActionSheet({
      itemList: unselectedHabits.map(h => h.name),
      success: (res) => {
        if (res.tapIndex !== undefined) {
          const habitId = unselectedHabits[res.tapIndex].id;
          const newSelectedHabits = [...selectedIds, habitId];
          
          this.setData({
            selectedHabits: newSelectedHabits
          });
          
          this.updatePreviewChain();
          this.checkCanSave();
        }
      }
    });
  },

  /**
   * 更新预览习惯链
   */
  updatePreviewChain() {
    const { chainForm, selectedHabits, allHabits } = this.data;
    
    if (selectedHabits.length < 2) {
      this.setData({
        previewChain: null
      });
      return;
    }
    
    const chain: HabitChain = {
      id: 'preview',
      name: chainForm.name || '新习惯链',
      description: chainForm.description,
      habits: selectedHabits.map((habitId, index) => ({
        habitId,
        order: index + 1,
        isOptional: false
      })),
      frequency: chainForm.frequency,
      createdAt: new Date().toISOString()
    };
    
    this.setData({
      previewChain: chain
    });
  },

  /**
   * 处理习惯链变化
   */
  onChainChange(e: any) {
    const updatedChain = e.detail;
    this.setData({
      previewChain: updatedChain
    });
  },

  /**
   * 检查是否可以保存
   */
  checkCanSave() {
    const { chainForm, selectedHabits } = this.data;
    
    const canSave = chainForm.name.trim() !== '' && selectedHabits.length >= 2;
    
    this.setData({
      canSave
    });
  },

  /**
   * 保存习惯链
   */
  async saveChain() {
    const { chainForm, previewChain } = this.data;
    
    if (!previewChain || !chainForm.name.trim()) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }
    
    try {
      const chain: HabitChain = {
        ...previewChain,
        id: previewChain.id === 'preview' ? `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : previewChain.id,
        name: chainForm.name,
        description: chainForm.description,
        frequency: chainForm.frequency,
        createdAt: new Date().toISOString()
      };
      
      await app.globalData.habitChainService.saveChain(chain);
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      this.setData({
        activeTab: 'my'
      });
      
      this.loadData();
    } catch (error) {
      console.error('保存习惯链失败', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  /**
   * 查看习惯链详情
   */
  viewChainDetail(e: WechatMiniprogram.BaseEvent) {
    const chainId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/habit-chain/detail/detail?id=${chainId}`
    });
  },

  /**
   * 编辑习惯链
   */
  editChain(e: WechatMiniprogram.BaseEvent) {
    const chainId = e.currentTarget.dataset.id;
    const chain = this.data.chains.find(c => c.id === chainId);
    
    if (!chain) return;
    
    this.setData({
      activeTab: 'create',
      chainForm: {
        name: chain.name,
        description: chain.description || '',
        frequency: chain.frequency
      },
      selectedHabits: chain.habits.map(h => h.habitId),
      previewChain: chain,
      canSave: true
    });
  },

  /**
   * 删除习惯链
   */
  deleteChain(e: WechatMiniprogram.BaseEvent) {
    const chainId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个习惯链吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.globalData.habitChainService.deleteChain(chainId);
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            this.loadData();
          } catch (error) {
            console.error('删除习惯链失败', error);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 加载习惯关联
   */
  async loadRelations() {
    if (this.data.allHabits.length < 2) {
      wx.showToast({
        title: '需要至少两个习惯才能分析关联',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ analyzing: true });
    
    try {
      // 加载用户的打卡记录
      const checkins = await app.globalData.checkinService.getUserCheckins();
      
      // 分析习惯间的关系
      const habits = this.data.allHabits;
      const relations: HabitRelation[] = [];
      
      for (let i = 0; i < habits.length; i++) {
        for (let j = 0; j < habits.length; j++) {
          if (i !== j) {
            const relation = analyzeHabitRelation(habits[i], habits[j], checkins);
            relations.push(relation);
          }
        }
      }
      
      // 过滤出强关联
      const strongRelations = relations.filter(r => 
        r.strength !== RelationStrength.WEAK && 
        r.confidence > 0.5
      );
      
      // 添加习惯名称
      const relationsWithNames = strongRelations.map(relation => {
        const sourceHabit = habits.find(h => h.id === relation.sourceHabitId);
        const targetHabit = habits.find(h => h.id === relation.targetHabitId);
        
        return {
          ...relation,
          sourceHabitName: sourceHabit?.name || '未知习惯',
          targetHabitName: targetHabit?.name || '未知习惯'
        };
      });
      
      // 生成推荐习惯链
      const recommendedChains = await this.generateRecommendedChains(habits, checkins);
      
      // 生成分析结果
      let analysisResult = '';
      if (strongRelations.length > 0) {
        const triggerCount = strongRelations.filter(r => r.type === HabitRelationType.TRIGGER).length;
        const complementaryCount = strongRelations.filter(r => r.type === HabitRelationType.COMPLEMENTARY).length;
        const sequentialCount = strongRelations.filter(r => r.type === HabitRelationType.SEQUENTIAL).length;
        const conflictingCount = strongRelations.filter(r => r.type === HabitRelationType.CONFLICTING).length;
        
        analysisResult = `分析发现您的习惯之间存在${strongRelations.length}个强关联，其中有${triggerCount}个触发关系，${complementaryCount}个互补关系，${sequentialCount}个序列关系，${conflictingCount}个冲突关系。基于这些关系，我们为您推荐了${recommendedChains.length}个习惯链。`;
      } else {
        analysisResult = '分析未发现您的习惯之间存在明显的强关联，可能是因为习惯数量较少或打卡数据不足。建议您继续坚持打卡，以便我们提供更准确的分析。';
      }
      
      this.setData({
        relations: relationsWithNames,
        recommendedChains,
        analysisResult,
        analyzing: false
      });
    } catch (error) {
      console.error('加载习惯关联失败', error);
      wx.showToast({
        title: '分析失败',
        icon: 'none'
      });
      this.setData({ analyzing: false });
    }
  },

  /**
   * 分析习惯关联
   */
  analyzeHabits() {
    this.loadRelations();
  },

  /**
   * 生成推荐习惯链
   */
  async generateRecommendedChains(habits: IHabit[], checkins: any[]): Promise<Array<HabitChain & { habitDetails: IHabit[] }>> {
    // 使用习惯链推荐函数
    const chains = await recommendHabitChains(habits, checkins);
    
    // 为习惯链添加习惯详情
    return chains.map(chain => {
      const habitDetails = chain.habits.map(item => {
        const habit = habits.find(h => h.id === item.habitId);
        return {
          ...habit,
          isOptional: item.isOptional
        };
      }).filter(Boolean);
      
      return {
        ...chain,
        habitDetails
      };
    });
  },

  /**
   * 保存推荐的习惯链
   */
  async saveRecommendedChain(e: WechatMiniprogram.BaseEvent) {
    const index = e.currentTarget.dataset.index;
    const chain = this.data.recommendedChains[index];
    
    if (!chain) return;
    
    try {
      // 生成新ID以避免覆盖
      const newChain = {
        ...chain,
        id: `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      delete newChain.habitDetails;
      
      await app.globalData.habitChainService.saveChain(newChain);
      
      wx.showToast({
        title: '已添加到我的习惯链',
        icon: 'success'
      });
      
      this.setData({
        activeTab: 'my'
      });
      
      this.loadData();
    } catch (error) {
      console.error('保存推荐习惯链失败', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  /**
   * 导航到推荐页面
   */
  navigateToRecommend() {
    this.setData({
      activeTab: 'analysis'
    });
    this.loadRelations();
  }
}); 
