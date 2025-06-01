// 好友列表页面
import { communityAPI } from '../../../services/api';
import { getAuthState } from '../../../utils/use-auth';

// 定义用户接口
interface IUser {
  _id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  isFollowing?: boolean;
  isFriend?: boolean;
}

Page({
  data: {
    // 登录状态
    hasLogin: false,
    
    // 当前标签页
    activeTab: 'friends',
    
    // 搜索相关
    searchValue: '',
    isSearching: false,
    
    // 好友列表
    friends: [] as IUser[],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    limit: 20,
    
    // 关注列表
    following: [] as IUser[],
    loadingFollowing: true,
    loadingMoreFollowing: false,
    hasMoreFollowing: true,
    followingPage: 1,
    followingLimit: 20,
    
    // 粉丝列表
    followers: [] as IUser[],
    loadingFollowers: true,
    loadingMoreFollowers: false,
    hasMoreFollowers: true,
    followersPage: 1,
    followersLimit: 20
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 检查登录状态
    const { hasLogin } = getAuthState();
    this.setData({ hasLogin });
    
    if (!hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return;
    }
    
    // 加载好友列表
    this.loadFriends();
  },

  /**
   * 切换标签页
   */
  onTabChange(e) {
    const { name } = e.detail;
    this.setData({ activeTab: name });
    
    // 根据标签页加载不同数据
    if (name === 'following' && this.data.following.length === 0) {
      this.loadFollowing();
    } else if (name === 'followers' && this.data.followers.length === 0) {
      this.loadFollowers();
    }
  },

  /**
   * 加载好友列表
   */
  loadFriends(isRefresh = false) {
    const { page, limit } = this.data;
    
    // 如果是刷新，重置页码
    const currentPage = isRefresh ? 1 : page;
    
    // 显示加载中
    this.setData({
      loading: this.data.friends.length === 0,
      loadingMore: this.data.friends.length > 0
    });
    
    // 调用API获取好友列表
    communityAPI.getFriends()
      .then(friends => {
        // 处理数据
        const processedFriends = friends.map(friend => ({
          ...friend,
          isOnline: Math.random() > 0.5 // 模拟在线状态
        }));
        
        // 更新数据
        this.setData({
          friends: isRefresh ? processedFriends : [...this.data.friends, ...processedFriends],
          page: currentPage + 1,
          hasMore: processedFriends.length === limit,
          loading: false,
          loadingMore: false
        });
      })
      .catch(error => {
        console.error('获取好友列表失败:', error);
        
        this.setData({
          loading: false,
          loadingMore: false
        });
        
        wx.showToast({
          title: '获取好友列表失败',
          icon: 'none'
        });
      });
  },

  /**
   * 加载关注列表
   */
  loadFollowing(isRefresh = false) {
    const { followingPage, followingLimit } = this.data;
    
    // 如果是刷新，重置页码
    const currentPage = isRefresh ? 1 : followingPage;
    
    // 显示加载中
    this.setData({
      loadingFollowing: this.data.following.length === 0,
      loadingMoreFollowing: this.data.following.length > 0
    });
    
    // 模拟API调用获取关注列表
    setTimeout(() => {
      // 模拟数据
      const mockFollowing = Array(10).fill(0).map((_, index) => ({
        _id: `following_${index}`,
        username: `user_${index}`,
        nickname: `关注用户 ${index}`,
        avatar: '/assets/images/default-avatar.png',
        bio: `这是关注用户 ${index} 的个人简介`,
        isFollowing: true,
        isFriend: Math.random() > 0.5 // 随机是否已经是好友
      }));
      
      // 更新数据
      this.setData({
        following: isRefresh ? mockFollowing : [...this.data.following, ...mockFollowing],
        followingPage: currentPage + 1,
        hasMoreFollowing: mockFollowing.length === followingLimit,
        loadingFollowing: false,
        loadingMoreFollowing: false
      });
    }, 500);
  },

  /**
   * 加载粉丝列表
   */
  loadFollowers(isRefresh = false) {
    const { followersPage, followersLimit } = this.data;
    
    // 如果是刷新，重置页码
    const currentPage = isRefresh ? 1 : followersPage;
    
    // 显示加载中
    this.setData({
      loadingFollowers: this.data.followers.length === 0,
      loadingMoreFollowers: this.data.followers.length > 0
    });
    
    // 模拟API调用获取粉丝列表
    setTimeout(() => {
      // 模拟数据
      const mockFollowers = Array(10).fill(0).map((_, index) => ({
        _id: `follower_${index}`,
        username: `user_${index}`,
        nickname: `粉丝用户 ${index}`,
        avatar: '/assets/images/default-avatar.png',
        bio: `这是粉丝用户 ${index} 的个人简介`,
        isFollowing: Math.random() > 0.5 // 随机是否已关注
      }));
      
      // 更新数据
      this.setData({
        followers: isRefresh ? mockFollowers : [...this.data.followers, ...mockFollowers],
        followersPage: currentPage + 1,
        hasMoreFollowers: mockFollowers.length === followersLimit,
        loadingFollowers: false,
        loadingMoreFollowers: false
      });
    }, 500);
  },

  /**
   * 搜索好友
   */
  onSearch() {
    const { searchValue } = this.data;
    if (!searchValue.trim()) return;
    
    // 设置搜索状态
    this.setData({
      isSearching: true,
      loading: true,
      friends: []
    });
    
    // 模拟搜索API调用
    setTimeout(() => {
      // 模拟搜索结果
      const searchResults = Array(3).fill(0).map((_, index) => ({
        _id: `search_${index}`,
        username: `${searchValue}_${index}`,
        nickname: `${searchValue} 用户 ${index}`,
        avatar: '/assets/images/default-avatar.png',
        bio: `搜索到的用户 ${index} 的个人简介`,
        isOnline: Math.random() > 0.5
      }));
      
      // 更新数据
      this.setData({
        friends: searchResults,
        loading: false,
        hasMore: false
      });
    }, 500);
  },

  /**
   * 搜索输入变化
   */
  onSearchChange(e) {
    this.setData({
      searchValue: e.detail
    });
  },

  /**
   * 取消搜索
   */
  onSearchCancel() {
    this.setData({
      searchValue: '',
      isSearching: false
    });
    
    // 重新加载好友列表
    this.loadFriends(true);
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
   * 发送消息
   */
  sendMessage(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/message/chat/chat?userId=${id}`
    });
  },

  /**
   * 添加好友
   */
  addFriend(e) {
    const { id, index } = e.currentTarget.dataset;
    
    // 显示加载中
    wx.showLoading({
      title: '处理中...'
    });
    
    // 调用API添加好友
    communityAPI.addFriend(id)
      .then(() => {
        // 更新本地数据
        const following = [...this.data.following];
        following[index].isFriend = true;
        
        this.setData({ following });
        
        // 显示成功提示
        wx.showToast({
          title: '已添加好友',
          icon: 'success'
        });
      })
      .catch(error => {
        console.error('添加好友失败:', error);
        
        // 显示错误提示
        wx.showToast({
          title: '添加好友失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 关注/取消关注用户
   */
  toggleFollow(e) {
    const { id, index } = e.currentTarget.dataset;
    const follower = this.data.followers[index];
    const isFollowing = follower.isFollowing;
    
    // 显示加载中
    wx.showLoading({
      title: isFollowing ? '取消关注中...' : '关注中...'
    });
    
    // 调用API关注/取消关注用户
    communityAPI.followUser(id, !isFollowing)
      .then(() => {
        // 更新本地数据
        const followers = [...this.data.followers];
        followers[index].isFollowing = !isFollowing;
        
        this.setData({ followers });
        
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
   * 前往寻找好友页面
   */
  goToFindFriends() {
    wx.navigateTo({
      url: '/pages/community/find-friends/find-friends'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 根据当前标签页刷新数据
    if (this.data.activeTab === 'friends') {
      this.loadFriends(true);
    } else if (this.data.activeTab === 'following') {
      this.loadFollowing(true);
    } else if (this.data.activeTab === 'followers') {
      this.loadFollowers(true);
    }
    
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 根据当前标签页加载更多数据
    if (this.data.activeTab === 'friends' && this.data.hasMore && !this.data.loadingMore) {
      this.loadFriends();
    } else if (this.data.activeTab === 'following' && this.data.hasMoreFollowing && !this.data.loadingMoreFollowing) {
      this.loadFollowing();
    } else if (this.data.activeTab === 'followers' && this.data.hasMoreFollowers && !this.data.loadingMoreFollowers) {
      this.loadFollowers();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的好友列表',
      path: '/pages/community/friends/friends'
    };
  }
}); 
