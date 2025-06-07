/**
 * 个人中心页面
 */
import { formatDate } from '../../utils/date';
import { habitAPI, checkinAPI, userAPI } from '../../services/api';
import { IUserProfileAll, IUserInfo, IAppOption } from '../../utils/types';
import { login, logout } from '../../utils/auth';

// 声明微信小程序头像选择事件接口
interface ChooseAvatarEvent {
  detail: {
    avatarUrl: string;
  }
}

// 声明OnThemeChangeCallback类型
type OnThemeChangeCallback = (theme: string) => void;

// 扩展的用户信息接口，包含可能的nickname字段
interface IExtendedUserInfo extends IUserInfo {
  nickname?: string; // 添加可选的nickname字段，用于兼容后端
}

interface IPageData {
  userInfo: IExtendedUserInfo | null;
  hasLogin: boolean;
  loading: boolean;
  stats: {
    totalHabits: number;
    completedToday: number;
    totalCheckins: number;
    currentStreak: number;
    longestStreak: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    progress: number;
    isCompleted: boolean;
  }>;
  showModal: boolean;
  tempUserInfo: {
    nickName: string;
    avatarUrl: string;
  };
  isFirstLogin: boolean; // 是否首次登录
  nicknameLength: number; // 昵称长度计数
}

interface IPageMethods {
  loadUserInfo(): void;
  loadProfileData(): void;
  login(): void;
  logout(): void;
  showProfileModal(): void;
  hideProfileModal(): void;
  onNicknameBlur(e: WechatMiniprogram.Input): void;
  onNicknameInput(e: WechatMiniprogram.Input): void;
  onChooseAvatar(e: ChooseAvatarEvent): void;
  updateUserProfile(): void;
  updateProfileSuccess(nickName: string, avatarUrl: string): void;
  updateProfileFail(err: any): void;
  navigateTo(e: WechatMiniprogram.TouchEvent): void;
  navigateToAchievement(e: WechatMiniprogram.TouchEvent): void;
  formSubmit(e: WechatMiniprogram.FormSubmit): void;
}

