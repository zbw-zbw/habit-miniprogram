/**
 * 社区搜索页面
 */
import { communityAPI } from '../../../services/api';
import { getFullImageUrl } from '../../../utils/image';
import { useAuth } from '../../../utils/use-auth';
import { formatRelativeTime } from '../../../utils/util';
import { IAppOption } from '../../../app';

interface IUserResult {
  id: string;
  avatar: string;
  nickname: string;
  bio: string;
  isFollowing: boolean;
}

interface IGroupResult {
  id: string;
  avatar: string;
  name: string;
  description: string;
  membersCount: number;
  postsCount: number;
  isJoined: boolean;
  creator?: {
    _id?: string;
    id?: string;
    username?: string;
    nickname?: string;
    avatar?: string;
  };
}

interface IChallengeResult {
  id: string;
  name: string;
  description: string;
  image: string;
  participantsCount: number;
  participants?: number; // 兼容不同的API返回格式
  isJoined: boolean;
  isParticipating?: boolean;
  creator?: {
    _id?: string;
    id?: string;
    username?: string;
    nickname?: string;
    avatar?: string;
  };
}

interface IPostResult {
  id: string;
  userId?: string;
  userAvatar: string;
  userName: string;
  createdAt: string;
  content: string;
  images: string[];
  tags?: string[];
  likes: number;
  likeCount?: number;
  comments: number;
  isLiked?: boolean;
  habitName?: string;
}

