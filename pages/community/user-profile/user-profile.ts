// 用户资料页面
import { communityAPI, userAPI, habitAPI } from '../../../services/api';
import { formatTimeAgo } from '../../../utils/util';
import { getAuthState } from '../../../utils/use-auth';

// 定义接口
interface IUserInfo {
  _id: string;
  username: string;
  nickname?: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  postsCount: number;
  followingCount: number;
  followersCount: number;
  isFollowing: boolean;
}

interface IPost {
  _id: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

interface IHabit {
  _id: string;
  name: string;
  icon?: string;
  currentStreak: number;
  completionRate: number;
}

interface IAchievement {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  earnedAt: string;
}

// 定义分页接口
interface IPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

Page({
  // 页面数据
  data: {
    // 用户登录状态
    hasLogin: false,
    
    // 用户ID
    userId: '',
    
    // 是否当前用户
    isCurrentUser: false,
    
    // 用户信息
    userInfo: {} as IUserInfo,
    
    // 加载状态
    loading: true,
    error: '',
    
    // 标签页
    activeTab: 'posts',
    
    // 动态列表
    posts: [] as IPost[],
    postsPage: 1,
    postsLimit: 10,
    hasMorePosts: true,
    loadingPosts: false,
    loadingMorePosts: false,
    
    // 习惯列表
    habits: [] as IHabit[],
    habitsPage: 1,
    habitsLimit: 10,
    hasMoreHabits: true,
    loadingHabits: false,
    loadingMoreHabits: false,
    
    // 成就列表
    achievements: [] as IAchievement[],
    achievementsPage: 1,
    achievementsLimit: 10,
    hasMoreAchievements: true,
    loadingAchievements: false,
    loadingMoreAchievements: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取用户ID
    const userId = options.id;
    if (!userId) {
      this.setData({
        loading: false,
        error: '未指定用户ID'
      });
      return;
    }

    // 设置用户ID
    this.setData({ userId });

    // 检查登录状态
    const { hasLogin, userInfo } = getAuthState();
    this.setData({ 
      hasLogin,
      isCurrentUser: hasLogin && userInfo && userInfo.id === userId
    });

    // 加载用户资料
    this.loadUserProfile();
  },

  /**
   * 加载用户资料
   */
  loadUserProfile() {
    const { userId } = this.data;
    
    // 显示加载中
    this.setData({
      loading: true,
      error: ''
    });
    
    // 调用API获取用户资料
    // 注意：由于API中没有获取其他用户资料的方法，这里使用模拟数据
    // 实际项目中应该有对应的API
    // 模拟获取用户资料
    const mockUserInfo: IUserInfo = {
      _id: userId,
      username: '用户' + userId.substring(0, 4),
      nickname: '昵称' + userId.substring(0, 4),
      avatar: '/assets/images/default-avatar.png',
      coverImage: '/assets/images/default-cover.jpg',
      bio: '这是用户的个人简介',
      postsCount: 12,
      followingCount: 45,
      followersCount: 23,
      isFollowing: false
    };
    
    setTimeout(() => {
      this.setData({
        userInfo: mockUserInfo,
        loading: false
      });
      
      // 加载初始数据
      this.loadPosts(true);
    }, 500);
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.detail.name;
    
    this.setData({ activeTab: tab }, () => {
      // 根据标签页加载不同数据
      if (tab === 'posts' && this.data.posts.length === 0) {
        this.loadPosts(true);
      } else if (tab === 'habits' && this.data.habits.length === 0) {
        this.loadHabits(true);
      } else if (tab === 'achievements' && this.data.achievements.length === 0) {
        this.loadAchievements(true);
      }
    });
  },

  /**
   * 加载用户动态
   */
  loadPosts(isRefresh = false) {
    const { userId, postsPage, postsLimit } = this.data;
    
    // 如果是刷新，重置页码
    const page = isRefresh ? 1 : postsPage;
    
    // 显示加载中
    this.setData({
      loadingPosts: this.data.posts.length === 0,
      loadingMorePosts: this.data.posts.length > 0
    });
    
    // 调用API获取用户动态
    communityAPI.getPosts({ userId, page, pageSize: postsLimit })
      .then(result => {
        const { posts, hasMore } = result;
        
        // 处理时间格式
        const formattedPosts = posts.map(post => ({
          ...post,
          createdAt: formatTimeAgo(post.createdAt)
        }));
        
        // 更新数据
        this.setData({
          posts: isRefresh ? formattedPosts : [...this.data.posts, ...formattedPosts],
          postsPage: page + 1,
          hasMorePosts: hasMore,
          loadingPosts: false,
          loadingMorePosts: false
        });
      })
      .catch(error => {
        console.error('获取用户动态失败:', error);
        
        this.setData({
          loadingPosts: false,
          loadingMorePosts: false
        });
        
        // 显示错误提示
        wx.showToast({
          title: '获取动态失败',
          icon: 'none'
        });
      });
  },

  /**
   * 加载用户习惯
   */
  loadHabits(isRefresh = false) {
    const { userId, habitsPage, habitsLimit } = this.data;
    const { isCurrentUser } = this.data;
    
    // 如果是刷新，重置页码
    const page = isRefresh ? 1 : habitsPage;
    
    // 显示加载中
    this.setData({
      loadingHabits: this.data.habits.length === 0,
      loadingMoreHabits: this.data.habits.length > 0
    });
    
    // 模拟获取用户习惯数据
    // 注意：由于API中没有获取其他用户习惯的方法，这里使用模拟数据
    setTimeout(() => {
      const mockHabits = Array(5).fill(0).map((_, index) => ({
        _id: `habit_${index}`,
        name: `习惯 ${index + 1}`,
        icon: '/assets/images/habits.png',
        currentStreak: Math.floor(Math.random() * 30),
        completionRate: Math.floor(Math.random() * 100)
      }));
      
      const mockPagination = {
        total: 10,
        page,
        limit: habitsLimit,
        pages: 2
      };
      
      // 更新数据
      this.setData({
        habits: isRefresh ? mockHabits : [...this.data.habits, ...mockHabits],
        habitsPage: page + 1,
        hasMoreHabits: page < mockPagination.pages,
        loadingHabits: false,
        loadingMoreHabits: false
      });
    }, 500);
  },

  /**
   * 加载用户成就
   */
  loadAchievements(isRefresh = false) {
    const { userId, achievementsPage, achievementsLimit } = this.data;
    
    // 如果是刷新，重置页码
    const page = isRefresh ? 1 : achievementsPage;
    
    // 显示加载中
    this.setData({
      loadingAchievements: this.data.achievements.length === 0,
      loadingMoreAchievements: this.data.achievements.length > 0
    });
    
    // 模拟获取用户成就数据
    // 注意：由于API中没有获取其他用户成就的方法，这里使用模拟数据
    setTimeout(() => {
      const mockAchievements = Array(5).fill(0).map((_, index) => ({
        _id: `achievement_${index}`,
        name: `成就 ${index + 1}`,
        description: `完成了某项任务获得的成就`,
        icon: '/assets/images/achievements.png',
        earnedAt: '2023-05-15'
      }));
      
      const mockPagination = {
        total: 10,
        page,
        limit: achievementsLimit,
        pages: 2
      };
      
      // 更新数据
      this.setData({
        achievements: isRefresh ? mockAchievements : [...this.data.achievements, ...mockAchievements],
        achievementsPage: page + 1,
        hasMoreAchievements: page < mockPagination.pages,
        loadingAchievements: false,
        loadingMoreAchievements: false
      });
    }, 500);
  },

  /**
   * 关注/取消关注用户
   */
  toggleFollow() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const { userId, userInfo } = this.data;
    const isFollowing = userInfo.isFollowing;
    
    // 显示加载中
    wx.showLoading({
      title: isFollowing ? '取消关注中...' : '关注中...'
    });
    
    // 调用API
    communityAPI.followUser(userId, !isFollowing)
      .then(() => {
        // 更新本地数据
        const newUserInfo = { ...this.data.userInfo };
        newUserInfo.isFollowing = !isFollowing;
        newUserInfo.followersCount = isFollowing 
          ? Math.max(0, newUserInfo.followersCount - 1)
          : newUserInfo.followersCount + 1;
        
        this.setData({ userInfo: newUserInfo });
        
        // 显示成功提示
        wx.showToast({
          title: isFollowing ? '已取消关注' : '已关注',
          icon: 'success'
        });
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
   * 编辑个人资料
   */
  editProfile() {
    wx.navigateTo({
      url: '/pages/profile/settings/settings'
    });
  },

  /**
   * 查看帖子详情
   */
  viewPostDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${id}`
    });
  },

  /**
   * 查看习惯详情
   */
  viewHabitDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/habits/detail/detail?id=${id}`
    });
  },

  /**
   * 点赞帖子
   */
  likePost(e) {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const { id, index } = e.currentTarget.dataset;
    const post = this.data.posts[index];
    const isLiked = post.isLiked;
    
    // 调用API
    const apiCall = isLiked 
      ? communityAPI.unlikePost(id) 
      : communityAPI.likePost(id);
    
    // 乐观更新UI
    const posts = [...this.data.posts];
    posts[index].isLiked = !isLiked;
    posts[index].likes = isLiked 
      ? Math.max(0, posts[index].likes - 1)
      : posts[index].likes + 1;
    
    this.setData({ posts });
    
    // 发送请求
    apiCall.catch(error => {
      console.error('点赞操作失败:', error);
      
      // 恢复原状态
      const posts = [...this.data.posts];
      posts[index].isLiked = isLiked;
      posts[index].likes = isLiked 
        ? posts[index].likes + 1
        : Math.max(0, posts[index].likes - 1);
      
      this.setData({ posts });
      
      // 显示错误提示
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },

  /**
   * 评论帖子
   */
  commentPost(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${id}&focus=comment`
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 刷新当前标签页数据
    if (this.data.activeTab === 'posts') {
      this.loadPosts(true);
    } else if (this.data.activeTab === 'habits') {
      this.loadHabits(true);
    } else if (this.data.activeTab === 'achievements') {
      this.loadAchievements(true);
    }
    
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 加载更多当前标签页数据
    if (this.data.activeTab === 'posts' && this.data.hasMorePosts) {
      this.loadPosts();
    } else if (this.data.activeTab === 'habits' && this.data.hasMoreHabits) {
      this.loadHabits();
    } else if (this.data.activeTab === 'achievements' && this.data.hasMoreAchievements) {
      this.loadAchievements();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { userInfo, userId } = this.data;
    
    return {
      title: `${userInfo.nickname || userInfo.username}的个人主页`,
      path: `/pages/community/user-profile/user-profile?id=${userId}`
    };
  }
}); 
