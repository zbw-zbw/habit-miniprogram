/**
 * 挑战排行榜页面
 */
import { communityAPI } from '../../../../services/api';

interface IPageData {
  challengeId: string;
  challengeName: string;
  leaderboard: any[];
  loading: boolean;
  myRank: number;
  myProgress: number;
}

interface IPageMethods {
  loadLeaderboard(): void;
  viewUserProfile(e: WechatMiniprogram.TouchEvent): void;
  goBack(): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    challengeId: '',
    challengeName: '挑战排行榜',
    leaderboard: [],
    loading: true,
    myRank: 0,
    myProgress: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { id, name } = options;
    
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 设置标题
    if (name) {
      this.setData({ challengeName: name });
      wx.setNavigationBarTitle({
        title: `${name} - 排行榜`
      });
    }
    
    // 保存挑战ID
    this.setData({ challengeId: id });
    
    // 加载排行榜
    this.loadLeaderboard();
  },
  
  /**
   * 加载排行榜
   */
  loadLeaderboard() {
    const { challengeId } = this.data;
    
    this.setData({ loading: true });
    
    // 调用API获取排行榜
    communityAPI.getChallengeLeaderboard(challengeId)
      .then(result => {
        
        
        // 获取排行榜数据
        const leaderboard = result.leaderboard || [];
        
        // 获取我的排名
        const myRank = result.myRank || 0;
        const myProgress = result.myProgress || 0;
        
        // 更新数据
        this.setData({
          leaderboard,
          loading: false,
          myRank,
          myProgress
        });
      })
      .catch(error => {
        
        
        wx.showToast({
          title: '获取排行榜失败',
          icon: 'none'
        });
        
        this.setData({ loading: false });
      });
  },
  
  /**
   * 查看用户资料
   */
  viewUserProfile(e: WechatMiniprogram.TouchEvent) {
    const userId = e.currentTarget.dataset.id;
    
    if (!userId) {
      return;
    }
    
    wx.navigateTo({
      url: `/pages/profile/user-profile/user-profile?id=${userId}`
    });
  },
  
  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
}); 