type TabType = 'all' | 'users' | 'groups' | 'challenges' | 'posts';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    keyword: '',
    searchHistory: [] as string[],
    hotSearches: [] as string[],
    activeTab: 'all' as TabType,
    loading: false,
    results: [] as any[],
    userResults: [] as IUserResult[],
    groupResults: [] as IGroupResult[],
    challengeResults: [] as IChallengeResult[],
    postResults: [] as IPostResult[],
    hasMore: false,
    page: 1,
    pageSize: 10,
    hasLogin: false,
    isSearched: false // 标记是否已经执行过搜索
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 使用useAuth工具获取全局登录状态
    useAuth(this);
    
    // 获取搜索历史
    const searchHistory = wx.getStorageSync('searchHistory') || [];
    this.setData({
      searchHistory
    });
    
    // 加载热门搜索词
    this.loadHotSearches();
  },

  // 加载热门搜索词
  loadHotSearches() {
    communityAPI.getHotSearches()
      .then(hotSearches => {
        this.setData({ hotSearches });
      })
      .catch(() => {
        // 加载失败时使用默认热门搜索
        this.setData({
          hotSearches: ['习惯养成', '早起', '阅读', '运动健身', '冥想']
        });
    });
  },

  // 输入搜索内容
  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({
      keyword: e.detail.value
    });

    // 移除输入过程中的过滤操作，只在用户回车或点击搜索按钮时触发搜索
    if (!e.detail.value) {
      this.setData({
        results: [],
        userResults: [],
        groupResults: [],
        challengeResults: [],
        postResults: []
      });
    }
  },

  // 执行搜索
  onSearch() {
    const { keyword } = this.data;
    if (!keyword || !keyword.trim()) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      });
      return;
    }

    // 保存搜索历史
    this.saveSearchHistory(keyword);

    // 重置页码和搜索结果
    this.setData({
      activeTab: 'all',
      loading: true,
      results: [],
      userResults: [],
      groupResults: [],
      challengeResults: [],
      postResults: [],
      page: 1,
      isSearched: true // 标记已执行搜索
    });

    // 执行搜索
    this.fetchSearchResults();
  },

  // 保存搜索历史
  saveSearchHistory(keyword: string) {
    let { searchHistory } = this.data;
    
    // 如果已经存在，先移除
    searchHistory = searchHistory.filter(item => item !== keyword);
    
    // 添加到头部
    searchHistory.unshift(keyword);
    
    // 最多保存10条
    if (searchHistory.length > 10) {
      searchHistory = searchHistory.slice(0, 10);
    }

    this.setData({ searchHistory });
    wx.setStorageSync('searchHistory', searchHistory);
  },

  // 清除搜索输入
  clearSearch() {
    this.setData({
      keyword: '',
      results: [],
      userResults: [],
      groupResults: [],
      challengeResults: [],
      postResults: [],
      isSearched: false // 重置搜索状态
    });
  },

  // 重置搜索结果
  resetSearch() {
    this.setData({
      results: [],
      userResults: [],
      groupResults: [],
      challengeResults: [],
      postResults: [],
      page: 1,
      hasMore: false,
      loading: false,
      isSearched: false // 重置搜索状态
    });
  },

  // 使用历史关键词
  useHistoryKeyword(e: WechatMiniprogram.TouchEvent) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.onSearch();
  },

  // 使用热门关键词
  useHotKeyword(e: WechatMiniprogram.TouchEvent) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.onSearch();
  },

  // 切换标签
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as TabType;
    this.setData({ activeTab: tab });
  },

  // 获取搜索结果
  fetchSearchResults() {
    const { keyword, activeTab, page, pageSize } = this.data;

    if (!keyword.trim()) {
      return;
    }
    
    this.setData({ loading: true });
    
    communityAPI.search({
      keyword,
      type: activeTab,
      page,
      limit: pageSize
    })
      .then(results => {
        if (activeTab === 'all') {
          // 处理图片URL和时间格式化
          const processedUsers = (results.users || []).map(user => ({
            ...user,
            avatar: getFullImageUrl(user.avatar)
          }));
          
          const processedGroups = (results.groups || []).map(group => {
            // 获取当前用户ID
            const app = getApp<IAppOption>();
            const currentUserId = app?.globalData?.userInfo?.id;
            
            console.log('处理小组数据:', group);
            console.log('当前用户ID:', currentUserId);
            
            // 如果当前用户是创建者，则标记为已加入
            const isCreator = group.creator && 
              (group.creator._id === currentUserId || (group.creator as any).id === currentUserId);
            
            console.log('是否是创建者:', isCreator);
            console.log('原始isJoined:', group.isJoined);
            
            return {
              ...group,
              avatar: getFullImageUrl(group.avatar),
              // 如果用户是创建者或服务端返回了已加入字段，则标记为已加入
              isJoined: isCreator || group.isJoined || false
            };
          });
          
          // 处理挑战数据，确保 isJoined 和 isParticipating 字段存在
          const processedChallenges = (results.challenges || []).map(challenge => {
            // 获取当前用户ID
            const app = getApp<IAppOption>();
            const currentUserId = app?.globalData?.userInfo?.id;
            
            console.log('处理挑战数据:', challenge);
            console.log('当前用户ID:', currentUserId);
            
            // 检查挑战是否已参与的逻辑
            // 如果当前用户是创建者，则标记为已参与
            const isCreator = challenge.creator && 
              (challenge.creator._id === currentUserId || (challenge.creator as any).id === currentUserId);
            
            console.log('是否是创建者:', isCreator);
            console.log('原始isJoined:', challenge.isJoined);
            console.log('原始isParticipating:', challenge.isParticipating);
            
            // 确保参与人数至少为1（如果有创建者）
            const participantsCount = challenge.participantsCount || challenge.participants || 0;
            const adjustedParticipantsCount = isCreator && participantsCount === 0 ? 1 : participantsCount;
            
            return {
              ...challenge,
              image: getFullImageUrl(challenge.image),
              // 如果用户是创建者或服务端返回了这些字段，则标记为已参与
              isJoined: isCreator || challenge.isJoined || challenge.isParticipating || false,
              isParticipating: isCreator || challenge.isJoined || challenge.isParticipating || false,
              isCreator: isCreator, // 添加创建者标识
              // 确保 participantsCount 字段存在
              participantsCount: adjustedParticipantsCount,
              participants: adjustedParticipantsCount
            };
          });
          
          const processedPosts = (results.posts || []).map(post => ({
            ...post,
            userAvatar: getFullImageUrl(post.userAvatar),
            images: (post.images || []).map(img => getFullImageUrl(img)),
            createdAt: formatRelativeTime(post.createdAt || new Date()),
            likes: post.likeCount || post.likes || 0
          }));

          // 计算总结果数量
          const totalResults = processedUsers.length + processedGroups.length + 
                              processedChallenges.length + processedPosts.length;

          this.setData({
            userResults: processedUsers,
            groupResults: processedGroups,
            challengeResults: processedChallenges,
            postResults: processedPosts,
            loading: false,
            results: totalResults > 0 ? [1] : [] // 用于判断是否有搜索结果
          });
        } else if (activeTab === 'users') {
          const users = results.users || [];
          const processedUsers = users.map(user => ({
            ...user,
            avatar: getFullImageUrl(user.avatar)
          }));
          
          const newUsers = page === 1 ? processedUsers : [...this.data.userResults, ...processedUsers];
          
          this.setData({
            userResults: newUsers,
            loading: false,
            hasMore: users && users.length === pageSize,
            results: newUsers.length > 0 ? [1] : [] // 用于判断是否有搜索结果
          });
        } else if (activeTab === 'groups') {
          const groups = results.groups || [];
          const processedGroups = groups.map(group => {
            // 获取当前用户ID
            const app = getApp<IAppOption>();
            const currentUserId = app?.globalData?.userInfo?.id;
            
            console.log('处理小组数据(tab):', group);
            console.log('当前用户ID(tab):', currentUserId);
            
            // 如果当前用户是创建者，则标记为已加入
            const isCreator = group.creator && 
              (group.creator._id === currentUserId || (group.creator as any).id === currentUserId);
            
            console.log('是否是创建者(tab):', isCreator);
            console.log('原始isJoined(tab):', group.isJoined);
            
            return {
              ...group,
              avatar: getFullImageUrl(group.avatar),
              // 如果用户是创建者或服务端返回了已加入字段，则标记为已加入
              isJoined: isCreator || group.isJoined || false
            };
          });
          
          const newGroups = page === 1 ? processedGroups : [...this.data.groupResults, ...processedGroups];
          
          this.setData({
            groupResults: newGroups,
            loading: false,
            hasMore: groups && groups.length === pageSize,
            results: newGroups.length > 0 ? [1] : [] // 用于判断是否有搜索结果
          });
        } else if (activeTab === 'challenges') {
          const challenges = results.challenges || [];
          // 处理挑战数据，确保 isJoined 和 isParticipating 字段存在
          const processedChallenges = challenges.map(challenge => {
            // 获取当前用户ID
            const app = getApp<IAppOption>();
            const currentUserId = app?.globalData?.userInfo?.id;
            
            console.log('处理挑战数据(tab):', challenge);
            console.log('当前用户ID(tab):', currentUserId);
            
            // 检查挑战是否已参与的逻辑
            // 如果当前用户是创建者，则标记为已参与
            const isCreator = challenge.creator && 
              (challenge.creator._id === currentUserId || (challenge.creator as any).id === currentUserId);
            
            console.log('是否是创建者(tab):', isCreator);
            console.log('原始isJoined(tab):', challenge.isJoined);
            console.log('原始isParticipating(tab):', challenge.isParticipating);
            
            // 确保参与人数至少为1（如果有创建者）
            const participantsCount = challenge.participantsCount || challenge.participants || 0;
            const adjustedParticipantsCount = isCreator && participantsCount === 0 ? 1 : participantsCount;
            
            return {
              ...challenge,
              image: getFullImageUrl(challenge.image),
              // 如果用户是创建者或服务端返回了这些字段，则标记为已参与
              isJoined: isCreator || challenge.isJoined || challenge.isParticipating || false,
              isParticipating: isCreator || challenge.isJoined || challenge.isParticipating || false,
              isCreator: isCreator, // 添加创建者标识
              // 确保 participantsCount 字段存在
              participantsCount: adjustedParticipantsCount,
              participants: adjustedParticipantsCount
            };
          });
          
          const newChallenges = page === 1 ? processedChallenges : [...this.data.challengeResults, ...processedChallenges];
          
          this.setData({
            challengeResults: newChallenges,
            loading: false,
            hasMore: challenges && challenges.length === pageSize,
            results: newChallenges.length > 0 ? [1] : [] // 用于判断是否有搜索结果
          });
        } else if (activeTab === 'posts') {
          const posts = results.posts || [];
          const processedPosts = posts.map(post => ({
            ...post,
            userAvatar: getFullImageUrl(post.userAvatar),
            images: (post.images || []).map(img => getFullImageUrl(img)),
            createdAt: formatRelativeTime(post.createdAt || new Date()),
            likes: post.likeCount || post.likes || 0
          }));
          
          const newPosts = page === 1 ? processedPosts : [...this.data.postResults, ...processedPosts];
          
          this.setData({
            postResults: newPosts,
            loading: false,
            hasMore: posts && posts.length === pageSize,
            results: newPosts.length > 0 ? [1] : [] // 用于判断是否有搜索结果
          });
        }
      })
      .catch(error => {
        console.error('搜索失败:', error);
        this.setData({ loading: false });
        wx.showToast({
          title: '搜索失败',
          icon: 'none'
        });
      });
  },

  // 加载更多结果
  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({
      page: this.data.page + 1
    });
    
    this.fetchSearchResults();
  },

  // 清除搜索历史
  clearHistory() {
    this.setData({ searchHistory: [] });
    wx.setStorageSync('searchHistory', []);
  },

  // 查看用户资料
  viewUserProfile(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/profile/profile?id=${id}`
    });
  },

  // 查看小组详情
  viewGroupDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/community/groups/detail/detail?id=${id}`
    });
  },

  // 查看挑战详情
  viewChallengeDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/community/challenges/detail/detail?id=${id}`
    });
  },

  // 查看动态详情
  viewPostDetail(e: WechatMiniprogram.TouchEvent) {
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

  // 切换关注状态
  toggleFollow(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const { id, index } = e.currentTarget.dataset;
    const { userResults } = this.data;
    const user = userResults[index];
    
    if (!user) return;
    
    const isFollow = !user.isFollowing;
    
    wx.showLoading({ title: '处理中' });
    
    communityAPI.followUser(id, isFollow)
      .then(() => {
        this.setData({
          [`userResults[${index}].isFollowing`]: isFollow
        });
      })
      .catch(error => {
        console.error('操作失败:', error);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  // 切换加入状态
  toggleJoin(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const { id, index } = e.currentTarget.dataset;
    const { groupResults } = this.data;
    const group = groupResults[index];
    
    if (!group) return;
    
    // 检查是否已经加入
    if (group.isJoined) {
      wx.showToast({
        title: '已加入该小组',
        icon: 'none'
      });
      return;
    }
    
    const isJoined = !group.isJoined;
    
    wx.showLoading({ title: '处理中' });
    
    if (isJoined) {
      communityAPI.joinGroup(id)
        .then(() => {
          // 更新本地状态
          this.setData({
            [`groupResults[${index}].isJoined`]: true,
            // 增加成员数
            [`groupResults[${index}].membersCount`]: (group.membersCount || 0) + 1
          });
          
          wx.showToast({
            title: '已成功加入',
            icon: 'success'
          });
        })
        .catch(error => {
          console.error('加入失败:', error);
          
          // 如果服务端返回已加入的错误，更新本地状态
          if (error && error.message && error.message.includes('已加入') || error.message.includes('已经是成员')) {
            this.setData({
              [`groupResults[${index}].isJoined`]: true
            });
            
            wx.showToast({
              title: '已加入该小组',
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: '加入失败',
              icon: 'none'
            });
          }
        })
        .finally(() => {
          wx.hideLoading();
        });
    } else {
      communityAPI.leaveGroup(id)
        .then(() => {
          // 更新本地状态
          this.setData({
            [`groupResults[${index}].isJoined`]: false,
            // 减少成员数，确保不小于0
            [`groupResults[${index}].membersCount`]: Math.max(0, (group.membersCount || 0) - 1)
          });
          
          wx.showToast({
            title: '已退出小组',
            icon: 'success'
          });
        })
        .catch(error => {
          console.error('退出失败:', error);
          wx.showToast({
            title: '退出失败',
            icon: 'none'
          });
        })
        .finally(() => {
          wx.hideLoading();
        });
    }
  },

  // 切换挑战参与状态
  toggleJoinChallenge(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const { id, index } = e.currentTarget.dataset;
    const { challengeResults } = this.data;
    const challenge = challengeResults[index];
    
    if (!challenge) return;
    
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
              title: '处理中...'
            });
            
            // 调用API解散挑战
            communityAPI.dismissChallenge(id)
              .then(() => {
                // 从列表中移除该挑战
                challengeResults.splice(index, 1);
                this.setData({ challengeResults });
                
                wx.showToast({
                  title: '挑战已解散',
                  icon: 'success'
                });
              })
              .catch(error => {
                console.error('解散挑战失败:', error);
                
                wx.showToast({
                  title: '解散挑战失败',
                  icon: 'none'
                });
              })
              .finally(() => {
                wx.hideLoading();
              });
          }
        }
      });
      return;
    }
    
    // 检查是否已经参与
    if (challenge.isJoined) {
      wx.showToast({
        title: '已参与此挑战',
        icon: 'none'
      });
      return;
    }
    
    const isJoined = !challenge.isJoined;
    
    wx.showLoading({ title: '处理中' });
    
    if (isJoined) {
      communityAPI.joinChallenge(id)
        .then(() => {
          // 更新本地状态
          this.setData({
            [`challengeResults[${index}].isJoined`]: true,
            [`challengeResults[${index}].isParticipating`]: true,
            // 增加参与人数
            [`challengeResults[${index}].participants`]: (challenge.participants || 0) + 1,
            [`challengeResults[${index}].participantsCount`]: (challenge.participantsCount || challenge.participants || 0) + 1
          });
          
          wx.showToast({
            title: '已成功参加',
            icon: 'success'
          });
        })
        .catch(error => {
          console.error('参与失败:', error);
          
          // 如果服务端返回已参与的错误，更新本地状态
          if (error && error.message && error.message.includes('已经参与')) {
            this.setData({
              [`challengeResults[${index}].isJoined`]: true,
              [`challengeResults[${index}].isParticipating`]: true
            });
            
            wx.showToast({
              title: '已参与此挑战',
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: '参与失败',
              icon: 'none'
            });
          }
        })
        .finally(() => {
          wx.hideLoading();
        });
    } else {
      communityAPI.leaveChallenge(id)
        .then(() => {
          this.setData({
            [`challengeResults[${index}].isJoined`]: false,
            [`challengeResults[${index}].isParticipating`]: false,
            // 减少参与人数，确保不小于1（如果有创建者）
            [`challengeResults[${index}].participants`]: Math.max(1, (challenge.participants || 0) - 1),
            [`challengeResults[${index}].participantsCount`]: Math.max(1, (challenge.participantsCount || challenge.participants || 0) - 1)
          });
          
          wx.showToast({
            title: '已退出挑战',
            icon: 'success'
          });
        })
        .catch(error => {
          console.error('退出失败:', error);
          wx.showToast({
            title: '退出失败',
            icon: 'none'
          });
        })
        .finally(() => {
          wx.hideLoading();
        });
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  /**
   * 点赞动态
   */
  likePost(e: WechatMiniprogram.TouchEvent) {
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
    
    const post = this.data.postResults[index];
    const isLiked = post.isLiked;
    
    // 乐观更新UI
    const postResults = [...this.data.postResults];
    postResults[index].isLiked = !isLiked;
    postResults[index].likes = isLiked 
      ? Math.max(0, postResults[index].likes - 1)
      : postResults[index].likes + 1;
    
    this.setData({ postResults });
    
    // 调用API
    const apiCall = isLiked 
      ? communityAPI.unlikePost(postId)
      : communityAPI.likePost(postId);
    
    apiCall.then(response => {
      // 使用服务器返回的实际点赞数和点赞状态
      const postResults = [...this.data.postResults];
      postResults[index].isLiked = response.isLiked;
      postResults[index].likes = response.likeCount;
      
      this.setData({ postResults });
    }).catch(error => {
      console.error('点赞操作失败:', error);
      
      // 恢复原状态
      const postResults = [...this.data.postResults];
      postResults[index].isLiked = isLiked;
      postResults[index].likes = isLiked 
        ? postResults[index].likes + 1
        : Math.max(0, postResults[index].likes - 1);
      
      this.setData({ postResults });
      
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
   * 分享动态
   */
  sharePost(e: WechatMiniprogram.TouchEvent) {
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
