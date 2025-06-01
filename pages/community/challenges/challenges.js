"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * pages/community/challenges/challenges.ts
 * 社区挑战页面
 */
const api_1 = require("../../../services/api");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        loading: true,
        hasMore: true,
        activeTab: 'all',
        challenges: [],
        page: 1,
        limit: 10,
        searchKeyword: '',
        showSearch: false
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 如果有标签参数，设置初始标签
        if (options.tab && ['all', 'joined', 'popular', 'new'].includes(options.tab)) {
            this.setData({ activeTab: options.tab });
        }
        // 如果有标签参数，直接搜索该标签
        if (options.tag) {
            this.setData({
                showSearch: true,
                searchKeyword: options.tag
            });
        }
        // 加载挑战数据
        this.loadChallenges(true);
    },
    /**
     * 加载挑战数据
     */
    loadChallenges(isRefresh = false) {
        // 如果是刷新，重置页码
        if (isRefresh) {
            this.setData({
                page: 1,
                challenges: [],
                hasMore: true
            });
        }
        // 如果没有更多数据，直接返回
        if (!this.data.hasMore && !isRefresh) {
            return;
        }
        // 显示加载中
        this.setData({
            loading: true
        });
        // 构建请求参数
        const params = {
            page: this.data.page,
            limit: this.data.limit,
            type: this.data.activeTab !== 'all' ? this.data.activeTab : undefined,
            keyword: this.data.searchKeyword || undefined,
            status: 'all' // 获取所有状态的挑战，包括upcoming
        };
        console.log('请求挑战列表参数:', params);
        // 调用API获取挑战数据
        api_1.communityAPI.getChallenges(params)
            .then(result => {
            console.log('获取到挑战数据:', result);
            // 确保返回了正确的数据结构
            let challenges = [];
            let pagination = {
                total: 0,
                pages: 0,
                page: this.data.page,
                limit: this.data.limit
            };
            // 处理不同的返回格式
            if (result && typeof result === 'object') {
                // 如果返回的是带有challenges和pagination的对象
                if (result.challenges) {
                    challenges = Array.isArray(result.challenges) ? result.challenges : [];
                    if (result.pagination) {
                        pagination = result.pagination;
                    }
                }
                // 如果返回的是带有data的对象
                else if (result.data && result.data.challenges) {
                    challenges = Array.isArray(result.data.challenges) ? result.data.challenges : [];
                    if (result.data.pagination) {
                        pagination = result.data.pagination;
                    }
                }
            }
            // 如果直接返回的是数组
            else if (Array.isArray(result)) {
                challenges = result;
                pagination.total = challenges.length;
            }
            // 处理挑战数据，确保字段一致性
            const processedChallenges = challenges.map(challenge => {
                // 计算进度值
                let progressValue = 0;
                if (typeof challenge.progress === 'number') {
                    progressValue = challenge.progress;
                }
                else if (challenge.progress && typeof challenge.progress.completionRate === 'number') {
                    progressValue = challenge.progress.completionRate;
                }
                // 处理可能的字段不一致问题
                const processed = {
                    ...challenge,
                    // 确保id字段存在
                    id: challenge.id || challenge._id,
                    // 确保标题字段存在
                    title: challenge.title || challenge.name || '未命名挑战',
                    // 确保图片字段存在
                    image: challenge.image || challenge.coverImage || '/assets/images/challenge.png',
                    // 确保描述字段存在
                    description: challenge.description || '',
                    // 确保参与人数字段存在
                    participantsCount: challenge.participantsCount || challenge.participants || 0,
                    participants: challenge.participants || challenge.participantsCount || 0,
                    // 确保isJoined字段存在
                    isJoined: challenge.isJoined || challenge.isParticipating || false,
                    isParticipating: challenge.isParticipating || challenge.isJoined || false,
                    // 确保进度字段是数字
                    progress: typeof challenge.progress === 'number' ?
                        challenge.progress :
                        (challenge.progress && typeof challenge.progress.completionRate === 'number' ?
                            challenge.progress.completionRate : 0),
                    // 确保天数字段存在
                    totalDays: challenge.totalDays ||
                        (challenge.requirements && challenge.requirements.targetCount ?
                            challenge.requirements.targetCount : 0),
                    // 设置预处理的进度值
                    progressValue: progressValue
                };
                return processed;
            });
            console.log('处理后的挑战数据:', processedChallenges);
            console.log('分页信息:', pagination);
            // 更新数据
            this.setData({
                challenges: isRefresh ? processedChallenges : [...this.data.challenges, ...processedChallenges],
                loading: false,
                hasMore: this.data.page < pagination.pages,
                page: this.data.page + 1
            });
        })
            .catch(error => {
            console.error('获取挑战列表失败:', error);
            // 显示错误提示
            wx.showToast({
                title: '获取挑战列表失败',
                icon: 'none'
            });
            this.setData({
                loading: false
            });
        });
    },
    /**
     * 切换标签
     */
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        if (tab !== this.data.activeTab) {
            this.setData({
                activeTab: tab,
                page: 1,
                challenges: [],
                hasMore: true
            });
            // 重新加载数据
            this.loadChallenges();
        }
    },
    /**
     * 查看挑战详情
     */
    viewChallengeDetail(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/challenges/detail/detail?id=${id}`
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
        const isJoined = challenge.isJoined || challenge.isParticipating;
        // 显示加载中
        wx.showLoading({
            title: isJoined ? '退出中...' : '参加中...'
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
                ? Math.max(0, challenges[index].participantsCount - 1)
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
                icon: 'success'
            });
        })
            .catch(error => {
            console.error('操作失败:', error);
            // 显示错误提示
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        })
            .finally(() => {
            wx.hideLoading();
        });
    },
    /**
     * 显示搜索框
     */
    showSearchInput() {
        this.setData({
            showSearch: true
        });
    },
    /**
     * 隐藏搜索框
     */
    hideSearchInput() {
        this.setData({
            showSearch: false,
            searchKeyword: ''
        });
        // 重新加载数据
        this.loadChallenges(true);
    },
    /**
     * 输入搜索关键词
     */
    inputSearch(e) {
        this.setData({
            searchKeyword: e.detail.value
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
            url: '/pages/community/challenges/create/create'
        });
    },
    /**
     * 刷新数据
     */
    refreshData() {
        console.log('刷新挑战列表数据');
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
            url: `/pages/community/tag/tag?name=${tag}`
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
            path: '/pages/community/challenges/challenges'
        };
    }
});
