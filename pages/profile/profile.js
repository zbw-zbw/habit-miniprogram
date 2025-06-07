"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../services/api");
const auth_1 = require("../../utils/auth");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        userInfo: null,
        hasLogin: false,
        loading: true,
        stats: {
            totalHabits: 0,
            completedToday: 0,
            totalCheckins: 0,
            currentStreak: 0,
            longestStreak: 0,
        },
        achievements: [],
        showModal: false,
        tempUserInfo: {
            nickName: '',
            avatar: '',
        },
        isFirstLogin: true,
        nicknameLength: 0, // 昵称长度计数
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        // 页面加载时执行
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        this.loadUserInfo();
        this.loadProfileData();
    },
    /**
     * 加载用户信息
     */
    loadUserInfo() {
        var _a;
        const app = getApp();
        // 判断是否首次登录（昵称为空或为"微信用户"）
        const isFirstLogin = !((_a = app.globalData.userInfo) === null || _a === void 0 ? void 0 : _a.nickName) ||
            app.globalData.userInfo.nickName === '微信用户';
        this.setData({
            userInfo: app.globalData.userInfo,
            hasLogin: app.globalData.hasLogin,
            'settings.theme': app.globalData.theme || 'light',
            isFirstLogin: isFirstLogin
        });
        // 监听主题变化
        if (typeof app.onThemeChange === 'function') {
            const callback = (theme) => {
                this.setData({
                    'settings.theme': theme,
                });
            };
            app.onThemeChange(callback);
        }
    },
    /**
     * 加载个人资料数据
     */
    loadProfileData() {
        this.setData({ loading: true });
        // 检查是否已登录，未登录则不请求数据
        if (!this.data.hasLogin) {
            this.setData({
                loading: false,
                stats: {
                    totalHabits: 0,
                    completedToday: 0,
                    totalCheckins: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                },
                achievements: [],
            });
            return;
        }
        // 使用新的聚合API获取所有数据
        api_1.userAPI
            .getProfileAll()
            .then((data) => {
            // 更新统计数据
            this.setData({
                'stats.totalHabits': data.stats.totalHabits,
                'stats.completedToday': data.stats.completedToday,
                'stats.totalCheckins': data.stats.totalCheckins,
                'stats.currentStreak': data.stats.currentStreak,
                'stats.longestStreak': data.stats.longestStreak,
                // 更新成就数据
                achievements: data.achievements,
                loading: false,
            });
        })
            .catch((error) => {
            this.setData({ loading: false });
        });
    },
    /**
     * 用户登录
     */
    login() {
        // 使用公共登录方法
        (0, auth_1.login)((success) => {
            if (success) {
                // 登录成功后，获取最新的用户信息
                const app = getApp();
                this.setData({
                    userInfo: app.globalData.userInfo,
                    hasLogin: true,
                });
                // 登录成功后重新加载数据
                this.loadProfileData();
            }
        });
    },
    /**
     * 显示资料完善模态框
     */
    showProfileModal() {
        var _a, _b;
        // 初始化临时用户信息
        const nickName = ((_a = this.data.userInfo) === null || _a === void 0 ? void 0 : _a.nickName) || '微信用户';
        const avatar = ((_b = this.data.userInfo) === null || _b === void 0 ? void 0 : _b.avatar) || '/assets/images/default-avatar.png';
        this.setData({
            showModal: true,
            tempUserInfo: {
                nickName: nickName,
                avatar: avatar,
            },
            nicknameLength: nickName.length // 初始化昵称长度计数
        });
    },
    /**
     * 隐藏资料完善模态框
     */
    hideProfileModal() {
        var _a, _b;
        // 重置临时用户信息，避免下次打开显示旧数据
        const nickName = ((_a = this.data.userInfo) === null || _a === void 0 ? void 0 : _a.nickName) || '微信用户';
        const avatar = ((_b = this.data.userInfo) === null || _b === void 0 ? void 0 : _b.avatar) || '/assets/images/default-avatar.png';
        this.setData({
            showModal: false,
            tempUserInfo: {
                nickName: nickName,
                avatar: avatar
            },
            nicknameLength: nickName.length // 重置昵称长度计数
        });
    },
    /**
     * 处理昵称输入失去焦点
     */
    onNicknameBlur(e) {
        const nickname = e.detail.value;
        if (!nickname) {
            return; // 如果为空，不更新
        }
        // 直接更新整个tempUserInfo对象
        this.setData({
            tempUserInfo: {
                nickName: nickname,
                avatar: this.data.tempUserInfo.avatar
            }
        });
    },
    /**
     * 处理昵称输入
     */
    onNicknameInput(e) {
        const nickname = e.detail.value;
        this.setData({
            'tempUserInfo.nickName': nickname,
            nicknameLength: nickname.length
        });
    },
    /**
     * 处理头像选择
     */
    onChooseAvatar(e) {
        const tempPath = e.detail.avatarUrl;
        // 获取当前昵称，确保不会丢失
        const currentNickName = this.data.tempUserInfo.nickName;
        // 更新临时头像，同时保留当前昵称
        this.setData({
            tempUserInfo: {
                nickName: currentNickName,
                avatar: tempPath
            }
        });
        wx.showToast({
            title: '已选择头像',
            icon: 'success',
            duration: 1500
        });
    },
    /**
     * 更新用户资料
     */
    updateUserProfile() {
        // 获取最新的临时用户信息
        const { nickName, avatar } = this.data.tempUserInfo;
        // 验证输入
        if (!nickName.trim()) {
            wx.showToast({
                title: '请输入昵称',
                icon: 'none'
            });
            return;
        }
        wx.showLoading({
            title: '更新资料中',
        });
        // 准备要发送到服务器的用户数据
        const userData = {
            nickName: nickName,
            nickname: nickName // 同时设置nickname，确保兼容后端
        }; // 使用any类型断言
        // 如果头像是临时文件路径，需要先上传
        if (avatar && (avatar.startsWith('wxfile://') || avatar.startsWith('http://tmp/'))) {
            // 先上传头像
            api_1.userAPI.updateAvatar(avatar)
                .then(response => {
                // 获取服务器返回的头像URL
                const serverAvatarUrl = response.avatar;
                // 上传成功后，更新用户资料
                return api_1.userAPI.updateProfile({
                    ...userData,
                    avatar: serverAvatarUrl
                }).then(() => {
                    // 返回服务器头像URL，以便后续使用
                    return serverAvatarUrl;
                });
            })
                .then((serverAvatarUrl) => {
                // 成功后处理，使用当前的昵称和服务器返回的头像URL
                this.updateProfileSuccess(nickName, serverAvatarUrl || avatar);
            })
                .catch(err => {
                this.updateProfileFail(err);
            });
        }
        else {
            // 更新用户资料
            api_1.userAPI.updateProfile({
                ...userData,
                avatar: avatar
            })
                .then(() => {
                this.updateProfileSuccess(nickName, avatar);
            })
                .catch(err => {
                this.updateProfileFail(err);
            });
        }
    },
    /**
     * 更新资料成功处理
     */
    updateProfileSuccess(nickName, avatar) {
        const app = getApp();
        // 更新全局用户信息
        if (app.globalData.userInfo) {
            // 使用类型断言来绕过TypeScript的类型检查
            app.globalData.userInfo = {
                ...app.globalData.userInfo,
                nickName: nickName,
                nickname: nickName,
                avatar: avatar // 使用avatar字段而不是avatarUrl
            };
            // 更新本地存储
            wx.setStorageSync('userInfo', app.globalData.userInfo);
            // 更新页面数据
            this.setData({
                userInfo: app.globalData.userInfo,
                showModal: false,
                isFirstLogin: false // 更新资料后不再是首次登录
            });
        }
        else {
            wx.showToast({
                title: '更新失败',
                icon: 'error'
            });
            return;
        }
        wx.hideLoading();
        wx.showToast({
            title: '资料更新成功',
            icon: 'success'
        });
    },
    /**
     * 更新资料失败处理
     */
    updateProfileFail(err) {
        wx.hideLoading();
        wx.showToast({
            title: '资料更新失败',
            icon: 'error'
        });
    },
    /**
     * 用户登出
     */
    logout() {
        // 使用公共登出方法
        (0, auth_1.logout)(() => {
            this.setData({
                userInfo: null,
                hasLogin: false,
                stats: {
                    totalHabits: 0,
                    completedToday: 0,
                    totalCheckins: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                },
                achievements: [],
            });
        });
    },
    /**
     * 导航到指定页面
     */
    navigateTo(e) {
        const url = e.currentTarget.dataset.url;
        wx.navigateTo({ url });
    },
    /**
     * 导航到成就详情页
     */
    navigateToAchievement(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/profile/achievements/detail/detail?id=${id}`,
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '我的习惯养成进度',
            path: '/pages/index/index',
            imageUrl: '/assets/images/share-profile.png',
        };
    },
    /**
     * 处理表单提交
     */
    formSubmit(e) {
        const formData = e.detail.value;
        const nickName = formData.nickname;
        const avatar = this.data.tempUserInfo.avatar;
        // 验证输入
        if (!nickName || !nickName.trim()) {
            wx.showToast({
                title: '请输入昵称',
                icon: 'none'
            });
            return;
        }
        // 更新临时用户信息中的昵称
        this.setData({
            'tempUserInfo.nickName': nickName
        });
        wx.showLoading({
            title: '更新资料中',
        });
        // 准备要发送到服务器的用户数据
        const userData = {
            nickName: nickName,
            nickname: nickName // 同时设置nickname，确保兼容后端
        }; // 使用any类型断言
        // 如果头像是临时文件路径，需要先上传
        if (avatar && (avatar.startsWith('wxfile://') || avatar.startsWith('http://tmp/'))) {
            // 先上传头像
            api_1.userAPI.updateAvatar(avatar)
                .then(response => {
                // 获取服务器返回的头像URL
                const serverAvatarUrl = response.avatar;
                // 上传成功后，更新用户资料
                return api_1.userAPI.updateProfile({
                    ...userData,
                    avatar: serverAvatarUrl
                }).then(() => {
                    // 返回服务器头像URL，以便后续使用
                    return serverAvatarUrl;
                });
            })
                .then((serverAvatarUrl) => {
                // 成功后处理，使用当前的昵称和服务器返回的头像URL
                this.updateProfileSuccess(nickName, serverAvatarUrl || avatar);
            })
                .catch(err => {
                this.updateProfileFail(err);
            });
        }
        else {
            // 更新用户资料
            api_1.userAPI.updateProfile({
                ...userData,
                avatar: avatar
            })
                .then(() => {
                this.updateProfileSuccess(nickName, avatar);
            })
                .catch(err => {
                this.updateProfileFail(err);
            });
        }
    },
});
