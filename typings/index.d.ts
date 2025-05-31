/// <reference path="../node_modules/miniprogram-api-typings/index.d.ts" />
/// <reference path="./user.d.ts" />
/// <reference path="./habit.d.ts" />
/// <reference path="./checkin.d.ts" />
/// <reference path="./community.d.ts" />

/**
 * 全局类型定义
 */

// 应用配置
interface IAppOption {
  globalData: {
    userInfo: IUserInfo | null;
    hasLogin: boolean;
    systemInfo?: WechatMiniprogram.SystemInfo;
    theme?: 'light' | 'dark' | 'system';
    unlockedAchievement?: IAchievement | null;
    showAchievementUnlock?: boolean;
    apiBaseUrl?: string; // API服务基础URL
    apiAvailable?: boolean; // API服务是否可用
    token?: string; // 用户认证令牌
    refreshToken?: string; // 刷新令牌
  };
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
  login(userInfo: IUserInfo, callback: (success: boolean) => void): void;
  logout(callback: () => void): void;
  setTheme(theme: 'light' | 'dark' | 'system'): void;
  setLanguage?(language: 'zh_CN' | 'en_US'): void;
  onAchievementUnlock(callback: (achievement: IAchievement) => void): void;
  onAchievementUnlocked(achievement: IAchievement): void;
  showAchievementUnlockNotification(achievement: IAchievement): void;
  onThemeChange?(callback: (theme: 'light' | 'dark' | 'system') => void): void;
  onLoginStateChange?(callback: (loginState: { userInfo: IUserInfo | null, hasLogin: boolean }) => void): void; // 登录状态变化监听
  notifyLoginStateChanged?(): void; // 通知登录状态变化
  checkApiAvailability?(): void; // 检查API服务可用性
  showApiUnavailableMessage?(): void; // 显示API服务不可用提示
  clearAuthData?(): void; // 清除认证数据
  loadTokenFromStorage?(): void; // 从本地存储加载令牌
  verifyToken?(): void; // 验证令牌有效性
  refreshAuthToken?(): void; // 刷新认证令牌
  mockLogin?(userInfo: IUserInfo, callback: (success: boolean) => void): void; // 本地模拟登录
  onShow?(): void; // 当小程序从后台进入前台显示时触发
}

// 用户信息
interface IUserInfo {
  id: string;
  nickName: string;
  avatarUrl: string;
  gender: number;
  province: string;
  city: string;
  country: string;
}

// 习惯
interface IHabit {
  id: string;
  _id?: string; // 添加MongoDB ID字段
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  frequency: {
    type: 'daily' | 'weekly' | 'custom' | 'monthly';
    days?: number[]; // 对于自定义频率，指定星期几 (0-6, 周日-周六)
    interval?: number; // 对于周期性习惯，指定间隔
  };
  startDate: string; // 习惯开始日期
  endDate?: string; // 习惯结束日期
  target?: number; // 目标值
  unit?: string; // 单位
  reminder: {
    enabled: boolean;
    time: string; // HH:MM 格式
  };
  isArchived: boolean;
  createdAt: string;
  updatedAt?: string;
}

// 打卡记录
interface ICheckin {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD 格式
  isCompleted: boolean;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

// 习惯统计数据
interface IHabitStats {
  totalCompletions: number;
  totalDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

// 社区动态接口
interface IPost {
  id: string;
  userId: string;
  userInfo: {
    avatarUrl: string;
    nickName: string;
  };
  content: string;
  images: string[];
  habitId: string;
  habitName: string;
  checkinId: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

// 评论接口
interface IComment {
  id: string;
  postId: string;
  userId: string;
  userInfo: {
    avatarUrl: string;
    nickName: string;
  };
  content: string;
  createdAt: string;
}

// 挑战接口
interface IChallenge {
  id: string;
  title: string;
  description: string;
  cover: string;
  startDate: string;
  endDate: string;
  participantsCount: number;
  isJoined: boolean;
  createdAt: string;
}

// 朋友接口
interface IFriend {
  id: string;
  userId: string;
  nickName: string;
  avatarUrl: string;
  motto?: string;
  isFollowing: boolean;
  isFollower: boolean;
  lastActive?: string;
  habits?: number; // 习惯数量
  streak?: number; // 当前连续天数
}

// 通知接口
interface INotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'challenge' | 'system';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string; // 相关的ID（如postId, challengeId等）
  sender?: {
    userId: string;
    nickName: string;
    avatarUrl: string;
  };
}

// 成就接口
interface IAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number; // 0-100表示进度百分比
  isCompleted: boolean;
  completedAt?: string;
  reward?: string; // 成就奖励
}

// 全局数据接口已合并到IAppOption中
