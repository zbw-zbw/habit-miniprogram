/**
 * 社区互动-挑战详情页面
 */
import { getUserInfo, getStorage, setStorage } from '../../../utils/storage';

interface IPageData {
  loading: boolean;
  challenge: {
    id: string;
    title: string;
    description: string;
    image: string;
    startDate: string;
    endDate: string;
    participants: number;
    isJoined: boolean;
    progress: number;
    creator: {
      id: string;
      name: string;
      avatar: string;
    };
    rules: string[];
    rewards: string[];
  };
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    progress: number;
    rank: number;
  }>;
  posts: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    images: string[];
    createdAt: string;
    likes: number;
    comments: number;
    isLiked: boolean;
  }>;
  showJoinModal: boolean;
  showShareModal: boolean;
  tabActive: 'intro' | 'rank' | 'posts';
  hasLogin: boolean;
}

interface IPageMethods {
  loadData(id: string): void;
  loadChallenge(id: string): void;
  loadParticipants(id: string): void;
  loadPosts(id: string): void;
  switchTab(e: WechatMiniprogram.TouchEvent): void;
  joinChallenge(): void;
  showJoinModal(): void;
  hideJoinModal(): void;
  showShareModal(): void;
  hideShareModal(): void;
  viewUserProfile(e: WechatMiniprogram.TouchEvent): void;
  likePost(e: WechatMiniprogram.TouchEvent): void;
  commentPost(e: WechatMiniprogram.TouchEvent): void;
  sharePost(e: WechatMiniprogram.TouchEvent): void;
  createPost(): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    challenge: {
      id: '',
      title: '',
      description: '',
      image: '',
      startDate: '',
      endDate: '',
      participants: 0,
      isJoined: false,
      progress: 0,
      creator: {
        id: '',
        name: '',
        avatar: ''
      },
      rules: [],
      rewards: []
    },
    participants: [],
    posts: [],
    showJoinModal: false,
    showShareModal: false,
    tabActive: 'intro',
    hasLogin: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const app = getApp<IAppOption>();
    this.setData({
      hasLogin: app.globalData.hasLogin
    });
    
    if (options.id) {
      this.loadData(options.id);
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

  /**
   * 加载数据
   */
  loadData(id: string) {
    this.setData({ loading: true });
    
    // 加载挑战详情
    this.loadChallenge(id);
    
    // 加载参与者
    this.loadParticipants(id);
    
    // 加载动态
    this.loadPosts(id);
    
    this.setData({ loading: false });
  },

  /**
   * 加载挑战详情
   */
  loadChallenge(id: string) {
    // 模拟加载挑战详情数据
    const mockChallenge = {
      id: id,
      title: '21天早起挑战',
      description: '连续21天早起，养成早起好习惯！每天需在6:30前打卡，连续21天即可获得成就徽章和积分奖励。',
      image: '/images/challenges/challenge1.jpg',
      startDate: '2023-10-01',
      endDate: '2023-10-21',
      participants: 2145,
      isJoined: false,
      progress: 0,
      creator: {
        id: '101',
        name: '习惯养成官',
        avatar: '/images/avatars/official.png'
      },
      rules: [
        '每天6:30前完成打卡',
        '打卡需上传早起照片作为凭证',
        '连续打卡21天视为挑战成功',
        '中途断签一次，挑战失败'
      ],
      rewards: [
        '完成挑战获得"早起达人"徽章',
        '获得100积分奖励',
        '有机会获得精美实物奖品'
      ]
    };
    
    this.setData({ challenge: mockChallenge });
  },

  /**
   * 加载参与者
   */
  loadParticipants(id: string) {
    // 模拟加载参与者数据
    const mockParticipants = [
      {
        id: '102',
        name: '张明',
        avatar: '/images/avatars/avatar2.png',
        progress: 85,
        rank: 1
      },
      {
        id: '103',
        name: '王丽',
        avatar: '/images/avatars/avatar3.png',
        progress: 80,
        rank: 2
      },
      {
        id: '104',
        name: '赵强',
        avatar: '/images/avatars/avatar4.png',
        progress: 75,
        rank: 3
      },
      {
        id: '105',
        name: '陈静',
        avatar: '/images/avatars/avatar5.png',
        progress: 70,
        rank: 4
      },
      {
        id: '106',
        name: '李华',
        avatar: '/images/avatars/avatar6.png',
        progress: 65,
        rank: 5
      }
    ];
    
    this.setData({ participants: mockParticipants });
  },

  /**
   * 加载动态
   */
  loadPosts(id: string) {
    // 模拟加载动态数据
    const mockPosts = [
      {
        id: '201',
        userId: '102',
        userName: '张明',
        userAvatar: '/images/avatars/avatar2.png',
        content: '今天是挑战第3天，6:00准时起床，感觉精神状态越来越好了！',
        images: ['/images/posts/morning1.jpg'],
        createdAt: '2023-10-03 06:15',
        likes: 42,
        comments: 8,
        isLiked: false
      },
      {
        id: '202',
        userId: '103',
        userName: '王丽',
        userAvatar: '/images/avatars/avatar3.png',
        content: '挑战第2天，今天5:50就起床了，看到了美丽的朝霞，心情超级好！',
        images: ['/images/posts/morning2.jpg'],
        createdAt: '2023-10-02 06:05',
        likes: 38,
        comments: 5,
        isLiked: true
      }
    ];
    
    this.setData({ posts: mockPosts });
  },

  /**
   * 切换标签
   */
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as 'intro' | 'rank' | 'posts';
    this.setData({ tabActive: tab });
  },

