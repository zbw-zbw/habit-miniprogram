/**
 * 社区动态列表页面
 */
import { communityAPI } from '../../../services/api';
import { getFullImageUrl } from '../../../utils/image';
import { formatRelativeTime } from '../../../utils/util';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    posts: [],
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 10,
    tags: [],
    activeTag: '',
    hasLogin: false,
    activeTagIndex: 0,
    searchKeyword: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    const app = getApp();
    this.setData({
      hasLogin: app.globalData.hasLogin
    });
    
    // 如果有标签参数，设置为活动标签
    if (options.tag) {
      this.setData({
        activeTag: options.tag
      });
    }
    
    // 加载热门标签
    this.loadTags();
    
    // 加载动态列表
    this.loadPosts(true);
  },

  /**
   * 加载热门标签
   */
  loadTags() {
    communityAPI.getHotTopics()
      .then(topics => {
        // 取前10个热门话题的名称
        const tags = topics.slice(0, 10).map(topic => topic.name);
        this.setData({ tags });
      })
      .catch(error => {
        
      });
  },

  /**
   * 加载动态列表
   */
  loadPosts(isRefresh = false) {
    const { page, pageSize, activeTag } = this.data;
    
    // 如果是刷新，重置页码
    const currentPage = isRefresh ? 1 : page;
    
    // 显示加载中
    this.setData({
      loading: true
    });
    
    // 构建请求参数
    const params = {
      page: currentPage,
      pageSize,
      tag: activeTag || undefined
    };
    
    // 调用API获取动态列表
    communityAPI.getPosts(params)
      .then(result => {
        const { posts, hasMore } = result;
        
        // 处理图片URL和时间格式
        const processedPosts = posts.map(post => {
          // 处理用户头像
          if (post.userAvatar) {
            post.userAvatar = getFullImageUrl(post.userAvatar);
          }
          
          // 处理动态图片
          if (post.images && post.images.length > 0) {
            post.images = post.images.map(img => getFullImageUrl(img));
          }
          
          // 格式化发布时间
          post.createdAt = formatRelativeTime(post.createdAt || new Date());
          
          // 统一点赞数字段
          post.likes = post.likeCount || post.likes || 0;
          
          return post;
        });
        
        // 更新数据
        this.setData({
          posts: isRefresh ? processedPosts : [...this.data.posts, ...processedPosts],
          loading: false,
          hasMore,
          page: currentPage + 1
        });
      })
      .catch(error => {
        
        
        this.setData({
          loading: false
        });
        
        wx.showToast({
          title: '获取动态列表失败',
          icon: 'none'
        });
      });
  },

  /**
   * 标签切换处理
   */
  onTabChange(e) {
    const index = e.detail;
    // 如果是第一个标签（全部），则清空activeTag
    let activeTag = '';
    
    if (index > 0 && this.data.tags.length >= index) {
      activeTag = this.data.tags[index - 1]; // 减1是因为第一个标签是"全部"
    }
    
    this.setData({
      activeTagIndex: index,
      activeTag: activeTag,
      page: 1
    });
    
    // 重新加载动态列表
    this.loadPosts(true);
  },

  /**
   * 选择标签
   */
  selectTag(e) {
    const tag = e.currentTarget.dataset.tag;
    
    if (tag !== this.data.activeTag) {
      this.setData({
        activeTag: tag,
        page: 1
      });
      
      // 重新加载动态列表
      this.loadPosts(true);
    }
  },

  /**
   * 查看动态详情
   */
  viewPostDetail(e) {
    const { postId } = e.detail;
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${postId}`
    });
  },

  /**
   * 查看用户资料
   */
  viewUserProfile(e) {
    const { userId } = e.detail;
    wx.navigateTo({
      url: `/pages/community/user-profile/user-profile?id=${userId}`
    });
  },

  /**
   * 点赞/取消点赞
   */
  likePost(e) {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const { postId, index, isLiked } = e.detail;
    
    // 显示加载中
    wx.showLoading({
      title: '处理中'
    });
    
    // 调用API
    const apiCall = isLiked 
      ? communityAPI.unlikePost(postId) 
      : communityAPI.likePost(postId);
    
    apiCall
      .then(result => {
        // 更新本地数据
        const posts = this.data.posts;
        posts[index].isLiked = !isLiked;
        posts[index].likeCount = result.likeCount;
        posts[index].likes = result.likeCount;
        
        this.setData({ posts });
      })
      .catch(error => {
        
        
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
   * 评论动态
   */
  commentPost(e) {
    const { postId } = e.detail;
    wx.navigateTo({
      url: `/pages/community/post-detail/post-detail?id=${postId}&focus=comment`
    });
  },

  /**
   * 分享动态
   */
  sharePost(e) {
    // 获取动态ID和索引
    const { postId, index } = e.detail;
    
    // 如果没有提供索引，则尝试从event中获取
    const postIndex = index !== undefined ? index : e.currentTarget.dataset.index;
    
    // 获取动态数据
    const post = this.data.posts[postIndex];
    
    if (!post) {
      wx.showToast({
        title: '分享失败',
        icon: 'none'
      });
      return;
    }
    
    // 显示分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 跳转到搜索页面
   */
  navigateToSearch() {
    wx.navigateTo({
      url: '/pages/community/search/search'
    });
  },

  /**
   * 搜索输入处理
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail
    });
  },

  /**
   * 执行搜索
   */
  onSearch() {
    const { searchKeyword } = this.data;
    if (!searchKeyword.trim()) {
      return;
    }
    
    // 设置搜索参数并重新加载
    this.setData({
      page: 1,
      activeTag: '',
      activeTagIndex: 0
    });
    
    this.loadPosts(true);
  },

  /**
   * 清除搜索
   */
  clearSearch() {
    this.setData({
      searchKeyword: '',
      page: 1
    });
    
    this.loadPosts(true);
  },

  /**
   * 显示筛选选项
   */
  showFilter() {
    wx.showActionSheet({
      itemList: ['最新发布', '最多点赞', '最多评论'],
      success: (res) => {
        // 根据选择的筛选选项重新加载数据
        
        this.loadPosts(true);
      }
    });
  },

  /**
   * 创建动态
   */
  createPost() {
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/community/create-post/create-post'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadPosts(true);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadPosts();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(res) {
    if (res.from === 'button') {
      const { postId, index } = res.target.dataset;
      const post = this.data.posts[index];
      
      if (post) {
        return {
          title: `${post.userName || '用户'}的习惯打卡分享`,
          path: `/pages/community/post-detail/post-detail?id=${postId}`,
          imageUrl: post.images && post.images.length > 0 ? post.images[0] : '/assets/images/share-default.png'
        };
      }
    }
    
    return {
      title: '习惯打卡社区',
      path: '/pages/community/posts/posts'
    };
  }
}); 
 