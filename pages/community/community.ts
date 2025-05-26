/**
 * 社区页面
 */
import { getUserInfo, getStorage, setStorage } from '../../utils/storage';

interface IPageData {
  activeTab: 'follow' | 'discover' | 'nearby' | 'rank';
  loading: boolean;
  hasLogin: boolean;
  userInfo: IUserInfo | null;
  posts: IPost[];
  challenges: IChallenge[];
  friends: IFriend[];
  hasMore: boolean;
  showPostModal: boolean;
  newPost: {
    content: string;
    images: string[];
    tags: string[];
  };
}

interface IPageMethods {
  loadData(): void;
  switchTab(e: WechatMiniprogram.TouchEvent): void;
  loadPosts(): void;
  loadChallenges(): void;
  loadFriends(): void;
  refreshData(): void;
  loadMorePosts(): void;
  viewPostDetail(e: WechatMiniprogram.TouchEvent): void;
  viewChallengeDetail(e: WechatMiniprogram.TouchEvent): void;
  viewUserProfile(e: WechatMiniprogram.TouchEvent): void;
  likePost(e: WechatMiniprogram.TouchEvent): void;
  commentPost(e: WechatMiniprogram.TouchEvent): void;
  sharePost(e: WechatMiniprogram.TouchEvent): void;
  joinChallenge(e: WechatMiniprogram.TouchEvent): void;
  showCreatePost(): void;
  hideCreatePost(): void;
  chooseImage(): void;
  removeImage(e: WechatMiniprogram.TouchEvent): void;
  addTag(e: WechatMiniprogram.TouchEvent): void;
  removeTag(e: WechatMiniprogram.TouchEvent): void;
  inputContent(e: WechatMiniprogram.Input): void;
  submitPost(): void;
  navigateToNotifications(): void;
  navigateToSearch(): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 'follow',
    loading: true,
    hasLogin: false,
    userInfo: null,
    posts: [],
    challenges: [],
    friends: [],
    hasMore: true,
    showPostModal: false,
    newPost: {
      content: '',
      images: [],
      tags: []
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 检查登录状态
    const app = getApp<IAppOption>();
    this.setData({
      userInfo: app.globalData.userInfo,
      hasLogin: app.globalData.hasLogin
    });
    
    this.loadData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时刷新数据
    this.refreshData();
  },

  /**
   * 加载数据
   */
  loadData() {
    this.setData({ loading: true });
    
    // 加载社区动态
    this.loadPosts();
    
    // 加载热门挑战
    this.loadChallenges();
    
    // 加载好友列表
    this.loadFriends();
    
    this.setData({ loading: false });
  },

