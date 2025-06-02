/**
 * 挑战详情页面
 */
import { communityAPI } from '../../../../services/api';
import { useAuth } from '../../../../utils/use-auth';
import { formatDate, formatRelativeTime } from '../../../../utils/util';

interface IPageData {
  challenge: IChallenge | null;
  loading: boolean;
  hasLogin: boolean;
  userInfo: IUserInfo | null;
  participants: any[];
  participantsLoading: boolean;
  isJoined: boolean;
  isCreator: boolean;
  statusText: string;
  statusClass: string;
  timeRemaining: string;
  progress: {
    completedCount: number;
    targetCount: number;
    completionRate: number;
  };
}

interface IPageMethods {
  loadChallenge(): void;
  loadParticipants(): void;
  toggleJoinChallenge(): void;
  dismissChallenge(): void;
  viewUserProfile(e: WechatMiniprogram.TouchEvent): void;
  viewAllParticipants(): void;
  viewLeaderboard(): void;
  shareChallenge(): void;
  formatStatusText(status: string): string;
  formatStatusClass(status: string): string;
  calculateTimeRemaining(startDate: string, endDate: string): string;
  goBack(): void;
  processChallenge(challenge: any): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    challenge: null,
    loading: true,
    hasLogin: false,
    userInfo: null,
    participants: [],
    participantsLoading: false,
    isJoined: false,
    isCreator: false,
    statusText: '',
    statusClass: '',
    timeRemaining: '',
    progress: {
      completedCount: 0,
      targetCount: 0,
      completionRate: 0
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 使用useAuth工具获取全局登录状态
    useAuth(this);
    
    // 获取挑战ID
    const { id } = options;
    
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
    
    // 保存挑战ID到页面实例
    (this as any).challengeId = id;
    
    // 加载挑战详情
    this.loadChallenge();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查登录状态，可能在其他页面已经登录/登出
    const app = getApp<IAppOption>();
    const isLoggedIn = app.globalData.hasLogin;
    
    // 更新登录状态
    this.setData({
      userInfo: app.globalData.userInfo,
      hasLogin: isLoggedIn
    });
    
    // 如果挑战ID存在，重新加载挑战详情
    if ((this as any).challengeId) {
      this.loadChallenge();
    }
  },
  
  /**
   * 加载挑战详情
   */
  loadChallenge() {
    const challengeId = (this as any).challengeId;
    
    if (!challengeId) {
      return;
    }
    
    this.setData({ loading: true });
    
    // 直接使用挑战详情API
    communityAPI.getChallenge(challengeId)
      .then(challenge => {
        console.log('获取到挑战详情:', challenge);
        this.processChallenge(challenge);
      })
      .catch(error => {
        console.error('获取挑战详情失败:', error);
        
        // 如果挑战详情API失败，尝试从挑战列表获取
        console.log('尝试从挑战列表获取挑战详情');
        return communityAPI.getChallenges({ limit: 20 })
          .then(result => {
            // 从挑战列表中查找指定ID的挑战
            const challenges = result.challenges || [];
            const challenge = challenges.find((c: any) => 
              (c.id === challengeId || c._id === challengeId)
            );
            
            if (challenge) {
              console.log('从挑战列表中找到了挑战详情:', challenge);
              this.processChallenge(challenge);
            } else {
              // 如果都失败了，显示错误提示
              wx.showToast({
                title: '获取挑战详情失败',
                icon: 'none'
              });
              this.setData({ loading: false });
            }
          })
          .catch(error2 => {
            console.error('从挑战列表获取挑战详情也失败:', error2);
            wx.showToast({
              title: '获取挑战详情失败',
              icon: 'none'
            });
            this.setData({ loading: false });
          });
      });
  },
  
  /**
   * 处理挑战数据
   */
  processChallenge(challenge: any) {
    // 处理挑战数据
    const processedChallenge = {
      ...challenge,
      // 确保id字段存在
      id: challenge.id || challenge._id,
      // 确保participantsCount字段存在
      participantsCount: challenge.participantsCount || challenge.participants || 0,
      // 确保participants字段存在
      participants: challenge.participants || challenge.participantsCount || 0,
      // 确保isJoined和isParticipating字段存在
      isJoined: challenge.isJoined || challenge.isParticipating || false,
      isParticipating: challenge.isParticipating || challenge.isJoined || false
    };
    
    // 计算状态文本和样式
    const statusText = this.formatStatusText(challenge.status);
    const statusClass = this.formatStatusClass(challenge.status);
    
    // 计算剩余时间
    const timeRemaining = this.calculateTimeRemaining(
      challenge.dateRange?.startDate || '',
      challenge.dateRange?.endDate || ''
    );
    
    // 检查是否是创建者
    const app = getApp<IAppOption>();
    const isCreator = app.globalData.userInfo && 
                      challenge.creator && 
                      app.globalData.userInfo.id === challenge.creator._id;
    
    // 更新页面数据
    this.setData({
      challenge: processedChallenge,
      loading: false,
      isJoined: processedChallenge.isJoined || processedChallenge.isParticipating,
      isCreator,
      statusText,
      statusClass,
      timeRemaining,
      progress: challenge.progress || {
        completedCount: 0,
        targetCount: challenge.requirements?.targetCount || 0,
        completionRate: 0
      }
    });
    
    // 加载参与者列表
    this.loadParticipants();
  },
  
