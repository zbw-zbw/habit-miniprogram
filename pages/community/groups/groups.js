"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * pages/community/groups/groups.ts
 * 社区小组页面
 */
const api_1 = require("../../../services/api");
const image_1 = require("../../../utils/image");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        loading: true,
        loadingMore: false,
        hasMore: true,
        activeTab: 'all',
        groups: [],
        page: 1,
        limit: 10,
        searchKeyword: '',
        hasLogin: false
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 如果有标签参数，设置初始标签
        if (options.tab && ['all', 'joined', 'created', 'recommended'].includes(options.tab)) {
            this.setData({ activeTab: options.tab });
        }
        // 如果有标签参数，直接搜索该标签
        if (options.tag) {
            this.setData({
                searchKeyword: options.tag
            });
        }
        // 加载小组数据
        this.loadGroups(true);
    },
    /**
     * 加载小组数据
     */
    loadGroups(isRefresh = false) {
        // 如果是刷新，重置页码
        const currentPage = isRefresh ? 1 : this.data.page;
        // 显示加载中
        this.setData({
            loading: this.data.groups.length === 0,
            loadingMore: this.data.groups.length > 0
        });
        // 构建请求参数
        const params = {
            page: currentPage,
            limit: this.data.limit
        };
        // 根据不同标签添加不同参数
        if (this.data.activeTab === 'joined') {
            params.joined = true;
        }
        else if (this.data.activeTab === 'created') {
            params.created = true;
        }
        else if (this.data.activeTab === 'recommended') {
            params.recommended = true;
        }
        // 只有当searchKeyword不为空时才添加keyword参数
        if (this.data.searchKeyword) {
            params.keyword = this.data.searchKeyword;
        }
        // 调用API获取小组数据
        api_1.communityAPI.getGroups(params)
            .then(result => {
            const { groups, pagination } = result;
            // 处理小组数据
            const processedGroups = groups.map((group) => {
                var _a, _b;
                // 获取当前用户ID
                const app = getApp();
                const currentUserId = (_b = (_a = app === null || app === void 0 ? void 0 : app.globalData) === null || _a === void 0 ? void 0 : _a.userInfo) === null || _b === void 0 ? void 0 : _b.id;
                // 检查是否是创建者
                const isCreator = group.creator &&
                    (group.creator._id === currentUserId || group.creator.id === currentUserId);
                // 处理图片URL
                if (group.avatar) {
                    group.avatar = (0, image_1.getFullImageUrl)(group.avatar);
                }
                if (group.coverImage) {
                    group.coverImage = (0, image_1.getFullImageUrl)(group.coverImage);
                }
                return {
                    id: group.id || group._id,
                    name: group.name,
                    description: group.description,
                    avatar: group.avatar || '/assets/images/default-group.png',
                    coverImage: group.coverImage || '/assets/images/groups.png',
                    membersCount: group.membersCount || 0,
                    postsCount: group.postsCount || 0,
                    isJoined: isCreator || group.isJoined || false,
                    isCreator: isCreator,
                    tags: group.tags || []
                };
            });
            // 更新数据
            this.setData({
                groups: isRefresh ? processedGroups : [...this.data.groups, ...processedGroups],
                page: currentPage + 1,
                hasMore: pagination && currentPage < pagination.pages,
                loading: false,
                loadingMore: false
            });
        })
            .catch(error => {
            console.error('获取小组列表失败:', error);
            // 显示错误提示
            wx.showToast({
                title: '获取小组列表失败',
                icon: 'none'
            });
            this.setData({
                loading: false,
                loadingMore: false
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
                groups: [],
                hasMore: true
            });
            // 重新加载数据
            this.loadGroups();
        }
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
     * 参加/退出/解散小组
     */
    toggleJoinGroup(e) {
        const id = e.currentTarget.dataset.id;
        const index = e.currentTarget.dataset.index;
        // 防止事件冒泡
        // 在微信小程序中，TouchEvent没有stopPropagation方法，使用catchtap替代
        // 获取当前小组
        const groups = this.data.groups;
        const group = groups[index];
        // 如果是创建者，则解散小组
        if (group.isCreator) {
            // 显示确认对话框
            wx.showModal({
                title: '解散小组',
                content: '确定要解散该小组吗？解散后无法恢复，所有成员将自动退出。',
                confirmText: '确定解散',
                confirmColor: '#F56C6C',
                success: (res) => {
                    if (res.confirm) {
                        wx.showLoading({
                            title: '处理中...'
                        });
                        // 调用API解散小组
                        api_1.communityAPI.dismissGroup(id)
                            .then(() => {
                            // 从列表中移除该小组
                            groups.splice(index, 1);
                            this.setData({ groups });
                            wx.showToast({
                                title: '小组已解散',
                                icon: 'success'
                            });
                        })
                            .catch(error => {
                            console.error('解散小组失败:', error);
                            wx.showToast({
                                title: '解散小组失败',
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
        const isJoined = group.isJoined;
        // 显示加载中
        wx.showLoading({
            title: isJoined ? '退出中...' : '加入中...'
        });
        // 调用API
        const apiCall = isJoined
            ? api_1.communityAPI.leaveGroup(id)
            : api_1.communityAPI.joinGroup(id);
        apiCall
            .then(() => {
            // 更新本地数据
            groups[index].isJoined = !isJoined;
            groups[index].membersCount = isJoined
                ? Math.max(0, groups[index].membersCount - 1)
                : groups[index].membersCount + 1;
            this.setData({ groups });
            // 显示成功提示
            wx.showToast({
                title: isJoined ? '已退出小组' : '已加入小组',
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
     * 创建小组
     */
    createGroup() {
        wx.navigateTo({
            url: '/pages/community/groups/create/create'
        });
    },
    /**
     * 刷新数据
     */
    refreshData() {
        console.log('刷新小组列表数据');
        this.loadGroups(true);
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        this.loadGroups(true);
        wx.stopPullDownRefresh();
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        if (!this.data.loading && this.data.hasMore) {
            this.loadGroups();
        }
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '习惯打卡社区 - 小组',
            path: '/pages/community/groups/groups'
        };
    },
    /**
     * 输入搜索关键词
     */
    inputSearch(e) {
        this.setData({ searchKeyword: e.detail.value });
    },
    /**
     * 执行搜索
     */
    doSearch() {
        this.loadGroups(true);
    }
});
