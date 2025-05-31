/**
 * 成就详情页面
 */
import { achievementService, IAchievement, IMilestone, IRelatedHabit } from '../../../../utils/achievement';

interface IPageData {
  achievement: IAchievement | null;
  milestones: IMilestone[];
  relatedHabits: IRelatedHabit[];
  loading: boolean;
}

interface IPageMethods {
  loadAchievementDetail(id: string): Promise<void>;
  navigateToHabit(e: WechatMiniprogram.TouchEvent): void;
  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent;
  navigateBack(): void;
}

Page<IPageData, IPageMethods>({
  data: {
    achievement: null,
    milestones: [],
    relatedHabits: [],
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    
    if (id) {
      this.loadAchievementDetail(id);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShareAppMessage() {
    const { achievement } = this.data;
    
    if (!achievement) {
      return {
        title: '我的成就',
        path: '/pages/profile/achievements/achievements'
      };
    }
    
    return {
      title: `我解锁了「${achievement.title}」成就！`,
      path: `/pages/profile/achievements/detail/detail?id=${achievement.id}`,
      imageUrl: 'assets/images/achievement.png' // 分享图片，需要自行准备
    };
  },

  /**
   * 加载成就详情
   */
  async loadAchievementDetail(id: string) {
    this.setData({ loading: true });
    
    try {
      // 获取成就详情
      const achievement = await achievementService.getAchievementById(id);
      
      if (!achievement) {
        throw new Error('成就不存在');
      }
      
      // 获取成就里程碑
      const milestones = await achievementService.getMilestones(id);
      
      // 获取相关习惯
      const relatedHabits = await achievementService.getRelatedHabits(id);
      
      this.setData({
        achievement,
        milestones,
        relatedHabits,
        loading: false
      });
    } catch (error) {
      console.error('加载成就详情失败:', error);
      
      this.setData({
        loading: false,
        achievement: null
      });
      
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  /**
   * 跳转到习惯详情
   */
  navigateToHabit(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/habits/detail/detail?id=${id}`
    });
  },
  
  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  }
}); 
