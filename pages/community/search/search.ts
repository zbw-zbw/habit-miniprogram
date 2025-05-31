// 社区搜索页面
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
}

interface ITopicResult {
  id: string;
  name: string;
  postsCount: number;
  participantsCount: number;
  isTrending: boolean;
}

interface IPostResult {
  id: string;
  userAvatar: string;
  userName: string;
  createdAt: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
}

type TabType = 'all' | 'users' | 'groups' | 'topics' | 'posts';

Page({
  data: {
    keyword: '',
    searchHistory: [] as string[],
    hotSearches: [
      '健身打卡',
      '早起习惯',
      '阅读挑战',
      '冥想',
      '学习英语',
      '每日喝水',
      '跑步',
      '饮食记录',
      '写作'
    ],
    activeTab: 'all' as TabType,
    loading: false,
    results: [] as any[],
    userResults: [] as IUserResult[],
    groupResults: [] as IGroupResult[],
    topicResults: [] as ITopicResult[],
    postResults: [] as IPostResult[],
    hasMore: false,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    // 获取搜索历史
    const searchHistory = wx.getStorageSync('searchHistory') || [];
    this.setData({
      searchHistory
    });
  },

  // 输入搜索内容
  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({
      keyword: e.detail.value
    });

    // 如果输入为空，重置搜索结果
    if (!e.detail.value) {
      this.resetSearch();
    }
  },

  // 执行搜索
  onSearch() {
    const { keyword } = this.data;
    if (!keyword.trim()) return;

    // 保存搜索历史
    this.saveSearchHistory(keyword);

    // 重置页码和搜索结果
    this.setData({
      activeTab: 'all',
      loading: true,
      results: [],
      userResults: [],
      groupResults: [],
      topicResults: [],
      postResults: [],
      page: 1
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
      keyword: ''
    });
    this.resetSearch();
  },

  // 重置搜索结果
  resetSearch() {
    this.setData({
      results: [],
      userResults: [],
      groupResults: [],
      topicResults: [],
      postResults: [],
      page: 1,
      hasMore: false,
      loading: false
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
    const { keyword, page, pageSize } = this.data;

    // 模拟API请求
    setTimeout(() => {
      // 模拟数据
      const mockResults = {
        users: [
          {
            id: 'user1',
            avatar: '/assets/images/avatar1.png',
            nickname: '健身达人',
            bio: '每天坚持运动，保持健康生活方式',
            isFollowing: false
          },
          {
            id: 'user2',
            avatar: '/assets/images/avatar2.png',
            nickname: '阅读小子',
            bio: '爱读书，爱生活',
            isFollowing: true
          }
        ],
        groups: [
          {
            id: 'group1',
            avatar: '/assets/images/group1.png',
            name: '每日运动小组',
            description: '一起坚持运动，共同成长',
            membersCount: 234,
            postsCount: 1256,
            isJoined: false
          },
          {
            id: 'group2',
            avatar: '/assets/images/group2.png',
            name: '读书会',
            description: '分享读书心得，推荐好书',
            membersCount: 125,
            postsCount: 896,
            isJoined: true
          }
        ],
        topics: [
          {
            id: 'topic1',
            name: '健身打卡',
            postsCount: 1234,
            participantsCount: 567,
            isTrending: true
          },
          {
            id: 'topic2',
            name: '早起习惯',
            postsCount: 896,
            participantsCount: 432,
            isTrending: false
          }
        ],
        posts: [
          {
            id: 'post1',
            userAvatar: '/assets/images/avatar1.png',
            userName: '健身达人',
            createdAt: '2小时前',
            content: '今天完成了5公里跑步，感觉很好！#健身打卡#',
            images: ['/assets/images/post1.png'],
            likes: 45,
            comments: 12
          },
          {
            id: 'post2',
            userAvatar: '/assets/images/avatar2.png',
            userName: '阅读小子',
            createdAt: '昨天',
            content: '这本书真的很推荐，让我对生活有了新的思考。#读书分享#',
            images: ['/assets/images/post2.png', '/assets/images/post3.png'],
            likes: 32,
            comments: 8
          }
        ]
      };

      this.setData({
        loading: false,
        userResults: page === 1 ? mockResults.users : [...this.data.userResults, ...mockResults.users],
        groupResults: page === 1 ? mockResults.groups : [...this.data.groupResults, ...mockResults.groups],
        topicResults: page === 1 ? mockResults.topics : [...this.data.topicResults, ...mockResults.topics],
        postResults: page === 1 ? mockResults.posts : [...this.data.postResults, ...mockResults.posts],
        results: [
          ...mockResults.users,
          ...mockResults.groups,
          ...mockResults.topics,
          ...mockResults.posts
        ],
        hasMore: page < 3, // 模拟只有3页数据
        page: page + 1
      });
    }, 1000);
  },

  // 加载更多
  loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
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

  // 查看话题详情
  viewTopicDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/community/tag/tag?id=${id}`
    });
  },

  // 查看动态详情
  viewPostDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${id}`
    });
  },

  // 关注/取消关注用户
  toggleFollow(e: WechatMiniprogram.TouchEvent) {
    const { id, index } = e.currentTarget.dataset;
    const userResults = [...this.data.userResults];
    userResults[index].isFollowing = !userResults[index].isFollowing;
    this.setData({ userResults });
  },

  // 加入/退出小组
  toggleJoin(e: WechatMiniprogram.TouchEvent) {
    const { id, index } = e.currentTarget.dataset;
    const groupResults = [...this.data.groupResults];
    groupResults[index].isJoined = !groupResults[index].isJoined;
    this.setData({ groupResults });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
}); 
