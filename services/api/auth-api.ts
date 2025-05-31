/**
 * 认证相关API
 */
import { get, post, put, del } from '../../utils/request';
import { IUserInfo } from '../../typings/user';

export const authAPI = {
  /**
   * 用户注册
   * @param userData 用户数据
   * @returns Promise
   */
  register: (userData: {
    username: string;
    password: string;
    nickname: string;
  }) => {
    return post<{ token: string; user: IUserInfo }>('/api/auth/register', userData);
  },

  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns Promise
   */
  login: (credentials: {
    username: string;
    password: string;
  }) => {
    return post<{ token: string; user: IUserInfo }>('/api/auth/login', credentials);
  },

  /**
   * 微信登录
   * @param wxData 微信登录数据
   * @returns Promise
   */
  wxLogin: (wxData: {
    code: string;
    userInfo?: WechatMiniprogram.UserInfo;
  }) => {
    return post<{ token: string; user: IUserInfo }>('/api/auth/wx-login', wxData);
  },

  /**
   * 刷新令牌
   * @param refreshToken 刷新令牌
   * @returns Promise
   */
  refreshToken: (refreshToken: string) => {
    return post<{ token: string; refreshToken: string }>('/api/auth/refresh-token', { refreshToken });
  },

  /**
   * 登出
   * @returns Promise
   */
  logout: () => {
    return post<{ success: boolean }>('/api/auth/logout');
  }
}; 
 