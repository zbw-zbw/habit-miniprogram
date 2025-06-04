/**
 * 登录状态管理工具
 * 提供在组件和页面中方便使用全局登录状态的方法
 */

// 使用app.d.ts中的类型定义
type IUserInfo = any; // 使用any类型避免类型冲突
interface IAppOption {
  globalData: {
    userInfo: IUserInfo | null;
    hasLogin: boolean;
    [key: string]: any;
  };
  onLoginStateChange: (callback: (loginState: { userInfo: IUserInfo | null; hasLogin: boolean }) => void) => void;
  login: (userInfo: any, callback: (success: boolean) => void) => void;
  logout: (callback: () => void) => void;
  [key: string]: any;
}

/**
 * 获取当前登录状态
 * @returns 包含登录状态的对象
 */
export function getAuthState(): { hasLogin: boolean; userInfo: IUserInfo | null } {
  const app = getApp<IAppOption>();
  return {
    hasLogin: app.globalData.hasLogin,
    userInfo: app.globalData.userInfo
  };
}

/**
 * 在页面或组件中使用登录状态
 * @param page 页面或组件实例
 * @param options 配置选项
 */
export function useAuth(
  page: WechatMiniprogram.Page.ILifetime | WechatMiniprogram.Component.Lifetimes,
  options: {
    /** 登录状态变化时的回调函数 */
    onChange?: (authState: { hasLogin: boolean; userInfo: IUserInfo | null }) => void;
    /** 是否自动更新页面或组件的数据 */
    autoUpdate?: boolean;
  } = {}
): void {
  const app = getApp<IAppOption>();
  const { onChange, autoUpdate = true } = options;
  
  // 存储初始登录状态，用于比较变化
  const initialLoginState = app.globalData.hasLogin;
  
  // 为页面或组件添加一个属性来跟踪上一次的登录状态
  (page as any).__previousLoginState = initialLoginState;
  
  // 初始化页面或组件的登录状态数据
  if (autoUpdate && typeof (page as any).setData === 'function') {
    (page as any).setData({
      hasLogin: initialLoginState,
      userInfo: app.globalData.userInfo
    });
  }
  
  // 注册登录状态变化监听
  const callback = (authState: { hasLogin: boolean; userInfo: IUserInfo | null }) => {
    // 获取上一次的登录状态
    const previousLoginState = (page as any).__previousLoginState;
    
    // 更新页面或组件的登录状态跟踪
    (page as any).__previousLoginState = authState.hasLogin;
    
    // 自动更新页面或组件的数据
    if (autoUpdate && typeof (page as any).setData === 'function') {
      (page as any).setData({
        hasLogin: authState.hasLogin,
        userInfo: authState.userInfo
      });
    }
    
    // 只有在登录状态从未登录变为已登录时才调用自定义回调
    // 或者从已登录变为未登录时
    if (onChange && ((!previousLoginState && authState.hasLogin) || (previousLoginState && !authState.hasLogin))) {
      onChange(authState);
    }
  };
  
  // 注册到全局登录状态变化监听
  if (typeof app.onLoginStateChange === 'function') {
    app.onLoginStateChange(callback);
  }
  
  // 在页面或组件卸载时移除监听
  const originalOnUnload = (page as any).onUnload;
  const originalDetached = (page as any).detached; // 组件的卸载方法
  
  if (typeof (page as any).onUnload === 'function' || typeof originalOnUnload === 'function') {
    // 页面卸载
    (page as any).onUnload = function() {
      // 移除监听器
      if ((app as any).loginStateChangeCallbacks && Array.isArray((app as any).loginStateChangeCallbacks)) {
        const index = (app as any).loginStateChangeCallbacks.findIndex((cb: any) => cb === callback);
        if (index !== -1) {
          (app as any).loginStateChangeCallbacks.splice(index, 1);
        }
      }
      
      // 调用原始的onUnload
      if (originalOnUnload && typeof originalOnUnload === 'function') {
        originalOnUnload.call(this);
      }
    };
  } else if (typeof (page as any).detached === 'function' || typeof originalDetached === 'function') {
    // 组件卸载
    (page as any).detached = function() {
      // 移除监听器
      if ((app as any).loginStateChangeCallbacks && Array.isArray((app as any).loginStateChangeCallbacks)) {
        const index = (app as any).loginStateChangeCallbacks.findIndex((cb: any) => cb === callback);
        if (index !== -1) {
          (app as any).loginStateChangeCallbacks.splice(index, 1);
        }
      }
      
      // 调用原始的detached
      if (originalDetached && typeof originalDetached === 'function') {
        originalDetached.call(this);
      }
    };
  }
}

/**
 * 登录方法
 * @param userInfo 用户信息
 * @returns Promise对象
 */
export function login(userInfo: any): Promise<boolean> {
  return new Promise((resolve) => {
    const app = getApp<IAppOption>();
    app.login(userInfo, (success: boolean) => {
      resolve(success);
    });
  });
}

/**
 * 登出方法
 * @returns Promise对象
 */
export function logout(): Promise<void> {
  return new Promise((resolve) => {
    const app = getApp<IAppOption>();
    app.logout(() => {
      resolve();
    });
  });
} 
