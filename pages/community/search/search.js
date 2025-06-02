"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 社区搜索页面
 */
const api_1 = require("../../../services/api");
const image_1 = require("../../../utils/image");
const use_auth_1 = require("../../../utils/use-auth");
const util_1 = require("../../../utils/util");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        keyword: '',
        searchHistory: [],
        hotSearches: [],
        activeTab: 'all',
        loading: false,
        results: [],
        userResults: [],
        groupResults: [],
        challengeResults: [],
        postResults: [],
        hasMore: false,
        page: 1,
        pageSize: 10,
        hasLogin: false,
        isSearched: false // 标记是否已经执行过搜索
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        // 使用useAuth工具获取全局登录状态
        (0, use_auth_1.useAuth)(this);
        // 获取搜索历史
        const searchHistory = wx.getStorageSync('searchHistory') || [];
        this.setData({
            searchHistory
        });
        // 加载热门搜索词
        this.loadHotSearches();
    },
    // 加载热门搜索词
    loadHotSearches() {
        api_1.communityAPI.getHotSearches()
            .then(hotSearches => {
            this.setData({ hotSearches });
        })
            .catch(() => {
            // 加载失败时使用默认热门搜索
            this.setData({
                hotSearches: ['习惯养成', '早起', '阅读', '运动健身', '冥想']
            });
        });
    },
    // 输入搜索内容
    onSearchInput(e) {
        this.setData({
            keyword: e.detail.value
        });
        // 移除输入过程中的过滤操作，只在用户回车或点击搜索按钮时触发搜索
        if (!e.detail.value) {
            this.setData({
                results: [],
                userResults: [],
                groupResults: [],
                challengeResults: [],
                postResults: []
            });
        }
    },
    // 执行搜索
    onSearch() {
        const { keyword } = this.data;
        if (!keyword || !keyword.trim()) {
            wx.showToast({
                title: '请输入搜索内容',
                icon: 'none'
            });
            return;
        }
        // 保存搜索历史
        this.saveSearchHistory(keyword);
        // 重置页码和搜索结果
        this.setData({
            activeTab: 'all',
            loading: true,
            results: [],
            userResults: [],
            groupResults: [],
            challengeResults: [],
            postResults: [],
            page: 1,
            isSearched: true // 标记已执行搜索
        });
        // 执行搜索
        this.fetchSearchResults();
    },
    // 保存搜索历史
    saveSearchHistory(keyword) {
        let { searchHistory } = this.data;
        // 如果已经存在，先移除
        searchHistory = searchHistory.filter(item => item !== keyword);
        // 添加到头部
        searchHistory.unshift(keyword);
        // 最多保存10条
        if (searchHistory.length > 10) {
            searchHistory = searchHistory.slice(0, 10);
        }
        this.setData({ searchHistory });
        wx.setStorageSync('searchHistory', searchHistory);
    },
    // 清除搜索输入
    clearSearch() {
        this.setData({
            keyword: '',
            results: [],
            userResults: [],
            groupResults: [],
            challengeResults: [],
            postResults: [],
            isSearched: false // 重置搜索状态
        });
    },
    // 重置搜索结果
    resetSearch() {
        this.setData({
            results: [],
            userResults: [],
            groupResults: [],
            challengeResults: [],
            postResults: [],
            page: 1,
            hasMore: false,
            loading: false,
            isSearched: false // 重置搜索状态
        });
    },
    // 使用历史关键词
    useHistoryKeyword(e) {
        const keyword = e.currentTarget.dataset.keyword;
        this.setData({ keyword });
        this.onSearch();
    },
    // 使用热门关键词
    useHotKeyword(e) {
        const keyword = e.currentTarget.dataset.keyword;
        this.setData({ keyword });
        this.onSearch();
    },
    // 切换标签
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ activeTab: tab });
    },
    // 获取搜索结果
    fetchSearchResults() {
        const { keyword, activeTab, page, pageSize } = this.data;
        if (!keyword.trim()) {
            return;
        }
        this.setData({ loading: true });
        api_1.communityAPI.search({
            keyword,
            type: activeTab,
            page,
            limit: pageSize
        })
            .then(results => {
            if (activeTab === 'all') {
                // 处理图片URL和时间格式化
                const processedUsers = (results.users || []).map(user => ({
                    ...user,
                    avatar: (0, image_1.getFullImageUrl)(user.avatar)
                }));
                const processedGroups = (results.groups || []).map(group => {
                    var _a, _b;
                    // 获取当前用户ID
                    const app = getApp();
                    const currentUserId = (_b = (_a = app === null || app === void 0 ? void 0 : app.globalData) === null || _a === void 0 ? void 0 : _a.userInfo) === null || _b === void 0 ? void 0 : _b.id;
                    console.log('处理小组数据:', group);
                    console.log('当前用户ID:', currentUserId);
                    // 如果当前用户是创建者，则标记为已加入
                    const isCreator = group.creator &&
                        (group.creator._id === currentUserId || group.creator.id === currentUserId);
                    console.log('是否是创建者:', isCreator);
                    console.log('原始isJoined:', group.isJoined);
                    return {
                        ...group,
                        avatar: (0, image_1.getFullImageUrl)(group.avatar),
                        // 如果用户是创建者或服务端返回了已加入字段，则标记为已加入
                        isJoined: isCreator || group.isJoined || false
                    };
                });
                // 处理挑战数据，确保 isJoined 和 isParticipating 字段存在
                const processedChallenges = (results.challenges || []).map(challenge => {
                    var _a, _b;
                    // 获取当前用户ID
                    const app = getApp();
                    const currentUserId = (_b = (_a = app === null || app === void 0 ? void 0 : app.globalData) === null || _a === void 0 ? void 0 : _a.userInfo) === null || _b === void 0 ? void 0 : _b.id;
                    console.log('处理挑战数据:', challenge);
                    console.log('当前用户ID:', currentUserId);
                    // 检查挑战是否已参与的逻辑
                    // 如果当前用户是创建者，则标记为已参与
                    const isCreator = challenge.creator &&
                        (challenge.creator._id === currentUserId || challenge.creator.id === currentUserId);
                    console.log('是否是创建者:', isCreator);
                    console.log('原始isJoined:', challenge.isJoined);
                    console.log('原始isParticipating:', challenge.isParticipating);
                    // 确保参与人数至少为1（如果有创建者）
                    const participantsCount = challenge.participantsCount || challenge.participants || 0;
                    const adjustedParticipantsCount = isCreator && participantsCount === 0 ? 1 : participantsCount;
                    return {
                        ...challenge,
                        image: (0, image_1.getFullImageUrl)(challenge.image),
                        // 如果用户是创建者或服务端返回了这些字段，则标记为已参与
                        isJoined: isCreator || challenge.isJoined || challenge.isParticipating || false,
                        isParticipating: isCreator || challenge.isJoined || challenge.isParticipating || false,
                        isCreator: isCreator,
                        // 确保 participantsCount 字段存在
                        participantsCount: adjustedParticipantsCount,
                        participants: adjustedParticipantsCount
                    };
                });
                const processedPosts = (results.posts || []).map(post => ({
                    ...post,
                    userAvatar: (0, image_1.getFullImageUrl)(post.userAvatar),
                    images: (post.images || []).map(img => (0, image_1.getFullImageUrl)(img)),
                    createdAt: (0, util_1.formatRelativeTime)(post.createdAt || new Date()),
                    likes: post.likeCount || post.likes || 0
                }));
                // 计算总结果数量
                const totalResults = processedUsers.length + processedGroups.length +
                    processedChallenges.length + processedPosts.length;
                this.setData({
                    userResults: processedUsers,
                    groupResults: processedGroups,
                    challengeResults: processedChallenges,
                    postResults: processedPosts,
                    loading: false,
                    results: totalResults > 0 ? [1] : [] // 用于判断是否有搜索结果
                });
            }
            else if (activeTab === 'users') {
                const users = results.users || [];
                const processedUsers = users.map(user => ({
                    ...user,
                    avatar: (0, image_1.getFullImageUrl)(user.avatar)
                }));
                const newUsers = page === 1 ? processedUsers : [...this.data.userResults, ...processedUsers];
                this.setData({
                    userResults: newUsers,
                    loading: false,
                    hasMore: users && users.length === pageSize,
                    results: newUsers.length > 0 ? [1] : [] // 用于判断是否有搜索结果
                });
            }
            else if (activeTab === 'groups') {
                const groups = results.groups || [];
                const processedGroups = groups.map(group => {
                    var _a, _b;
                    // 获取当前用户ID
                    const app = getApp();
                    const currentUserId = (_b = (_a = app === null || app === void 0 ? void 0 : app.globalData) === null || _a === void 0 ? void 0 : _a.userInfo) === null || _b === void 0 ? void 0 : _b.id;
                    console.log('处理小组数据(tab):', group);
                    console.log('当前用户ID(tab):', currentUserId);
                    // 如果当前用户是创建者，则标记为已加入
                    const isCreator = group.creator &&
                        (group.creator._id === currentUserId || group.creator.id === currentUserId);
                    console.log('是否是创建者(tab):', isCreator);
                    console.log('原始isJoined(tab):', group.isJoined);
                    return {
                        ...group,
                        avatar: (0, image_1.getFullImageUrl)(group.avatar),
                        // 如果用户是创建者或服务端返回了已加入字段，则标记为已加入
                        isJoined: isCreator || group.isJoined || false
                    };
                });
                const newGroups = page === 1 ? processedGroups : [...this.data.groupResults, ...processedGroups];
                this.setData({
                    groupResults: newGroups,
                    loading: false,
                    hasMore: groups && groups.length === pageSize,
                    results: newGroups.length > 0 ? [1] : [] // 用于判断是否有搜索结果
                });
            }
            else if (activeTab === 'challenges') {
                const challenges = results.challenges || [];
                // 处理挑战数据，确保 isJoined 和 isParticipating 字段存在
                const processedChallenges = challenges.map(challenge => {
                    var _a, _b;
                    // 获取当前用户ID
                    const app = getApp();
                    const currentUserId = (_b = (_a = app === null || app === void 0 ? void 0 : app.globalData) === null || _a === void 0 ? void 0 : _a.userInfo) === null || _b === void 0 ? void 0 : _b.id;
                    console.log('处理挑战数据(tab):', challenge);
                    console.log('当前用户ID(tab):', currentUserId);
                    // 检查挑战是否已参与的逻辑
                    // 如果当前用户是创建者，则标记为已参与
                    const isCreator = challenge.creator &&
                        (challenge.creator._id === currentUserId || challenge.creator.id === currentUserId);
                    console.log('是否是创建者(tab):', isCreator);
                    console.log('原始isJoined(tab):', challenge.isJoined);
                    console.log('原始isParticipating(tab):', challenge.isParticipating);
                    // 确保参与人数至少为1（如果有创建者）
                    const participantsCount = challenge.participantsCount || challenge.participants || 0;
                    const adjustedParticipantsCount = isCreator && participantsCount === 0 ? 1 : participantsCount;
                    return {
                        ...challenge,
                        image: (0, image_1.getFullImageUrl)(challenge.image),
                        // 如果用户是创建者或服务端返回了这些字段，则标记为已参与
                        isJoined: isCreator || challenge.isJoined || challenge.isParticipating || false,
                        isParticipating: isCreator || challenge.isJoined || challenge.isParticipating || false,
                        isCreator: isCreator,
                        // 确保 participantsCount 字段存在
                        participantsCount: adjustedParticipantsCount,
                        participants: adjustedParticipantsCount
                    };
                });
                const newChallenges = page === 1 ? processedChallenges : [...this.data.challengeResults, ...processedChallenges];
                this.setData({
                    challengeResults: newChallenges,
                    loading: false,
                    hasMore: challenges && challenges.length === pageSize,
                    results: newChallenges.length > 0 ? [1] : [] // 用于判断是否有搜索结果
                });
            }
            else if (activeTab === 'posts') {
                const posts = results.posts || [];
                const processedPosts = posts.map(post => ({
                    ...post,
                    userAvatar: (0, image_1.getFullImageUrl)(post.userAvatar),
                    images: (post.images || []).map(img => (0, image_1.getFullImageUrl)(img)),
                    createdAt: (0, util_1.formatRelativeTime)(post.createdAt || new Date()),
                    likes: post.likeCount || post.likes || 0
                }));
                const newPosts = page === 1 ? processedPosts : [...this.data.postResults, ...processedPosts];
                this.setData({
                    postResults: newPosts,
                    loading: false,
                    hasMore: posts && posts.length === pageSize,
                    results: newPosts.length > 0 ? [1] : [] // 用于判断是否有搜索结果
                });
            }
        })
            .catch(error => {
            console.error('搜索失败:', error);
            this.setData({ loading: false });
            wx.showToast({
                title: '搜索失败',
                icon: 'none'
            });
        });
    },
    // 加载更多结果
    loadMore() {
        if (this.data.loading || !this.data.hasMore)
            return;
        this.setData({
            page: this.data.page + 1
        });
        this.fetchSearchResults();
    },
    // 清除搜索历史
    clearHistory() {
        this.setData({ searchHistory: [] });
        wx.setStorageSync('searchHistory', []);
    },
    // 查看用户资料
    viewUserProfile(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/profile/profile?id=${id}`
        });
    },
    // 查看小组详情
    viewGroupDetail(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/groups/detail/detail?id=${id}`
        });
    },
    // 查看挑战详情
    viewChallengeDetail(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/challenges/detail/detail?id=${id}`
        });
    },
    // 查看动态详情
    viewPostDetail(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/post-detail/post-detail?id=${id}`
        });
    },
    // 切换关注状态
    toggleFollow(e) {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }
        const { id, index } = e.currentTarget.dataset;
        const { userResults } = this.data;
        const user = userResults[index];
        if (!user)
            return;
        const isFollow = !user.isFollowing;
        wx.showLoading({ title: '处理中' });
        api_1.communityAPI.followUser(id, isFollow)
            .then(() => {
            this.setData({
                [`userResults[${index}].isFollowing`]: isFollow
            });
        })
            .catch(error => {
            console.error('操作失败:', error);
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        })
            .finally(() => {
            wx.hideLoading();
        });
    },
    // 切换加入状态
    toggleJoin(e) {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }
        const { id, index } = e.currentTarget.dataset;
        const { groupResults } = this.data;
        const group = groupResults[index];
        if (!group)
            return;
        // 检查是否已经加入
        if (group.isJoined) {
            wx.showToast({
                title: '已加入该小组',
                icon: 'none'
            });
            return;
        }
        const isJoined = !group.isJoined;
        wx.showLoading({ title: '处理中' });
        if (isJoined) {
            api_1.communityAPI.joinGroup(id)
                .then(() => {
                // 更新本地状态
                this.setData({
                    [`groupResults[${index}].isJoined`]: true,
                    // 增加成员数
                    [`groupResults[${index}].membersCount`]: (group.membersCount || 0) + 1
                });
                wx.showToast({
                    title: '已成功加入',
                    icon: 'success'
                });
            })
                .catch(error => {
                console.error('加入失败:', error);
                // 如果服务端返回已加入的错误，更新本地状态
                if (error && error.message && error.message.includes('已加入') || error.message.includes('已经是成员')) {
                    this.setData({
                        [`groupResults[${index}].isJoined`]: true
                    });
                    wx.showToast({
                        title: '已加入该小组',
                        icon: 'none'
                    });
                }
                else {
                    wx.showToast({
                        title: '加入失败',
                        icon: 'none'
                    });
                }
            })
                .finally(() => {
                wx.hideLoading();
            });
        }
        else {
            api_1.communityAPI.leaveGroup(id)
                .then(() => {
                // 更新本地状态
                this.setData({
                    [`groupResults[${index}].isJoined`]: false,
                    // 减少成员数，确保不小于0
                    [`groupResults[${index}].membersCount`]: Math.max(0, (group.membersCount || 0) - 1)
                });
                wx.showToast({
                    title: '已退出小组',
                    icon: 'success'
                });
            })
                .catch(error => {
                console.error('退出失败:', error);
                wx.showToast({
                    title: '退出失败',
                    icon: 'none'
                });
            })
                .finally(() => {
                wx.hideLoading();
            });
        }
    },
    // 切换挑战参与状态
    toggleJoinChallenge(e) {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }
        const { id, index } = e.currentTarget.dataset;
        const { challengeResults } = this.data;
        const challenge = challengeResults[index];
        if (!challenge)
            return;
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
                            title: '处理中...'
                        });
                        // 调用API解散挑战
                        api_1.communityAPI.dismissChallenge(id)
                            .then(() => {
                            // 从列表中移除该挑战
                            challengeResults.splice(index, 1);
                            this.setData({ challengeResults });
                            wx.showToast({
                                title: '挑战已解散',
                                icon: 'success'
                            });
                        })
                            .catch(error => {
                            console.error('解散挑战失败:', error);
                            wx.showToast({
                                title: '解散挑战失败',
                                icon: 'none'
                            });
                        })
                            .finally(() => {
                            wx.hideLoading();
                        });
                    }
                }
            });
            return;
        }
        // 检查是否已经参与
        if (challenge.isJoined) {
            wx.showToast({
                title: '已参与此挑战',
                icon: 'none'
            });
            return;
        }
        const isJoined = !challenge.isJoined;
        wx.showLoading({ title: '处理中' });
        if (isJoined) {
            api_1.communityAPI.joinChallenge(id)
                .then(() => {
                // 更新本地状态
                this.setData({
                    [`challengeResults[${index}].isJoined`]: true,
                    [`challengeResults[${index}].isParticipating`]: true,
                    // 增加参与人数
                    [`challengeResults[${index}].participants`]: (challenge.participants || 0) + 1,
                    [`challengeResults[${index}].participantsCount`]: (challenge.participantsCount || challenge.participants || 0) + 1
                });
                wx.showToast({
                    title: '已成功参加',
                    icon: 'success'
                });
            })
                .catch(error => {
                console.error('参与失败:', error);
                // 如果服务端返回已参与的错误，更新本地状态
                if (error && error.message && error.message.includes('已经参与')) {
                    this.setData({
                        [`challengeResults[${index}].isJoined`]: true,
                        [`challengeResults[${index}].isParticipating`]: true
                    });
                    wx.showToast({
                        title: '已参与此挑战',
                        icon: 'none'
                    });
                }
                else {
                    wx.showToast({
                        title: '参与失败',
                        icon: 'none'
                    });
                }
            })
                .finally(() => {
                wx.hideLoading();
            });
        }
        else {
            api_1.communityAPI.leaveChallenge(id)
                .then(() => {
                this.setData({
                    [`challengeResults[${index}].isJoined`]: false,
                    [`challengeResults[${index}].isParticipating`]: false,
                    // 减少参与人数，确保不小于1（如果有创建者）
                    [`challengeResults[${index}].participants`]: Math.max(1, (challenge.participants || 0) - 1),
                    [`challengeResults[${index}].participantsCount`]: Math.max(1, (challenge.participantsCount || challenge.participants || 0) - 1)
                });
                wx.showToast({
                    title: '已退出挑战',
                    icon: 'success'
                });
            })
                .catch(error => {
                console.error('退出失败:', error);
                wx.showToast({
                    title: '退出失败',
                    icon: 'none'
                });
            })
                .finally(() => {
                wx.hideLoading();
            });
        }
    },
    // 返回
    goBack() {
        wx.navigateBack();
    }
});
