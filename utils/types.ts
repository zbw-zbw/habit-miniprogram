/**
 * 全局类型定义
 */

/**
 * 习惯接口
 */
export interface IHabit {
  id: string;
  _id?: string; // 兼容后端MongoDB的_id
  name: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  frequency: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    days?: number[];
    dates?: number[];
    interval?: number;
  };
  targetValue?: number;
  unit?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  // 可选的实时状态，非数据库字段
  isCompleted?: boolean;
  todayValue?: number;
  completionRate?: number;
  streak?: number;
}

/**
 * 打卡记录接口
 */
export interface ICheckin {
  id?: string;
  _id?: string; // 兼容后端MongoDB的_id
  habitId: string;
  habit?: string | IHabit; // 可能是habitId或者完整的habit对象
  date: string;
  time?: string;
  isCompleted: boolean;
  value?: number;
  note?: string;
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  images?: string[];
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 习惯统计数据接口
 */
export interface IHabitStats {
  totalCompletions: number;
  totalDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  // 可选的扩展数据
  averageDuration?: number;
  maxDuration?: number;
  bestDayOfWeek?: number;
  worstDayOfWeek?: number;
  weeklyAverage?: number[];
  monthlyAverage?: number[];
}

/**
 * 用户接口
 */
export interface IUser {
  id: string;
  _id?: string; // 兼容后端MongoDB的_id
  nickname: string;
  avatarUrl?: string;
  gender?: 0 | 1 | 2; // 0-未知，1-男，2-女
  country?: string;
  province?: string;
  city?: string;
  language?: string;
  openid?: string;
  unionid?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 成就接口
 */
export interface IAchievement {
  id: string;
  _id?: string; // 兼容后端MongoDB的_id
  name: string;
  description: string;
  icon: string;
  criteria: {
    type: 'habit_streak' | 'habit_completion' | 'total_checkins' | 'custom';
    value: number;
    habitCategory?: string;
  };
  isUnlocked: boolean;
  unlockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 排行榜项目接口
 */
export interface ILeaderboardItem {
  rank: number;
  userId: string;
  nickname: string;
  avatarUrl?: string;
  score: number;
  habit?: {
    id: string;
    name: string;
    category: string;
  };
}

/**
 * 点赞接口
 */
export interface ILike {
  id: string;
  _id?: string; // 兼容后端MongoDB的_id
  userId: string;
  targetId: string;
  targetType: 'checkin' | 'comment' | 'habit';
  createdAt: string;
}

/**
 * 评论接口
 */
export interface IComment {
  id: string;
  _id?: string; // 兼容后端MongoDB的_id
  userId: string;
  targetId: string;
  targetType: 'checkin' | 'habit';
  content: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    nickname: string;
    avatarUrl?: string;
  };
}

/**
 * 社区动态接口
 */
export interface IFeed {
  id: string;
  _id?: string; // 兼容后端MongoDB的_id
  type: 'checkin' | 'achievement' | 'streak';
  userId: string;
  user: {
    id: string;
    nickname: string;
    avatarUrl?: string;
  };
  content: {
    habitId?: string;
    habitName?: string;
    achievementId?: string;
    achievementName?: string;
    streakDays?: number;
    message?: string;
    images?: string[];
    value?: number;
    unit?: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

/**
 * 标签接口
 */
export interface ITag {
  id: string;
  _id?: string; // 兼容后端MongoDB的_id
  name: string;
  color?: string;
  count?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 用户信息类型
 */
export interface IUserInfo {
  id: string;
  nickName: string;
  avatarUrl: string;
  gender?: 0 | 1 | 2; // 0: 未知, 1: 男, 2: 女
  country?: string;
  province?: string;
  city?: string;
  language?: string;
  createdAt: string;
  updatedAt?: string;
  openId?: string;
  unionId?: string;
  phoneNumber?: string;
  email?: string;
  isNewUser?: boolean;
}

/**
 * 应用配置类型
 */
export interface IAppOption {
  globalData: {
    userInfo: IUserInfo | null;
    hasLogin: boolean;
    systemInfo?: WechatMiniprogram.SystemInfo;
    theme?: 'light' | 'dark' | 'system';
    unlockedAchievement?: IAchievement | null;
    habitService?: any;
    checkinService?: any;
    habitChainService?: any;
    achievementService?: any;
    token?: string;
    refreshToken?: string;
  };
}

/**
 * 用户资料聚合数据接口
 */
export interface IUserProfileAll {
  userInfo: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
    gender: string;
  };
  stats: {
    totalHabits: number;
    activeHabits: number;
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
  settings: {
    theme: string;
    notifications: {
      enabled: boolean;
      reminderTime: string;
    };
    privacy: {
      shareData: boolean;
      showInRankings: boolean;
    };
  };
} 
