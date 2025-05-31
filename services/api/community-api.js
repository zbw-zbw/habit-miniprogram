"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityAPI = void 0;
/**
 * 社区相关API
 */
const request_1 = require("../../utils/request");
exports.communityAPI = {
    /**
     * 获取社区动态
     * @param params 查询参数
     * @returns Promise<{posts: IPost[], hasMore: boolean}>
     */
    getPosts: (params) => {
        return (0, request_1.get)('/api/posts', params).then((res) => {
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
    getPost: (id) => {
        return (0, request_1.get)(`/api/posts/${id}`);
    },
    /**
     * 创建动态
     * @param postData 动态数据
     * @returns Promise<IPost>
     */
    createPost: (postData) => {
        return (0, request_1.post)('/api/posts', postData);
    },
    /**
     * 删除动态
     * @param id 动态ID
     * @returns Promise<void>
     */
    deletePost: (id) => {
        return (0, request_1.del)(`/api/posts/${id}`);
    },
    /**
     * 点赞动态
     * @param id 动态ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    likePost: (id) => {
        return (0, request_1.post)(`/api/posts/${id}/like`, {});
    },
    /**
     * 取消点赞动态
     * @param id 动态ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    unlikePost: (id) => {
        return (0, request_1.post)(`/api/posts/${id}/unlike`, {});
    },
    /**
     * 获取动态评论
     * @param postId 动态ID
     * @param params 查询参数
     * @returns Promise<{comments: IComment[], pagination: IPagination}>
     */
    getComments: (postId, params) => {
        return (0, request_1.get)(`/api/posts/${postId}/comments`, params);
    },
    /**
     * 添加评论
     * @param postId 动态ID
     * @param comment 评论内容
     * @returns Promise<IComment>
     */
    addComment: (postId, comment) => {
        return (0, request_1.post)(`/api/posts/${postId}/comments`, comment);
    },
    /**
     * 删除评论
     * @param postId 动态ID
     * @param commentId 评论ID
     * @returns Promise<void>
     */
    deleteComment: (postId, commentId) => {
        return (0, request_1.del)(`/api/posts/${postId}/comments/${commentId}`);
    },
    /**
     * 点赞评论
     * @param postId 动态ID
     * @param commentId 评论ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    likeComment: (postId, commentId) => {
        return (0, request_1.post)(`/api/posts/${postId}/comments/${commentId}/like`, {});
    },
    /**
     * 取消点赞评论
     * @param postId 动态ID
     * @param commentId 评论ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    unlikeComment: (postId, commentId) => {
        return (0, request_1.post)(`/api/posts/${postId}/comments/${commentId}/unlike`, {});
    },
    /**
     * 获取挑战列表
     * @param params 查询参数
     * @returns Promise<IChallenge[]>
     */
    getChallenges: (params) => {
        return (0, request_1.get)('/api/challenges', params);
    },
    /**
     * 获取单个挑战
     * @param id 挑战ID
     * @returns Promise<IChallenge>
     */
    getChallenge: (id) => {
        return (0, request_1.get)(`/api/challenges/${id}`);
    },
    /**
     * 参加挑战
     * @param id 挑战ID
     * @returns Promise<{success: boolean}>
     */
    joinChallenge: (id) => {
        return (0, request_1.post)(`/api/challenges/${id}/join`, {});
    },
    /**
     * 退出挑战
     * @param id 挑战ID
     * @returns Promise<{success: boolean}>
     */
    leaveChallenge: (id) => {
        return (0, request_1.post)(`/api/challenges/${id}/leave`, {});
    },
    /**
     * 获取好友列表
     * @returns Promise<IFriend[]>
     */
    getFriends: () => {
        return (0, request_1.get)('/api/friends');
    },
    /**
     * 关注/取消关注用户
     * @param userId 用户ID
     * @param isFollow 是否关注
     * @returns Promise<{success: boolean}>
     */
    followUser: (userId, isFollow) => {
        return (0, request_1.put)(`/api/friends/${userId}/follow`, { isFollow });
    },
    /**
     * 上传图片
     * @param filePath 本地文件路径
     * @returns Promise<{url: string}>
     */
    uploadImage: (filePath) => {
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
                        }
                        else {
                            reject(new Error(data.message || '上传失败'));
                        }
                    }
                    catch (error) {
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
    getGroups: (params) => {
        return (0, request_1.get)('/api/community/groups', params);
    },
    /**
     * 获取小组详情
     * @param id 小组ID
     * @returns Promise<IGroup>
     */
    getGroup: (id) => {
        return (0, request_1.get)(`/api/community/groups/${id}`);
    },
    /**
     * 加入小组
     * @param id 小组ID
     * @returns Promise<{success: boolean}>
     */
    joinGroup: (id) => {
        return (0, request_1.post)(`/api/community/groups/${id}/join`, {});
    },
    /**
     * 退出小组
     * @param id 小组ID
     * @returns Promise<{success: boolean}>
     */
    leaveGroup: (id) => {
        return (0, request_1.post)(`/api/community/groups/${id}/leave`, {});
    },
    /**
     * 创建小组
     * @param data 小组数据
     * @returns Promise<IGroup>
     */
    createGroup: (data) => {
        return (0, request_1.post)('/api/community/groups', data);
    },
    /**
     * 搜索社区内容
     * @param params 搜索参数
     * @returns Promise<{posts: IPost[], users: any[], challenges: IChallenge[], groups: any[]}>
     */
    search: (params) => {
        return (0, request_1.get)('/api/community/search', params);
    },
    /**
     * 获取热门搜索词
     * @returns Promise<string[]>
     */
    getHotSearches: () => {
        return (0, request_1.get)('/api/community/hot-searches');
    },
    /**
     * 获取热门话题
     * @returns Promise<{id: string; name: string; count: number}[]>
     */
    getHotTopics: () => {
        return (0, request_1.get)('/api/community/hot-topics');
    }
};
