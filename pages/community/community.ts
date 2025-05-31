/**
 * 社区页面
 */
import { communityAPI } from '../../services/api';
import { useAuth } from '../../utils/use-auth';
import { login as authLogin } from '../../utils/auth';

interface IPageData {
  activeTab: 'groups' | 'challenges' | 'posts' | 'friends';
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
}

interface IPageMethods {
  loadData(): void;
  switchTab(e: WechatMiniprogram.TouchEvent): void;
  loadPosts(): Promise<{posts: IPost[], hasMore: boolean}>;
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
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'groups',
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
      tags: []
    },
    page: 1,
    pageSize: 10
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 使用useAuth工具获取全局登录状态
    useAuth(this);
    
    // 只有登录后才加载数据
    if (this.data.hasLogin) {
      this.loadData();
    } else {
      this.setData({ 
        loading: false 
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
    
    // 更新登录状态
    this.setData({
      userInfo: app.globalData.userInfo,
      hasLogin: isLoggedIn
    });
    
    // 只有登录后才刷新数据
    if (isLoggedIn) {
      // 每次显示页面时刷新数据
      this.refreshData();
    } else {
      this.setData({ 
        loading: false,
        posts: [],
        challenges: [],
        groups: [],
        friends: []
      });
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
      .catch(error => {
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
    const tab = e.currentTarget.dataset.tab as 'groups' | 'challenges' | 'posts' | 'friends';
    
    // 如果点击的是当前标签，不做任何操作
    if (tab === this.data.activeTab) {
      return;
    }
    
    this.setData({ 
      activeTab: tab,
      page: 1
    }, () => {
      // 重新加载数据
      this.loadData();
    });
  },

  /**
   * 加载社区动态
   */
  loadPosts() {
    const { page, pageSize } = this.data;
    
    return communityAPI.getPosts({
      page,
      pageSize
    })
      .then(result => {
        this.setData({
          posts: page === 1 ? result.posts : [...this.data.posts, ...result.posts],
          hasMore: result.hasMore
        });
        return result;
      })
      .catch(error => {
        console.error('加载社区动态失败:', error);
        wx.showToast({
          title: '加载动态失败',
          icon: 'none'
        });
        return Promise.reject(error);
      });
  },

  /**
   * 加载热门挑战
   */
  loadChallenges() {
    return communityAPI.getChallenges({ limit: 3 })
      .then((response: any) => {
        // 处理API返回的不同格式
        let challenges: IChallenge[] = [];
        if (Array.isArray(response)) {
          // 直接返回数组
          challenges = response;
        } else if (response && typeof response === 'object') {
          // 处理包含data的响应
          if ('data' in response && response.data && typeof response.data === 'object') {
            if ('challenges' in response.data && Array.isArray(response.data.challenges)) {
              challenges = response.data.challenges;
            }
          } else if ('challenges' in response && Array.isArray(response.challenges)) {
            // 直接包含challenges的对象
            challenges = response.challenges;
          }
        }
        
        console.log('处理后的挑战数据:', challenges);
        this.setData({ challenges });
        return challenges;
      })
      .catch(error => {
        console.error('加载热门挑战失败:', error);
        this.setData({ challenges: [] });
        return Promise.reject(error);
      });
  },

  /**
   * 加载小组列表
   */
  loadGroups() {
    return communityAPI.getGroups()
      .then((response: any) => {
        // 处理API返回的不同格式
        let groups: IGroup[] = [];
        if (Array.isArray(response)) {
          // 直接返回数组
          groups = response;
        } else if (response && typeof response === 'object') {
          // 处理包含data的响应
          if ('data' in response && response.data && typeof response.data === 'object') {
            if ('groups' in response.data && Array.isArray(response.data.groups)) {
              groups = response.data.groups;
            }
          } else if ('groups' in response && Array.isArray(response.groups)) {
            // 直接包含groups的对象
            groups = response.groups;
          }
        }
        
        console.log('处理后的小组数据:', groups);
        this.setData({ groups });
        return groups;
      })
      .catch(error => {
        console.error('加载小组列表失败:', error);
        this.setData({ groups: [] });
        return Promise.reject(error);
      });
  },

  /**
   * 加载好友列表
   */
  loadFriends() {
    return communityAPI.getFriends()
      .then(friends => {
        this.setData({ friends });
        return friends;
      })
      .catch(error => {
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
      hasMore: true
    });
    // 根据当前标签加载不同数据
    const { activeTab } = this.data;
    wx.showNavigationBarLoading();
    this.loadPosts()
      .then(() => {
        // 如果是关注标签，还需要刷新好友列表
        if (activeTab === 'friends') {
          return this.loadFriends();
        }
        // 明确返回类型，避免Promise<void>和Promise<IFriend[]>类型不匹配问题
        return Promise.resolve([]);
      })
      .catch((error) => {
        console.error('刷新数据失败:', error);
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
      page: this.data.page + 1
    });
    
    this.loadPosts()
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  /**
   * 查看动态详情
   */
  viewPostDetail(e: WechatMiniprogram.TouchEvent) {
    const { postId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${postId}`
    });
  },

  /**
   * 查看挑战详情
   */
  viewChallengeDetail(e: WechatMiniprogram.TouchEvent) {
    const { challengeId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community/challenges/detail/detail?id=${challengeId}`
    });
  },

  /**
   * 查看用户资料
   */
  viewUserProfile(e: WechatMiniprogram.TouchEvent) {
    const { userId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/profile/user/user?id=${userId}`
    });
  },

  /**
   * 点赞动态
   */
  likePost(e: WechatMiniprogram.TouchEvent) {
    const { postId, index } = e.currentTarget.dataset;
    const post = this.data.posts[index];
    
    if (!post) return;
    
    const isLiked = post.isLiked;
    const newLikes = isLiked ? post.likes - 1 : post.likes + 1;
    
    // 更新本地状态
    this.setData({
      [`posts[${index}].isLiked`]: !isLiked,
      [`posts[${index}].likes`]: newLikes
    });
    
    // 调用API更新服务端状态
    (isLiked ? communityAPI.unlikePost(postId) : communityAPI.likePost(postId))
      .catch(error => {
        console.error('点赞失败:', error);
        // 恢复原状态
        this.setData({
          [`posts[${index}].isLiked`]: isLiked,
          [`posts[${index}].likes`]: post.likes
        });
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
  },

  /**
   * 评论动态
   */
  commentPost(e: WechatMiniprogram.TouchEvent) {
    const { postId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${postId}&focus=comment`
    });
  },

  /**
   * 分享动态
   */
  sharePost(e: WechatMiniprogram.TouchEvent) {
    // 分享功能由微信小程序原生支持
    // 在onShareAppMessage中处理
  },

  /**
   * 参加挑战
   */
  joinChallenge(e: WechatMiniprogram.TouchEvent) {
    const { challengeId, index } = e.currentTarget.dataset;
    const challenge = this.data.challenges[index];
    
    if (!challenge) return;
    
    wx.showLoading({
      title: '处理中'
    });
    
    communityAPI.joinChallenge(challengeId)
      .then(() => {
        // 更新本地状态
        this.setData({
          [`challenges[${index}].isJoined`]: true,
          [`challenges[${index}].participants`]: challenge.participants + 1
        });
        wx.showToast({
          title: '已成功参加',
          icon: 'success'
        });
      })
      .catch(error => {
        console.error('参加挑战失败:', error);
        wx.showToast({
          title: '参加失败',
          icon: 'none'
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
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showPostModal: true,
      newPost: {
        content: '',
        images: [],
        tags: []
      }
    });
  },

  /**
   * 隐藏创建动态模态框
   */
  hideCreatePost() {
    this.setData({
      showPostModal: false
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
        icon: 'none'
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
          'newPost.images': [...images, ...res.tempFilePaths]
        });
      }
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
      'newPost.images': images
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
        icon: 'none'
      });
      return;
    }
    
    tags.push(tag);
    
    this.setData({
      'newPost.tags': tags
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
      'newPost.tags': tags
    });
  },

  /**
   * 输入内容
   */
  inputContent(e: WechatMiniprogram.Input) {
    this.setData({
      'newPost.content': e.detail.value
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
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '发布中'
    });
    
    // 如果有图片，先上传图片
    const uploadImages = images.length > 0 
      ? this.uploadImages(images) 
      : Promise.resolve([]);
    
    uploadImages
      .then((imageUrls: string[]) => {
        // 创建动态
        return communityAPI.createPost({
          content: content.trim(),
          images: imageUrls,
          tags,
          habitId
        });
      })
      .then((post: IPost) => {
        wx.hideLoading();
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        });
        
        // 关闭模态框
        this.hideCreatePost();
        
        // 刷新数据
        this.refreshData();
      })
      .catch((error: Error) => {
        console.error('发布动态失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '发布失败',
          icon: 'none'
        });
      });
  },
  
  /**
   * 上传图片
   */
  uploadImages(images: string[]): Promise<string[]> {
    return Promise.all(
      images.map(image => 
        communityAPI.uploadImage(image)
          .then(result => result.url)
      )
    );
  },

  /**
   * 导航到通知页面
   */
  navigateToNotifications() {
    wx.navigateTo({
      url: '/pages/community/notifications/notifications'
    });
  },

  /**
   * 导航到搜索页面
   */
  navigateToSearch() {
    wx.navigateTo({
      url: '/pages/community/search/search'
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
          imageUrl: post.images && post.images.length > 0 ? post.images[0] : '/images/share-default.png'
        };
      }
    }
    
    return {
      title: '习惯打卡社区',
      path: '/pages/community/community'
    };
  },

  /**
   * 查看所有挑战
   */
  viewAllChallenges(e: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({
      url: '/pages/community/challenges/challenges'
    });
  },

  /**
   * 查看所有小组
   */
  viewAllGroups() {
    wx.navigateTo({
      url: '/pages/community/groups/groups'
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
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/community/groups/create/create'
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
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/community/friends/add-friend'
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
              'newPost.tags': [...this.data.newPost.tags, habit.name]
            });
          }
        }
      }
    });
  },

  /**
   * 查看所有动态
   */
  viewAllPosts() {
    wx.navigateTo({
      url: '/pages/community/posts/posts'
    });
  },

  /**
   * 查看所有好友
   */
  viewAllFriends() {
    wx.navigateTo({
      url: '/pages/community/friends/friends'
    });
  }
}); 
