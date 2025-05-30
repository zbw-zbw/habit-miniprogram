/**
 * API服务
 * 封装后端API调用
 */
import { get, post, put, del } from '../utils/request';

/**
 * 认证相关API
 */
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

/**
 * 用户相关API
 */
export const userAPI = {
  /**
   * 获取当前用户信息
   * @returns Promise
   */
  getCurrentUser: () => {
    return get<IUserInfo>('/api/users/me');
  },

  /**
   * 更新用户资料
   * @param userData 用户数据
   * @returns Promise
   */
  updateProfile: (userData: Partial<IUserInfo>) => {
    return put<IUserInfo>('/api/users/me', userData);
  },

  /**
   * 更新用户头像
   * @param avatarFile 头像文件
   * @returns Promise
   */
  updateAvatar: (avatarFile: WechatMiniprogram.UploadFileOption['filePath']) => {
    // 使用wx.uploadFile上传文件
    return new Promise<{ avatarUrl: string }>((resolve, reject) => {
      wx.uploadFile({
        url: 'http://localhost:3001/api/users/me/avatar',
        filePath: avatarFile,
        name: 'avatar',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(res.data);
              resolve(data);
            } catch (error) {
              reject(new Error('上传头像失败：数据解析错误'));
            }
          } else {
            reject(new Error(`上传头像失败：${res.statusCode}`));
          }
        },
        fail: () => {
          reject(new Error('上传头像失败：网络错误'));
        }
      });
    });
  },

  /**
   * 获取用户成就
   * @returns Promise
   */
  getAchievements: () => {
    return get<Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      progress: number;
      isCompleted: boolean;
    }>>('/api/users/me/achievements').catch(error => {
      console.error('获取用户成就失败:', error);
      // 如果API不可用，返回默认成就数据
      return [
        {
          id: 'habit_master',
          title: '习惯养成者',
          description: '连续完成一个习惯30天',
          icon: 'trophy',
          progress: 0,
          isCompleted: false
        },
        {
          id: 'early_bird',
          title: '早起达人',
          description: '连续7天在早上7点前打卡"早起"习惯',
          icon: 'sun',
          progress: 0,
          isCompleted: false
        },
        {
          id: 'reading_expert',
          title: '阅读专家',
          description: '累计阅读时间达到100小时',
          icon: 'book',
          progress: 0,
          isCompleted: false
        }
      ];
    });
  },

  /**
   * 登录
   * @param data 登录数据
   * @returns Promise<{token: string; userInfo: IUserInfo}>
   */
  login: (data: { code: string; userInfo: any }): Promise<{token: string; userInfo: IUserInfo}> => {
    return post('/api/auth/login', data);
  },
  
  /**
   * 获取用户信息
   * @returns Promise<IUserInfo>
   */
  getUserInfo: (): Promise<IUserInfo> => {
    return get('/api/user/info');
  },
  
  /**
   * 更新用户信息
   * @param data 用户信息
   * @returns Promise<IUserInfo>
   */
  updateUserInfo: (data: Partial<IUserInfo>): Promise<IUserInfo> => {
    return put('/api/user/info', data);
  }
};

/**
 * 习惯相关API
 */
