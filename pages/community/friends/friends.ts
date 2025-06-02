// 好友列表页面
import { communityAPI } from '../../../services/api';
import { getAuthState } from '../../../utils/use-auth';
import { getFullImageUrl } from '../../../utils/image';

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
          avatar: getFullImageUrl(friend.avatar),
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
    
    // 使用真实API获取关注列表
    communityAPI.getFollowing ? communityAPI.getFollowing().then((result: any) => {
      console.log('获取关注列表结果:', result);
      
      let followingUsers: any[] = [];
      
      // 处理不同的数据结构
      if (result && typeof result === 'object' && result.data && typeof result.data === 'object' && 
          result.data.following && Array.isArray(result.data.following)) {
        // 处理 {success: true, data: {following: [...]}} 格式
        followingUsers = result.data.following;
      } else if (result && typeof result === 'object' && Array.isArray(result.following)) {
        // 处理 {following: [...]} 格式
        followingUsers = result.following;
      } else if (Array.isArray(result)) {
        // 处理直接返回数组的格式
        followingUsers = result;
      }
      
      console.log('处理后的关注用户:', followingUsers);
      
      // 处理数据
      const processedFollowing = followingUsers.map(user => ({
        _id: user._id || user.id || '',
        username: user.username || '',
        nickname: user.nickname || user.username || '未命名用户',
        avatar: getFullImageUrl(user.avatar || '/assets/images/default-avatar.png'),
        bio: user.bio || '这是一个神秘的用户',
        isFollowing: true,
        isFriend: user.isFriend || false
      }));
      
      // 更新数据
      this.setData({
        following: isRefresh ? processedFollowing : [...this.data.following, ...processedFollowing],
        followingPage: currentPage + 1,
        hasMoreFollowing: processedFollowing.length === followingLimit,
        loadingFollowing: false,
        loadingMoreFollowing: false
      });
    }).catch(error => {
      console.error('获取关注列表失败:', error);
      
      // 使用模拟数据作为备选
      this.loadMockFollowing(isRefresh, currentPage);
    }) : 
    // 如果API不存在，使用模拟数据
    this.loadMockFollowing(isRefresh, currentPage);
  },

  /**
   * 加载模拟关注列表数据
   */
  loadMockFollowing(isRefresh = false, currentPage = 1) {
    const { followingLimit } = this.data;
    
    // 模拟数据
    const mockFollowing = Array(10).fill(0).map((_, index) => ({
      _id: `following_${index}`,
      username: `user_${index}`,
      nickname: `关注用户 ${index}`,
      avatar: getFullImageUrl('/assets/images/default-avatar.png'),
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
    
    // 使用真实API获取粉丝列表
    communityAPI.getFollowers ? communityAPI.getFollowers().then(result => {
      // 确保result是数组
      const followers = Array.isArray(result) ? result : [];
      
      // 处理数据
      const processedFollowers = followers.map(user => ({
        _id: user._id || user.id || '',
        username: user.username || '',
        nickname: user.nickname || user.username || '未命名用户',
        avatar: getFullImageUrl(user.avatar || '/assets/images/default-avatar.png'),
        bio: user.bio || '这是一个神秘的用户',
        isFollowing: user.isFollowing || false
      }));
      
      // 更新数据
      this.setData({
        followers: isRefresh ? processedFollowers : [...this.data.followers, ...processedFollowers],
        followersPage: currentPage + 1,
        hasMoreFollowers: processedFollowers.length === followersLimit,
        loadingFollowers: false,
        loadingMoreFollowers: false
      });
    }).catch(error => {
      console.error('获取粉丝列表失败:', error);
      
      // 使用模拟数据作为备选
      this.loadMockFollowers(isRefresh, currentPage);
    }) : 
    // 如果API不存在，使用模拟数据
    this.loadMockFollowers(isRefresh, currentPage);
  },

  /**
   * 加载模拟粉丝列表数据
   */
  loadMockFollowers(isRefresh = false, currentPage = 1) {
    const { followersLimit } = this.data;
    
    // 模拟数据
    const mockFollowers = Array(10).fill(0).map((_, index) => ({
      _id: `follower_${index}`,
      username: `user_${index}`,
      nickname: `粉丝用户 ${index}`,
      avatar: getFullImageUrl('/assets/images/default-avatar.png'),
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
    
    // 调用真实的搜索API
    communityAPI.searchUsers({ keyword: searchValue })
      .then(users => {
        // 处理搜索结果
        const searchResults = users.map(user => ({
          _id: user.id || user._id,
          username: user.username,
          nickname: user.nickname || user.username,
          avatar: getFullImageUrl(user.avatar || '/assets/images/default-avatar.png'),
          bio: user.bio || '',
          isOnline: false, // 在线状态无法确定
          isFriend: user.isFriend || false
        }));
        
        // 更新数据
        this.setData({
          friends: searchResults,
          loading: false,
          hasMore: false
        });
        
        // 如果没有搜索结果，显示提示
        if (searchResults.length === 0) {
          wx.showToast({
            title: '未找到相关用户',
            icon: 'none'
          });
        }
      })
      .catch(error => {
        console.error('搜索用户失败:', error);
        
        // 如果API调用失败，使用模拟数据
        console.log('使用模拟数据作为备选');
        const searchResults = Array(3).fill(0).map((_, index) => ({
          _id: `search_${index}`,
          username: `${searchValue}_${index}`,
          nickname: `${searchValue} 用户 ${index}`,
          avatar: getFullImageUrl('/assets/images/default-avatar.png'),
          bio: `搜索到的用户 ${index} 的个人简介`,
          isOnline: Math.random() > 0.5
        }));
        
        // 更新数据
        this.setData({
          friends: searchResults,
          loading: false,
          hasMore: false
        });
        
        // 显示错误提示
        wx.showToast({
          title: '搜索API调用失败，显示模拟数据',
          icon: 'none'
        });
      });
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
    // 清除搜索状态
    this.setData({
      searchValue: '',
      isSearching: false,
      loading: true
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
    
    console.log('发送消息给用户:', id);
    
    // 检查id是否有效
    if (!id) {
      console.error('无效的用户ID');
      return;
    }
    
    // 跳转到聊天页面
    wx.navigateTo({
      url: `/pages/message/chat/chat?userId=${id}`,
      fail: (err) => {
        console.error('跳转到聊天页面失败:', err);
        
        // 如果页面不存在，显示提示
        wx.showToast({
          title: '聊天功能暂未实现',
          icon: 'none'
        });
      }
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
    
    // 检查是否是模拟数据
    if (id.startsWith('following_')) {
      // 模拟添加好友成功
      setTimeout(() => {
        // 更新本地数据
        const following = [...this.data.following];
        following[index].isFriend = true;
        
        this.setData({ following });
        
        // 显示成功提示
        wx.showToast({
          title: '已添加好友',
          icon: 'success'
        });
        
        wx.hideLoading();
      }, 500);
      return;
    }
    
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
        let errorMsg = '添加好友失败';
        if (error.statusCode === 404) {
          errorMsg = '该用户不存在或API尚未实现';
        }
        
        wx.showToast({
          title: errorMsg,
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