  /**
   * 参加挑战
   */
  joinChallenge() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '加入中'
    });
    
    // 模拟加入挑战
    setTimeout(() => {
      wx.hideLoading();
      
      this.setData({
        'challenge.isJoined': true,
        'challenge.participants': this.data.challenge.participants + 1,
        showJoinModal: false
      });
      
      wx.showToast({
        title: '加入成功',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 显示加入模态框
   */
  showJoinModal() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ showJoinModal: true });
  },

  /**
   * 隐藏加入模态框
   */
  hideJoinModal() {
    this.setData({ showJoinModal: false });
  },

  /**
   * 显示分享模态框
   */
  showShareModal() {
    this.setData({ showShareModal: true });
  },

  /**
   * 隐藏分享模态框
   */
  hideShareModal() {
    this.setData({ showShareModal: false });
  },

  /**
   * 查看用户资料
   */
  viewUserProfile(e: WechatMiniprogram.TouchEvent) {
    const userId = e.currentTarget.dataset.userId;
    
    wx.navigateTo({
      url: `/pages/profile/user/user?id=${userId}`
    });
  },

  /**
   * 点赞动态
   */
  likePost(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    const post = this.data.posts[index];
    
    // 更新点赞状态
    const newPosts = [...this.data.posts];
    newPosts[index] = {
      ...post,
      isLiked: !post.isLiked,
      likes: post.isLiked ? post.likes - 1 : post.likes + 1
    };
    
    this.setData({ posts: newPosts });
  },

  /**
   * 评论动态
   */
  commentPost(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const postId = e.currentTarget.dataset.postId;
    
    wx.navigateTo({
      url: `/packageCommunity/pages/post/post?id=${postId}`
    });
  },

  /**
   * 分享动态
   */
  sharePost(e: WechatMiniprogram.TouchEvent) {
    const postId = e.currentTarget.dataset.postId;
    
    this.showShareModal();
  },

  /**
   * 创建动态
   */
  createPost() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.challenge.isJoined) {
      wx.showToast({
        title: '请先加入挑战',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/packageCommunity/pages/post/create/create?challengeId=${this.data.challenge.id}`
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { challenge } = this.data;
    
    return {
      title: `邀请你一起参加"${challenge.title}"`,
      path: `/packageCommunity/pages/challenge/challenge?id=${challenge.id}`,
      imageUrl: challenge.image
    };
  },
  
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    if (this.data.challenge.id) {
      this.loadData(this.data.challenge.id);
      wx.stopPullDownRefresh();
    }
  }
}); 
