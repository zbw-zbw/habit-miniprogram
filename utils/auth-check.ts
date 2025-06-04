/**
 * 权限检查工具函数
 * 用于检查用户是否已登录，未登录时显示登录提示
 */
import { IAppOption } from './types';

/**
 * 页面接口类型，包含登录相关的方法和数据
 */
export interface IPageWithLoginCheck {
  setData: (data: any) => void;
  data: {
    loginModal?: {
      show: boolean;
      message: string;
    };
    [key: string]: any;
  };
  onLoginModalClose?: () => void;
  onLoginSuccess?: () => void;
  onLoginFail?: () => void;
  loginSuccess?: () => void;
}

/**
 * 检查用户是否已登录，如果未登录则显示登录提示
 * @param page 页面实例
 * @param message 登录提示信息
 * @param onSuccess 登录成功后的回调函数
 * @returns 用户是否已登录
 */
export function checkLogin(
  page: IPageWithLoginCheck, 
  message = '请先登录以使用此功能', 
  onSuccess: (() => void) | null = null
): boolean {
  const app = getApp<IAppOption>();
  if (!app.globalData.hasLogin) {
    // 如果未登录，显示登录提示模态框
    page.setData({
      'loginModal.show': true,
      'loginModal.message': message
    });
    
    // 设置登录成功的回调
    page.loginSuccess = onSuccess || undefined;
    
    return false;
  }
  
  // 已登录，可以执行后续操作
  return true;
}

/**
 * 在页面中集成登录检查功能
 * @param page 页面实例
 */
export function setupLoginCheck(page: IPageWithLoginCheck): void {
  // 混入登录模态框处理方法
  if (!page.onLoginModalClose) {
    page.onLoginModalClose = function() {
      this.setData({
        'loginModal.show': false
      });
    };
  }
  
  if (!page.onLoginSuccess) {
    page.onLoginSuccess = function() {
      if (typeof this.loginSuccess === 'function') {
        this.loginSuccess();
      }
    };
  }
  
  if (!page.onLoginFail) {
    page.onLoginFail = function() {
      
    };
  }
  
  // 确保页面初始数据中包含loginModal
  if (!page.data.loginModal) {
    page.setData({
      loginModal: {
        show: false,
        message: '请先登录以使用此功能'
      }
    });
  }
} 