export const habitAPI = {
  /**
   * 获取所有习惯
   * @returns Promise
   */
  getHabits: (params?: { category?: string; isArchived?: boolean }): Promise<IHabit[]> => {
    return get('/api/habits', params);
  },

  /**
   * 获取习惯详情
   * @param habitId 习惯ID
   * @returns Promise
   */
  getHabit: (habitId: string): Promise<IHabit> => {
    return get(`/api/habits/${habitId}`);
  },

  /**
   * 创建习惯
   * @param habitData 习惯数据
   * @returns Promise
   */
  createHabit: (habitData: Partial<IHabit>): Promise<IHabit> => {
    return post<IHabit>('/api/habits', habitData);
  },

  /**
   * 更新习惯
   * @param habitId 习惯ID
   * @param habitData 习惯数据
   * @returns Promise
   */
  updateHabit: (habitId: string, habitData: Partial<IHabit>): Promise<IHabit> => {
    return put<IHabit>(`/api/habits/${habitId}`, habitData);
  },

  /**
   * 删除习惯
   * @param habitId 习惯ID
   * @returns Promise
   */
  deleteHabit: (habitId: string): Promise<void> => {
    return del<{ success: boolean }>(`/api/habits/${habitId}`).then(() => {});
  },

  /**
   * 归档习惯
   * @param habitId 习惯ID
   * @returns Promise
   */
  archiveHabit: (habitId: string): Promise<IHabit> => {
    return post<IHabit>(`/api/habits/${habitId}/archive`);
  },

  /**
   * 取消归档习惯
   * @param habitId 习惯ID
   * @returns Promise
   */
  unarchiveHabit: (habitId: string): Promise<IHabit> => {
    return post<IHabit>(`/api/habits/${habitId}/unarchive`);
  },

  /**
   * 获取习惯统计数据
   * @param habitId 习惯ID
   * @returns Promise
   */
  getHabitStats: (habitId: string): Promise<IHabitStats> => {
    if (!habitId) {
      return Promise.reject(new Error('习惯ID不能为空'));
    }
    return get<IHabitStats>(`/api/habits/${habitId}/stats`);
  },

  /**
   * 获取习惯分类
   * @returns Promise
   */
  getCategories: () => {
    return get<{ id: string; name: string; icon: string; }[]>('/api/habits/categories');
  },

  /**
   * 获取习惯模板
   * @returns Promise
   */
  getTemplates: () => {
    return get<IHabit[]>('/api/habits/templates');
  },

  /**
   * 从模板创建习惯
   * @param templateId 模板ID
   * @returns Promise
   */
  createFromTemplate: (templateId: string) => {
    return post<IHabit>(`/api/habits/from-template/${templateId}`);
  }
};

/**
 * 打卡相关API
 */
export const checkinAPI = {
  /**
   * 获取打卡记录
   * @param params 查询参数
   * @returns Promise<ICheckin[]>
   */
  getCheckins: (params?: {
    startDate?: string;
    endDate?: string;
    habitId?: string;
  }): Promise<ICheckin[]> => {
    return get<ICheckin[]>('/api/checkins', params);
  },

  /**
   * 获取习惯打卡记录
   * @param habitId 习惯ID
   * @returns Promise<ICheckin[]>
   */
  getHabitCheckins: (habitId: string): Promise<ICheckin[]> => {
    return get<ICheckin[]>(`/api/habits/${habitId}/checkins`);
  },

  /**
   * 获取单个打卡记录
   * @param id 打卡记录ID
   * @returns Promise<ICheckin>
   */
  getCheckin: (id: string): Promise<ICheckin> => {
    return get(`/api/checkins/${id}`);
  },
  
  /**
   * 创建打卡记录
   * @param checkinData 打卡数据
   * @returns Promise<ICheckin>
   */
  createCheckin: (checkinData: Partial<ICheckin> & { habitId?: string, habit?: string }): Promise<ICheckin> => {
    // 确保habitId或habit至少有一个
    if (!checkinData.habitId && !checkinData.habit) {
      return Promise.reject(new Error('习惯ID不能为空'));
    }
    
    // 将habitId复制到habit字段，以满足服务器端要求
    const data = { ...checkinData };
    if (!data.habit && data.habitId) {
      data.habit = data.habitId;
    }
    
    return post<ICheckin>('/api/checkins', data);
  },

  /**
   * 更新打卡记录
   * @param id 打卡记录ID
   * @param checkin 打卡记录数据
   * @returns Promise<ICheckin>
   */
  updateCheckin: (id: string, checkin: Partial<ICheckin>): Promise<ICheckin> => {
    return put(`/api/checkins/${id}`, checkin);
  },
  
  /**
   * 删除打卡记录
   * @param id 打卡记录ID
   * @returns Promise<void>
   */
  deleteCheckin: (id: string): Promise<void> => {
    return del(`/api/checkins/${id}`);
  }
};

/**
 * 数据分析相关API
 */
