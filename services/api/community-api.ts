/**
 * 社区相关API
 */
import { get, post, put, del } from '../../utils/request';
import { IAppOption } from '../../app';

export const communityAPI = {
  /**
   * 获取社区动态
   * @param params 查询参数
   * @returns Promise<{posts: IPost[], hasMore: boolean}>
   */
  getPosts: (params?: {
    type?: string;
    page?: number;
    pageSize?: number;
    userId?: string;
    habitId?: string;
  }): Promise<{ posts: IPost[]; hasMore: boolean }> => {
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
  createPost: (postData: {
    content: string;
    images: string[];
    tags: string[];
    habitId?: string;
  }): Promise<IPost> => {
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
   * 点赞动态
   * @param id 动态ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  likePost: (id: string): Promise<{ likeCount: number; isLiked: boolean }> => {
    return post(`/api/posts/${id}/like`, {});
  },

  /**
   * 取消点赞动态
   * @param id 动态ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  unlikePost: (
    id: string
  ): Promise<{ likeCount: number; isLiked: boolean }> => {
    return post(`/api/posts/${id}/unlike`, {});
  },

  /**
   * 获取动态评论
   * @param postId 动态ID
   * @param params 查询参数
   * @returns Promise<{comments: IComment[], pagination: IPagination}>
   */
  getComments: (
    postId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<{ comments: IComment[]; pagination: any }> => {
    return get(`/api/posts/${postId}/comments`, params);
  },

  /**
   * 添加评论
   * @param postId 动态ID
   * @param comment 评论内容
   * @returns Promise<IComment>
   */
  addComment: (
    postId: string,
    comment: { content: string }
  ): Promise<IComment> => {
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
   * 点赞评论
   * @param postId 动态ID
   * @param commentId 评论ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  likeComment: (
    postId: string,
    commentId: string
  ): Promise<{ likeCount: number; isLiked: boolean }> => {
    return post(`/api/posts/${postId}/comments/${commentId}/like`, {});
  },

  /**
   * 取消点赞评论
   * @param postId 动态ID
   * @param commentId 评论ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  unlikeComment: (
    postId: string,
    commentId: string
  ): Promise<{ likeCount: number; isLiked: boolean }> => {
    return post(`/api/posts/${postId}/comments/${commentId}/unlike`, {});
  },

  /**
   * 直接点赞评论（用于回复）
   * @param commentId 评论ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  likeCommentDirect: (
    commentId: string
  ): Promise<{ likeCount: number; isLiked: boolean }> => {
    return post(`/api/comments/${commentId}/like`, {});
  },

  /**
   * 直接取消点赞评论（用于回复）
   * @param commentId 评论ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  unlikeCommentDirect: (
    commentId: string
  ): Promise<{ likeCount: number; isLiked: boolean }> => {
    return post(`/api/comments/${commentId}/unlike`, {});
  },

  /**
   * 获取挑战列表
   * @param params 查询参数
   * @returns Promise<IChallenge[]>
   */
  getChallenges: (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    type?: string;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<any> => {
    return get('/api/challenges', params).then((response: any) => {
      console.log('挑战列表原始响应:', response);

      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        // 标准格式: { success: true, data: { challenges: [], pagination: {} } }
        if (
          response.success === true &&
          response.data &&
          response.data.challenges
        ) {
          console.log('返回标准格式数据');

          // 处理挑战数据，确保字段一致性
          if (Array.isArray(response.data.challenges)) {
            response.data.challenges = response.data.challenges.map(
              (challenge: any) => ({
                ...challenge,
                id: challenge.id || challenge._id,
                participantsCount:
                  challenge.participantsCount || challenge.participants || 0,
                participants:
                  challenge.participants || challenge.participantsCount || 0,
                isJoined:
                  challenge.isJoined || challenge.isParticipating || false,
                isParticipating:
                  challenge.isParticipating || challenge.isJoined || false,
              })
            );
          }

          return response.data;
        }

        // 直接返回数据对象: { challenges: [], pagination: {} }
        if (response.challenges && Array.isArray(response.challenges)) {
          console.log('返回数据对象');

          // 处理挑战数据，确保字段一致性
          response.challenges = response.challenges.map((challenge: any) => ({
            ...challenge,
            id: challenge.id || challenge._id,
            participantsCount:
              challenge.participantsCount || challenge.participants || 0,
            participants:
              challenge.participants || challenge.participantsCount || 0,
            isJoined: challenge.isJoined || challenge.isParticipating || false,
            isParticipating:
              challenge.isParticipating || challenge.isJoined || false,
          }));

          return response;
        }
      }

      // 如果是数组，直接返回
      if (Array.isArray(response)) {
        console.log('返回数组');

        // 处理挑战数据，确保字段一致性
        const processedChallenges = response.map((challenge: any) => ({
          ...challenge,
          id: challenge.id || challenge._id,
          participantsCount:
            challenge.participantsCount || challenge.participants || 0,
          participants:
            challenge.participants || challenge.participantsCount || 0,
          isJoined: challenge.isJoined || challenge.isParticipating || false,
          isParticipating:
            challenge.isParticipating || challenge.isJoined || false,
        }));

        return {
          challenges: processedChallenges,
          pagination: {
            total: processedChallenges.length,
            page: params?.page || 1,
            limit: params?.limit || processedChallenges.length,
            pages: 1,
          },
        };
      }

      // 默认返回空数据
      console.log('返回默认空数据');
      return {
        challenges: [],
        pagination: {
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          pages: 0,
        },
      };
    });
  },

  /**
   * 获取单个挑战
   * @param id 挑战ID
   * @returns Promise<IChallenge>
   */
  getChallenge: (id: string): Promise<any> => {
    return get(`/api/challenges/${id}`);
  },

  /**
   * 参加挑战
   * @param id 挑战ID
   * @returns Promise<{success: boolean}>
   */
  joinChallenge: (id: string): Promise<{ success: boolean }> => {
    return post(`/api/challenges/${id}/join`, {});
  },

  /**
   * 退出挑战
   * @param id 挑战ID
   * @returns Promise<{success: boolean}>
   */
  leaveChallenge: (id: string): Promise<{ success: boolean }> => {
    return post(`/api/challenges/${id}/leave`, {});
  },

  /**
   * 解散挑战（仅创建者可操作）
   * @param id 挑战ID
   * @returns Promise<{success: boolean}>
   */
  dismissChallenge: (id: string): Promise<{ success: boolean }> => {
    return post(`/api/challenges/${id}/dismiss`, {});
  },

  /**
   * 获取好友列表
   * @returns Promise<IFriend[]>
   */
  getFriends: (): Promise<IFriend[]> => {
    return get('/api/friends');
  },

  /**
   * 获取关注列表
   * @returns Promise<IUser[]>
   */
  getFollowing: (): Promise<any[]> => {
    return get('/api/community/users/following');
  },

  /**
   * 获取粉丝列表
   * @returns Promise<IUser[]>
   */
  getFollowers: (): Promise<any[]> => {
    return get('/api/community/users/followers');
  },

  /**
   * 关注/取消关注用户
   * @param userId 用户ID
   * @param isFollow 是否关注
   * @returns Promise<{success: boolean}>
   */
  followUser: (
    userId: string,
    isFollow: boolean
  ): Promise<{ success: boolean }> => {
    return put(`/api/friends/${userId}/follow`, { isFollow });
  },

  /**
   * 上传图片
   * @param filePath 本地文件路径
   * @returns Promise<{url: string}>
   */
  uploadImage: (filePath: string): Promise<{ url: string }> => {
    return new Promise((resolve, reject) => {
      // 获取token和baseURL
      const token = wx.getStorageSync('token');
      const baseUrl = wx.getStorageSync('apiBaseUrl') || '';

      wx.uploadFile({
        url: baseUrl + '/api/media/upload',
        filePath,
        name: 'file',
        header: {
          Authorization: `Bearer ${token}`,
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              // 检查返回的URL是否已包含baseURL
              let imageUrl = data.url;
              if (imageUrl && imageUrl.startsWith('/')) {
                // 如果是相对路径，添加baseURL
                imageUrl = baseUrl + imageUrl;
              }
              resolve({ url: imageUrl });
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (error) {
            reject(new Error('解析响应失败'));
          }
        },
        fail: (error) => {
          console.error('上传图片失败:', error);
          reject(error);
        },
      });
    });
  },

  /**
   * 获取小组列表
   * @param params 查询参数
   * @returns Promise<{groups: IGroup[], pagination: any}>
   */
  getGroups: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    keyword?: string;
  }): Promise<{ groups: any[]; pagination: any }> => {
    return get('/api/groups', params);
  },

  /**
   * 获取小组详情
   * @param id 小组ID
   * @returns Promise<IGroup>
   */
  getGroup: (id: string): Promise<any> => {
    return get(`/api/groups/${id}`);
  },

  /**
   * 获取小组详情（别名，与getGroup功能相同）
   * @param id 小组ID
   * @returns Promise<IGroup>
   */
  getGroupDetail: (id: string): Promise<any> => {
    return get(`/api/groups/${id}`);
  },

  /**
   * 获取小组动态
   * @param groupId 小组ID
   * @param params 查询参数
   * @returns Promise<{posts: any[], pagination: any}>
   */
  getGroupPosts: (
    groupId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ posts: any[]; pagination: any }> => {
    return get(`/api/groups/${groupId}/posts`, params).then((response: any) => {
      console.log('获取小组动态响应:', response);
      
      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        // 标准格式: { success: true, data: { posts: [], pagination: {} } }
        if (response.success === true && response.data && response.data.posts) {
          console.log('返回标准格式数据');
          return response.data;
        }
        
        // 直接返回数据对象: { posts: [], pagination: {} }
        if (response.posts && Array.isArray(response.posts)) {
          console.log('返回数据对象');
          return response;
        }
      }
      
      // 如果是数组，直接返回
      if (Array.isArray(response)) {
        console.log('返回数组');
        return {
          posts: response,
          pagination: {
            total: response.length,
            page: params?.page || 1,
            limit: params?.limit || response.length,
            pages: 1
          }
        };
      }
      
      // 默认返回空数据
      console.log('返回默认空数据');
      return {
        posts: [],
        pagination: {
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          pages: 0
        }
      };
    });
  },

  /**
   * 获取小组成员
   * @param groupId 小组ID
   * @param params 查询参数
   * @returns Promise<{members: any[], pagination: any}>
   */
  getGroupMembers: (
    groupId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ members: any[]; pagination: any }> => {
    return get(`/api/groups/${groupId}/members`, params);
  },

  /**
   * 加入小组
   * @param id 小组ID
   * @returns Promise<{success: boolean}>
   */
  joinGroup: (id: string): Promise<{ success: boolean }> => {
    return post(`/api/groups/${id}/join`, {});
  },

  /**
   * 退出小组
   * @param id 小组ID
   * @returns Promise<{success: boolean}>
   */
  leaveGroup: (id: string): Promise<{ success: boolean }> => {
    return post(`/api/groups/${id}/leave`, {});
  },

  /**
   * 创建小组
   * @param data 小组数据
   * @returns Promise<IGroup>
   */
  createGroup: (data: {
    name: string;
    description: string;
    type?: string;
    isPrivate?: boolean;
    tags?: string[];
    avatar?: string;
    coverImage?: string;
  }): Promise<any> => {
    return post('/api/groups', data);
  },

  /**
   * 搜索社区内容
   * @param params 搜索参数
   * @returns Promise<{posts: IPost[], users: any[], challenges: IChallenge[], groups: any[]}>
   */
  search: (params: {
    keyword: string;
    type?: 'all' | 'posts' | 'users' | 'challenges' | 'groups';
    page?: number;
    limit?: number;
  }): Promise<{
    posts: IPost[];
    users: any[];
    challenges: IChallenge[];
    groups: any[];
  }> => {
    // 添加当前用户ID，以便服务端返回是否已加入/参与状态
    const app = getApp<IAppOption>();
    const currentUserId = app?.globalData?.userInfo?.id;
    
    // 如果有用户ID，添加到请求参数中
    const requestParams = {
      ...params,
      userId: currentUserId
    };
    
    console.log('搜索请求参数:', requestParams);
    
    return get('/api/community/search', requestParams).then((response: any) => {
      console.log('搜索响应:', response);
      return response;
    });
  },

  /**
   * 获取热门搜索词
   * @returns Promise<string[]>
   */
  getHotSearches: (): Promise<string[]> => {
    return get('/api/community/hot-searches');
  },

  /**
   * 获取热门话题
   * @returns Promise<{id: string; name: string; count: number}[]>
   */
  getHotTopics: (): Promise<{ id: string; name: string; count: number }[]> => {
    return get('/api/community/hot-topics');
  },

  /**
   * 搜索用户
   * @param params 搜索参数
   * @returns Promise<IUser[]>
   */
  searchUsers: (params: { keyword: string }): Promise<any[]> => {
    return get('/api/community/search/users', params);
  },

  /**
   * 获取推荐用户
   * @returns Promise<IUser[]>
   */
  getRecommendUsers: (): Promise<any[]> => {
    return get('/api/community/recommend-users');
  },

  /**
   * 创建挑战
   * @param data 挑战数据
   * @returns Promise<IChallenge>
   */
  createChallenge: (data: {
    title: string;
    description: string;
    rules: string;
    image?: string;
    duration: number;
    startDate?: string;
    tags?: string[];
    isPublic?: boolean;
    habitId?: string;
    needsApproval?: boolean;
  }): Promise<any> => {
    return post('/api/community/challenges', data);
  },

  /**
   * 添加好友
   * @param userId 用户ID
   * @returns Promise<{success: boolean}>
   */
  addFriend: (userId: string): Promise<{ success: boolean }> => {
    return post(`/api/friends/${userId}/add`, {});
  },

  /**
   * 获取挑战参与者列表
   * @param challengeId 挑战ID
   * @param params 查询参数
   * @returns Promise<{participants: any[], pagination: any}>
   */
  getChallengeParticipants: (
    challengeId: string,
    params?: { status?: string; page?: number; limit?: number }
  ): Promise<{ participants: any[]; pagination: any }> => {
    return get(`/api/challenges/${challengeId}/participants`, params);
  },

  /**
   * 获取挑战排行榜
   * @param challengeId 挑战ID
   * @returns Promise<{leaderboard: any[], myRank: number, myProgress: number}>
   */
  getChallengeLeaderboard: (
    challengeId: string
  ): Promise<{ leaderboard: any[]; myRank: number; myProgress: number }> => {
    return get(`/api/challenges/${challengeId}/leaderboard`);
  },

  /**
   * 解散小组（仅创建者可操作）
   * @param id 小组ID
   * @returns Promise<{ success: boolean }>
   */
  dismissGroup: (id: string): Promise<{ success: boolean }> => {
    return del(`/api/groups/${id}/dismiss`).then(() => ({ success: true }));
  },

  /**
   * 获取用户习惯
   * @param userId 用户ID
   * @param params 查询参数
   * @returns Promise<{habits: any[], pagination: any}>
   */
  getUserHabits: (userId: string, params?: { page?: number; limit?: number }) => {
    return get(`/api/users/${userId}/habits`, params);
  },

  /**
   * 获取用户成就
   * @param userId 用户ID
   * @param params 查询参数
   * @returns Promise<{achievements: any[], pagination: any}>
   */
  getUserAchievements: (userId: string, params?: { page?: number; limit?: number }) => {
    return get(`/api/users/${userId}/achievements`, params);
  },
};
