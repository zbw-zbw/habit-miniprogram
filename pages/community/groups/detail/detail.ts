// 小组详情页面
import { communityAPI } from '../../../../services/api';
import { formatTimeAgo } from '../../../../utils/util';
import { getAuthState } from '../../../../utils/use-auth';
import { IAppOption } from '../../../../app';

// 定义接口
interface IGroupDetail {
  _id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage?: string;
  tags: string[];
  type: 'public' | 'private';
  membersCount: number;
  postsCount: number;
  creator: {
    _id: string;
    username: string;
    nickname?: string;
    avatar: string;
  };
  isJoined: boolean;
  isCreator?: boolean; // 添加创建者标识
  createdAt: string;
  updatedAt: string;
}

interface IMember {
  _id: string;
  username: string;
  nickname?: string;
  avatar: string;
  role?: string;
}

interface IPost {
  _id: string;
  content: string;
  images: string[];
  user: {
    _id: string;
    username: string;
    nickname?: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

interface IPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface IPageData {
  // 用户登录状态
  hasLogin: boolean;
  
  // 小组ID
  groupId: string;
  
  // 小组详情
  group: IGroupDetail;
  
  // 加载状态
  loading: boolean;
  error: string;
  
  // 标签页
  activeTab: string;
  
  // 动态列表
  posts: IPost[];
  postsPage: number;
  postsLimit: number;
  hasMorePosts: boolean;
  loadingPosts: boolean;
  loadingMorePosts: boolean;
  
  // 成员列表
  members: IMember[];
  membersPage: number;
  membersLimit: number;
  hasMoreMembers: boolean;
  loadingMembers: boolean;
  loadingMoreMembers: boolean;
}

interface IPageMethods {
  loadGroupDetail(): void;
  switchTab(e: any): void;
  loadPosts(isRefresh?: boolean): void;
  loadMembers(isRefresh?: boolean): void;
  toggleJoin(): void;
  dismissGroup(): void; // 添加解散小组方法
  viewUserProfile(e: any): void;
  viewPostDetail(e: any): void;
  likePost(e: any): void;
  commentPost(e: any): void;
  createPost(): void;
  sharePost(e: any): void;
}

Page<IPageData, IPageMethods>({
  // 页面数据
  data: {
    // 用户登录状态
    hasLogin: false,
    
    // 小组ID
    groupId: '',
    
    // 小组详情
    group: {} as IGroupDetail,
    
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
    
    // 成员列表
    members: [] as IMember[],
    membersPage: 1,
    membersLimit: 20,
    hasMoreMembers: true,
    loadingMembers: false,
    loadingMoreMembers: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    
    
    // 获取小组ID
    const groupId = options.id;
    if (!groupId) {
      
      this.setData({
        loading: false,
        error: '未指定小组ID'
      });
      return;
    }

    
    
    // 设置小组ID
    this.setData({ groupId });

    // 检查登录状态
    const { hasLogin } = getAuthState();
    this.setData({ hasLogin });

    // 加载小组详情
    this.loadGroupDetail();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 获取页面栈
    const pages = getCurrentPages();
    // 如果是从发布动态页面返回
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2];
      if (prevPage.route && prevPage.route.includes('pages/community/create-post/create-post')) {
        // 刷新动态列表
        if (this.data.activeTab === 'posts') {
          this.loadPosts(true);
        }
      }
    }
  },

  /**
   * 加载小组详情
   */
  loadGroupDetail() {
    const { groupId } = this.data;
    
    
    
    // 显示加载中
    this.setData({
      loading: true,
      error: ''
    });
    
    // 调用API获取小组详情
    communityAPI.getGroupDetail(groupId)
      .then(result => {
        
        
        // 如果返回的数据中没有id字段但有_id字段，则添加id字段
        if (!result.id && result._id) {
          result.id = result._id;
        }
        
        // 获取当前用户ID
        const app = getApp<IAppOption>();
        const currentUserId = app?.globalData?.userInfo?.id;
        
        // 检查是否是创建者
        const isCreator = result.creator && 
          (result.creator._id === currentUserId || result.creator.id === currentUserId);
        
        // 更新小组详情
        this.setData({
          group: {
            ...result,
            isCreator: isCreator // 添加创建者标识
          },
          loading: false
        });
        
        // 加载初始数据
        this.loadPosts(true);
      })
      .catch(error => {
        
        
        // 显示错误提示
        this.setData({
          loading: false,
          error: '获取小组详情失败，请重试'
        });
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
      } else if (tab === 'members' && this.data.members.length === 0) {
        this.loadMembers(true);
      }
    });
  },

