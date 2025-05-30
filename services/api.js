"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsAPI = exports.notificationAPI = exports.communityAPI = exports.analyticsAPI = exports.checkinAPI = exports.habitAPI = exports.userAPI = exports.authAPI = void 0;
/**
 * API服务
 * 封装后端API调用
 */
const request_1 = require("../utils/request");
/**
 * 认证相关API
 */
exports.authAPI = {
    /**
     * 用户注册
     * @param userData 用户数据
     * @returns Promise
     */
    register: (userData) => {
        return (0, request_1.post)('/api/auth/register', userData);
    },
    /**
     * 用户登录
     * @param credentials 登录凭证
     * @returns Promise
     */
    login: (credentials) => {
        return (0, request_1.post)('/api/auth/login', credentials);
    },
    /**
     * 微信登录
     * @param wxData 微信登录数据
     * @returns Promise
     */
    wxLogin: (wxData) => {
        return (0, request_1.post)('/api/auth/wx-login', wxData);
    },
    /**
     * 刷新令牌
     * @param refreshToken 刷新令牌
     * @returns Promise
     */
    refreshToken: (refreshToken) => {
        return (0, request_1.post)('/api/auth/refresh-token', { refreshToken });
    },
    /**
     * 登出
     * @returns Promise
     */
    logout: () => {
        return (0, request_1.post)('/api/auth/logout');
    }
};
/**
 * 用户相关API
 */
