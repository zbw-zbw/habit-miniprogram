// 用户资料设置页面
import { IUserInfo } from '../../../utils/types';

interface IPageData {
  code: string;
  nickname: string;
  avatarUrl: string;
  tempFilePath: string;
  nicknameError: string;
  isSubmitting: boolean;
}

interface IPageMethods {
  onLoad(options: { code: string }): void;
  inputNickname(e: WechatMiniprogram.Input): void;
  chooseAvatar(e: WechatMiniprogram.CustomEvent): void;
  submitUserInfo(): void;
  validateForm(): boolean;
  uploadAvatar(filePath: string): Promise<string>;
}

Page<IPageData, IPageMethods>({
  data: {
    code: '',
    nickname: '',
    avatarUrl: '/assets/images/default-avatar.png',
    tempFilePath: '',
    nicknameError: '',
    isSubmitting: false
  },
  
  onLoad(options) {
    if (options.code) {
      this.setData({ code: options.code });
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  // 输入昵称
  inputNickname(e) {
    this.setData({
      nickname: e.detail.value,
      nicknameError: ''
    });
  },
  
  // 选择头像
  chooseAvatar(e) {
    const { avatarUrl } = e.detail;
    
    this.setData({
      avatarUrl,
      tempFilePath: avatarUrl
    });
  },
  
  // 验证表单
  validateForm() {
    let isValid = true;
    
    if (!this.data.nickname.trim()) {
      this.setData({
        nicknameError: '请输入昵称'
      });
      isValid = false;
    } else if (this.data.nickname.length < 2 || this.data.nickname.length > 20) {
      this.setData({
        nicknameError: '昵称长度应在2-20个字符之间'
      });
      isValid = false;
    }
    
    return isValid;
  },
  
  // 提交用户信息
  submitUserInfo() {
    if (!this.validateForm()) {
      return;
    }
    
    this.setData({ isSubmitting: true });
    
    // 如果有选择头像，先上传头像
    const uploadAvatarPromise = this.data.tempFilePath
      ? this.uploadAvatar(this.data.tempFilePath)
      : Promise.resolve(this.data.avatarUrl);
    
    uploadAvatarPromise
      .then(avatarUrl => {
        // 构建用户信息
        const userInfo: IUserInfo = {
          id: 'temp_' + Date.now(),
          nickName: this.data.nickname,
          avatarUrl: avatarUrl,
          createdAt: new Date().toISOString()
        };
        
        // 调用后端API进行登录
        const apiBaseUrl = wx.getStorageSync('apiBaseUrl') || 'http://localhost:3000';
        return new Promise<any>((resolve, reject) => {
          wx.request({
            url: `${apiBaseUrl}/api/auth/wx-login`,
            method: 'POST',
            data: {
              code: this.data.code,
              userInfo: userInfo
            },
            success: (res: any) => {
              if (res.statusCode === 200 && res.data && res.data.success) {
                resolve(res.data.data);
              } else {
                reject(new Error(res.data?.message || '登录失败'));
              }
            },
            fail: (err) => {
              reject(err);
            }
          });
        });
      })
      .then(data => {
        const app = getApp<any>();
        
        // 保存令牌和用户信息
        app.globalData.token = data.token;
        app.globalData.refreshToken = data.refreshToken || null;
        app.globalData.userInfo = data.user;
        app.globalData.hasLogin = true;
        
        // 保存到本地存储
        try {
          wx.setStorageSync('token', app.globalData.token);
          if (app.globalData.refreshToken) {
            wx.setStorageSync('refreshToken', app.globalData.refreshToken);
          }
          wx.setStorageSync('userInfo', app.globalData.userInfo);
        } catch (e) {
          console.error('保存登录状态失败', e);
        }
        
        // 通知登录状态变化
        app.notifyLoginStateChanged();
        
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
        
        // 返回上一页
        setTimeout(() => {
          const pages = getCurrentPages();
          // 如果是从登录页面进入的，返回两级
          if (pages.length > 2 && pages[pages.length - 2].route?.includes('login')) {
            wx.navigateBack({ delta: 2 });
          } else {
            wx.navigateBack();
          }
        }, 1500);
      })
      .catch(error => {
        console.error('设置用户资料失败:', error);
        wx.showToast({
          title: error.message || '设置失败',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
      });
  },
  
  // 上传头像
  uploadAvatar(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const apiBaseUrl = wx.getStorageSync('apiBaseUrl') || 'http://localhost:3000';
      
      wx.uploadFile({
        url: `${apiBaseUrl}/api/media/upload`,
        filePath,
        name: 'file',
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(apiBaseUrl + data.url);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (error) {
            reject(new Error('解析响应失败'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }
}); 
