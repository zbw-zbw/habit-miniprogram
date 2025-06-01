"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 社区搜索页面
const api_1 = require("../../../services/api");
const use_auth_1 = require("../../../utils/use-auth");
Page({
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
        hasLogin: false
    },
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
            .catch(error => {
            console.error('加载热门搜索词失败:', error);
        });
    },
    // 输入搜索内容
    onSearchInput(e) {
        this.setData({
            keyword: e.detail.value
        });
        // 如果输入为空，重置搜索结果
        if (!e.detail.value) {
            this.resetSearch();
        }
    },
    // 执行搜索
    onSearch() {
        const { keyword } = this.data;
        if (!keyword.trim())
            return;
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
            page: 1
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
            keyword: ''
        });
        this.resetSearch();
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
            loading: false
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
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
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
                this.setData({
                    userResults: results.users || [],
                    groupResults: results.groups || [],
                    challengeResults: results.challenges || [],
                    postResults: results.posts || [],
                    loading: false,
                    hasMore: false // 全部搜索不支持分页
                });
            }
            else if (activeTab === 'users') {
                const newUsers = page === 1 ? results.users : [...this.data.userResults, ...results.users];
                this.setData({
                    userResults: newUsers,
                    loading: false,
                    hasMore: results.users && results.users.length === pageSize
                });
            }
            else if (activeTab === 'groups') {
                const newGroups = page === 1 ? results.groups : [...this.data.groupResults, ...results.groups];
                this.setData({
                    groupResults: newGroups,
                    loading: false,
                    hasMore: results.groups && results.groups.length === pageSize
                });
            }
            else if (activeTab === 'challenges') {
                const newChallenges = page === 1 ? results.challenges : [...this.data.challengeResults, ...results.challenges];
                this.setData({
                    challengeResults: newChallenges,
                    loading: false,
                    hasMore: results.challenges && results.challenges.length === pageSize
                });
            }
            else if (activeTab === 'posts') {
                const newPosts = page === 1 ? results.posts : [...this.data.postResults, ...results.posts];
                this.setData({
                    postResults: newPosts,
                    loading: false,
                    hasMore: results.posts && results.posts.length === pageSize
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
        const isJoined = !group.isJoined;
        wx.showLoading({ title: '处理中' });
        if (isJoined) {
            api_1.communityAPI.joinGroup(id)
                .then(() => {
                this.setData({
                    [`groupResults[${index}].isJoined`]: true
                });
            })
                .catch(error => {
                console.error('加入失败:', error);
                wx.showToast({
                    title: '加入失败',
                    icon: 'none'
                });
            })
                .finally(() => {
                wx.hideLoading();
            });
        }
        else {
            api_1.communityAPI.leaveGroup(id)
                .then(() => {
                this.setData({
                    [`groupResults[${index}].isJoined`]: false
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
        const isJoined = !challenge.isJoined;
        wx.showLoading({ title: '处理中' });
        if (isJoined) {
            api_1.communityAPI.joinChallenge(id)
                .then(() => {
                this.setData({
                    [`challengeResults[${index}].isJoined`]: true
                });
            })
                .catch(error => {
                console.error('参与失败:', error);
                wx.showToast({
                    title: '参与失败',
                    icon: 'none'
                });
            })
                .finally(() => {
                wx.hideLoading();
            });
        }
        else {
            api_1.communityAPI.leaveChallenge(id)
                .then(() => {
                this.setData({
                    [`challengeResults[${index}].isJoined`]: false
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