exports.userAPI = {
    /**
     * 获取当前用户信息
     * @returns Promise
     */
    getCurrentUser: () => {
        return (0, request_1.get)('/api/users/me');
    },
    /**
     * 更新用户资料
     * @param userData 用户数据
     * @returns Promise
     */
    updateProfile: (userData) => {
        return (0, request_1.put)('/api/users/me', userData);
    },
    /**
     * 更新用户头像
     * @param avatarFile 头像文件
     * @returns Promise
     */
    updateAvatar: (avatarFile) => {
        // 使用wx.uploadFile上传文件
        return new Promise((resolve, reject) => {
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
                        }
                        catch (error) {
                            reject(new Error('上传头像失败：数据解析错误'));
                        }
                    }
                    else {
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
        return (0, request_1.get)('/api/users/me/achievements');
    },
    /**
     * 登录
     * @param data 登录数据
     * @returns Promise<{token: string; userInfo: IUserInfo}>
     */
    login: (data) => {
        return (0, request_1.post)('/api/auth/login', data);
    },
    /**
     * 获取用户信息
     * @returns Promise<IUserInfo>
     */
    getUserInfo: () => {
        return (0, request_1.get)('/api/user/info');
    },
    /**
     * 更新用户信息
     * @param data 用户信息
     * @returns Promise<IUserInfo>
     */
    updateUserInfo: (data) => {
        return (0, request_1.put)('/api/user/info', data);
    }
};
/**
 * 习惯相关API
 */
exports.habitAPI = {
    /**
     * 获取所有习惯
     * @returns Promise
     */
    getHabits: (params) => {
        return (0, request_1.get)('/api/habits', params);
    },
    /**
     * 获取习惯详情
     * @param habitId 习惯ID
     * @returns Promise
     */
    getHabit: (habitId) => {
        return (0, request_1.get)(`/api/habits/${habitId}`);
    },
    /**
     * 创建习惯
     * @param habitData 习惯数据
     * @returns Promise
     */
    createHabit: (habitData) => {
        return (0, request_1.post)('/api/habits', habitData);
    },
    /**
     * 更新习惯
     * @param habitId 习惯ID
     * @param habitData 习惯数据
     * @returns Promise
     */
    updateHabit: (habitId, habitData) => {
        return (0, request_1.put)(`/api/habits/${habitId}`, habitData);
    },
    /**
     * 删除习惯
     * @param habitId 习惯ID
     * @returns Promise
     */
    deleteHabit: (habitId) => {
        return (0, request_1.del)(`/api/habits/${habitId}`);
    },
    /**
     * 归档习惯
     * @param habitId 习惯ID
     * @returns Promise
     */
    archiveHabit: (habitId) => {
        return (0, request_1.post)(`/api/habits/${habitId}/archive`);
    },
    /**
     * 取消归档习惯
     * @param habitId 习惯ID
     * @returns Promise
     */
    unarchiveHabit: (habitId) => {
        return (0, request_1.post)(`/api/habits/${habitId}/unarchive`);
    },
    /**
     * 获取习惯统计数据
     * @param habitId 习惯ID
     * @returns Promise
     */
    getHabitStats: (habitId) => {
        return (0, request_1.get)(`/api/habits/${habitId}/stats`);
    },
    /**
     * 获取习惯分类
     * @returns Promise
     */
    getCategories: () => {
        return (0, request_1.get)('/api/habits/categories');
    },
    /**
     * 获取习惯模板
     * @returns Promise
     */
    getTemplates: () => {
        return (0, request_1.get)('/api/habits/templates');
    },
    /**
     * 从模板创建习惯
     * @param templateId 模板ID
     * @returns Promise
     */
    createFromTemplate: (templateId) => {
        return (0, request_1.post)(`/api/habits/from-template/${templateId}`);
    },
    /**
     * 获取习惯列表
     * @param params 查询参数
     * @returns Promise<IHabit[]>
     */
    getHabits: (params) => {
        return (0, request_1.get)('/api/habits', params);
    },
    /**
     * 获取单个习惯
     * @param id 习惯ID
     * @returns Promise<IHabit>
     */
    getHabit: (id) => {
        return (0, request_1.get)(`/api/habits/${id}`);
    },
    /**
     * 创建习惯
     * @param habit 习惯数据
     * @returns Promise<IHabit>
     */
    createHabit: (habit) => {
        return (0, request_1.post)('/api/habits', habit);
    },
    /**
     * 更新习惯
     * @param id 习惯ID
     * @param habit 习惯数据
     * @returns Promise<IHabit>
     */
    updateHabit: (id, habit) => {
        return (0, request_1.put)(`/api/habits/${id}`, habit);
    },
    /**
     * 删除习惯
     * @param id 习惯ID
     * @returns Promise<void>
     */
    deleteHabit: (id) => {
        return (0, request_1.del)(`/api/habits/${id}`);
    },
    /**
     * 归档习惯
     * @param id 习惯ID
     * @returns Promise<IHabit>
     */
    archiveHabit: (id) => {
        return (0, request_1.put)(`/api/habits/${id}/archive`, {});
    },
    /**
     * 取消归档习惯
     * @param id 习惯ID
     * @returns Promise<IHabit>
     */
    unarchiveHabit: (id) => {
        return (0, request_1.put)(`/api/habits/${id}/unarchive`, {});
    },
    /**
     * 获取习惯统计数据
     * @param id 习惯ID
     * @returns Promise<IHabitStats>
     */
    getHabitStats: (id) => {
        return (0, request_1.get)(`/api/habits/${id}/stats`);
    }
};
/**
 * 打卡相关API
 */
exports.checkinAPI = {
    /**
     * 获取打卡记录
     * @param params 查询参数
     * @returns Promise
     */
    getCheckins: (params) => {
        return (0, request_1.get)('/api/checkins', params);
    },
    /**
     * 获取习惯打卡记录
     * @param habitId 习惯ID
     * @returns Promise
     */
    getHabitCheckins: (habitId) => {
        return (0, request_1.get)(`/api/habits/${habitId}/checkins`);
    },
    /**
     * 创建打卡记录
     * @param checkinData 打卡数据
     * @returns Promise
     */
    createCheckin: (checkinData) => {
        return (0, request_1.post)('/api/checkins', checkinData);
    },
    /**
     * 更新打卡记录
     * @param checkinId 打卡记录ID
     * @param checkinData 打卡数据
     * @returns Promise
     */
    updateCheckin: (checkinId, checkinData) => {
        return (0, request_1.put)(`/api/checkins/${checkinId}`, checkinData);
    },
    /**
     * 删除打卡记录
     * @param checkinId 打卡记录ID
     * @returns Promise
     */
    deleteCheckin: (checkinId) => {
        return (0, request_1.del)(`/api/checkins/${checkinId}`);
    },
    /**
     * 获取打卡记录列表
     * @param params 查询参数
     * @returns Promise<ICheckin[]>
     */
    getCheckins: (params) => {
        return (0, request_1.get)('/api/checkins', params);
    },
    /**
     * 获取单个打卡记录
     * @param id 打卡记录ID
     * @returns Promise<ICheckin>
     */
    getCheckin: (id) => {
        return (0, request_1.get)(`/api/checkins/${id}`);
    },
    /**
     * 创建打卡记录
     * @param checkin 打卡记录数据
     * @returns Promise<ICheckin>
     */
    createCheckin: (checkin) => {
        return (0, request_1.post)('/api/checkins', checkin);
    },
    /**
     * 更新打卡记录
     * @param id 打卡记录ID
     * @param checkin 打卡记录数据
     * @returns Promise<ICheckin>
     */
    updateCheckin: (id, checkin) => {
        return (0, request_1.put)(`/api/checkins/${id}`, checkin);
    },
    /**
     * 删除打卡记录
     * @param id 打卡记录ID
     * @returns Promise<void>
     */
    deleteCheckin: (id) => {
        return (0, request_1.del)(`/api/checkins/${id}`);
    }
};
/**
 * 数据分析相关API
 */
exports.analyticsAPI = {
    /**
     * 获取仪表盘数据
     * @returns Promise
     */
    getDashboard: () => {
        return (0, request_1.get)('/api/analytics/dashboard');
    },
    /**
     * 获取习惯完成率
     * @param params 查询参数
     * @returns Promise
     */
    getCompletionRate: (params) => {
        return (0, request_1.get)('/api/analytics/completion-rate', params);
    },
    /**
     * 获取连续打卡记录
     * @returns Promise
     */
    getStreaks: () => {
        return (0, request_1.get)('/api/analytics/streaks');
    },
    /**
     * 获取习惯趋势数据
     * @param params 查询参数
     * @returns Promise
     */
    getTrends: (params) => {
        return (0, request_1.get)('/api/analytics/trends', params);
    },
    /**
     * 获取习惯统计数据
     * @param params 查询参数
     * @returns Promise<any>
     */
    getHabitStats: (params) => {
        return (0, request_1.get)('/api/analytics/habits', params);
    },
    /**
     * 获取趋势数据
     * @param params 查询参数
     * @returns Promise<any>
     */
    getTrends: (params) => {
        return (0, request_1.get)('/api/analytics/trends', params);
    },
    /**
     * 生成报告
     * @param params 查询参数
     * @returns Promise<any>
     */
    generateReport: (params) => {
        return (0, request_1.post)('/api/analytics/report', params);
    },
    /**
     * 获取洞察数据
     * @returns Promise<any>
     */
    getInsights: () => {
        return (0, request_1.get)('/api/analytics/insights');
    }
};
/**
 * 社区相关API
 */
exports.communityAPI = {
    /**
     * 获取动态列表
     * @param params 查询参数
     * @returns Promise
     */
    getPosts: (params) => {
        return (0, request_1.get)('/api/community/posts', params);
    },
    /**
     * 获取动态详情
     * @param postId 动态ID
     * @returns Promise
     */
    getPost: (postId) => {
        return (0, request_1.get)(`/api/community/posts/${postId}`);
    },
    /**
     * 创建动态
     * @param postData 动态数据
     * @returns Promise
     */
    createPost: (postData) => {
        return (0, request_1.post)('/api/community/posts', postData);
    },
    /**
     * 点赞动态
     * @param postId 动态ID
     * @returns Promise
     */
    likePost: (postId) => {
        return (0, request_1.post)(`/api/community/posts/${postId}/like`);
    },
    /**
     * 取消点赞动态
     * @param postId 动态ID
     * @returns Promise
     */
    unlikePost: (postId) => {
        return (0, request_1.post)(`/api/community/posts/${postId}/unlike`);
    },
    /**
     * 获取评论列表
     * @param postId 动态ID
     * @returns Promise
     */
    getComments: (postId) => {
        return (0, request_1.get)(`/api/community/posts/${postId}/comments`);
    },
    /**
     * 创建评论
     * @param postId 动态ID
     * @param commentData 评论数据
     * @returns Promise
     */
    createComment: (postId, commentData) => {
        return (0, request_1.post)(`/api/community/posts/${postId}/comments`, commentData);
    },
    /**
     * 获取挑战列表
     * @returns Promise
     */
    getChallenges: () => {
        return (0, request_1.get)('/api/community/challenges');
    },
    /**
     * 获取挑战详情
     * @param challengeId 挑战ID
     * @returns Promise
     */
    getChallenge: (challengeId) => {
        return (0, request_1.get)(`/api/community/challenges/${challengeId}`);
    },
    /**
     * 参与挑战
     * @param challengeId 挑战ID
     * @returns Promise
     */
    joinChallenge: (challengeId) => {
        return (0, request_1.post)(`/api/community/challenges/${challengeId}/join`);
    },
    /**
     * 退出挑战
     * @param challengeId 挑战ID
     * @returns Promise
     */
    leaveChallenge: (challengeId) => {
        return (0, request_1.post)(`/api/community/challenges/${challengeId}/leave`);
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
                url: getApp().globalData.apiBaseUrl + '/api/upload',
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
     * 获取动态评论
     * @param postId 动态ID
     * @param params 查询参数
     * @returns Promise<IComment[]>
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
                url: getApp().globalData.apiBaseUrl + '/api/upload',
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
    }
};
/**
 * 通知相关API
 */
exports.notificationAPI = {
    /**
     * 获取通知列表
     * @param params 查询参数
     * @returns Promise
     */
    getNotifications: (params) => {
        return (0, request_1.get)('/api/notifications', params);
    },
    /**
     * 标记通知为已读
     * @param notificationId 通知ID
     * @returns Promise
     */
    markAsRead: (notificationId) => {
        return (0, request_1.put)(`/api/notifications/${notificationId}/read`);
    },
    /**
     * 标记所有通知为已读
     * @returns Promise
     */
    markAllAsRead: () => {
        return (0, request_1.put)('/api/notifications/read-all');
    },
    /**
     * 删除通知
     * @param notificationId 通知ID
     * @returns Promise
     */
    deleteNotification: (notificationId) => {
        return (0, request_1.del)(`/api/notifications/${notificationId}`);
    }
};
/**
 * 设置相关API
 */
exports.settingsAPI = {
    /**
     * 获取用户设置
     * @returns Promise
     */
    getSettings: () => {
        return (0, request_1.get)('/api/settings');
    },
    /**
     * 更新用户设置
     * @param settings 设置数据
     * @returns Promise
     */
    updateSettings: (settings) => {
        return (0, request_1.put)('/api/settings', settings);
    }
};
exports.default = {
    auth: exports.authAPI,
    user: exports.userAPI,
    habit: exports.habitAPI,
    checkin: exports.checkinAPI,
    analytics: exports.analyticsAPI,
    community: exports.communityAPI,
    notification: exports.notificationAPI,
    settings: exports.settingsAPI
};