  /**
   * 加载小组动态
   */
  loadPosts(isRefresh = false) {
    const { groupId, postsPage, postsLimit } = this.data;
    
    // 如果是刷新，重置页码
    const page = isRefresh ? 1 : postsPage;
    
    // 显示加载中
    this.setData({
      loadingPosts: this.data.posts.length === 0,
      loadingMorePosts: this.data.posts.length > 0
    });
    
    // 调用API获取小组动态
    communityAPI.getGroupPosts(groupId, { page, limit: postsLimit })
      .then(result => {
        const { posts, pagination } = result;
        
        // 处理时间格式
        const formattedPosts = posts.map(post => ({
          ...post,
          createdAt: formatTimeAgo(post.createdAt)
        }));
        
        // 更新数据
        this.setData({
          posts: isRefresh ? formattedPosts : [...this.data.posts, ...formattedPosts],
          postsPage: page + 1,
          hasMorePosts: page < pagination.pages,
          loadingPosts: false,
          loadingMorePosts: false
        });
      })
      .catch(error => {
        
        
        this.setData({
          loadingPosts: false,
          loadingMorePosts: false
        });
        
        // 显示错误提示
        wx.showToast({
          title: '获取小组动态失败',
          icon: 'none'
        });
      });
  },

  /**
   * 加载小组成员
   */
  loadMembers(isRefresh = false) {
    const { groupId, membersPage, membersLimit } = this.data;
    
    // 如果是刷新，重置页码
    const page = isRefresh ? 1 : membersPage;
    
    // 显示加载中
    this.setData({
      loadingMembers: this.data.members.length === 0,
      loadingMoreMembers: this.data.members.length > 0
    });
    
    // 调用API获取小组成员
    communityAPI.getGroupMembers(groupId, { page, limit: membersLimit })
      .then(result => {
        const { members, pagination } = result;
        
        if (!members || !Array.isArray(members)) {
          // 如果members不是数组，初始化为空数组
          this.setData({
            members: isRefresh ? [] : this.data.members,
            loadingMembers: false,
            loadingMoreMembers: false
          });
          return;
        }
        
        // 处理成员数据，确保有id字段
        const processedMembers = members.map((member: any) => {
          if (!member) return null; // 跳过无效成员
          
          return {
            ...member,
            id: member.id || member._id || `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 确保有id字段
            _id: member._id || member.id || `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 确保有_id字段
            avatar: member.avatar || member.avatarUrl || '/assets/images/default-avatar.png' // 确保有头像
          };
        }).filter(Boolean); // 过滤掉null值
        
        // 更新数据
        this.setData({
          members: isRefresh ? processedMembers : [...this.data.members, ...processedMembers],
          membersPage: page + 1,
          hasMoreMembers: pagination && page < pagination.pages,
          loadingMembers: false,
          loadingMoreMembers: false
        });
      })
      .catch(error => {
        
        
        this.setData({
          loadingMembers: false,
          loadingMoreMembers: false
        });
        
        // 显示错误提示
        wx.showToast({
          title: '获取小组成员失败',
          icon: 'none'
        });
      });
  },

  /**
   * 加入/退出小组
   */
  toggleJoin() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const { groupId, group } = this.data;
    
    // 如果是创建者，则解散小组
    if (group.isCreator) {
      this.dismissGroup();
      return;
    }
    
    const isJoined = group.isJoined;
    
