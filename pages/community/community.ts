/**
 * 社区页面
 */
import { communityAPI } from '../../services/api';
import { useAuth } from '../../utils/use-auth';
import { login as authLogin } from '../../utils/auth';
import { formatRelativeTime } from '../../utils/util';

// 后端返回的Post类型
interface IPostResponse {
  _id: string;
  user: {
    _id: string;
    username?: string;
    nickname?: string;
    avatar?: string;
  };
  content: string;
  media?: Array<{
    type: string;
    url: string;
    thumbnail?: string;
  }>;
  tags?: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  habit?: {
    name: string;
    category?: string;
    icon?: string;
    color?: string;
  };
}

interface IPageData {
  activeTab: 'groups' | 'challenges' | 'posts' | 'friends';
  tabIndex: number;
  loading: boolean;
  hasLogin: boolean;
  userInfo: IUserInfo | null;
  posts: IPost[];
  challenges: IChallenge[];
  groups: IGroup[];
  friends: IFriend[];
  hasMore: boolean;
  showPostModal: boolean;
  newPost: {
    content: string;
    images: string[];
    tags: string[];
    habitId?: string;
  };
  page: number;
  pageSize: number;
  isInitialized: boolean;
}

interface IPageMethods {
  loadData(): void;
  switchTab(e: WechatMiniprogram.TouchEvent): void;
  onTabChange(e: any): void;
  loadPosts(): Promise<{ posts: IPost[]; hasMore: boolean }>;
  loadChallenges(): Promise<IChallenge[]>;
  loadGroups(): Promise<IGroup[]>;
  loadFriends(): Promise<IFriend[]>;
  refreshData(): void;
  loadMorePosts(): void;
  viewPostDetail(e: WechatMiniprogram.TouchEvent): void;
  viewChallengeDetail(e: WechatMiniprogram.TouchEvent): void;
  viewUserProfile(e: WechatMiniprogram.TouchEvent): void;
  likePost(e: WechatMiniprogram.TouchEvent): void;
  commentPost(e: WechatMiniprogram.TouchEvent): void;
  sharePost(e: WechatMiniprogram.TouchEvent): void;
  joinChallenge(e: WechatMiniprogram.TouchEvent): void;
  viewAllChallenges(e: WechatMiniprogram.TouchEvent): void;
  viewAllGroups(): void;
  showCreatePost(): void;
  hideCreatePost(): void;
  chooseImage(): void;
  removeImage(e: WechatMiniprogram.TouchEvent): void;
  addTag(e: WechatMiniprogram.TouchEvent): void;
  removeTag(e: WechatMiniprogram.TouchEvent): void;
  inputContent(e: WechatMiniprogram.Input): void;
  submitPost(): void;
  uploadImages(images: string[]): Promise<string[]>;
  navigateToNotifications(): void;
  navigateToSearch(): void;
  createGroup(): void;
  addFriend(): void;
  chooseHabit(): void;
  login(): void;
  viewAllPosts(): void;
  viewAllFriends(): void;
  createChallenge(): void;
  viewGroupDetail(e: WechatMiniprogram.TouchEvent): void;
  sendMessage(e: WechatMiniprogram.TouchEvent): void;
}

/**
 * 好友接口
 */
interface IFriend {
  _id: string;
  username: string;
  nickname: string;
  avatar: string;
  status?: string;
  followedAt?: string;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'posts',
    tabIndex: 0,
    loading: true,
    hasLogin: false,
    userInfo: null,
    posts: [],
    challenges: [],
    groups: [],
    friends: [],
    hasMore: true,
    showPostModal: false,
    newPost: {
      content: '',
      images: [],
      tags: [],
    },
    page: 1,
    pageSize: 10,
    isInitialized: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 使用useAuth工具获取全局登录状态
    useAuth(this);

    // 标记页面已经初始化
    this.data.isInitialized = true;

