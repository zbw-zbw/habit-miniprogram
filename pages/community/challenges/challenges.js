"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * pages/community/challenges/challenges.ts
 * 社区挑战页面
 */
const api_1 = require("../../../services/api");
const image_1 = require("../../../utils/image");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        loading: true,
        hasMore: true,
        activeTab: 'all',
        tabIndex: 0,
        challenges: [],
        page: 1,
        limit: 10,
        searchKeyword: '',
        hasLogin: false,
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 如果有标签参数，设置初始标签
        if (options.tab &&
            ['all', 'joined', 'created', 'popular', 'new'].includes(options.tab)) {
            const tabMapping = {
                'all': 0,
                'joined': 1,
                'created': 2,
                'popular': 3,
                'new': 4
            };
            this.setData({
                activeTab: options.tab,
                tabIndex: tabMapping[options.tab]
            });
        }
        // 如果有标签参数，直接搜索该标签
        if (options.tag) {
            this.setData({
                searchKeyword: options.tag,
            });
        }
        // 加载挑战数据
        this.loadChallenges(true);
    },
    /**
     * 加载挑战数据
     */
    loadChallenges(isRefresh = false) {
        const { page, limit, activeTab, searchKeyword } = this.data;
        // 如果是刷新，重置页码
        const currentPage = isRefresh ? 1 : page;
        // 设置加载状态
        this.setData({
            loading: this.data.challenges.length === 0,
            loadingMore: this.data.challenges.length > 0,
        });
        // 构建查询参数
        const params = {
            page: currentPage,
            limit,
        };
        // 根据activeTab设置不同的查询参数
        switch (activeTab) {
            case 'all':
                // 查询所有挑战
                break;
            case 'joined':
                // 已参加的挑战
                params.joined = true;
                break;
            case 'created':
                // 我创建的挑战
                params.created = true;
                break;
            case 'popular':
                // 热门挑战
                params.sort = 'popular';
                break;
            case 'new':
                // 最新挑战
                params.sort = 'new';
                break;
        }
        // 如果有搜索关键词，添加到查询参数
        if (searchKeyword) {
            params.keyword = searchKeyword;
        }
        // 调用API获取挑战列表
        api_1.communityAPI
            .getChallenges(params)
            .then((result) => {
            // 获取挑战列表
            const challenges = result.challenges || [];
            // 处理挑战数据
            const processedChallenges = challenges.map((challenge) => {
                var _a, _b;
                // 获取当前用户ID
                const app = getApp();
                const currentUserId = (_b = (_a = app === null || app === void 0 ? void 0 : app.globalData) === null || _a === void 0 ? void 0 : _a.userInfo) === null || _b === void 0 ? void 0 : _b.id;
                // 检查是否是创建者
                const isCreator = challenge.creator &&
                    (challenge.creator._id === currentUserId ||
                        challenge.creator.id === currentUserId);
                // 处理图片URL
                if (challenge.image) {
                    challenge.image = (0, image_1.getFullImageUrl)(challenge.image);
                }
                if (challenge.coverImage) {
                    challenge.coverImage = (0, image_1.getFullImageUrl)(challenge.coverImage);
                }
                // 确保参与人数至少为1（如果有创建者）
                const participantsCount = challenge.participantsCount || challenge.participants || 0;
                const adjustedParticipantsCount = isCreator && participantsCount === 0 ? 1 : participantsCount;
                return {
                    id: challenge.id || challenge._id,
                    name: challenge.name || challenge.title,
                    description: challenge.description,
                    image: challenge.image ||
                        challenge.coverImage ||
                        '/assets/images/challenge.png',
                    coverImage: challenge.coverImage ||
                        challenge.image ||
                        '/assets/images/challenge.png',
                    participantsCount: challenge.participantCount,
                    participants: adjustedParticipantsCount,
                    isJoined: challenge.isJoined || challenge.isParticipating || false,
                    isCreator: isCreator,
                    startDate: challenge.startDate,
                    endDate: challenge.endDate,
                    status: challenge.status || 'active',
                    tags: challenge.tags || [],
                    durationDays: challenge.durationDays,
                    remainingDays: challenge.remainingDays,
                };
            });
            // 更新数据
            this.setData({
                challenges: isRefresh
                    ? processedChallenges
                    : [...this.data.challenges, ...processedChallenges],
                page: currentPage + 1,
                hasMore: challenges.length === limit,
                loading: false,
                loadingMore: false,
            });
        })
            .catch((error) => {
            this.setData({
                loading: false,
                loadingMore: false,
            });
            wx.showToast({
                title: '获取挑战列表失败',
                icon: 'none',
            });
        });
    },
    /**
     * 切换标签
     */
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        if (tab !== this.data.activeTab) {
            const tabMapping = {
                'all': 0,
                'joined': 1,
                'created': 2,
                'popular': 3,
                'new': 4
            };
            this.setData({
                activeTab: tab,
                tabIndex: tabMapping[tab],
                page: 1,
                challenges: [],
                hasMore: true,
            });
            // 重新加载数据
            this.loadChallenges(true);
        }
    },
    /**
     * 处理tab-bar组件的标签切换事件
     */
    onTabChange(e) {
        const index = e.detail.index;
        const tabMapping = ['all', 'joined', 'created', 'new'];
        const tab = tabMapping[index];
        if (tab !== this.data.activeTab) {
            this.setData({
                activeTab: tab,
                tabIndex: index,
                page: 1,
                challenges: [],
                hasMore: true,
            });
            // 重新加载数据
            this.loadChallenges(true);
        }
    },
    /**
     * 查看挑战详情
     */
    viewChallengeDetail(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/challenges/detail/detail?id=${id}`,
        });
    },
    /**
     * 参加/退出挑战
     */
    toggleJoinChallenge(e) {
        const id = e.currentTarget.dataset.id;
        const index = e.currentTarget.dataset.index;
        // 防止事件冒泡
        // 在微信小程序中，TouchEvent没有stopPropagation方法，使用catchtap替代
        // 获取当前挑战
        const challenges = this.data.challenges;
        const challenge = challenges[index];
        // 如果是创建者，则解散挑战
        if (challenge.isCreator) {
            // 显示确认对话框
            wx.showModal({
                title: '解散挑战',
                content: '确定要解散该挑战吗？解散后无法恢复，所有参与者将自动退出。',
                confirmText: '确定解散',
                confirmColor: '#F56C6C',
                success: (res) => {
                    if (res.confirm) {
                        wx.showLoading({
                            title: '处理中...',
                        });
                        // 调用API解散挑战
                        api_1.communityAPI
                            .dismissChallenge(id)
                            .then(() => {
                            // 从列表中移除该挑战
                            challenges.splice(index, 1);
                            this.setData({ challenges });
                            wx.showToast({
                                title: '挑战已解散',
                                icon: 'success',
                            });
                        })
                            .catch((error) => {
                            wx.showToast({
                                title: '解散挑战失败',
                                icon: 'none',
                            });
                        })
                            .finally(() => {
                            wx.hideLoading();
                        });
                    }
                },
            });
            return;
        }
        const isJoined = challenge.isJoined || challenge.isParticipating;
        // 显示加载中
        wx.showLoading({
            title: isJoined ? '退出中...' : '参加中...',
        });
        // 调用API
        const apiCall = isJoined
            ? api_1.communityAPI.leaveChallenge(id)
            : api_1.communityAPI.joinChallenge(id);
        apiCall
            .then(() => {
            // 更新本地数据
            challenges[index].isJoined = !isJoined;
            challenges[index].isParticipating = !isJoined;
            challenges[index].participantsCount = isJoined
                ? Math.max(1, challenges[index].participantsCount - 1) // 确保至少有1人（创建者）
                : challenges[index].participantsCount + 1;
            challenges[index].participants = challenges[index].participantsCount;
            // 如果是退出挑战，重置进度
            if (isJoined) {
                challenges[index].progress = 0;
                challenges[index].progressValue = 0;
            }
            this.setData({ challenges });
            // 显示成功提示
            wx.showToast({
                title: isJoined ? '已退出挑战' : '已参加挑战',
                icon: 'success',
            });
        })
            .catch((error) => {
            // 显示错误提示
            wx.showToast({
                title: '操作失败',
                icon: 'none',
            });
        })
            .finally(() => {
            wx.hideLoading();
        });
    },
    /**
     * 输入搜索关键词
     */
    inputSearch(e) {
        this.setData({
            searchKeyword: e.detail.value,
        });
    },
    /**
     * 执行搜索
     */
    doSearch() {
        // 重新加载数据
        this.loadChallenges(true);
    },
    /**
     * 创建新挑战
     */
    createChallenge() {
        wx.navigateTo({
            url: '/pages/community/challenges/create/create',
        });
    },
    /**
     * 刷新数据
     */
    refreshData() {
        this.loadChallenges(true);
    },
    /**
     * 查看标签
     */
    viewTag(e) {
        const tag = e.currentTarget.dataset.tag;
        // 防止事件冒泡
        // 在微信小程序中，TouchEvent没有stopPropagation方法，使用catchtap替代
        wx.navigateTo({
            url: `/pages/community/tag/tag?name=${tag}`,
        });
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        this.loadChallenges(true);
        wx.stopPullDownRefresh();
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        if (!this.data.loading && this.data.hasMore) {
            this.loadChallenges();
        }
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '一起来参加习惯挑战，培养好习惯！',
            path: '/pages/community/challenges/challenges',
        };
    },
});
