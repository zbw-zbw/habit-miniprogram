/**
 * 社区相关API
 */
import { get, post, put, del } from '../../utils/request';

export const communityAPI = {
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
   * 点赞动态
   * @param id 动态ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  likePost: (id: string): Promise<{likeCount: number, isLiked: boolean}> => {
    return post(`/api/posts/${id}/like`, {});
  },
  
  /**
   * 取消点赞动态
   * @param id 动态ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  unlikePost: (id: string): Promise<{likeCount: number, isLiked: boolean}> => {
    return post(`/api/posts/${id}/unlike`, {});
  },
  
  /**
   * 获取动态评论
   * @param postId 动态ID
   * @param params 查询参数
   * @returns Promise<{comments: IComment[], pagination: IPagination}>
   */
  getComments: (postId: string, params?: { page?: number; pageSize?: number }): Promise<{comments: IComment[], pagination: any}> => {
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
   * 点赞评论
   * @param postId 动态ID
   * @param commentId 评论ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  likeComment: (postId: string, commentId: string): Promise<{likeCount: number, isLiked: boolean}> => {
    return post(`/api/posts/${postId}/comments/${commentId}/like`, {});
  },
  
  /**
   * 取消点赞评论
   * @param postId 动态ID
   * @param commentId 评论ID
   * @returns Promise<{likeCount: number, isLiked: boolean}>
   */
  unlikeComment: (postId: string, commentId: string): Promise<{likeCount: number, isLiked: boolean}> => {
    return post(`/api/posts/${postId}/comments/${commentId}/unlike`, {});
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
        url: wx.getStorageSync('apiBaseUrl') + '/api/upload',
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
   * 获取小组列表
   * @param params 查询参数
   * @returns Promise<{groups: IGroup[], pagination: any}>
   */
  getGroups: (params?: { page?: number; limit?: number; type?: string; keyword?: string }): Promise<{groups: any[], pagination: any}> => {
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
   * 加入小组
   * @param id 小组ID
   * @returns Promise<{success: boolean}>
   */
  joinGroup: (id: string): Promise<{success: boolean}> => {
    return post(`/api/groups/${id}/join`, {});
  },

  /**
   * 退出小组
   * @param id 小组ID
   * @returns Promise<{success: boolean}>
   */
  leaveGroup: (id: string): Promise<{success: boolean}> => {
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
  search: (params: { keyword: string; type?: 'all' | 'posts' | 'users' | 'challenges' | 'groups'; page?: number; limit?: number }): Promise<{posts: IPost[], users: any[], challenges: IChallenge[], groups: any[]}> => {
    return get('/api/community/search', params);
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
  getHotTopics: (): Promise<{id: string; name: string; count: number}[]> => {
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
   * 添加好友
   * @param userId 用户ID
   * @returns Promise<{success: boolean}>
   */
  addFriend: (userId: string): Promise<{success: boolean}> => {
    return post(`/api/friends/${userId}/add`, {});
  },
}; 
 