Page<IPageData, IPageMethods>({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    hasLogin: false,
    loading: true,
    stats: {
      totalHabits: 0,
      completedToday: 0,
      totalCheckins: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
    achievements: [],
    showModal: false,
    tempUserInfo: {
      nickName: '',
      avatarUrl: '',
    },
    isFirstLogin: true, // 默认为首次登录
    nicknameLength: 0, // 昵称长度计数
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 页面加载时执行
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadUserInfo();
    this.loadProfileData();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const app = getApp<IAppOption>();

    // 判断是否首次登录（昵称为空或为"微信用户"）
    const isFirstLogin = !app.globalData.userInfo?.nickName || 
                         app.globalData.userInfo.nickName === '微信用户';

    this.setData({
      userInfo: app.globalData.userInfo as IExtendedUserInfo,
      hasLogin: app.globalData.hasLogin,
      'settings.theme': app.globalData.theme || 'light',
      isFirstLogin: isFirstLogin
    });

    // 监听主题变化
    if (typeof app.onThemeChange === 'function') {
      const callback = (theme: string) => {
        this.setData({
          'settings.theme': theme,
        });
      };
      app.onThemeChange(callback as any);
    }
  },

  /**
   * 加载个人资料数据
   */
  loadProfileData() {
    this.setData({ loading: true });

    // 检查是否已登录，未登录则不请求数据
    if (!this.data.hasLogin) {
      
      this.setData({
        loading: false,
        stats: {
          totalHabits: 0,
          completedToday: 0,
          totalCheckins: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        achievements: [],
      });
      return;
    }

    // 使用新的聚合API获取所有数据
    userAPI
      .getProfileAll()
      .then((data: IUserProfileAll) => {
        

        // 更新统计数据
        this.setData({
          'stats.totalHabits': data.stats.totalHabits,
          'stats.completedToday': data.stats.completedToday,
          'stats.totalCheckins': data.stats.totalCheckins,
          'stats.currentStreak': data.stats.currentStreak,
          'stats.longestStreak': data.stats.longestStreak,
          // 更新成就数据
          achievements: data.achievements,
          loading: false,
        });
      })
      .catch((error) => {
        
        this.setData({ loading: false });
      });
  },

  /**
   * 用户登录
   */
  login() {
    // 使用公共登录方法
    login((success) => {
      if (success) {
        // 登录成功后，获取最新的用户信息
        const app = getApp<IAppOption>();
        this.setData({
          userInfo: app.globalData.userInfo as IExtendedUserInfo,
          hasLogin: true,
        });
        
        // 登录成功后重新加载数据
        this.loadProfileData();
      }
    });
  },

  /**
   * 显示资料完善模态框
   */
  showProfileModal() {
    // 初始化临时用户信息
    const nickName = this.data.userInfo?.nickName || '微信用户';
    const avatarUrl = this.data.userInfo?.avatarUrl || '/assets/images/default-avatar.png';
    
    this.setData({
      showModal: true,
      tempUserInfo: {
        nickName: nickName,
        avatarUrl: avatarUrl,
      },
      nicknameLength: nickName.length // 初始化昵称长度计数
    });
  },

  /**
   * 隐藏资料完善模态框
   */
  hideProfileModal() {
    // 重置临时用户信息，避免下次打开显示旧数据
    const nickName = this.data.userInfo?.nickName || '微信用户';
    const avatarUrl = this.data.userInfo?.avatarUrl || '/assets/images/default-avatar.png';
    
    this.setData({
      showModal: false,
      tempUserInfo: {
        nickName: nickName,
        avatarUrl: avatarUrl
      },
      nicknameLength: nickName.length // 重置昵称长度计数
    });
  },

  /**
   * 处理昵称输入失去焦点
   */
  onNicknameBlur(e: WechatMiniprogram.Input) {
    const nickname = e.detail.value;
    
    if (!nickname) {
      return; // 如果为空，不更新
    }
    
    // 直接更新整个tempUserInfo对象
    this.setData({
      tempUserInfo: {
        nickName: nickname,
        avatarUrl: this.data.tempUserInfo.avatarUrl
      }
    });
  },

  /**
   * 处理昵称输入
   */
  onNicknameInput(e: WechatMiniprogram.Input) {
    const nickname = e.detail.value;
    
    this.setData({
      'tempUserInfo.nickName': nickname,
      nicknameLength: nickname.length
    });
  },

  /**
   * 处理头像选择
   */
  onChooseAvatar(e: ChooseAvatarEvent) {
    const tempPath = e.detail.avatarUrl;
    
    // 获取当前昵称，确保不会丢失
    const currentNickName = this.data.tempUserInfo.nickName;
    
    // 更新临时头像，同时保留当前昵称
    this.setData({
      tempUserInfo: {
        nickName: currentNickName, // 保留当前昵称
        avatarUrl: tempPath
      }
    });
    
    wx.showToast({
      title: '已选择头像',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 更新用户资料
   */
  updateUserProfile() {
    // 获取最新的临时用户信息
    const { nickName, avatarUrl } = this.data.tempUserInfo;
    
    // 验证输入
    if (!nickName.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '更新资料中',
    });
    
    // 准备要发送到服务器的用户数据
    const userData = {
      nickName: nickName,
      nickname: nickName // 同时设置nickname，确保兼容后端
    } as any; // 使用any类型断言
    
    // 如果头像是临时文件路径，需要先上传
    if (avatarUrl && (avatarUrl.startsWith('wxfile://') || avatarUrl.startsWith('http://tmp/'))) {
      // 先上传头像
      userAPI.updateAvatar(avatarUrl)
        .then(response => {
          // 获取服务器返回的头像URL
          const serverAvatarUrl = response.avatarUrl;
          
          // 上传成功后，更新用户资料
          return userAPI.updateProfile({
            ...userData,
            avatarUrl: serverAvatarUrl
          }).then(() => {
            // 返回服务器头像URL，以便后续使用
            return serverAvatarUrl;
          });
        })
        .then((serverAvatarUrl) => {
          // 成功后处理，使用当前的昵称和服务器返回的头像URL
          this.updateProfileSuccess(nickName, serverAvatarUrl || avatarUrl);
        })
        .catch(err => {
          this.updateProfileFail(err);
        });
    } else {
      // 更新用户资料
      userAPI.updateProfile({
        ...userData,
        avatarUrl: avatarUrl
      })
        .then(() => {
          this.updateProfileSuccess(nickName, avatarUrl);
        })
        .catch(err => {
          this.updateProfileFail(err);
        });
    }
  },
  
  /**
   * 更新资料成功处理
   */
  updateProfileSuccess(nickName: string, avatarUrl: string) {
    const app = getApp<IAppOption>();
    
    // 更新全局用户信息
    if (app.globalData.userInfo) {
      // 使用类型断言来绕过TypeScript的类型检查
      app.globalData.userInfo = {
        ...app.globalData.userInfo,
        nickName: nickName, // 使用nickName属性名，与IUserInfo接口一致
        nickname: nickName, // 同时设置nickname，确保兼容后端
        avatarUrl: avatarUrl
      } as IExtendedUserInfo;
      
      // 更新本地存储
      wx.setStorageSync('userInfo', app.globalData.userInfo);
      
      // 更新页面数据
      this.setData({
        userInfo: app.globalData.userInfo as IExtendedUserInfo,
        showModal: false,
        isFirstLogin: false // 更新资料后不再是首次登录
      });
    } else {
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      });
      return;
    }
    
    wx.hideLoading();
    wx.showToast({
      title: '资料更新成功',
      icon: 'success'
    });
  },
  
  /**
   * 更新资料失败处理
   */
  updateProfileFail(err: any) {
    wx.hideLoading();
    wx.showToast({
      title: '资料更新失败',
      icon: 'error'
    });
  },

  /**
   * 用户登出
   */
  logout() {
    // 使用公共登出方法
    logout(() => {
      this.setData({
        userInfo: null,
        hasLogin: false,
        stats: {
          totalHabits: 0,
          completedToday: 0,
          totalCheckins: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        achievements: [],
      });
    });
  },

  /**
   * 导航到指定页面
   */
  navigateTo(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  /**
   * 导航到成就详情页
   */
  navigateToAchievement(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/profile/achievements/detail/detail?id=${id}`,
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的习惯养成进度',
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-profile.png',
    };
  },

  /**
   * 处理表单提交
   */
  formSubmit(e: WechatMiniprogram.FormSubmit) {
    const formData = e.detail.value;
    const nickName = formData.nickname;
    const avatarUrl = this.data.tempUserInfo.avatarUrl;
    
    // 验证输入
    if (!nickName || !nickName.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    // 更新临时用户信息中的昵称
    this.setData({
      'tempUserInfo.nickName': nickName
    });
    
    wx.showLoading({
      title: '更新资料中',
    });
    
    // 准备要发送到服务器的用户数据
    const userData = {
      nickName: nickName,
      nickname: nickName // 同时设置nickname，确保兼容后端
    } as any; // 使用any类型断言
    
    // 如果头像是临时文件路径，需要先上传
    if (avatarUrl && (avatarUrl.startsWith('wxfile://') || avatarUrl.startsWith('http://tmp/'))) {
      // 先上传头像
      userAPI.updateAvatar(avatarUrl)
        .then(response => {
          // 获取服务器返回的头像URL
          const serverAvatarUrl = response.avatarUrl;
          
          // 上传成功后，更新用户资料
          return userAPI.updateProfile({
            ...userData,
            avatarUrl: serverAvatarUrl
          }).then(() => {
            // 返回服务器头像URL，以便后续使用
            return serverAvatarUrl;
          });
        })
        .then((serverAvatarUrl) => {
          // 成功后处理，使用当前的昵称和服务器返回的头像URL
          this.updateProfileSuccess(nickName, serverAvatarUrl || avatarUrl);
        })
        .catch(err => {
          this.updateProfileFail(err);
        });
    } else {
      // 更新用户资料
      userAPI.updateProfile({
        ...userData,
        avatarUrl: avatarUrl
      })
        .then(() => {
          this.updateProfileSuccess(nickName, avatarUrl);
        })
        .catch(err => {
          this.updateProfileFail(err);
        });
    }
  },
});
