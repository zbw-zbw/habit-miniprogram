// 小组详情页面
import { communityAPI } from '../../../../services/api';
import { formatTimeAgo } from '../../../../utils/util';
import { getAuthState } from '../../../../utils/use-auth';

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

Page({
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
        // 更新小组详情
        this.setData({
          group: result,
          loading: false
        });
        
        // 加载初始数据
        this.loadPosts(true);
      })
      .catch(error => {
        console.error('获取小组详情失败:', error);
        
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
        console.error('获取小组动态失败:', error);
        
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
        
        // 更新数据
        this.setData({
          members: isRefresh ? members : [...this.data.members, ...members],
          membersPage: page + 1,
          hasMoreMembers: page < pagination.pages,
          loadingMembers: false,
          loadingMoreMembers: false
        });
      })
      .catch(error => {
        console.error('获取小组成员失败:', error);
        
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
  viewUserProfile(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community/user-profile/user-profile?id=${id}`
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
      title: `${group.name} - 习惯打卡小组`,
      path: `/pages/community/groups/detail/detail?id=${groupId}`
    };
  }
}); 
