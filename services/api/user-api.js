"use strict";
exports.__esModule = true;
exports.userAPI = void 0;
/**
 * 用户相关API
 */
var request_1 = require("../../utils/request");
exports.userAPI = {
    /**
     * 获取当前用户信息
     * @returns Promise<IUserInfo>
     */
    getCurrentUser: function () {
        return (0, request_1.get)('/api/users/me');
    },
    /**
     * 更新用户资料
     * @param userData 用户数据
     * @returns Promise<IUserInfo>
     */
    updateProfile: function (userData) {
        return (0, request_1.put)('/api/users/me', userData);
    },
    /**
     * 更新用户头像
     * @param avatarFile 头像文件
     * @returns Promise<{avatarUrl: string}>
     */
    updateAvatar: function (avatarFile) {
        // 使用wx.uploadFile上传文件
        return new Promise(function (resolve, reject) {
            wx.uploadFile({
                url: 'http://localhost:3000/api/users/me/avatar',
                filePath: avatarFile,
                name: 'avatar',
                header: {
                    'Authorization': "Bearer ".concat(wx.getStorageSync('token'))
                },
                success: function (res) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            var data = JSON.parse(res.data);
                            resolve(data);
                        }
                        catch (error) {
                            reject(new Error('上传头像失败：数据解析错误'));
                        }
                    }
                    else {
                        reject(new Error("\u4E0A\u4F20\u5934\u50CF\u5931\u8D25\uFF1A".concat(res.statusCode)));
                    }
                },
                fail: function () {
                    reject(new Error('上传头像失败：网络错误'));
                }
            });
        });
    },
    /**
     * 获取用户成就
     * @returns Promise<Array<{id: string; title: string; description: string; icon: string; progress: number; isCompleted: boolean;}>>
     */
    getAchievements: function () {
        return (0, request_1.get)('/api/users/me/achievements');
    },
    /**
     * 获取用户信息
     * @returns Promise<IUserInfo>
     */
    getUserInfo: function () {
        return (0, request_1.get)('/api/user/info');
    },
    /**
     * 更新用户信息
     * @param data 用户信息
     * @returns Promise<IUserInfo>
     */
    updateUserInfo: function (data) {
        return (0, request_1.put)('/api/user/info', data);
    },
    /**
     * 获取用户资料聚合数据（包括基本信息、统计数据和成就）
     * @returns Promise<IUserProfileAll>
     */
    getProfileAll: function () {
        return (0, request_1.get)('/api/users/profile/all');
    }
};
