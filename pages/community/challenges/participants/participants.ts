/**
 * 挑战参与者列表页面
 */
import { communityAPI } from '../../../../services/api';
import { formatDate } from '../../../../utils/util';

interface IPageData {
  challengeId: string;
  challengeName: string;
  participants: any[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  limit: number;
}

interface IPageMethods {
  loadParticipants(isRefresh?: boolean): void;
  viewUserProfile(e: WechatMiniprogram.TouchEvent): void;
  goBack(): void;
  formatJoinTime(time: string): string;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    challengeId: '',
    challengeName: '挑战参与者',
    participants: [],
    loading: true,
    hasMore: true,
    page: 1,
    limit: 20
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
        title: `${name} - 参与者`
      });
    }
    
    // 保存挑战ID
    this.setData({ challengeId: id });
    
    // 加载参与者列表
    this.loadParticipants(true);
  },
  
  /**
   * 加载参与者列表
   */
  loadParticipants(isRefresh = false) {
    const { challengeId, page, limit } = this.data;
    
    // 如果是刷新，重置页码
    if (isRefresh) {
      this.setData({
        page: 1,
        participants: [],
        hasMore: true
      });
    }
    
    // 如果没有更多数据，直接返回
    if (!this.data.hasMore && !isRefresh) {
      return;
    }
    
    this.setData({ loading: true });
    
    // 构建请求参数
    const params = {
      page: isRefresh ? 1 : page,
      limit
    };
    
    // 调用API获取参与者列表
    communityAPI.getChallengeParticipants(challengeId, params)
      .then(result => {
        console.log('获取到参与者列表:', result);
        
        // 获取参与者数据
        const participants = result.participants || [];
        
        // 格式化时间
        const processedParticipants = participants.map(participant => {
          return {
            ...participant,
            joinedAt: this.formatJoinTime(participant.joinedAt)
          };
        });
        
        // 获取分页信息
        const pagination = result.pagination || {
          total: participants.length,
          pages: 1,
          page: params.page,
          limit: params.limit
        };
        
        // 更新数据
        this.setData({
          participants: isRefresh ? processedParticipants : [...this.data.participants, ...processedParticipants],
          loading: false,
          hasMore: params.page < pagination.pages,
          page: params.page + 1
        });
      })
      .catch(error => {
        console.error('获取参与者列表失败:', error);
        
        wx.showToast({
          title: '获取参与者列表失败',
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
  },
  
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadParticipants(true);
    wx.stopPullDownRefresh();
  },
  
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadParticipants();
    }
  },
  
  /**
   * 格式化加入时间
   */
  formatJoinTime(time: string): string {
    if (!time) return '未知时间';
    return formatDate(new Date(time), 'yyyy-MM-dd HH:mm');
  }
}); 
