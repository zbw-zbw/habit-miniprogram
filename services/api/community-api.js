"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.communityAPI = void 0;
/**
 * 社区相关API
 */
var request_1 = require("../../utils/request");
exports.communityAPI = {
    /**
     * 获取社区动态
     * @param params 查询参数
     * @returns Promise<{posts: IPost[], hasMore: boolean}>
     */
    getPosts: function (params) {
        return (0, request_1.get)('/api/posts', params).then(function (res) {
            // 处理分页数据
            var posts = res.posts, total = res.total, page = res.page, limit = res.limit;
            var hasMore = page * limit < total;
            return { posts: posts, hasMore: hasMore };
        });
    },
    /**
     * 获取单个动态
     * @param id 动态ID
     * @returns Promise<IPost>
     */
    getPost: function (id) {
        return (0, request_1.get)("/api/posts/".concat(id));
    },
    /**
     * 创建动态
     * @param postData 动态数据
     * @returns Promise<IPost>
     */
    createPost: function (postData) {
        return (0, request_1.post)('/api/posts', postData);
    },
    /**
     * 删除动态
     * @param id 动态ID
     * @returns Promise<void>
     */
    deletePost: function (id) {
        return (0, request_1.del)("/api/posts/".concat(id));
    },
    /**
     * 点赞动态
     * @param id 动态ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    likePost: function (id) {
        return (0, request_1.post)("/api/posts/".concat(id, "/like"), {});
    },
    /**
     * 取消点赞动态
     * @param id 动态ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    unlikePost: function (id) {
        return (0, request_1.post)("/api/posts/".concat(id, "/unlike"), {});
    },
    /**
     * 获取动态评论
     * @param postId 动态ID
     * @param params 查询参数
     * @returns Promise<{comments: IComment[], pagination: IPagination}>
     */
    getComments: function (postId, params) {
        return (0, request_1.get)("/api/posts/".concat(postId, "/comments"), params);
    },
    /**
     * 添加评论
     * @param postId 动态ID
     * @param comment 评论内容
     * @returns Promise<IComment>
     */
    addComment: function (postId, comment) {
        return (0, request_1.post)("/api/posts/".concat(postId, "/comments"), comment);
    },
    /**
     * 删除评论
     * @param postId 动态ID
     * @param commentId 评论ID
     * @returns Promise<void>
     */
    deleteComment: function (postId, commentId) {
        return (0, request_1.del)("/api/posts/".concat(postId, "/comments/").concat(commentId));
    },
    /**
     * 点赞评论
     * @param postId 动态ID
     * @param commentId 评论ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    likeComment: function (postId, commentId) {
        return (0, request_1.post)("/api/posts/".concat(postId, "/comments/").concat(commentId, "/like"), {});
    },
    /**
     * 取消点赞评论
     * @param postId 动态ID
     * @param commentId 评论ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    unlikeComment: function (postId, commentId) {
        return (0, request_1.post)("/api/posts/".concat(postId, "/comments/").concat(commentId, "/unlike"), {});
    },
    /**
     * 直接点赞评论（用于回复）
     * @param commentId 评论ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    likeCommentDirect: function (commentId) {
        return (0, request_1.post)("/api/comments/".concat(commentId, "/like"), {});
    },
    /**
     * 直接取消点赞评论（用于回复）
     * @param commentId 评论ID
     * @returns Promise<{likeCount: number, isLiked: boolean}>
     */
    unlikeCommentDirect: function (commentId) {
        return (0, request_1.post)("/api/comments/".concat(commentId, "/unlike"), {});
    },
    /**
     * 获取挑战列表
     * @param params 查询参数
     * @returns Promise<IChallenge[]>
     */
    getChallenges: function (params) {
        return (0, request_1.get)('/api/community/challenges', params).then(function (response) {
            console.log('挑战列表原始响应:', response);
            // 处理不同的响应格式
            if (response && typeof response === 'object') {
                // 标准格式: { success: true, data: { challenges: [], pagination: {} } }
                if (response.success === true && response.data && response.data.challenges) {
                    console.log('返回标准格式数据');
                    // 处理挑战数据，确保字段一致性
                    if (Array.isArray(response.data.challenges)) {
                        response.data.challenges = response.data.challenges.map(function (challenge) { return (__assign(__assign({}, challenge), { id: challenge.id || challenge._id, participantsCount: challenge.participantsCount || challenge.participants || 0, participants: challenge.participants || challenge.participantsCount || 0, isJoined: challenge.isJoined || challenge.isParticipating || false, isParticipating: challenge.isParticipating || challenge.isJoined || false })); });
                    }
                    return response.data;
                }
                // 直接返回数据对象: { challenges: [], pagination: {} }
                if (response.challenges && Array.isArray(response.challenges)) {
                    console.log('返回数据对象');
                    // 处理挑战数据，确保字段一致性
                    response.challenges = response.challenges.map(function (challenge) { return (__assign(__assign({}, challenge), { id: challenge.id || challenge._id, participantsCount: challenge.participantsCount || challenge.participants || 0, participants: challenge.participants || challenge.participantsCount || 0, isJoined: challenge.isJoined || challenge.isParticipating || false, isParticipating: challenge.isParticipating || challenge.isJoined || false })); });
                    return response;
                }
            }
            // 如果是数组，直接返回
            if (Array.isArray(response)) {
                console.log('返回数组');
                // 处理挑战数据，确保字段一致性
                var processedChallenges = response.map(function (challenge) { return (__assign(__assign({}, challenge), { id: challenge.id || challenge._id, participantsCount: challenge.participantsCount || challenge.participants || 0, participants: challenge.participants || challenge.participantsCount || 0, isJoined: challenge.isJoined || challenge.isParticipating || false, isParticipating: challenge.isParticipating || challenge.isJoined || false })); });
                return {
                    challenges: processedChallenges,
                    pagination: {
                        total: processedChallenges.length,
                        page: (params === null || params === void 0 ? void 0 : params.page) || 1,
                        limit: (params === null || params === void 0 ? void 0 : params.limit) || processedChallenges.length,
                        pages: 1
                    }
                };
            }
            // 默认返回空数据
            console.log('返回默认空数据');
            return {
                challenges: [],
                pagination: {
                    total: 0,
                    page: (params === null || params === void 0 ? void 0 : params.page) || 1,
                    limit: (params === null || params === void 0 ? void 0 : params.limit) || 10,
                    pages: 0
                }
            };
        });
    },
    /**
     * 获取单个挑战
     * @param id 挑战ID
     * @returns Promise<IChallenge>
     */
    getChallenge: function (id) {
        return (0, request_1.get)("/api/community/challenges/".concat(id));
    },
    /**
     * 参加挑战
     * @param id 挑战ID
     * @returns Promise<{success: boolean}>
     */
    joinChallenge: function (id) {
        return (0, request_1.post)("/api/community/challenges/".concat(id, "/join"), {});
    },
    /**
     * 退出挑战
     * @param id 挑战ID
     * @returns Promise<{success: boolean}>
     */
    leaveChallenge: function (id) {
        return (0, request_1.post)("/api/community/challenges/".concat(id, "/leave"), {});
    },
    /**
     * 解散挑战（仅创建者可操作）
     * @param id 挑战ID
     * @returns Promise<{success: boolean}>
     */
    dismissChallenge: function (id) {
        return (0, request_1.post)("/api/community/challenges/".concat(id, "/dismiss"), {});
    },
    /**
     * 获取好友列表
     * @returns Promise<IFriend[]>
     */
    getFriends: function () {
        return (0, request_1.get)('/api/friends');
    },
    /**
     * 关注/取消关注用户
     * @param userId 用户ID
     * @param isFollow 是否关注
     * @returns Promise<{success: boolean}>
     */
    followUser: function (userId, isFollow) {
        return (0, request_1.put)("/api/friends/".concat(userId, "/follow"), { isFollow: isFollow });
    },
    /**
     * 上传图片
     * @param filePath 本地文件路径
     * @returns Promise<{url: string}>
     */
    uploadImage: function (filePath) {
        return new Promise(function (resolve, reject) {
            // 获取token
            var token = wx.getStorageSync('token');
            wx.uploadFile({
                url: wx.getStorageSync('apiBaseUrl') + '/api/media/upload',
                filePath: filePath,
                name: 'file',
                header: {
                    'Authorization': "Bearer ".concat(token)
                },
                success: function (res) {
                    try {
                        var data = JSON.parse(res.data);
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
                fail: function (error) {
                    console.error('上传图片失败:', error);
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
    getGroups: function (params) {
        return (0, request_1.get)('/api/groups', params);
    },
    /**
     * 获取小组详情
     * @param id 小组ID
     * @returns Promise<IGroup>
     */
    getGroup: function (id) {
        return (0, request_1.get)("/api/groups/".concat(id));
    },
    /**
     * 获取小组详情（别名，与getGroup功能相同）
     * @param id 小组ID
     * @returns Promise<IGroup>
     */
    getGroupDetail: function (id) {
        return (0, request_1.get)("/api/groups/".concat(id));
    },
    /**
     * 获取小组动态
     * @param groupId 小组ID
     * @param params 查询参数
     * @returns Promise<{posts: any[], pagination: any}>
     */
    getGroupPosts: function (groupId, params) {
        return (0, request_1.get)("/api/groups/".concat(groupId, "/posts"), params);
    },
    /**
     * 获取小组成员
     * @param groupId 小组ID
     * @param params 查询参数
     * @returns Promise<{members: any[], pagination: any}>
     */
    getGroupMembers: function (groupId, params) {
        return (0, request_1.get)("/api/groups/".concat(groupId, "/members"), params);
    },
    /**
     * 加入小组
     * @param id 小组ID
     * @returns Promise<{success: boolean}>
     */
    joinGroup: function (id) {
        return (0, request_1.post)("/api/groups/".concat(id, "/join"), {});
    },
    /**
     * 退出小组
     * @param id 小组ID
     * @returns Promise<{success: boolean}>
     */
    leaveGroup: function (id) {
        return (0, request_1.post)("/api/groups/".concat(id, "/leave"), {});
    },
    /**
     * 创建小组
     * @param data 小组数据
     * @returns Promise<IGroup>
     */
    createGroup: function (data) {
        return (0, request_1.post)('/api/groups', data);
    },
    /**
     * 搜索社区内容
     * @param params 搜索参数
     * @returns Promise<{posts: IPost[], users: any[], challenges: IChallenge[], groups: any[]}>
     */
    search: function (params) {
        return (0, request_1.get)('/api/community/search', params);
    },
    /**
     * 获取热门搜索词
     * @returns Promise<string[]>
     */
    getHotSearches: function () {
        return (0, request_1.get)('/api/community/hot-searches');
    },
    /**
     * 获取热门话题
     * @returns Promise<{id: string; name: string; count: number}[]>
     */
    getHotTopics: function () {
        return (0, request_1.get)('/api/community/hot-topics');
    },
    /**
     * 搜索用户
     * @param params 搜索参数
     * @returns Promise<IUser[]>
     */
    searchUsers: function (params) {
        return (0, request_1.get)('/api/community/search/users', params);
    },
    /**
     * 获取推荐用户
     * @returns Promise<IUser[]>
     */
    getRecommendUsers: function () {
        return (0, request_1.get)('/api/community/recommend-users');
    },
    /**
     * 创建挑战
     * @param data 挑战数据
     * @returns Promise<IChallenge>
     */
    createChallenge: function (data) {
        return (0, request_1.post)('/api/community/challenges', data);
    },
    /**
     * 添加好友
     * @param userId 用户ID
     * @returns Promise<{success: boolean}>
     */
    addFriend: function (userId) {
        return (0, request_1.post)("/api/friends/".concat(userId, "/add"), {});
    },
    /**
     * 获取挑战参与者列表
     * @param challengeId 挑战ID
     * @param params 查询参数
     * @returns Promise<{participants: any[], pagination: any}>
     */
    getChallengeParticipants: function (challengeId, params) {
        return (0, request_1.get)("/api/community/challenges/".concat(challengeId, "/participants"), params);
    },
    /**
     * 获取挑战排行榜
     * @param challengeId 挑战ID
     * @returns Promise<{leaderboard: any[], myRank: number, myProgress: number}>
     */
    getChallengeLeaderboard: function (challengeId) {
        return (0, request_1.get)("/api/community/challenges/".concat(challengeId, "/leaderboard"));
    }
};