export const analyticsAPI = {
  /**
   * 获取仪表盘数据
   * @returns Promise
   */
  getDashboard: () => {
    return get<{
      habitCount: number;
      completedToday: number;
      streak: number;
      completion: number;
    }>('/api/analytics/dashboard');
  },

  /**
   * 获取习惯完成率
   * @param params 查询参数
   * @returns Promise
   */
  getCompletionRate: (params?: {
    habitId?: string;
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }) => {
    return get<{
      overall: number;
      data: Array<{ date: string; rate: number }>;
    }>('/api/analytics/completion-rate', params);
  },

  /**
   * 获取连续打卡记录
   * @returns Promise
   */
  getStreaks: () => {
    return get<Array<{
      habitId: string;
      habitName: string;
      currentStreak: number;
      longestStreak: number;
    }>>('/api/analytics/streaks');
  },

  /**
   * 获取习惯趋势数据
   * @param params 查询参数
   * @returns Promise
   */
  getTrends: (params?: {
    habitId?: string;
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }) => {
    return get<Array<{
      date: string;
      count: number;
    }>>('/api/analytics/trends', params);
  },

  /**
   * 获取习惯统计数据
   * @param params 查询参数
   * @returns Promise<any>
   */
  getHabitStats: (params?: { startDate?: string; endDate?: string; habitId?: string }): Promise<any> => {
    return get('/api/analytics/habits', params);
  },
  
  /**
   * 获取周报告
   * @param params 查询参数
   * @returns Promise
   */
  getWeeklyReport: (params?: { date?: string }) => {
    return get<{
      overview: {
        totalHabits: number;
        activeHabits: number;
        completedToday: number;
        completionRate: number;
        totalCheckins: number;
        currentStreak: number;
        longestStreak: number;
        startDate: string;
        totalDays: number;
      };
      habitDetails: Array<{
        id: string;
        name: string;
        color: string;
        icon: string;
        completionRate: number;
        streak: number;
        totalCheckins: number;
        bestDay: string;
        bestTime: string;
      }>;
      trends: {
        weeklyCompletion: number[];
        monthlyCompletion: number[];
        weekLabels: string[];
        monthLabels: string[];
      };
    }>('/api/analytics/reports/weekly', params);
  },
  
  /**
   * 获取月报告
   * @param params 查询参数
   * @returns Promise
   */
  getMonthlyReport: (params?: { month?: string }) => {
    return get<{
      overview: {
        totalHabits: number;
        activeHabits: number;
        completedToday: number;
        completionRate: number;
        totalCheckins: number;
        currentStreak: number;
        longestStreak: number;
        startDate: string;
        totalDays: number;
      };
      habitDetails: Array<{
        id: string;
        name: string;
        color: string;
        icon: string;
        completionRate: number;
        streak: number;
        totalCheckins: number;
        bestDay: string;
        bestTime: string;
      }>;
      trends: {
        weeklyCompletion: number[];
        monthlyCompletion: number[];
        weekLabels: string[];
        monthLabels: string[];
      };
    }>('/api/analytics/reports/monthly', params);
  },
  
  /**
   * 生成报告
   * @param params 查询参数
   * @returns Promise<any>
   */
  generateReport: (params?: { type: 'daily' | 'weekly' | 'monthly'; date?: string }): Promise<any> => {
    return post('/api/analytics/report', params);
  },
  
  /**
   * 获取洞察数据
   * @returns Promise<any>
   */
  getInsights: (): Promise<any> => {
    return get('/api/analytics/insights');
  }
};

/**
 * 社区相关API
 */
