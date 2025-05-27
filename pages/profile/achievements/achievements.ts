/**
 * 成就列表页面
 */
import { achievementService, IAchievement } from '../../../utils/achievement';

interface IPageData {
  allAchievements: IAchievement[];
  filteredAchievements: IAchievement[];
  loading: boolean;
  activeTab: 'all' | 'completed' | 'in-progress';
}

interface IPageMethods {
  loadAchievements(): Promise<void>;
  filterAchievements(): void;
  switchTab(e: WechatMiniprogram.TouchEvent): void;
  viewAchievementDetail(e: WechatMiniprogram.TouchEvent): void;
  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    allAchievements: [],
    filteredAchievements: [],
    loading: true,
    activeTab: 'all'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.loadAchievements();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 如果已经加载过成就，则刷新数据
    if (this.data.allAchievements.length > 0) {
      this.loadAchievements();
    }
  },

  /**
   * 加载成就列表
   */
  async loadAchievements() {
    this.setData({ loading: true });
    
    try {
      // 获取所有成就
      const achievements = await achievementService.getAllAchievements();
      
      this.setData({
        allAchievements: achievements,
        loading: false
      });
      
      // 根据当前选中的标签筛选成就
      this.filterAchievements();
    } catch (error) {
      console.error('加载成就列表失败:', error);
      
      this.setData({
        loading: false,
        allAchievements: [],
        filteredAchievements: []
      });
      
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  /**
   * 根据标签筛选成就
   */
  filterAchievements() {
    const { allAchievements, activeTab } = this.data;
    
    let filteredAchievements = [...allAchievements];
    
    // 根据标签筛选
    if (activeTab === 'completed') {
      filteredAchievements = allAchievements.filter(a => a.isCompleted);
    } else if (activeTab === 'in-progress') {
      filteredAchievements = allAchievements.filter(a => !a.isCompleted);
    }
    
    this.setData({ filteredAchievements });
  },

  /**
   * 切换标签
   */
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as 'all' | 'completed' | 'in-progress';
    
    if (tab !== this.data.activeTab) {
      this.setData({ activeTab: tab });
      this.filterAchievements();
    }
  },

  /**
   * 查看成就详情
   */
  viewAchievementDetail(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `./detail/detail?id=${id}`
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的成就列表',
      path: '/pages/profile/achievements/achievements'
    };
  }
}); 
