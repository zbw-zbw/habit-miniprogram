"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 添加好友页面
 */
const api_1 = require("../../../services/api");
const use_auth_1 = require("../../../utils/use-auth");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        hasLogin: false,
        searchKeyword: '',
        hasSearched: false,
        loading: false,
        loadingRecommend: true,
        users: [],
        recommendUsers: []
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        // 使用useAuth工具获取全局登录状态
        (0, use_auth_1.useAuth)(this);
        // 检查登录状态
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none',
                success: () => {
                    setTimeout(() => {
                        wx.navigateBack();
                    }, 1500);
                }
            });
            return;
        }
        // 加载推荐好友
        this.loadRecommendUsers();
    },
    /**
     * 返回上一页
     */
    goBack() {
        wx.navigateBack();
    },
    /**
     * 输入搜索关键词
     */
    inputKeyword(e) {
        this.setData({
            searchKeyword: e.detail.value
        });
    },
    /**
     * 清空搜索关键词
     */
    clearKeyword() {
        this.setData({
            searchKeyword: ''
        });
    },
    /**
     * 搜索用户
     */
    searchUsers() {
        const { searchKeyword } = this.data;
        if (!searchKeyword.trim()) {
            wx.showToast({
                title: '请输入搜索关键词',
                icon: 'none'
            });
            return;
        }
        this.setData({
            loading: true,
            hasSearched: true
        });
        api_1.communityAPI.searchUsers({
            keyword: searchKeyword.trim()
        })
            .then(users => {
            this.setData({
                users,
                loading: false
            });
        })
            .catch(error => {
            console.error('搜索用户失败:', error);
            this.setData({
                users: [],
                loading: false
            });
            wx.showToast({
                title: '搜索失败',
                icon: 'none'
            });
        });
    },
    /**
     * 加载推荐好友
     */
    loadRecommendUsers() {
        this.setData({
            loadingRecommend: true
        });
        api_1.communityAPI.getRecommendUsers()
            .then(users => {
            this.setData({
                recommendUsers: users,
                loadingRecommend: false
            });
        })
            .catch(error => {
            console.error('加载推荐好友失败:', error);
            this.setData({
                recommendUsers: [],
                loadingRecommend: false
            });
        });
    },
    /**
     * 查看用户资料
     */
    viewUserProfile(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/profile/user/user?id=${id}`
        });
    },
    /**
     * 添加好友（搜索结果）
     */
    addFriend(e) {
        const { id, index } = e.currentTarget.dataset;
        wx.showLoading({
            title: '处理中'
        });
        api_1.communityAPI.addFriend(id)
            .then(() => {
            // 更新本地状态
            this.setData({
                [`users[${index}].isFriend`]: true
            });
            wx.showToast({
                title: '添加成功',
                icon: 'success'
            });
        })
            .catch(error => {
            console.error('添加好友失败:', error);
            wx.showToast({
                title: '添加失败',
                icon: 'none'
            });
        })
            .finally(() => {
            wx.hideLoading();
        });
    },
    /**
     * 添加好友（推荐列表）
     */
    addRecommendFriend(e) {
        const { id, index } = e.currentTarget.dataset;
        wx.showLoading({
            title: '处理中'
        });
        api_1.communityAPI.addFriend(id)
            .then(() => {
            // 更新本地状态
            this.setData({
                [`recommendUsers[${index}].isFriend`]: true
            });
            wx.showToast({
                title: '添加成功',
                icon: 'success'
            });
        })
            .catch(error => {
            console.error('添加好友失败:', error);
            wx.showToast({
                title: '添加失败',
                icon: 'none'
            });
        })
            .finally(() => {
            wx.hideLoading();
        });
    },
    /**
     * 扫码添加好友
     */
    scanQRCode() {
        wx.scanCode({
            success: (res) => {
                // 处理扫码结果
                const scanResult = res.result;
                // 判断是否是好友二维码
                if (scanResult.startsWith('habit-tracker://friend/')) {
                    const userId = scanResult.replace('habit-tracker://friend/', '');
                    // 添加好友
                    wx.showLoading({
                        title: '处理中'
                    });
                    api_1.communityAPI.addFriend(userId)
                        .then(() => {
                        wx.showToast({
                            title: '添加成功',
                            icon: 'success'
                        });
                        // 刷新推荐好友列表
                        this.loadRecommendUsers();
                    })
                        .catch(error => {
                        console.error('添加好友失败:', error);
                        wx.showToast({
                            title: '添加失败',
                            icon: 'none'
                        });
                    })
                        .finally(() => {
                        wx.hideLoading();
                    });
                }
                else {
                    wx.showToast({
                        title: '无效的好友码',
                        icon: 'none'
                    });
                }
            },
            fail: () => {
                // 用户取消扫码
            }
        });
    }
});