  /**
   * 加载参与者列表
   */
  loadParticipants() {
    const challengeId = (this as any).challengeId;
    
    if (!challengeId) {
      return;
    }
    
    this.setData({ participantsLoading: true });
    
    communityAPI.getChallengeParticipants(challengeId, { limit: 5 })
      .then(result => {
        console.log('获取到参与者列表:', result);
        
        this.setData({
          participants: result.participants || [],
          participantsLoading: false
        });
      })
      .catch(error => {
        console.error('获取参与者列表失败:', error);
        this.setData({ participantsLoading: false });
      });
  },
  
  /**
   * 参加/退出挑战
   */
  toggleJoinChallenge() {
    // 如果未登录，跳转到登录页
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const challengeId = (this as any).challengeId;
    const { isJoined, challenge } = this.data;
    
    if (!challengeId || !challenge) {
      return;
    }
    
    wx.showLoading({
      title: isJoined ? '退出中...' : '参加中...'
    });
    
    // 调用API
    const apiCall = isJoined 
      ? communityAPI.leaveChallenge(challengeId) 
      : communityAPI.joinChallenge(challengeId);
    
    apiCall
      .then(() => {
        // 更新本地状态
        const newParticipantsCount = isJoined 
          ? Math.max(0, challenge.participantsCount - 1)
          : challenge.participantsCount + 1;
        
        this.setData({
          isJoined: !isJoined,
          'challenge.isJoined': !isJoined,
          'challenge.isParticipating': !isJoined,
          'challenge.participantsCount': newParticipantsCount,
          'challenge.participants': newParticipantsCount
        });
        
        // 显示成功提示
        wx.showToast({
          title: isJoined ? '已退出挑战' : '已参加挑战',
          icon: 'success'
        });
        
        // 重新加载参与者列表
        this.loadParticipants();
      })
      .catch(error => {
        console.error('操作失败:', error);
        
        // 显示错误提示
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
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
   * 查看所有参与者
   */
  viewAllParticipants() {
    const challengeId = (this as any).challengeId;
    
    if (!challengeId) {
      return;
    }
    
    wx.navigateTo({
      url: `/pages/community/challenges/participants/participants?id=${challengeId}&name=${encodeURIComponent(this.data.challenge?.name || '挑战')}`
    });
  },
  
  /**
   * 查看排行榜
   */
  viewLeaderboard() {
    const challengeId = (this as any).challengeId;
    
    if (!challengeId) {
      return;
    }
    
    wx.navigateTo({
      url: `/pages/community/challenges/leaderboard/leaderboard?id=${challengeId}&name=${encodeURIComponent(this.data.challenge?.name || '挑战')}`
    });
  },
  
  /**
   * 分享挑战
   */
  shareChallenge() {
    // 调用系统分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },
  
  /**
   * 格式化状态文本
   */
  formatStatusText(status: string): string {
    switch (status) {
      case 'upcoming':
        return '即将开始';
      case 'active':
        return '进行中';
      case 'completed':
        return '已结束';
      case 'cancelled':
        return '已取消';
      default:
        return '未知状态';
    }
  },
  
  /**
   * 格式化状态样式
   */
  formatStatusClass(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'status-upcoming';
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  },
  
  /**
   * 计算剩余时间
   */
  calculateTimeRemaining(startDate: string, endDate: string): string {
    if (!startDate || !endDate) {
      return '';
    }
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      // 还未开始
      const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `${diffDays}天后开始`;
    } else if (now <= end) {
      // 进行中
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `剩余${diffDays}天`;
    } else {
      // 已结束
      return '已结束';
    }
  },
  
  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },
  
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { challenge } = this.data;
    
    if (!challenge) {
      return {
        title: '习惯挑战',
        path: '/pages/community/challenges/challenges'
      };
    }
    
    return {
      title: challenge.name || '习惯挑战',
      path: `/pages/community/challenges/detail/detail?id=${challenge.id}`,
      imageUrl: challenge.coverImage || '/images/challenge.png'
    };
  },
  
  /**
   * 解散挑战
   */
  dismissChallenge() {
    // 如果未登录，跳转到登录页
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const challengeId = (this as any).challengeId;
    
    if (!challengeId) {
      return;
    }
    
    // 显示确认对话框
    wx.showModal({
      title: '解散挑战',
      content: '确定要解散该挑战吗？解散后无法恢复，所有参与者将自动退出。',
      confirmText: '确定解散',
      confirmColor: '#F56C6C',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          // 调用API解散挑战
          communityAPI.dismissChallenge(challengeId)
            .then(() => {
              wx.showToast({
                title: '挑战已解散',
                icon: 'success'
              });
              
              // 返回上一页
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            })
            .catch(error => {
              console.error('解散挑战失败:', error);
              
              wx.showToast({
                title: '解散挑战失败',
                icon: 'none'
              });
            })
            .finally(() => {
              wx.hideLoading();
            });
        }
      }
    });
  },
}); 
