/**
 * 习惯类型
 */
export interface IHabit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency: {
    type: 'daily' | 'weekly' | 'custom';
    days?: number[]; // 对于自定义频率，指定星期几
  };
  reminder?: {
    enabled: boolean;
    time: string; // HH:mm 格式
    days?: number[]; // 哪些天提醒
  };
  goal?: {
    type: 'count' | 'duration' | 'boolean';
    target: number; // 对于 boolean 类型，1 表示完成
    unit?: string; // 单位，例如"次"、"分钟"等
  };
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  isArchived?: boolean;
}

/**
 * 打卡记录类型
 */
export interface ICheckin {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD 格式
  time: string; // HH:mm:ss 格式
  value: number; // 对于 boolean 类型，1 表示完成
  note?: string;
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  media?: Array<{
    type: 'image' | 'video' | 'audio';
    url: string;
    thumbnailUrl?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
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
 * 成就类型
 */
export interface IAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  progress?: number; // 0-100
  isUnlocked: boolean;
  unlockedAt?: string;
  category: 'streak' | 'count' | 'milestone' | 'special';
  level?: number; // 成就等级
  nextLevel?: IAchievement; // 下一级成就
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
