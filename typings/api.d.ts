/**
 * API类型定义
 */

/**
 * API响应接口
 */
interface ApiResponse<T = any> {
  code?: number;         // 业务状态码
  message?: string;      // 状态描述
  data?: T;              // 响应数据
  success?: boolean;     // 是否成功
  timestamp?: number;    // 时间戳
  [key: string]: any;    // 允许其他字段
}

/**
 * 分页请求参数
 */
interface PaginationParams {
  page?: number;         // 页码
  limit?: number;        // 每页数量
}

/**
 * 分页响应结果
 */
interface PaginationResult<T> {
  list: T[];             // 数据列表
  total: number;         // 总数量
  page: number;          // 当前页码
  limit: number;         // 每页数量
  totalPages: number;    // 总页数
}

/**
 * 认证响应
 */
interface AuthResponse {
  token: string;                 // 访问令牌
  refreshToken?: string;         // 刷新令牌
  expiresIn?: number;            // 过期时间
  user: IUserInfo;               // 用户信息
}

/**
 * 用户设置
 */
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh_CN' | 'en_US';
  notification: boolean;
  sound: boolean;
  vibration: boolean;
}

/**
 * 习惯分类
 */
interface HabitCategory {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

/**
 * 打卡记录创建参数
 */
interface CheckinCreateParams {
  habitId: string;
  date: string;
  isCompleted: boolean;
  note?: string;
  mood?: number;
  images?: string[];
  location?: {
    longitude: number;
    latitude: number;
    name: string;
  };
}

/**
 * 习惯统计数据
 */
interface HabitStatistics {
  totalCompletions: number;
  totalDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

/**
 * 仪表盘数据
 */
interface DashboardData {
  habitCount: number;
  completedToday: number;
  streak: number;
  completion: number;
}

/**
 * 社区动态创建参数
 */
interface PostCreateParams {
  content: string;
  images?: string[];
  habitId?: string;
  checkinId?: string;
  tags?: string[];
  visibility?: 'public' | 'friends' | 'private';
}

/**
 * 社区动态响应
 */
interface PostResponse {
  id: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  user: {
    id: string;
    nickName: string;
    avatarUrl: string;
  };
  habit?: {
    id: string;
    name: string;
    color: string;
  };
  checkin?: {
    id: string;
    date: string;
    isCompleted: boolean;
  };
}

/**
 * 挑战创建参数
 */
interface ChallengeCreateParams {
  title: string;
  description: string;
  cover: string;
  startDate: string;
  endDate: string;
  habits?: string[];
  rewards?: {
    name: string;
    description: string;
    icon: string;
  }[];
  rules?: string[];
}

/**
 * 挑战响应
 */
interface ChallengeResponse {
  id: string;
  title: string;
  description: string;
  cover: string;
  startDate: string;
  endDate: string;
  participantsCount: number;
  isJoined: boolean;
  createdAt: string;
  participants: {
    id: string;
    nickName: string;
    avatarUrl: string;
    progress: number;
  }[];
  habits: {
    id: string;
    name: string;
    color: string;
  }[];
}

/**
 * 通知响应
 */
interface NotificationResponse {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'challenge' | 'system';
  content: string;
  targetId: string;
  targetType: 'post' | 'challenge' | 'user' | 'system';
  createdAt: string;
  isRead: boolean;
  sourceUser?: {
    id: string;
    nickName: string;
    avatarUrl: string;
  };
  targetData?: {
    id: string;
    title?: string;
    content?: string;
    image?: string;
  };
}

/**
 * 通用成功响应
 */
interface SuccessResponse {
  success: boolean;
  message?: string;
} 
 