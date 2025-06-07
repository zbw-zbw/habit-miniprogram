/**
 * pages/community/challenges/challenges.ts
 * 社区挑战页面
 */
import { communityAPI } from '../../../services/api';
import { getFullImageUrl } from '../../../utils/image';
import { IAppOption } from '../../../app';

// 本地接口定义，用于处理挑战数据
interface IChallengeItem {
  id: string;
  _id?: string;
  title: string;
  name?: string;
  image?: string;
  coverImage?: string;
  description?: string;
  participants: number;
  participantsCount: number;
  isJoined: boolean;
  isParticipating?: boolean;
  isCreator?: boolean; // 添加创建者标识
  progress?: number | { completionRate: number };
  progressValue?: number; // 添加预处理的进度值
  totalDays?: number;
  durationDays?: number; // 添加挑战总天数字段
  remainingDays?: number; // 添加挑战剩余天数字段
  requirements?: {
    targetCount?: number;
  };
  tags?: string[];
}

// 声明全局类型，因为typings中的类型是全局定义的
declare global {
  interface IChallenge {
    id: string;
    _id?: string; // 添加_id字段，兼容后端返回
    title: string;
    image: string;
    participants: number;
    participantsCount: number; // 兼容不同的API返回格式
    isJoined: boolean;
    isParticipating?: boolean; // 添加isParticipating字段，兼容后端返回
  }
}

interface IPageData {
  loading: boolean;
  hasMore: boolean;
  activeTab: string; // all, joined, created, popular, new
  tabIndex: number; // 添加tabIndex属性，用于tab-bar组件
  challenges: IChallengeItem[];
  page: number;
  limit: number;
  searchKeyword: string;
  hasLogin: boolean;
}

