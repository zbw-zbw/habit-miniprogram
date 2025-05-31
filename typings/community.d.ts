/**
 * 社区相关类型定义
 */

/**
 * 社区动态帖子
 */
interface IPost {
  id: string;
  userId: string;
  userAvatar: string;
  userName: string;
  content: string;
  images: string[];
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  habitName: string;
}

/**
 * 挑战
 */
interface IChallenge {
  id: string;
  title: string;
  image: string;
  participants: number;
  isJoined: boolean;
}

/**
 * 好友
 */
interface IFriend {
  id: string;
  name: string;
  avatar: string;
  hasUpdate: boolean;
}

/**
 * 评论
 */
interface IComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

/**
 * 通知
 */
interface INotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'challenge' | 'system';
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  targetId: string;
  targetType: 'post' | 'challenge' | 'user' | 'system';
  createdAt: string;
  isRead: boolean;
}

/**
 * 小组
 */
interface IGroup {
  id: string;
  name: string;
  avatar: string;
  coverImage: string;
  description: string;
  membersCount: number;
  isJoined: boolean;
  createdAt: string;
  createdBy: string;
  tags?: string[];
  isPrivate?: boolean;
}

/**
 * 分页信息
 */
interface IPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
} 
