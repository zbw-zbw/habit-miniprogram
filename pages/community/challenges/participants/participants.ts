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
    
    console.log('查看用户资料, userId:', userId);
    
    if (!userId) {
      console.error('未找到用户ID:', e.currentTarget.dataset);
      wx.showToast({
        title: '无法查看用户资料',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/community/user-profile/user-profile?id=${userId}`,
      fail: (err) => {
        console.error('跳转到用户资料页失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
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
    
    try {
      const date = new Date(time);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return '未知时间';
      }
      
      // 获取当前时间
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      // 如果是今天
      if (diffDays === 0) {
        return `今天 ${formatDate(date, 'HH:mm')} 加入`;
      }
      
      // 如果是昨天
      if (diffDays === 1) {
        return `昨天 ${formatDate(date, 'HH:mm')} 加入`;
      }
      
      // 如果是7天内
      if (diffDays < 7) {
        return `${diffDays}天前加入`;
      }
      
      // 如果是今年
      if (date.getFullYear() === now.getFullYear()) {
        return `${formatDate(date, 'MM月dd日')} 加入`;
      }
      
      // 其他情况
      return `${formatDate(date, 'yyyy年MM月dd日')} 加入`;
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '未知时间';
    }
  }
}); 
