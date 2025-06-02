// 用户资料页面
import { communityAPI, userAPI, habitAPI } from '../../../services/api';
import { formatTimeAgo, formatDate } from '../../../utils/util';
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
  id: string;
  userId: string;
  userAvatar: string;
  userName: string;
  content: string;
  images: string[];
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  habitName?: string;
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
    
    // 获取API基础URL
    const app = getApp();
    const apiBaseUrl = app.globalData.apiBaseUrl;
    
    // 调用API获取用户资料
    wx.request({
      url: `${apiBaseUrl}/api/users/${userId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res: any) => {
        const { success, data, message } = res.data;
        
        if (success && data) {
          console.log('获取用户资料成功:', data);
          
          this.setData({
            userInfo: data,
            loading: false
          });
          
          // 加载初始数据
          this.loadPosts(true);
        } else {
          console.error('获取用户资料失败:', message);
          
          this.setData({
            loading: false,
            error: message || '获取用户资料失败'
          });
        }
      },
      fail: (error) => {
        console.error('获取用户资料请求失败:', error);
        
        this.setData({
          loading: false,
          error: '网络请求失败，请检查网络连接'
        });
      }
    });
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
        
        // 处理返回的帖子数据，确保格式正确
        const formattedPosts = posts.map((post: any) => {
          // 将API返回的数据格式转换为页面使用的格式
          return {
            id: post.id || post._id,
            userId: post.userId || (post.user ? post.user._id : ''),
            userAvatar: post.userAvatar || (post.user ? post.user.avatar : '/assets/images/default-avatar.png'),
            userName: post.userName || (post.user ? (post.user.nickname || post.user.username) : '用户'),
            content: post.content || '',
            images: post.images || (post.media ? post.media.map((m: any) => m.url) : []),
            tags: post.tags || [],
            likes: typeof post.likes === 'number' ? post.likes : (post.likeCount || 0),
            comments: typeof post.comments === 'number' ? post.comments : (post.commentCount || 0),
            isLiked: post.isLiked || false,
            createdAt: formatTimeAgo(post.createdAt),
            habitName: post.habitName || (post.habit ? post.habit.name : '')
          };
        });
        
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
    
    // 如果是刷新，重置页码
    const page = isRefresh ? 1 : habitsPage;
    
    // 显示加载中
    this.setData({
      loadingHabits: this.data.habits.length === 0,
      loadingMoreHabits: this.data.habits.length > 0
    });
    
    // 获取API基础URL
    const app = getApp();
    const apiBaseUrl = app.globalData.apiBaseUrl;
    
    // 调用API获取用户习惯
    wx.request({
      url: `${apiBaseUrl}/api/users/${userId}/habits`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: {
        page,
        limit: habitsLimit
      },
      success: (res: any) => {
        const { success, data, message } = res.data;
        
        if (success && data) {
          console.log('获取用户习惯成功:', data);
          
          const { habits = [], pagination = {} } = data;
          
          // 更新数据
          this.setData({
            habits: isRefresh ? habits : [...this.data.habits, ...habits],
            habitsPage: page + 1,
            hasMoreHabits: page < pagination.pages,
            loadingHabits: false,
            loadingMoreHabits: false
          });
        } else {
          console.error('获取用户习惯失败:', message);
          
          this.setData({
            loadingHabits: false,
            loadingMoreHabits: false
          });
          
          wx.showToast({
            title: message || '获取习惯失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        console.error('获取用户习惯请求失败:', error);
        
        this.setData({
          loadingHabits: false,
          loadingMoreHabits: false
        });
        
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
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
    
    // 获取API基础URL
    const app = getApp();
    const apiBaseUrl = app.globalData.apiBaseUrl;
    
    // 调用API获取用户成就
    wx.request({
      url: `${apiBaseUrl}/api/users/${userId}/achievements`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: {
        page,
        limit: achievementsLimit
      },
      success: (res: any) => {
        const { success, data, message } = res.data;
        
        if (success && data) {
          console.log('获取用户成就成功:', data);
          
          const { achievements = [], pagination = {} } = data;
          
          // 更新数据
          this.setData({
            achievements: isRefresh ? achievements : [...this.data.achievements, ...achievements],
            achievementsPage: page + 1,
            hasMoreAchievements: page < pagination.pages,
            loadingAchievements: false,
            loadingMoreAchievements: false
          });
        } else {
          console.error('获取用户成就失败:', message);
          
          this.setData({
            loadingAchievements: false,
            loadingMoreAchievements: false
          });
          
          wx.showToast({
            title: message || '获取成就失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        console.error('获取用户成就请求失败:', error);
        
        this.setData({
          loadingAchievements: false,
          loadingMoreAchievements: false
        });
        
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
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
    // 从组件事件的detail中获取postId，或者从dataset中获取id（兼容直接点击的情况）
    const postId = e.detail?.postId || e.currentTarget.dataset.id;
    if (!postId) {
      console.error('无法获取帖子ID:', e);
      wx.showToast({
        title: '无法查看帖子详情',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${postId}`
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
    
    // 从组件事件的detail中获取postId和index，或者从dataset中获取（兼容直接点击的情况）
    const postId = e.detail?.postId || e.currentTarget.dataset.id;
    const index = e.detail?.index !== undefined ? e.detail.index : e.currentTarget.dataset.index;
    
    if (postId === undefined || index === undefined) {
      console.error('无法获取帖子ID或索引:', e);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
      return;
    }
    
    const post = this.data.posts[index];
    const isLiked = post.isLiked;
    
    // 调用API
    const apiCall = isLiked 
      ? communityAPI.unlikePost(postId) 
      : communityAPI.likePost(postId);
    
    // 乐观更新UI
    const posts = [...this.data.posts];
    posts[index].isLiked = !isLiked;
    posts[index].likes = isLiked 
      ? Math.max(0, posts[index].likes - 1)
      : posts[index].likes + 1;
    
    this.setData({ posts });
    
    // 发送请求并使用服务器返回的实际点赞数更新UI
    apiCall.then(response => {
      // 使用服务器返回的实际点赞数和点赞状态
      const posts = [...this.data.posts];
      posts[index].isLiked = response.isLiked;
      posts[index].likes = response.likeCount;
      
      this.setData({ posts });
    }).catch(error => {
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
    // 从组件事件的detail中获取postId，或者从dataset中获取id（兼容直接点击的情况）
    const postId = e.detail?.postId || e.currentTarget.dataset.id;
    if (!postId) {
      console.error('无法获取帖子ID:', e);
      wx.showToast({
        title: '无法评论帖子',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${postId}&focus=comment`
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
  },

  /**
   * 预览图片
   */
  previewImage(e: WechatMiniprogram.TouchEvent) {
    const { urls, current } = e.currentTarget.dataset;
    
    wx.previewImage({
      urls,
      current
    });
  },

  /**
   * 查看用户资料
   */
  viewUserProfile(e) {
    const { userId } = e.detail || e.currentTarget.dataset;
    if (userId) {
      wx.navigateTo({
        url: `/pages/community/user-profile/user-profile?id=${userId}`
      });
    }
  },

  /**
   * 分享帖子
   */
  sharePost(e) {
    // 从组件事件的detail中获取postId，或者从dataset中获取id（兼容直接点击的情况）
    const postId = e.detail?.postId || e.currentTarget.dataset.id;
    if (!postId) {
      console.error('无法获取帖子ID:', e);
      return;
    }
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },
}); 
