/**
 * 添加好友页面
 */
import { communityAPI } from '../../../services/api';
import { useAuth } from '../../../utils/use-auth';

interface IUser {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  isFriend: boolean;
}

interface IPageData {
  hasLogin: boolean;
  searchKeyword: string;
  hasSearched: boolean;
  loading: boolean;
  loadingRecommend: boolean;
  users: IUser[];
  recommendUsers: IUser[];
}

Page<IPageData, {
  goBack(): void;
  inputKeyword(e: WechatMiniprogram.Input): void;
  clearKeyword(): void;
  searchUsers(): void;
  loadRecommendUsers(): void;
  viewUserProfile(e: WechatMiniprogram.TouchEvent): void;
  addFriend(e: WechatMiniprogram.TouchEvent): void;
  addRecommendFriend(e: WechatMiniprogram.TouchEvent): void;
  scanQRCode(): void;
}>({
  /**
   * 页面的初始数据
   */
  data: {
    hasLogin: false,
    searchKeyword: '',
    hasSearched: false,
    loading: false,
    loadingRecommend: true,
    users: [],
    recommendUsers: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 使用useAuth工具获取全局登录状态
    useAuth(this);
    
    // 检查登录状态
    if (!this.data.hasLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
      return;
    }
    
    // 加载推荐好友
    this.loadRecommendUsers();
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 输入搜索关键词
   */
  inputKeyword(e: WechatMiniprogram.Input) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 清空搜索关键词
   */
  clearKeyword() {
    this.setData({
      searchKeyword: ''
    });
  },

  /**
   * 搜索用户
   */
  searchUsers() {
    const { searchKeyword } = this.data;
    
    if (!searchKeyword.trim()) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      loading: true,
      hasSearched: true
    });
    
    communityAPI.searchUsers({
      keyword: searchKeyword.trim()
    })
      .then(users => {
        this.setData({
          users,
          loading: false
        });
      })
      .catch(error => {
        
        this.setData({
          users: [],
          loading: false
        });
        wx.showToast({
          title: '搜索失败',
          icon: 'none'
        });
      });
  },

  /**
   * 加载推荐好友
   */
  loadRecommendUsers() {
    this.setData({
      loadingRecommend: true
    });
    
    communityAPI.getRecommendUsers()
      .then(users => {
        this.setData({
          recommendUsers: users,
          loadingRecommend: false
        });
      })
      .catch(error => {
        
        this.setData({
          recommendUsers: [],
          loadingRecommend: false
        });
      });
  },

  /**
   * 查看用户资料
   */
  viewUserProfile(e: WechatMiniprogram.TouchEvent) {
    console.log(e);
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community/user-profile/user-profile?id=${id}`
    });
  },

  /**
   * 添加好友（搜索结果）
   */
  addFriend(e: WechatMiniprogram.TouchEvent) {
    const { id, index } = e.currentTarget.dataset;
    
    wx.showLoading({
      title: '处理中'
    });
    
    communityAPI.addFriend(id)
      .then(() => {
        // 更新本地状态
        this.setData({
          [`users[${index}].isFriend`]: true
        });
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
      })
      .catch(error => {
        
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 添加好友（推荐列表）
   */
  addRecommendFriend(e: WechatMiniprogram.TouchEvent) {
    const { id, index } = e.currentTarget.dataset;
    
    wx.showLoading({
      title: '处理中'
    });
    
    communityAPI.addFriend(id)
      .then(() => {
        // 更新本地状态
        this.setData({
          [`recommendUsers[${index}].isFriend`]: true
        });
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
      })
      .catch(error => {
        
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 扫码添加好友
   */
  scanQRCode() {
    wx.scanCode({
      success: (res) => {
        // 处理扫码结果
        const scanResult = res.result;
        
        // 判断是否是好友二维码
        if (scanResult.startsWith('habit-tracker://friend/')) {
          const userId = scanResult.replace('habit-tracker://friend/', '');
          
          // 添加好友
          wx.showLoading({
            title: '处理中'
          });
          
          communityAPI.addFriend(userId)
            .then(() => {
              wx.showToast({
                title: '添加成功',
                icon: 'success'
              });
              
              // 刷新推荐好友列表
              this.loadRecommendUsers();
            })
            .catch(error => {
              
              wx.showToast({
                title: '添加失败',
                icon: 'none'
              });
            })
            .finally(() => {
              wx.hideLoading();
            });
        } else {
          wx.showToast({
            title: '无效的好友码',
            icon: 'none'
          });
        }
      },
      fail: () => {
        // 用户取消扫码
      }
    });
  }
}); 