  /**
   * 切换标签
   */
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as 'follow' | 'discover' | 'nearby' | 'rank';
    this.setData({ activeTab: tab }, () => {
      this.refreshData();
    });
  },

  /**
   * 加载社区动态
   */
  loadPosts() {
    // 模拟加载社区动态数据
    const mockPosts: IPost[] = [
      {
        id: '1',
        userId: '101',
        userName: '李小华',
        userAvatar: '/images/avatars/avatar1.png',
        content: '今天完成了《原子习惯》的阅读，真的很有启发！分享一个金句："习惯是复利的魔力：1%的微小改变，带来巨大的人生转变。"',
        images: ['/images/posts/post1.jpg'],
        tags: ['阅读', '自我提升'],
        likes: 256,
        comments: 48,
        isLiked: false,
        createdAt: '2023-10-16 08:23',
        habitName: '阅读习惯'
      },
      {
        id: '2',
        userId: '102',
        userName: '张明',
        userAvatar: '/images/avatars/avatar2.png',
        content: '今天完成了10公里跑步，突破了自己的记录！坚持就是胜利，明天继续加油！',
        images: ['/images/posts/post2.jpg'],
        tags: ['跑步', '健身'],
        likes: 128,
        comments: 32,
        isLiked: true,
        createdAt: '2023-10-15 19:45',
        habitName: '跑步习惯'
      },
      {
        id: '3',
        userId: '103',
        userName: '王丽',
        userAvatar: '/images/avatars/avatar3.png',
        content: '早晨冥想20分钟，整个人都平静下来了。推荐大家尝试"正念呼吸法"，对缓解焦虑真的很有效！现在已经坚持了45天，感觉自己的情绪管理能力有了很大提升。',
        images: [],
        tags: ['冥想', '心理健康'],
        likes: 89,
        comments: 15,
        isLiked: false,
        createdAt: '2023-10-14 07:30',
        habitName: '冥想习惯'
      }
    ];
    
    this.setData({ posts: mockPosts });
  },

  /**
   * 加载热门挑战
   */
  loadChallenges() {
    // 模拟加载热门挑战数据
    const mockChallenges: IChallenge[] = [
      {
        id: '1',
        title: '21天早起挑战',
        image: '/images/challenges/challenge1.jpg',
        participants: 2145,
        isJoined: false
      },
      {
        id: '2',
        title: '每日1万步',
        image: '/images/challenges/challenge2.jpg',
        participants: 3872,
        isJoined: false
      },
      {
        id: '3',
        title: '30天健康饮食',
        image: '/images/challenges/challenge3.jpg',
        participants: 1658,
        isJoined: false
      }
    ];
    
    this.setData({ challenges: mockChallenges });
  },

  /**
   * 加载好友列表
   */
  loadFriends() {
    // 模拟加载好友列表数据
    const mockFriends: IFriend[] = [
      {
        id: '101',
        name: '李小华',
        avatar: '/images/avatars/avatar1.png',
        hasUpdate: true
      },
      {
        id: '102',
        name: '张明',
        avatar: '/images/avatars/avatar2.png',
        hasUpdate: true
      },
      {
        id: '103',
        name: '王丽',
        avatar: '/images/avatars/avatar3.png',
        hasUpdate: true
      },
      {
        id: '104',
        name: '赵强',
        avatar: '/images/avatars/avatar4.png',
        hasUpdate: false
      },
      {
        id: '105',
        name: '陈静',
        avatar: '/images/avatars/avatar5.png',
        hasUpdate: true
      }
    ];
    
    this.setData({ friends: mockFriends });
  },

  /**
   * 刷新数据
   */
  refreshData() {
    const { activeTab } = this.data;
    
    this.setData({ loading: true });
    
    // 根据当前标签加载不同数据
    switch (activeTab) {
      case 'follow':
        this.loadPosts();
        this.loadFriends();
        break;
      case 'discover':
        this.loadPosts();
        this.loadChallenges();
        break;
      case 'nearby':
        // 加载附近的人数据
        break;
      case 'rank':
        // 加载排行榜数据
        break;
    }
    
    this.setData({ loading: false });
    
    // 停止下拉刷新
    wx.stopPullDownRefresh();
  },

  /**
   * 加载更多动态
   */
  loadMorePosts() {
    if (!this.data.hasMore) return;
    
    wx.showLoading({ title: '加载中' });
    
    // 模拟加载更多数据
    setTimeout(() => {
      const newPosts: IPost[] = [
        {
          id: '4',
          userId: '104',
          userName: '赵强',
          userAvatar: '/images/avatars/avatar4.png',
          content: '坚持写日记一个月了，记录生活中的点点滴滴，回顾时感觉很有成就感！',
          images: ['/images/posts/post4.jpg'],
          tags: ['写作', '日记'],
          likes: 56,
          comments: 8,
          isLiked: false,
          createdAt: '2023-10-13 22:10',
          habitName: '写日记'
        },
        {
          id: '5',
          userId: '105',
          userName: '陈静',
          userAvatar: '/images/avatars/avatar5.png',
          content: '今天的瑜伽课很棒，学会了新的体式，感觉身体更加柔软了！',
          images: ['/images/posts/post5.jpg'],
          tags: ['瑜伽', '健身'],
          likes: 78,
          comments: 12,
          isLiked: false,
          createdAt: '2023-10-12 18:30',
          habitName: '瑜伽习惯'
        }
      ];
      
      this.setData({
        posts: [...this.data.posts, ...newPosts],
        hasMore: false // 模拟没有更多数据了
      });
      
      wx.hideLoading();
    }, 1000);
  },

  /**
   * 查看动态详情
   */
  viewPostDetail(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/post-detail/post-detail?id=${id}`
    });
  },

  /**
   * 查看挑战详情
   */
  viewChallengeDetail(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/challenge-detail/challenge-detail?id=${id}`
    });
  },

  /**
   * 查看用户资料
   */
  viewUserProfile(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/user-profile/user-profile?id=${id}`
    });
  },

  /**
   * 点赞动态
   */
  likePost(e: WechatMiniprogram.TouchEvent) {
    const { id, index } = e.currentTarget.dataset;
    const posts = [...this.data.posts];
    
    // 切换点赞状态
    posts[index].isLiked = !posts[index].isLiked;
    posts[index].likes += posts[index].isLiked ? 1 : -1;
    
    this.setData({ posts });
    
    // TODO: 发送点赞请求到服务器
  },

  /**
   * 评论动态
   */
  commentPost(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageCommunity/pages/post-detail/post-detail?id=${id}&focus=comment`
    });
  },

  /**
   * 分享动态
   */
  sharePost(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    // 使用小程序分享功能
  },

  /**
   * 参加挑战
   */
  joinChallenge(e: WechatMiniprogram.TouchEvent) {
    const { id, index } = e.currentTarget.dataset;
    const challenges = [...this.data.challenges];
    
    // 切换参加状态
    challenges[index].isJoined = !challenges[index].isJoined;
    challenges[index].participants += challenges[index].isJoined ? 1 : -1;
    
    this.setData({ challenges });
    
    // 提示用户
    wx.showToast({
      title: challenges[index].isJoined ? '已参加挑战' : '已退出挑战',
      icon: 'success'
    });
    
    // TODO: 发送参加挑战请求到服务器
  },

  /**
   * 显示发布动态弹窗
   */
  showCreatePost() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ showPostModal: true });
  },

  /**
   * 隐藏发布动态弹窗
   */
  hideCreatePost() {
    this.setData({ showPostModal: false });
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
        this.setData({
          'newPost.images': [...images, ...res.tempFilePaths]
        });
      }
    });
  },

  /**
   * 移除图片
   */
  removeImage(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data.newPost;
    
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
    const { tags } = this.data.newPost;
    
    if (tags.includes(tag)) return;
    
    this.setData({
      'newPost.tags': [...tags, tag]
    });
  },

  /**
   * 移除标签
   */
  removeTag(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset;
    const { tags } = this.data.newPost;
    
    tags.splice(index, 1);
    
    this.setData({
      'newPost.tags': tags
    });
  },

  /**
   * 输入动态内容
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
    const { content, images, tags } = this.data.newPost;
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入动态内容',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '发布中' });
    
    // 模拟发布动态
    setTimeout(() => {
      // 重置表单
      this.setData({
        showPostModal: false,
        newPost: {
          content: '',
          images: [],
          tags: []
        }
      });
      
      // 刷新动态列表
      this.loadPosts();
      
      wx.hideLoading();
      
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });
    }, 1500);
  },

  /**
   * 跳转到通知页面
   */
  navigateToNotifications() {
    wx.navigateTo({
      url: '/packageCommunity/pages/notifications/notifications'
    });
  },

  /**
   * 跳转到搜索页面
   */
  navigateToSearch() {
    wx.navigateTo({
      url: '/packageCommunity/pages/search/search'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.refreshData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.loadMorePosts();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '习惯打卡社区',
      path: '/pages/community/community'
    };
  }
}); 
