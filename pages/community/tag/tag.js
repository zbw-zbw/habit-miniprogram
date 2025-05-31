"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 标签页面
 */
const api_1 = require("../../../services/api");
const use_auth_1 = require("../../../utils/use-auth");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        activeTab: 'posts',
        loading: true,
        hasLogin: false,
        userInfo: null,
        tagName: '',
        tagId: '',
        posts: [],
        challenges: [],
        groups: [],
        hasMore: true,
        page: 1,
        pageSize: 10
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 使用useAuth工具获取全局登录状态
        (0, use_auth_1.useAuth)(this);
        // 获取标签名和ID
        if (options.tag) {
            this.setData({
                tagName: decodeURIComponent(options.tag)
            });
        }
        if (options.id) {
            this.setData({
                tagId: options.id
            });
        }
        // 加载数据
        if (this.data.hasLogin) {
            this.loadData();
        }
        else {
            this.setData({ loading: false });
        }
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 检查登录状态，可能在其他页面已经登录/登出
        const app = getApp();
        const isLoggedIn = app.globalData.hasLogin;
        // 更新登录状态
        this.setData({
            userInfo: app.globalData.userInfo,
            hasLogin: isLoggedIn
        });
        // 只有登录后才刷新数据
        if (isLoggedIn) {
            // 每次显示页面时刷新数据
            this.refreshData();
        }
        else {
            this.setData({
                loading: false,
                posts: [],
                challenges: [],
                groups: []
            });
        }
    },
    /**
     * 返回上一页
     */
    goBack() {
        wx.navigateBack();
    },
    /**
     * 加载数据
     */
    loadData() {
        // 检查登录状态
        if (!this.data.hasLogin) {
            this.setData({ loading: false });
            return;
        }
        this.setData({ loading: true });
        // 根据当前选中的标签加载对应数据
        const { activeTab } = this.data;
        let dataPromise;
        switch (activeTab) {
            case 'posts':
                dataPromise = this.loadPosts();
                break;
            case 'challenges':
                dataPromise = this.loadChallenges();
                break;
            case 'groups':
                dataPromise = this.loadGroups();
                break;
            default:
                dataPromise = Promise.resolve();
        }
        dataPromise
            .catch(error => {
            console.error(`加载${activeTab}数据失败:`, error);
        })
            .finally(() => {
            this.setData({ loading: false });
        });
    },
    /**
     * 切换标签
     */
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        // 如果点击的是当前标签，不做任何操作
        if (tab === this.data.activeTab) {
            return;
        }
        this.setData({
            activeTab: tab,
            page: 1
        }, () => {
            // 重新加载数据
            this.loadData();
        });
    },
    /**
     * 加载标签相关动态
     */
    loadPosts() {
        const { page, pageSize, tagId, tagName } = this.data;
        return api_1.communityAPI.getPostsByTag({
            tag: tagId || tagName,
            page,
            pageSize
        })
            .then(result => {
            this.setData({
                posts: page === 1 ? result.posts : [...this.data.posts, ...result.posts],
                hasMore: result.hasMore
            });
            return result;
        })
            .catch(error => {
            console.error('加载标签动态失败:', error);
            wx.showToast({
                title: '加载动态失败',
                icon: 'none'
            });
            return Promise.reject(error);
        });
    },
    /**
     * 加载标签相关挑战
     */
    loadChallenges() {
        const { tagId, tagName } = this.data;
        return api_1.communityAPI.getChallengesByTag({
            tag: tagId || tagName
        })
            .then(challenges => {
            this.setData({ challenges });
            return challenges;
        })
            .catch(error => {
            console.error('加载标签挑战失败:', error);
            this.setData({ challenges: [] });
            return Promise.reject(error);
        });
    },
    /**
     * 加载标签相关小组
     */
    loadGroups() {
        const { tagId, tagName } = this.data;
        return api_1.communityAPI.getGroupsByTag({
            tag: tagId || tagName
        })
            .then(groups => {
            this.setData({ groups });
            return groups;
        })
            .catch(error => {
            console.error('加载标签小组失败:', error);
            this.setData({ groups: [] });
            return Promise.reject(error);
        });
    },
    /**
     * 刷新数据
     */
    refreshData() {
        // 检查登录状态
        if (!this.data.hasLogin) {
            wx.hideNavigationBarLoading();
            wx.stopPullDownRefresh();
            return;
        }
        // 重置页码
        this.setData({
            page: 1,
            hasMore: true
        });
        // 加载数据
        this.loadData();
    },
    /**
     * 加载更多数据
     */
    loadMoreData() {
        if (!this.data.hasMore || this.data.loading) {
            return;
        }
        // 仅动态支持分页加载更多
        if (this.data.activeTab !== 'posts') {
            return;
        }
        this.setData({
            loading: true,
            page: this.data.page + 1
        });
        this.loadPosts()
            .finally(() => {
            this.setData({ loading: false });
        });
    },
    /**
     * 查看动态详情
     */
    viewPostDetail(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/community/post-detail/post-detail?id=${id}`
        });
    },
    /**
     * 查看挑战详情
     */
    viewChallengeDetail(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/community/challenges/detail/detail?id=${id}`
        });
    },
    /**
     * 查看小组详情
     */
    viewGroupDetail(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/community/groups/detail/detail?id=${id}`
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
     * 点赞动态
     */
    likePost(e) {
        const { id, index } = e.currentTarget.dataset;
        const post = this.data.posts[index];
        if (!post)
            return;
        const isLiked = post.isLiked;
        const newLikes = isLiked ? post.likes - 1 : post.likes + 1;
        // 更新本地状态
        this.setData({
            [`posts[${index}].isLiked`]: !isLiked,
            [`posts[${index}].likes`]: newLikes
        });
        // 调用API更新服务端状态
        (isLiked ? api_1.communityAPI.unlikePost(id) : api_1.communityAPI.likePost(id))
            .catch(error => {
            console.error('点赞失败:', error);
            // 恢复原状态
            this.setData({
                [`posts[${index}].isLiked`]: isLiked,
                [`posts[${index}].likes`]: post.likes
            });
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        });
    },
    /**
     * 评论动态
     */
    commentPost(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/community/post-detail/post-detail?id=${id}&focus=comment`
        });
    },
    /**
     * 分享动态
     */
    sharePost(e) {
        // 分享功能由微信小程序原生支持
        // 在onShareAppMessage中处理
    },
    /**
     * 参加挑战
     */
    joinChallenge(e) {
        const { id, index } = e.currentTarget.dataset;
        const challenge = this.data.challenges[index];
        if (!challenge)
            return;
        wx.showLoading({
            title: '处理中'
        });
        api_1.communityAPI.joinChallenge(id)
            .then(() => {
            // 更新本地状态
            this.setData({
                [`challenges[${index}].isJoined`]: true,
                [`challenges[${index}].participants`]: challenge.participants + 1
            });
            wx.showToast({
                title: '已成功参加',
                icon: 'success'
            });
        })
            .catch(error => {
            console.error('参加挑战失败:', error);
            wx.showToast({
                title: '参加失败',
                icon: 'none'
            });
        })
            .finally(() => {
            wx.hideLoading();
        });
    },
    /**
     * 显示创建动态
     */
    showCreatePost() {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }
        // 跳转到发布动态页面，并预填标签
        wx.navigateTo({
            url: `/pages/community/posts/create/create?tag=${encodeURIComponent(this.data.tagName)}`
        });
    },
    /**
     * 创建挑战
     */
    createChallenge() {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }
        // 跳转到创建挑战页面，并预填标签
        wx.navigateTo({
            url: `/pages/community/challenges/create/create?tag=${encodeURIComponent(this.data.tagName)}`
        });
    },
    /**
     * 创建小组
     */
    createGroup() {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }
        // 跳转到创建小组页面，并预填标签
        wx.navigateTo({
            url: `/pages/community/groups/create/create?tag=${encodeURIComponent(this.data.tagName)}`
        });
    },
    /**
     * 导航到搜索页面
     */
    navigateToSearch() {
        wx.navigateTo({
            url: '/pages/community/search/search'
        });
    },
    /**
     * 登录
     */
    login() {
        // 跳转到登录页面
        wx.navigateTo({
            url: '/pages/login/login'
        });
    },
    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.refreshData();
        wx.stopPullDownRefresh();
    },
    /**
     * 上拉加载更多
     */
    onReachBottom() {
        this.loadMoreData();
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: `#${this.data.tagName}# - 习惯打卡社区`,
            path: `/pages/community/tag/tag?tag=${encodeURIComponent(this.data.tagName)}`
        };
    }
});
