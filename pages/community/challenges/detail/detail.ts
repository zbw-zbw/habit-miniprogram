/**
 * 挑战详情页面
 */
import { communityAPI } from '../../../../services/api';
import { useAuth } from '../../../../utils/use-auth';
import { formatDate, formatRelativeTime } from '../../../../utils/util';
import { IAppOption } from '../../../../app';

interface IUserInfo {
  id: string;
  nickname?: string;
  username?: string;
  avatar?: string;
}

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

interface IChallenge {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  coverImage?: string;
  creator?: any;
  participantsCount: number;
  participants?: number;
  isJoined?: boolean;
  isParticipating?: boolean;
  status: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  requirements?: {
    targetCount: number;
  };
  progress?: {
    completedCount: number;
    targetCount: number;
    completionRate: number;
  };
  tags?: string[];
  rules?: string;
  remainingDays?: number;
  durationDays?: number;
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
    const previousLoginState = this.data.hasLogin;
    
    // 更新登录状态
    this.setData({
      userInfo: app.globalData.userInfo,
      hasLogin: isLoggedIn
    });
    
    // 只有当登录状态发生变化时，才重新加载挑战详情
    if ((this as any).challengeId && previousLoginState !== isLoggedIn) {
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
    
    communityAPI.getChallenge(challengeId)
      .then(challenge => {
        
        
        // 处理挑战数据
        const processedChallenge = {
          ...challenge,
          // 确保id字段存在
          id: challenge.id || challenge._id,
          // 确保participantsCount字段存在，如果为0且有创建者，则设为1（至少包含创建者）
          participantsCount: challenge.participantsCount || challenge.participants || (challenge.creator ? 1 : 0),
          // 确保participants字段存在
          participants: challenge.participants || challenge.participantsCount || (challenge.creator ? 1 : 0),
          // 确保isJoined和isParticipating字段存在
          isJoined: challenge.isJoined || challenge.isParticipating || false,
          isParticipating: challenge.isParticipating || challenge.isJoined || false,
          // 确保remainingDays和durationDays字段存在
          remainingDays: challenge.remainingDays !== undefined ? challenge.remainingDays : 0,
          durationDays: challenge.durationDays || (challenge.requirements?.targetCount || 0)
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
      })
      .catch(error => {
        
        
        wx.showToast({
          title: '获取挑战详情失败',
          icon: 'none'
        });
        
        this.setData({ loading: false });
      });
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
        
        
        let participants = result.participants || [];
        
        // 检查创建者是否在参与者列表中
        const { challenge } = this.data;
        if (challenge && challenge.creator) {
          // 检查创建者是否已经在列表中
          const creatorExists = participants.some(
            (p: any) => p.user && (p.user._id === challenge.creator._id || p.user.id === challenge.creator._id)
          );
          
          // 如果创建者不在列表中，添加创建者
          if (!creatorExists) {
            participants = [
              {
                user: challenge.creator,
                isCreator: true,
                joinDate: challenge.createdAt || new Date().toISOString()
              },
              ...participants
            ];
          } else {
            // 如果创建者在列表中，标记为创建者
            participants = participants.map((p: any) => {
              if (p.user && (p.user._id === challenge.creator._id || p.user.id === challenge.creator._id)) {
                return { ...p, isCreator: true };
              }
              return p;
            });
          }
        }
        
        this.setData({
          participants,
          participantsLoading: false
        });
      })
      .catch(error => {
        
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
          ? Math.max(1, challenge.participantsCount - 1) // 确保至少有1人（创建者）
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
    const { challenge } = this.data;
    
    // 如果后端已经提供了remainingDays和durationDays，优先使用它们
    if (challenge && challenge.remainingDays !== undefined && challenge.durationDays !== undefined) {
      if (challenge.status === 'completed' || challenge.status === 'cancelled') {
        return '已结束';
      } else if (challenge.status === 'upcoming') {
        return `${challenge.remainingDays}/${challenge.durationDays} 天后开始`;
      } else if (challenge.status === 'active') {
        return `剩余 ${challenge.remainingDays}/${challenge.durationDays} 天`;
      }
    }
    
    // 后备方案：手动计算
    if (!startDate || !endDate) {
      return '';
    }
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 计算总天数
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (now < start) {
      // 还未开始
      const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `${diffDays}/${totalDays}天后开始`;
    } else if (now <= end) {
      // 进行中
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `剩余${diffDays}/${totalDays}天`;
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