interface IPageMethods {
  loadChallenges(isRefresh?: boolean): void;
  switchTab(e: any): void;
  onTabChange(e: any): void; // 添加onTabChange方法，用于tab-bar组件
  viewChallengeDetail(e: any): void;
  toggleJoinChallenge(e: any): void;
  inputSearch(e: any): void;
  doSearch(): void;
  createChallenge(): void;
  viewTag(e: any): void;
  refreshData(): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    hasMore: true,
    activeTab: 'all', // all, joined, created, popular, new
    tabIndex: 0, // 添加tabIndex属性，默认选中第一个标签
    challenges: [],
    page: 1,
    limit: 10,
    searchKeyword: '',
    hasLogin: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: Record<string, string>) {
    // 如果有标签参数，设置初始标签
    if (
      options.tab &&
      ['all', 'joined', 'created', 'popular', 'new'].includes(options.tab)
    ) {
      const tabMapping = {
        'all': 0,
        'joined': 1,
        'created': 2,
        'popular': 3,
        'new': 4
      };
      
      this.setData({ 
        activeTab: options.tab,
        tabIndex: tabMapping[options.tab as keyof typeof tabMapping]
      });
    }

    // 如果有标签参数，直接搜索该标签
    if (options.tag) {
      this.setData({
        searchKeyword: options.tag,
      });
    }

    // 加载挑战数据
    this.loadChallenges(true);
  },

  /**
   * 加载挑战数据
   */
  loadChallenges(isRefresh = false) {
    const { page, limit, activeTab, searchKeyword } = this.data;

    // 如果是刷新，重置页码
    const currentPage = isRefresh ? 1 : page;

    // 设置加载状态
    this.setData({
      loading: this.data.challenges.length === 0,
      loadingMore: this.data.challenges.length > 0,
    });

    // 构建查询参数
    const params: Record<string, any> = {
      page: currentPage,
      limit,
    };

    // 根据activeTab设置不同的查询参数
    switch (activeTab) {
      case 'all':
        // 查询所有挑战
        break;
      case 'joined':
        // 已参加的挑战
        params.joined = true;
        break;
      case 'created':
        // 我创建的挑战
        params.created = true;
        break;
      case 'popular':
        // 热门挑战
        params.sort = 'popular';
        break;
      case 'new':
        // 最新挑战
        params.sort = 'new';
        break;
    }

    // 如果有搜索关键词，添加到查询参数
    if (searchKeyword) {
      params.keyword = searchKeyword;
    }

    // 调用API获取挑战列表
    communityAPI
      .getChallenges(params)
      .then((result) => {
        // 获取挑战列表
        const challenges = result.challenges || [];

        // 处理挑战数据
        const processedChallenges = challenges.map((challenge: any) => {
          // 获取当前用户ID
          const app = getApp<IAppOption>();
          const currentUserId = app?.globalData?.userInfo?.id;

          // 检查是否是创建者
          const isCreator =
            challenge.creator &&
            (challenge.creator._id === currentUserId ||
              challenge.creator.id === currentUserId);

          // 处理图片URL
          if (challenge.image) {
            challenge.image = getFullImageUrl(challenge.image);
          }
          if (challenge.coverImage) {
            challenge.coverImage = getFullImageUrl(challenge.coverImage);
          }

          // 确保参与人数至少为1（如果有创建者）
          const participantsCount =
            challenge.participantsCount || challenge.participants || 0;
          const adjustedParticipantsCount =
            isCreator && participantsCount === 0 ? 1 : participantsCount;

          return {
            id: challenge.id || challenge._id,
            name: challenge.name || challenge.title,
            description: challenge.description,
            image:
              challenge.image ||
              challenge.coverImage ||
              '/assets/images/challenge.png',
            coverImage:
              challenge.coverImage ||
              challenge.image ||
              '/assets/images/challenge.png',
            participantsCount: challenge.participantCount,
            participants: adjustedParticipantsCount,
            isJoined: challenge.isJoined || challenge.isParticipating || false,
            isCreator: isCreator, // 添加创建者标识
            startDate: challenge.startDate,
            endDate: challenge.endDate,
            status: challenge.status || 'active',
            tags: challenge.tags || [],
            durationDays: challenge.durationDays,
            remainingDays: challenge.remainingDays,
          };
        });

        // 更新数据
        this.setData({
          challenges: isRefresh
            ? processedChallenges
            : [...this.data.challenges, ...processedChallenges],
          page: currentPage + 1,
          hasMore: challenges.length === limit,
          loading: false,
          loadingMore: false,
        });
      })
      .catch((error) => {
        this.setData({
          loading: false,
          loadingMore: false,
        });

        wx.showToast({
          title: '获取挑战列表失败',
          icon: 'none',
        });
      });
  },

  /**
   * 切换标签
   */
  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab as string;

    if (tab !== this.data.activeTab) {
      const tabMapping = {
        'all': 0,
        'joined': 1,
        'created': 2,
        'popular': 3,
        'new': 4
      };
      
      this.setData({
        activeTab: tab,
        tabIndex: tabMapping[tab as keyof typeof tabMapping],
        page: 1,
        challenges: [],
        hasMore: true,
      });

      // 重新加载数据
      this.loadChallenges(true);
    }
  },

  /**
   * 处理tab-bar组件的标签切换事件
   */
  onTabChange(e: any) {
    const index = e.detail.index;
    const tabMapping = ['all', 'joined', 'created', 'new'];
    const tab = tabMapping[index];
    
    if (tab !== this.data.activeTab) {
      this.setData({
        activeTab: tab,
        tabIndex: index,
        page: 1,
        challenges: [],
        hasMore: true,
      });

      // 重新加载数据
      this.loadChallenges(true);
    }
  },

  /**
   * 查看挑战详情
   */
  viewChallengeDetail(e: any) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({
      url: `/pages/community/challenges/detail/detail?id=${id}`,
    });
  },

  /**
   * 参加/退出挑战
   */
  toggleJoinChallenge(e: any) {
    const id = e.currentTarget.dataset.id as string;
    const index = e.currentTarget.dataset.index as number;

    // 防止事件冒泡
    // 在微信小程序中，TouchEvent没有stopPropagation方法，使用catchtap替代

    // 获取当前挑战
    const challenges = this.data.challenges;
    const challenge = challenges[index];

    // 如果是创建者，则解散挑战
    if (challenge.isCreator) {
      // 显示确认对话框
      wx.showModal({
        title: '解散挑战',
        content: '确定要解散该挑战吗？解散后无法恢复，所有参与者将自动退出。',
        confirmText: '确定解散',
        confirmColor: '#F56C6C',
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({
              title: '处理中...',
            });

            // 调用API解散挑战
            communityAPI
              .dismissChallenge(id)
              .then(() => {
                // 从列表中移除该挑战
                challenges.splice(index, 1);
                this.setData({ challenges });

                wx.showToast({
                  title: '挑战已解散',
                  icon: 'success',
                });
              })
              .catch((error) => {
                wx.showToast({
                  title: '解散挑战失败',
                  icon: 'none',
                });
              })
              .finally(() => {
                wx.hideLoading();
              });
          }
        },
      });
      return;
    }

    const isJoined = challenge.isJoined || challenge.isParticipating;

    // 显示加载中
    wx.showLoading({
      title: isJoined ? '退出中...' : '参加中...',
    });

    // 调用API
    const apiCall = isJoined
      ? communityAPI.leaveChallenge(id)
      : communityAPI.joinChallenge(id);

    apiCall
      .then(() => {
        // 更新本地数据
        challenges[index].isJoined = !isJoined;
        challenges[index].isParticipating = !isJoined;
        challenges[index].participantsCount = isJoined
          ? Math.max(1, challenges[index].participantsCount - 1) // 确保至少有1人（创建者）
          : challenges[index].participantsCount + 1;
        challenges[index].participants = challenges[index].participantsCount;

        // 如果是退出挑战，重置进度
        if (isJoined) {
          challenges[index].progress = 0;
          challenges[index].progressValue = 0;
        }

        this.setData({ challenges });

        // 显示成功提示
        wx.showToast({
          title: isJoined ? '已退出挑战' : '已参加挑战',
          icon: 'success',
        });
      })
      .catch((error) => {
        // 显示错误提示
        wx.showToast({
          title: '操作失败',
          icon: 'none',
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 输入搜索关键词
   */
  inputSearch(e: any) {
    this.setData({
      searchKeyword: e.detail.value,
    });
  },

  /**
   * 执行搜索
   */
  doSearch() {
    // 重新加载数据
    this.loadChallenges(true);
  },

  /**
   * 创建新挑战
   */
  createChallenge() {
    wx.navigateTo({
      url: '/pages/community/challenges/create/create',
    });
  },

  /**
   * 刷新数据
   */
  refreshData() {
    this.loadChallenges(true);
  },

  /**
   * 查看标签
   */
  viewTag(e: any) {
    const tag = e.currentTarget.dataset.tag as string;

    // 防止事件冒泡
    // 在微信小程序中，TouchEvent没有stopPropagation方法，使用catchtap替代

    wx.navigateTo({
      url: `/pages/community/tag/tag?name=${tag}`,
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadChallenges(true);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadChallenges();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '一起来参加习惯挑战，培养好习惯！',
      path: '/pages/community/challenges/challenges',
    };
  },
});