    // 只有登录后才加载数据
    if (this.data.hasLogin) {
      this.loadData();
    } else {
      this.setData({
        loading: false,
      });
    }
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
      hasLogin: isLoggedIn,
    });

    // 只有在以下情况才刷新数据：
    // 1. 登录状态发生变化（从未登录到已登录）
    // 2. 已登录状态下，不是首次加载页面（避免与onLoad重复加载）
    if (
      isLoggedIn &&
      (!this.data.isInitialized || previousLoginState !== isLoggedIn)
    ) {
      this.refreshData();
    } else if (!isLoggedIn) {
      this.setData({
        loading: false,
        posts: [],
        challenges: [],
        groups: [],
        friends: [],
      });
    }

    // 重置初始化标记，以便从其他页面返回时能正确刷新
    if (this.data.isInitialized) {
      this.data.isInitialized = false;
    }
  },

  /**
   * 加载数据
   */
  loadData() {
    // 检查登录状态
    if (!this.data.hasLogin) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    // 根据当前选中的标签加载对应数据
    const { activeTab } = this.data;
    let dataPromise;

    switch (activeTab) {
      case 'groups':
        dataPromise = this.loadGroups();
        break;
      case 'challenges':
        dataPromise = this.loadChallenges();
        break;
      case 'posts':
        dataPromise = this.loadPosts();
        break;
      case 'friends':
        dataPromise = this.loadFriends();
        break;
      default:
        dataPromise = Promise.resolve();
    }

    dataPromise
      .catch((error) => {
        console.error(`加载${activeTab}数据失败:`, error);
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  /**
   * 切换标签
   */
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as
      | 'groups'
      | 'challenges'
      | 'posts'
      | 'friends';

    // 如果点击的是当前标签，不做任何操作
    if (tab === this.data.activeTab) {
      return;
    }

    this.setData(
      {
        activeTab: tab,
        page: 1,
      },
      () => {
        // 重新加载数据
        this.loadData();
      }
    );
  },

  /**
   * 加载社区动态
   */
  loadPosts() {
    const { page, pageSize } = this.data;

    return communityAPI
      .getPosts({
        page,
        pageSize,
      })
      .then((result) => {
        // 处理返回的帖子数据，添加格式化的日期和用户信息
        const formattedPosts = (result.posts as unknown as IPostResponse[]).map(
          (post) => {
            // 构建符合IPost接口的数据对象
            return {
              id: post._id,
              userId: post.user?._id || '',
              userAvatar:
                post.user?.avatar || '/assets/images/default-avatar.png',
              userName:
                post.user?.nickname || post.user?.username || '匿名用户',
              content: post.content || '',
              images: post.media?.map((m) => m.url) || [],
              tags: post.tags || [],
              likes: post.likeCount || 0,
              comments: post.commentCount || 0,
              isLiked: post.isLiked || false,
              createdAt: formatRelativeTime(post.createdAt || new Date()),
              habitName: post.habit?.name || '',
            } as IPost;
          }
        );

        this.setData({
          posts:
            page === 1
              ? formattedPosts
              : [...this.data.posts, ...formattedPosts],
          hasMore: result.hasMore,
        });
        return result;
      })
      .catch((error) => {
        console.error('加载社区动态失败:', error);
        wx.showToast({
          title: '加载动态失败',
          icon: 'none',
        });
        return Promise.reject(error);
      });
  },

  /**
   * 加载热门挑战
   */
  loadChallenges() {
    return communityAPI
      .getChallenges({ limit: 3, status: 'all' })
      .then((response: any) => {
        console.log('社区页面获取到挑战数据:', response);

        // 处理API返回的不同格式
        let challenges: IChallenge[] = [];

        if (response && typeof response === 'object') {
          // 处理标准格式: { challenges: [], pagination: {} }
          if (response.challenges && Array.isArray(response.challenges)) {
            challenges = response.challenges;
          }
          // 处理包含data的响应: { data: { challenges: [] } }
          else if (
            response.data &&
            typeof response.data === 'object' &&
            response.data.challenges &&
            Array.isArray(response.data.challenges)
          ) {
            challenges = response.data.challenges;
          }
        }
        // 如果直接返回数组
        else if (Array.isArray(response)) {
          challenges = response;
        }

        // 处理挑战数据，确保字段一致性
        const processedChallenges = challenges.map((challenge) => {
          return {
            ...challenge,
            id: challenge.id || challenge._id,
            name: challenge.name || challenge.title,
            title: challenge.title || challenge.name,
            image: challenge.coverImage || challenge.image,
            coverImage: challenge.coverImage || challenge.image,
            participants:
              challenge.participants || challenge.participantsCount || 0,
            participantsCount:
              challenge.participantsCount || challenge.participants || 0,
            // 确保isParticipating字段存在
            isParticipating:
              challenge.isParticipating || challenge.isJoined || false,
          };
        });

        console.log('社区页面处理后的挑战数据:', processedChallenges);
        this.setData({ challenges: processedChallenges });
        return processedChallenges;
      })
      .catch((error) => {
        console.error('加载热门挑战失败:', error);
        this.setData({ challenges: [] });
        return Promise.reject(error);
      });
  },

  /**
   * 加载小组列表
   */
  loadGroups() {
    return communityAPI
      .getGroups()
      .then((response: any) => {
        // 处理API返回的不同格式
        let groups: IGroup[] = [];
        if (Array.isArray(response)) {
          // 直接返回数组
          groups = response;
        } else if (response && typeof response === 'object') {
          // 处理包含data的响应
          if (
            'data' in response &&
            response.data &&
            typeof response.data === 'object'
          ) {
            if (
              'groups' in response.data &&
              Array.isArray(response.data.groups)
            ) {
              groups = response.data.groups;
            }
          } else if ('groups' in response && Array.isArray(response.groups)) {
            // 直接包含groups的对象
            groups = response.groups;
          }
        }

        // 确保每个小组对象都有id字段
        const processedGroups = groups.map(group => {
          // 如果没有id字段但有_id字段，则使用_id作为id
          if (!group.id && group._id) {
            return {
              ...group,
              id: group._id
            };
          }
          return group;
        });

        console.log('处理后的小组数据:', processedGroups);
        this.setData({ groups: processedGroups });
        return processedGroups;
      })
      .catch((error) => {
        console.error('加载小组列表失败:', error);
        this.setData({ groups: [] });
        return Promise.reject(error);
      });
  },

  /**
   * 加载好友列表
   */
  loadFriends() {
    return communityAPI
      .getFriends()
      .then((response: any) => {
        console.log('好友列表API返回数据:', response);
        
        // 处理API返回的数据
        let friends: IFriend[] = [];
        
        if (response && response.data && Array.isArray(response.data)) {
          // 处理 {success: true, data: [...]} 格式
          friends = response.data.map((friend: any) => ({
            _id: friend._id,
            username: friend.username || '',
            nickname: friend.nickname || friend.username || '用户',
            avatar: friend.avatar || '/assets/images/default-avatar.png',
            status: friend.status || '',
            followedAt: friend.followedAt
          }));
        } else if (Array.isArray(response)) {
          // 处理直接返回数组的格式
          friends = response.map((friend: any) => ({
            _id: friend._id,
            username: friend.username || '',
            nickname: friend.nickname || friend.username || '用户',
            avatar: friend.avatar || '/assets/images/default-avatar.png',
            status: friend.status || '',
            followedAt: friend.followedAt
          }));
        }
        
        console.log('处理后的好友数据:', friends);
        this.setData({ friends });
        return friends;
      })
      .catch((error) => {
        console.error('加载好友列表失败:', error);
        return Promise.reject(error);
      });
  },

  /**
   * 刷新数据
   */
  refreshData() {
    // 检查登录状态
    if (!this.data.hasLogin) {
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
      return;
    }

    // 重置页码
    this.setData({
      page: 1,
      hasMore: true,
    });

    // 根据当前标签加载不同数据
    const { activeTab } = this.data;
    wx.showNavigationBarLoading();

    // 根据当前标签加载对应数据
    let dataPromise;

    switch (activeTab) {
      case 'groups':
        dataPromise = this.loadGroups();
        break;
      case 'challenges':
        dataPromise = this.loadChallenges();
        break;
      case 'posts':
        dataPromise = this.loadPosts();
        break;
      case 'friends':
        dataPromise = this.loadFriends();
        break;
      default:
        dataPromise = Promise.resolve();
    }

    dataPromise
      .catch((error) => {
        console.error(`刷新${activeTab}数据失败:`, error);
      })
      .finally(() => {
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
      });
  },

  /**
   * 加载更多动态
   */
  loadMorePosts() {
    if (!this.data.hasMore || this.data.loading) {
      return;
    }

    this.setData({
      loading: true,
      page: this.data.page + 1,
    });

    this.loadPosts().finally(() => {
      this.setData({ loading: false });
    });
  },

  /**
   * 查看动态详情
   */
  viewPostDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.detail?.id || e.currentTarget.dataset.id;

    if (!id) {
      console.error('缺少动态ID');
      return;
    }

    // 跳转到动态详情页
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${id}`,
    });
  },

  /**
   * 查看挑战详情
   */
  viewChallengeDetail(e: WechatMiniprogram.TouchEvent) {
    const challengeId = e.currentTarget.dataset.challengeId;

    if (!challengeId) {
      console.error('缺少挑战ID');
      return;
    }

    console.log('跳转到挑战详情页，ID:', challengeId);

    wx.navigateTo({
      url: `/pages/community/challenges/detail/detail?id=${challengeId}`,
    });
  },

  /**
   * 查看用户资料
   */
  viewUserProfile(e: WechatMiniprogram.TouchEvent) {
    const userId = e.detail?.userId || e.currentTarget.dataset.id;

    if (!userId) {
      console.error('缺少用户ID');
      return;
    }

    console.log('查看用户资料，ID:', userId);
    
    wx.navigateTo({
      url: `/pages/community/user-profile/user-profile?id=${userId}`,
    });
  },

  /**
   * 点赞动态
   */
  likePost(e: WechatMiniprogram.TouchEvent) {
    // 如果未登录，跳转到登录页
    if (!this.data.hasLogin) {
      return this.login();
    }

    const { id, index } = e.detail || e.currentTarget.dataset;

    if (!id) {
      console.error('缺少动态ID');
      return;
    }

    const post = this.data.posts[index];

    // 乐观更新UI
    post.isLiked = !post.isLiked;
    post.likes = post.isLiked ? post.likes + 1 : Math.max(0, post.likes - 1);

    // 更新指定索引的动态数据
    this.setData({
      [`posts[${index}].isLiked`]: post.isLiked,
      [`posts[${index}].likes`]: post.likes,
    });

    // 调用API
    const apiCall = post.isLiked
      ? communityAPI.likePost(id)
      : communityAPI.unlikePost(id);

    apiCall.catch((error) => {
      console.error('点赞操作失败:', error);

      // 发生错误时回滚UI更新
      post.isLiked = !post.isLiked;
      post.likes = post.isLiked ? post.likes + 1 : Math.max(0, post.likes - 1);

      this.setData({
        [`posts[${index}].isLiked`]: post.isLiked,
        [`posts[${index}].likes`]: post.likes,
      });

      wx.showToast({
        title: '操作失败',
        icon: 'none',
      });
    });
  },

  /**
   * 评论动态
   */
  commentPost(e: WechatMiniprogram.TouchEvent) {
    // 如果未登录，跳转到登录页
    if (!this.data.hasLogin) {
      return this.login();
    }

    const id = e.detail?.id || e.currentTarget.dataset.id;

    if (!id) {
      console.error('缺少动态ID');
      return;
    }

    // 跳转到动态详情页并自动聚焦评论框
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${id}&focus=comment`,
    });
  },

  /**
   * 分享动态
   */
  sharePost(e: WechatMiniprogram.TouchEvent) {
    const id = e.detail?.id || e.currentTarget.dataset.id;

    if (!id) {
      console.error('缺少动态ID');
      return;
    }

    // 调用系统分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
  },

  /**
   * 参加挑战
   */
  joinChallenge(e: WechatMiniprogram.TouchEvent) {
    // 在微信小程序中，使用catchtap属性代替stopPropagation
    // 已在wxml中使用catchtap处理

    // 如果未登录，跳转到登录页
    if (!this.data.hasLogin) {
      return this.login();
    }

    const challengeId = e.currentTarget.dataset.challengeId;
    const index = e.currentTarget.dataset.index;
    const challenge = this.data.challenges[index];

    if (!challenge) return;

    // 检查是否已经参与
    if (challenge.isJoined || challenge.isParticipating) {
      wx.showToast({
        title: '已参与此挑战',
        icon: 'none',
      });
      return;
    }

    wx.showLoading({
      title: '处理中',
    });

    communityAPI
      .joinChallenge(challengeId)
      .then(() => {
        // 更新本地状态
        this.setData({
          [`challenges[${index}].isJoined`]: true,
          [`challenges[${index}].isParticipating`]: true,
          [`challenges[${index}].participants`]: challenge.participants + 1,
          [`challenges[${index}].participantsCount`]:
            (challenge.participantsCount || challenge.participants || 0) + 1,
        });
        wx.showToast({
          title: '已成功参加',
          icon: 'success',
        });
      })
      .catch((error) => {
        console.error('参加挑战失败:', error);
        wx.showToast({
          title: '参加失败',
          icon: 'none',
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 显示创建动态模态框
   */
  showCreatePost() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }

    this.setData({
      showPostModal: true,
      newPost: {
        content: '',
        images: [],
        tags: [],
      },
    });
  },

  /**
   * 隐藏创建动态模态框
   */
  hideCreatePost() {
    this.setData({
      showPostModal: false,
    });
  },

  /**
   * 选择图片
   */
  chooseImage() {
    const { images } = this.data.newPost;
    const count = 9 - images.length;

    if (count <= 0) {
      wx.showToast({
        title: '最多选择9张图片',
        icon: 'none',
      });
      return;
    }

    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 更新图片列表
        this.setData({
          'newPost.images': [...images, ...res.tempFilePaths],
        });
      },
    });
  },

  /**
   * 删除图片
   */
  removeImage(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset;
    const images = [...this.data.newPost.images];

    images.splice(index, 1);

    this.setData({
      'newPost.images': images,
    });
  },

  /**
   * 添加标签
   */
  addTag(e: WechatMiniprogram.TouchEvent) {
    const { tag } = e.currentTarget.dataset;
    const tags = [...this.data.newPost.tags];

    if (tags.includes(tag)) {
      return;
    }

    if (tags.length >= 5) {
      wx.showToast({
        title: '最多添加5个标签',
        icon: 'none',
      });
      return;
    }

    tags.push(tag);

    this.setData({
      'newPost.tags': tags,
    });
  },

  /**
   * 删除标签
   */
  removeTag(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset;
    const tags = [...this.data.newPost.tags];

    tags.splice(index, 1);

    this.setData({
      'newPost.tags': tags,
    });
  },

  /**
   * 输入内容
   */
  inputContent(e: WechatMiniprogram.Input) {
    this.setData({
      'newPost.content': e.detail.value,
    });
  },

  /**
   * 提交动态
   */
  submitPost() {
    const { content, images, tags, habitId } = this.data.newPost;

    if (!content.trim() && images.length === 0) {
      wx.showToast({
        title: '请输入内容或添加图片',
        icon: 'none',
      });
      return;
    }

    wx.showLoading({
      title: '发布中',
    });

    // 如果有图片，先上传图片
    const uploadImages =
      images.length > 0 ? this.uploadImages(images) : Promise.resolve([]);

    uploadImages
      .then((imageUrls: string[]) => {
        // 创建动态
        return communityAPI.createPost({
          content: content.trim(),
          images: imageUrls,
          tags,
          habitId,
        });
      })
      .then((post: IPost) => {
        wx.hideLoading();
        wx.showToast({
          title: '发布成功',
          icon: 'success',
        });

        // 关闭模态框
        this.hideCreatePost();

        // 重置页码，确保获取最新数据
        this.setData({
          page: 1,
          posts: [],
        });

        // 刷新数据并滚动到顶部
        this.loadPosts().then(() => {
          // 滚动到顶部
          wx.pageScrollTo({
            scrollTop: 0,
            duration: 300,
          });
        });
      })
      .catch((error: Error) => {
        console.error('发布动态失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '发布失败',
          icon: 'none',
        });
      });
  },

  /**
   * 上传图片
   */
  uploadImages(images: string[]): Promise<string[]> {
    return Promise.all(
      images.map((image) =>
        communityAPI.uploadImage(image).then((result) => result.url)
      )
    );
  },

  /**
   * 导航到通知页面
   */
  navigateToNotifications() {
    wx.navigateTo({
      url: '/pages/community/notifications/notifications',
    });
  },

  /**
   * 导航到搜索页面
   */
  navigateToSearch() {
    wx.navigateTo({
      url: '/pages/community/search/search',
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.refreshData();
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    this.loadMorePosts();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(res: any) {
    if (res.from === 'button') {
      const { postId, index } = res.target.dataset;
      const post = this.data.posts[index];

      if (post) {
        return {
          title: `${post.userName}的习惯打卡分享`,
          path: `/pages/community/post-detail/post-detail?id=${postId}`,
          imageUrl:
            post.images && post.images.length > 0
              ? post.images[0]
              : '/images/share-default.png',
        };
      }
    }

    return {
      title: '习惯打卡社区',
      path: '/pages/community/community',
    };
  },

  /**
   * 查看所有挑战
   */
  viewAllChallenges(e: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({
      url: '/pages/community/challenges/challenges',
    });
  },

  /**
   * 查看所有小组
   */
  viewAllGroups() {
    wx.navigateTo({
      url: '/pages/community/groups/groups',
    });
  },

  /**
   * 创建小组
   */
  createGroup() {
    // 检查是否已登录
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/community/groups/create/create',
    });
  },

  /**
   * 登录
   */
  login() {
    // 使用公共登录方法
    authLogin((success: boolean) => {
      if (success) {
        // 登录成功后，获取最新的用户信息
        const app = getApp<IAppOption>();
        this.setData({
          userInfo: app.globalData.userInfo,
          hasLogin: true,
        });

        // 登录成功后重新加载数据
        this.loadData();
      }
    });
  },

  /**
   * 添加好友
   */
  addFriend() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/community/friends/add-friend',
    });
  },

  /**
   * 选择习惯
   */
  chooseHabit() {
    wx.navigateTo({
      url: '/pages/habits/select/select',
      events: {
        // 监听选择习惯页面返回的数据
        selectHabit: (habit: IHabit) => {
          console.log('选择的习惯:', habit);
          if (habit) {
            this.setData({
              'newPost.habitId': habit.id,
              'newPost.tags': [...this.data.newPost.tags, habit.name],
            });
          }
        },
      },
    });
  },

  /**
   * 查看所有动态
   */
  viewAllPosts() {
    console.log('查看所有动态');
    wx.navigateTo({
      url: '/pages/community/posts/posts',
    });
  },

  /**
   * 查看所有好友
   */
  viewAllFriends() {
    wx.navigateTo({
      url: '/pages/community/friends/friends',
    });
  },

  /**
   * 切换标签页
   */
  onTabChange(e: any) {
    const tabIndex = e.detail.index;
    let activeTab: 'groups' | 'challenges' | 'posts' | 'friends';

    switch (tabIndex) {
      case 0:
        activeTab = 'posts';
        break;
      case 1:
        activeTab = 'challenges';
        break;
      case 2:
        activeTab = 'groups';
        break;
      case 3:
        activeTab = 'friends';
        break;
      default:
        activeTab = 'posts';
    }

    this.setData({
      tabIndex,
      activeTab,
      page: 1,
    });

    // 根据标签页加载不同的数据
    this.loadData();
  },

  /**
   * 创建挑战
   */
  createChallenge() {
    if (!this.data.hasLogin) {
      this.login();
      return;
    }

    wx.navigateTo({
      url: '/pages/community/challenges/create/create',
    });
  },

  /**
   * 查看小组详情
   */
  viewGroupDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    console.log('viewGroupDetail被调用，dataset:', e.currentTarget.dataset);
    
    // 尝试从index获取小组数据
    let groupData = null;
    if (typeof index === 'number' && this.data.groups[index]) {
      groupData = this.data.groups[index];
      console.log('通过index找到小组数据:', groupData);
    } else {
      // 尝试通过id在groups数组中查找
      groupData = this.data.groups.find(group => group.id === id);
      console.log('通过id查找小组数据:', groupData);
    }
    
    if (!id) {
      console.error('缺少小组ID，dataset:', e.currentTarget.dataset);
      console.log('当前小组列表数据:', this.data.groups);
      wx.showToast({
        title: '无法查看小组详情',
        icon: 'none'
      });
      return;
    }
    
    console.log('跳转到小组详情页，ID:', id);
    
    wx.navigateTo({
      url: `/pages/community/groups/detail/detail?id=${id}`,
      fail: (err) => {
        console.error('跳转到小组详情页失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 发送消息给好友
   */
  sendMessage(e: WechatMiniprogram.TouchEvent) {
    // 使用catchtap阻止事件冒泡，不需要显式调用stopPropagation
    
    const { id } = e.currentTarget.dataset;
    console.log('发送消息给用户:', id);
    
    if (!id) {
      console.error('缺少用户ID');
      return;
    }
    
    // 跳转到聊天页面
    wx.navigateTo({
      url: `/pages/message/chat/chat?userId=${id}`,
      fail: (err) => {
        console.error('跳转到聊天页面失败:', err);
        
        wx.showToast({
          title: '聊天功能暂未实现',
          icon: 'none'
        });
      }
    });
  },
});