    // 显示加载中
    wx.showLoading({
      title: isJoined ? '退出中...' : '加入中...'
    });
    
    // 调用API
    const apiCall = isJoined 
      ? communityAPI.leaveGroup(groupId) 
      : communityAPI.joinGroup(groupId);
    
    apiCall
      .then(() => {
        // 更新本地数据
        const newGroup = { ...this.data.group };
        newGroup.isJoined = !isJoined;
        newGroup.membersCount = isJoined 
          ? Math.max(0, newGroup.membersCount - 1)
          : newGroup.membersCount + 1;
        
        this.setData({ group: newGroup });
        
        // 显示成功提示
        wx.showToast({
          title: isJoined ? '已退出小组' : '已加入小组',
          icon: 'success'
        });
        
        // 如果是加入，刷新成员列表
        if (!isJoined && this.data.activeTab === 'members') {
          this.loadMembers(true);
        }
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
   * 解散小组
   */
  dismissGroup() {
    const { groupId } = this.data;
    
    // 显示确认对话框
    wx.showModal({
      title: '解散小组',
      content: '确定要解散该小组吗？解散后无法恢复，所有成员将自动退出。',
      confirmText: '确定解散',
      confirmColor: '#F56C6C',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          // 调用API解散小组
          communityAPI.dismissGroup(groupId)
            .then(() => {
              wx.showToast({
                title: '小组已解散',
                icon: 'success'
              });
              
              // 返回上一页
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            })
            .catch(error => {
              
              
              wx.showToast({
                title: '解散小组失败',
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

  /**
   * 查看用户资料
   */
  viewUserProfile(e) {
    // 直接从currentTarget.dataset获取id
    let finalUserId = null;
    
    if (e.currentTarget && e.currentTarget.dataset) {
      finalUserId = e.currentTarget.dataset.id;
    }
    
    // 如果上面没获取到，再尝试从detail中获取
    if (!finalUserId && e.detail) {
      finalUserId = e.detail.userId || e.detail.id;
    }
    
    // 如果是从成员列表点击，尝试直接获取成员数据
    if (!finalUserId && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.index !== undefined) {
      const index = e.currentTarget.dataset.index;
      
      const member = this.data.members[index];
      if (member) {
        finalUserId = member.id || member._id;
      }
    }
    
    if (!finalUserId) {
      wx.showToast({
        title: '无法查看用户资料',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/community/user-profile/user-profile?id=${finalUserId}`
    });
  },

  /**
   * 查看帖子详情
   */
  viewPostDetail(e) {
    const { id, postId } = e.detail || e.currentTarget.dataset;
    const postId2 = postId || id;
    if (postId2) {
      wx.navigateTo({
        url: `/pages/community/post-detail/post-detail?id=${postId2}`
      });
    }
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
    
    const { id, index } = e.detail || e.currentTarget.dataset;
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
    apiCall.then(response => {
      // 使用服务器返回的实际点赞数和点赞状态
      const posts = [...this.data.posts];
      posts[index].isLiked = response.isLiked;
      posts[index].likes = response.likeCount;
      
      this.setData({ posts });
    }).catch(error => {
      
      
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
    const { id } = e.detail || e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${id}&focus=comment`
    });
  },

  /**
   * 创建帖子
   */
  createPost() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const { groupId, group } = this.data;
    
    wx.navigateTo({
      url: `/pages/community/create-post/create-post?groupId=${groupId}&groupName=${encodeURIComponent(group.name)}`
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 刷新当前标签页数据
    if (this.data.activeTab === 'posts') {
      this.loadPosts(true);
    } else if (this.data.activeTab === 'members') {
      this.loadMembers(true);
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
    } else if (this.data.activeTab === 'members' && this.data.hasMoreMembers) {
      this.loadMembers();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { group, groupId } = this.data;
    
    return {
      title: group.name,
      path: `/pages/community/groups/detail/detail?id=${groupId}`
    };
  },

  /**
   * 分享帖子
   */
  sharePost(e) {
    const { id } = e.detail || e.currentTarget.dataset;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
}); 