export const communityAPI = {
  /**
   * 获取动态列表
   * @param params 查询参数
   * @returns Promise
   */
  getPosts: (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    habitId?: string;
  }) => {
    return get<{
      posts: IPost[];
      total: number;
      page: number;
      limit: number;
    }>('/api/community/posts', params);
  },

  /**
   * 获取动态详情
   * @param postId 动态ID
   * @returns Promise
   */
  getPost: (postId: string) => {
    return get<IPost>(`/api/community/posts/${postId}`);
  },

  /**
   * 创建动态
   * @param postData 动态数据
   * @returns Promise
   */
  createPost: (postData: {
    content: string;
    images?: string[];
    habitId?: string;
    checkinId?: string;
  }) => {
    return post<IPost>('/api/community/posts', postData);
  },

  /**
   * 点赞动态
   * @param postId 动态ID
   * @returns Promise
   */
  likePost: (postId: string) => {
    return post<{ success: boolean }>(`/api/community/posts/${postId}/like`);
  },

  /**
   * 取消点赞动态
   * @param postId 动态ID
   * @returns Promise
   */
  unlikePost: (postId: string) => {
    return post<{ success: boolean }>(`/api/community/posts/${postId}/unlike`);
  },

  /**
   * 获取评论列表
   * @param postId 动态ID
   * @returns Promise
   */
  getComments: (postId: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    return get<{
      comments: IComment[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/community/posts/${postId}/comments`, params);
  },

  /**
   * 创建评论
   * @param postId 动态ID
   * @param commentData 评论数据
   * @returns Promise
   */
  createComment: (postId: string, commentData: {
    content: string;
    parentId?: string;
  }) => {
    return post<IComment>(`/api/community/posts/${postId}/comments`, commentData);
  },

  /**
   * 搜索
   * @param params 搜索参数
   * @returns Promise
   */
  search: (params: {
    keyword: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => {
    return get<{
      items: any[];
      total: number;
      page: number;
      limit: number;
    }>('/api/community/search', params);
  },
  
  /**
   * 获取热门搜索词
   * @returns Promise
   */
  getHotSearches: () => {
    return get<{
      keywords: string[];
    }>('/api/community/hot-searches');
  },

  /**
   * 获取社区热门话题
   * @returns Promise
   */
  getHotTopics: () => {
    return get<{
      topics: Array<{
        id: string;
        name: string;
        image?: string;
        postCount: number;
        followerCount: number;
        isFollowing?: boolean;
      }>;
    }>('/api/community/hot-topics');
  },

  /**
   * 获取挑战列表
   * @returns Promise<IChallenge[]>
   */
  getChallenges: () => {
    return get<IChallenge[]>('/api/community/challenges');
  },

  /**
   * 获取挑战详情
   * @param challengeId 挑战ID
   * @returns Promise
   */
  getChallenge: (challengeId: string) => {
    return get<IChallenge>(`/api/community/challenges/${challengeId}`);
  },

  /**
   * 参与挑战
   * @param challengeId 挑战ID
   * @returns Promise
   */
  joinChallenge: (challengeId: string) => {
    return post<{ success: boolean }>(`/api/community/challenges/${challengeId}/join`);
  },

  /**
   * 退出挑战
   * @param challengeId 挑战ID
   * @returns Promise
   */
  leaveChallenge: (challengeId: string) => {
    return post<{ success: boolean }>(`/api/community/challenges/${challengeId}/leave`);
  },

  /**
   * 获取好友列表
   * @returns Promise<IFriend[]>
   */
  getFriends: () => {
    return get('/api/friends');
  },
  
  /**
   * 关注/取消关注用户
   * @param userId 用户ID
   * @param isFollow 是否关注
   * @returns Promise<{success: boolean}>
   */
  followUser: (userId: string, isFollow: boolean) => {
    return put(`/api/friends/${userId}/follow`, { isFollow });
  },
  
  /**
   * 上传图片
   * @param filePath 本地文件路径
   * @returns Promise<{url: string}>
   */
  uploadImage: (filePath: string) => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: getApp<IAppOption>().globalData.apiBaseUrl + '/api/upload',
        filePath,
        name: 'file',
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve({ url: data.url });
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
  },

  /**
   * 获取社区动态
   * @param params 查询参数
   * @returns Promise<{posts: IPost[], hasMore: boolean}>
   */
  getPosts: (params?: { type?: string; page?: number; pageSize?: number; userId?: string; habitId?: string }): Promise<{posts: IPost[], hasMore: boolean}> => {
    return get('/api/posts', params).then((res: any) => {
      // 处理分页数据
      const { posts, total, page, limit } = res;
      const hasMore = page * limit < total;
      return { posts, hasMore };
    });
  },
  
  /**
   * 获取单个动态
   * @param id 动态ID
   * @returns Promise<IPost>
   */
  getPost: (id: string): Promise<IPost> => {
    return get(`/api/posts/${id}`);
  },
  
  /**
   * 创建动态
   * @param postData 动态数据
   * @returns Promise<IPost>
   */
  createPost: (postData: { content: string; images: string[]; tags: string[]; habitId?: string }): Promise<IPost> => {
    return post('/api/posts', postData);
  },
  
  /**
   * 删除动态
   * @param id 动态ID
   * @returns Promise<void>
   */
  deletePost: (id: string): Promise<void> => {
    return del(`/api/posts/${id}`);
  },
  
  /**
   * 获取动态评论
   * @param postId 动态ID
   * @param params 查询参数
   * @returns Promise<IComment[]>
   */
  getComments: (postId: string, params?: { page?: number; pageSize?: number }): Promise<IComment[]> => {
    return get(`/api/posts/${postId}/comments`, params);
  },
  
  /**
   * 添加评论
   * @param postId 动态ID
   * @param comment 评论内容
   * @returns Promise<IComment>
   */
  addComment: (postId: string, comment: { content: string }): Promise<IComment> => {
    return post(`/api/posts/${postId}/comments`, comment);
  },
  
  /**
   * 删除评论
   * @param postId 动态ID
   * @param commentId 评论ID
   * @returns Promise<void>
   */
  deleteComment: (postId: string, commentId: string): Promise<void> => {
    return del(`/api/posts/${postId}/comments/${commentId}`);
  },
  
  /**
   * 获取挑战列表
   * @param params 查询参数
   * @returns Promise<IChallenge[]>
   */
  getChallenges: (params?: { page?: number; limit?: number; userId?: string }): Promise<IChallenge[]> => {
    return get('/api/challenges', params);
  },
  
  /**
   * 获取单个挑战
   * @param id 挑战ID
   * @returns Promise<IChallenge>
   */
  getChallenge: (id: string): Promise<IChallenge> => {
    return get(`/api/challenges/${id}`);
  },
  
  /**
   * 参加挑战
   * @param id 挑战ID
   * @returns Promise<{success: boolean}>
   */
  joinChallenge: (id: string): Promise<{success: boolean}> => {
    return post(`/api/challenges/${id}/join`, {});
  },
  
  /**
   * 退出挑战
   * @param id 挑战ID
   * @returns Promise<{success: boolean}>
   */
  leaveChallenge: (id: string): Promise<{success: boolean}> => {
    return post(`/api/challenges/${id}/leave`, {});
  },
  
  /**
   * 获取好友列表
   * @returns Promise<IFriend[]>
   */
  getFriends: (): Promise<IFriend[]> => {
    return get('/api/friends');
  },
  
  /**
   * 关注/取消关注用户
   * @param userId 用户ID
   * @param isFollow 是否关注
   * @returns Promise<{success: boolean}>
   */
  followUser: (userId: string, isFollow: boolean): Promise<{success: boolean}> => {
    return put(`/api/friends/${userId}/follow`, { isFollow });
  },
  
  /**
   * 上传图片
   * @param filePath 本地文件路径
   * @returns Promise<{url: string}>
   */
  uploadImage: (filePath: string): Promise<{url: string}> => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: getApp<IAppOption>().globalData.apiBaseUrl + '/api/upload',
        filePath,
        name: 'file',
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve({ url: data.url });
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
};

/**
 * 通知相关API
 */
export const notificationAPI = {
  /**
   * 获取通知列表
   * @param params 查询参数
   * @returns Promise
   */
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    type?: 'like' | 'comment' | 'follow' | 'challenge' | 'system';
  }) => {
    return get<{
      notifications: INotification[];
      total: number;
      unread: number;
    }>('/api/notifications', params);
  },

  /**
   * 标记通知为已读
   * @param notificationId 通知ID
   * @returns Promise
   */
  markAsRead: (notificationId: string) => {
    return put<{ success: boolean }>(`/api/notifications/${notificationId}/read`);
  },

  /**
   * 标记所有通知为已读
   * @returns Promise
   */
  markAllAsRead: () => {
    return put<{ success: boolean }>('/api/notifications/read-all');
  },

  /**
   * 删除通知
   * @param notificationId 通知ID
   * @returns Promise
   */
  deleteNotification: (notificationId: string) => {
    return del<{ success: boolean }>(`/api/notifications/${notificationId}`);
  }
};

/**
 * 设置相关API
 */
export const settingsAPI = {
  /**
   * 获取用户设置
   * @returns Promise
   */
  getSettings: () => {
    return get<{
      theme: 'light' | 'dark' | 'system';
      language: 'zh_CN' | 'en_US';
      notification: boolean;
      sound: boolean;
      vibration: boolean;
    }>('/api/settings');
  },

  /**
   * 更新用户设置
   * @param settings 设置数据
   * @returns Promise
   */
  updateSettings: (settings: Partial<{
    theme: 'light' | 'dark' | 'system';
    language: 'zh_CN' | 'en_US';
    notification: boolean;
    sound: boolean;
    vibration: boolean;
  }>) => {
    return put<{ success: boolean }>('/api/settings', settings);
  }
};

export default {
  auth: authAPI,
  user: userAPI,
  habit: habitAPI,
  checkin: checkinAPI,
  analytics: analyticsAPI,
  community: communityAPI,
  notification: notificationAPI,
  settings: settingsAPI
}; 
 