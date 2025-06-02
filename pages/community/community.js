"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 社区页面
 */
const api_1 = require("../../services/api");
const use_auth_1 = require("../../utils/use-auth");
const auth_1 = require("../../utils/auth");
const util_1 = require("../../utils/util");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        activeTab: 'posts',
        tabIndex: 0,
        loading: true,
        hasLogin: false,
        userInfo: null,
        posts: [],
        challenges: [],
        groups: [],
        friends: [],
        hasMore: true,
        showPostModal: false,
        newPost: {
            content: '',
            images: [],
            tags: [],
        },
        page: 1,
        pageSize: 10,
        isInitialized: true,
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        // 使用useAuth工具获取全局登录状态
        (0, use_auth_1.useAuth)(this);
        // 标记页面已经初始化
        this.data.isInitialized = true;
        // 只有登录后才加载数据
        if (this.data.hasLogin) {
            this.loadData();
        }
        else {
            this.setData({
                loading: false,
            });
        }
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 检查登录状态，可能在其他页面已经登录/登出
        const app = getApp();
        const isLoggedIn = app.globalData.hasLogin;
        const previousLoginState = this.data.hasLogin;
        // 更新登录状态
        this.setData({
            userInfo: app.globalData.userInfo,
            hasLogin: isLoggedIn,
        });
        // 只有在以下情况才刷新数据：
        // 1. 登录状态发生变化（从未登录到已登录）
        // 2. 已登录状态下，不是首次加载页面（避免与onLoad重复加载）
        if (isLoggedIn &&
            (!this.data.isInitialized || previousLoginState !== isLoggedIn)) {
            this.refreshData();
        }
        else if (!isLoggedIn) {
            this.setData({
                loading: false,
                posts: [],
                challenges: [],
                groups: [],
                friends: [],
            });
        }
        // 重置初始化标记，以便从其他页面返回时能正确刷新
        if (this.data.isInitialized) {
            this.data.isInitialized = false;
        }
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
            case 'groups':
                dataPromise = this.loadGroups();
                break;
            case 'challenges':
                dataPromise = this.loadChallenges();
                break;
            case 'posts':
                dataPromise = this.loadPosts();
                break;
            case 'friends':
                dataPromise = this.loadFriends();
                break;
            default:
                dataPromise = Promise.resolve();
        }
        dataPromise
            .catch((error) => {
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
            page: 1,
        }, () => {
            // 重新加载数据
            this.loadData();
        });
    },
    /**
     * 加载社区动态
     */
    loadPosts() {
        const { page, pageSize } = this.data;
        return api_1.communityAPI
            .getPosts({
            page,
            pageSize,
        })
            .then((result) => {
            // 处理返回的帖子数据，添加格式化的日期和用户信息
            const formattedPosts = result.posts.map((post) => {
                var _a, _b, _c, _d, _e, _f;
                // 构建符合IPost接口的数据对象
                return {
                    id: post._id,
                    userId: ((_a = post.user) === null || _a === void 0 ? void 0 : _a._id) || '',
                    userAvatar: ((_b = post.user) === null || _b === void 0 ? void 0 : _b.avatar) || '/assets/images/default-avatar.png',
                    userName: ((_c = post.user) === null || _c === void 0 ? void 0 : _c.nickname) || ((_d = post.user) === null || _d === void 0 ? void 0 : _d.username) || '匿名用户',
                    content: post.content || '',
                    images: ((_e = post.media) === null || _e === void 0 ? void 0 : _e.map((m) => m.url)) || [],
                    tags: post.tags || [],
                    likes: post.likeCount || 0,
                    comments: post.commentCount || 0,
                    isLiked: post.isLiked || false,
                    createdAt: (0, util_1.formatRelativeTime)(post.createdAt || new Date()),
                    habitName: ((_f = post.habit) === null || _f === void 0 ? void 0 : _f.name) || '',
                };
            });
            this.setData({
                posts: page === 1
                    ? formattedPosts
                    : [...this.data.posts, ...formattedPosts],
                hasMore: result.hasMore,
            });
            return result;
        })
            .catch((error) => {
            console.error('加载社区动态失败:', error);
            wx.showToast({
                title: '加载动态失败',
                icon: 'none',
            });
            return Promise.reject(error);
        });
    },
    /**
     * 加载热门挑战
     */
    loadChallenges() {
        return api_1.communityAPI
            .getChallenges({ limit: 3, status: 'all' })
            .then((response) => {
            console.log('社区页面获取到挑战数据:', response);
            // 处理API返回的不同格式
            let challenges = [];
            if (response && typeof response === 'object') {
                // 处理标准格式: { challenges: [], pagination: {} }
                if (response.challenges && Array.isArray(response.challenges)) {
                    challenges = response.challenges;
                }
                // 处理包含data的响应: { data: { challenges: [] } }
                else if (response.data &&
                    typeof response.data === 'object' &&
                    response.data.challenges &&
                    Array.isArray(response.data.challenges)) {
                    challenges = response.data.challenges;
                }
            }
            // 如果直接返回数组
            else if (Array.isArray(response)) {
                challenges = response;
            }
            // 处理挑战数据，确保字段一致性
            const processedChallenges = challenges.map((challenge) => {
                return {
                    ...challenge,
                    id: challenge.id || challenge._id,
                    name: challenge.name || challenge.title,
                    title: challenge.title || challenge.name,
                    image: challenge.coverImage || challenge.image,
                    coverImage: challenge.coverImage || challenge.image,
                    participants: challenge.participants || challenge.participantsCount || 0,
                    participantsCount: challenge.participantsCount || challenge.participants || 0,
                    // 确保isParticipating字段存在
                    isParticipating: challenge.isParticipating || challenge.isJoined || false,
                };
            });
            console.log('社区页面处理后的挑战数据:', processedChallenges);
            this.setData({ challenges: processedChallenges });
            return processedChallenges;
        })
            .catch((error) => {
            console.error('加载热门挑战失败:', error);
            this.setData({ challenges: [] });
            return Promise.reject(error);
        });
    },
    /**
     * 加载小组列表
     */
    loadGroups() {
        return api_1.communityAPI
            .getGroups()
            .then((response) => {
            // 处理API返回的不同格式
            let groups = [];
            if (Array.isArray(response)) {
                // 直接返回数组
                groups = response;
            }
            else if (response && typeof response === 'object') {
                // 处理包含data的响应
                if ('data' in response &&
                    response.data &&
                    typeof response.data === 'object') {
                    if ('groups' in response.data &&
                        Array.isArray(response.data.groups)) {
                        groups = response.data.groups;
                    }
                }
                else if ('groups' in response && Array.isArray(response.groups)) {
                    // 直接包含groups的对象
                    groups = response.groups;
                }
            }
            console.log('处理后的小组数据:', groups);
            this.setData({ groups });
            return groups;
        })
            .catch((error) => {
            console.error('加载小组列表失败:', error);
            this.setData({ groups: [] });
            return Promise.reject(error);
        });
    },
    /**
     * 加载好友列表
     */
    loadFriends() {
        return api_1.communityAPI
            .getFriends()
            .then((friends) => {
            this.setData({ friends });
            return friends;
        })
            .catch((error) => {
            console.error('加载好友列表失败:', error);
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
            hasMore: true,
        });
        // 根据当前标签加载不同数据
        const { activeTab } = this.data;
        wx.showNavigationBarLoading();
        // 根据当前标签加载对应数据
        let dataPromise;
        switch (activeTab) {
            case 'groups':
                dataPromise = this.loadGroups();
                break;
            case 'challenges':
                dataPromise = this.loadChallenges();
                break;
            case 'posts':
                dataPromise = this.loadPosts();
                break;
            case 'friends':
                dataPromise = this.loadFriends();
                break;
            default:
                dataPromise = Promise.resolve();
        }
        dataPromise
            .catch((error) => {
            console.error(`刷新${activeTab}数据失败:`, error);
        })
            .finally(() => {
            wx.hideNavigationBarLoading();
            wx.stopPullDownRefresh();
        });
    },
    /**
     * 加载更多动态
     */
    loadMorePosts() {
        if (!this.data.hasMore || this.data.loading) {
            return;
        }
        this.setData({
            loading: true,
            page: this.data.page + 1,
        });
        this.loadPosts().finally(() => {
            this.setData({ loading: false });
        });
    },
    /**
     * 查看动态详情
     */
    viewPostDetail(e) {
        var _a;
        const id = ((_a = e.detail) === null || _a === void 0 ? void 0 : _a.id) || e.currentTarget.dataset.id;
        if (!id) {
            console.error('缺少动态ID');
            return;
        }
        // 跳转到动态详情页
        wx.navigateTo({
            url: `/pages/community/post-detail/post-detail?id=${id}`,
        });
    },
    /**
     * 查看挑战详情
     */
    viewChallengeDetail(e) {
        const challengeId = e.currentTarget.dataset.challengeId;
        if (!challengeId) {
            console.error('缺少挑战ID');
            return;
        }
        console.log('跳转到挑战详情页，ID:', challengeId);
        wx.navigateTo({
            url: `/pages/community/challenges/detail/detail?id=${challengeId}`,
        });
    },
    /**
     * 查看用户资料
     */
    viewUserProfile(e) {
        var _a;
        const userId = ((_a = e.detail) === null || _a === void 0 ? void 0 : _a.userId) || e.currentTarget.dataset.id;
        if (!userId) {
            console.error('缺少用户ID');
            return;
        }
        wx.navigateTo({
            url: `/pages/profile/user-profile/user-profile?id=${userId}`,
        });
    },
    /**
     * 点赞动态
     */
    likePost(e) {
        // 如果未登录，跳转到登录页
        if (!this.data.hasLogin) {
            return this.login();
        }
        const { id, index } = e.detail || e.currentTarget.dataset;
        if (!id) {
            console.error('缺少动态ID');
            return;
        }
        const post = this.data.posts[index];
        // 乐观更新UI
        post.isLiked = !post.isLiked;
        post.likes = post.isLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
        // 更新指定索引的动态数据
        this.setData({
            [`posts[${index}].isLiked`]: post.isLiked,
            [`posts[${index}].likes`]: post.likes,
        });
        // 调用API
        const apiCall = post.isLiked
            ? api_1.communityAPI.likePost(id)
            : api_1.communityAPI.unlikePost(id);
        apiCall.catch((error) => {
            console.error('点赞操作失败:', error);
            // 发生错误时回滚UI更新
            post.isLiked = !post.isLiked;
            post.likes = post.isLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
            this.setData({
                [`posts[${index}].isLiked`]: post.isLiked,
                [`posts[${index}].likes`]: post.likes,
            });
            wx.showToast({
                title: '操作失败',
                icon: 'none',
            });
        });
    },
    /**
     * 评论动态
     */
    commentPost(e) {
        var _a;
        // 如果未登录，跳转到登录页
        if (!this.data.hasLogin) {
            return this.login();
        }
        const id = ((_a = e.detail) === null || _a === void 0 ? void 0 : _a.id) || e.currentTarget.dataset.id;
        if (!id) {
            console.error('缺少动态ID');
            return;
        }
        // 跳转到动态详情页并自动聚焦评论框
        wx.navigateTo({
            url: `/pages/community/post-detail/post-detail?id=${id}&focus=comment`,
        });
    },
    /**
     * 分享动态
     */
    sharePost(e) {
        var _a;
        const id = ((_a = e.detail) === null || _a === void 0 ? void 0 : _a.id) || e.currentTarget.dataset.id;
        if (!id) {
            console.error('缺少动态ID');
            return;
        }
        // 调用系统分享
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline'],
        });
    },
    /**
     * 参加挑战
     */
    joinChallenge(e) {
        // 在微信小程序中，使用catchtap属性代替stopPropagation
        // 已在wxml中使用catchtap处理
        // 如果未登录，跳转到登录页
        if (!this.data.hasLogin) {
            return this.login();
        }
        const challengeId = e.currentTarget.dataset.challengeId;
        const index = e.currentTarget.dataset.index;
        const challenge = this.data.challenges[index];
        if (!challenge)
            return;
        // 检查是否已经参与
        if (challenge.isJoined || challenge.isParticipating) {
            wx.showToast({
                title: '已参与此挑战',
                icon: 'none',
            });
            return;
        }
        wx.showLoading({
            title: '处理中',
        });
        api_1.communityAPI
            .joinChallenge(challengeId)
            .then(() => {
            // 更新本地状态
            this.setData({
                [`challenges[${index}].isJoined`]: true,
                [`challenges[${index}].isParticipating`]: true,
                [`challenges[${index}].participants`]: challenge.participants + 1,
                [`challenges[${index}].participantsCount`]: (challenge.participantsCount || challenge.participants || 0) + 1,
            });
            wx.showToast({
                title: '已成功参加',
                icon: 'success',
            });
        })
            .catch((error) => {
            console.error('参加挑战失败:', error);
            wx.showToast({
                title: '参加失败',
                icon: 'none',
            });
        })
            .finally(() => {
            wx.hideLoading();
        });
    },
    /**
     * 显示创建动态模态框
     */
    showCreatePost() {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none',
            });
            return;
        }
        this.setData({
            showPostModal: true,
            newPost: {
                content: '',
                images: [],
                tags: [],
            },
        });
    },
    /**
     * 隐藏创建动态模态框
     */
    hideCreatePost() {
        this.setData({
            showPostModal: false,
        });
    },
    /**
     * 选择图片
     */
    chooseImage() {
        const { images } = this.data.newPost;
        const count = 9 - images.length;
        if (count <= 0) {
            wx.showToast({
                title: '最多选择9张图片',
                icon: 'none',
            });
            return;
        }
        wx.chooseImage({
            count,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                // 更新图片列表
                this.setData({
                    'newPost.images': [...images, ...res.tempFilePaths],
                });
            },
        });
    },
    /**
     * 删除图片
     */
    removeImage(e) {
        const { index } = e.currentTarget.dataset;
        const images = [...this.data.newPost.images];
        images.splice(index, 1);
        this.setData({
            'newPost.images': images,
        });
    },
    /**
     * 添加标签
     */
    addTag(e) {
        const { tag } = e.currentTarget.dataset;
        const tags = [...this.data.newPost.tags];
        if (tags.includes(tag)) {
            return;
        }
        if (tags.length >= 5) {
            wx.showToast({
                title: '最多添加5个标签',
                icon: 'none',
            });
            return;
        }
        tags.push(tag);
        this.setData({
            'newPost.tags': tags,
        });
    },
    /**
     * 删除标签
     */
    removeTag(e) {
        const { index } = e.currentTarget.dataset;
        const tags = [...this.data.newPost.tags];
        tags.splice(index, 1);
        this.setData({
            'newPost.tags': tags,
        });
    },
    /**
     * 输入内容
     */
    inputContent(e) {
        this.setData({
            'newPost.content': e.detail.value,
        });
    },
    /**
     * 提交动态
     */
    submitPost() {
        const { content, images, tags, habitId } = this.data.newPost;
        if (!content.trim() && images.length === 0) {
            wx.showToast({
                title: '请输入内容或添加图片',
                icon: 'none',
            });
            return;
        }
        wx.showLoading({
            title: '发布中',
        });
        // 如果有图片，先上传图片
        const uploadImages = images.length > 0 ? this.uploadImages(images) : Promise.resolve([]);
        uploadImages
            .then((imageUrls) => {
            // 创建动态
            return api_1.communityAPI.createPost({
                content: content.trim(),
                images: imageUrls,
                tags,
                habitId,
            });
        })
            .then((post) => {
            wx.hideLoading();
            wx.showToast({
                title: '发布成功',
                icon: 'success',
            });
            // 关闭模态框
            this.hideCreatePost();
            // 重置页码，确保获取最新数据
            this.setData({
                page: 1,
                posts: [],
            });
            // 刷新数据并滚动到顶部
            this.loadPosts().then(() => {
                // 滚动到顶部
                wx.pageScrollTo({
                    scrollTop: 0,
                    duration: 300,
                });
            });
        })
            .catch((error) => {
            console.error('发布动态失败:', error);
            wx.hideLoading();
            wx.showToast({
                title: '发布失败',
                icon: 'none',
            });
        });
    },
    /**
     * 上传图片
     */
    uploadImages(images) {
        return Promise.all(images.map((image) => api_1.communityAPI.uploadImage(image).then((result) => result.url)));
    },
    /**
     * 导航到通知页面
     */
    navigateToNotifications() {
        wx.navigateTo({
            url: '/pages/community/notifications/notifications',
        });
    },
    /**
     * 导航到搜索页面
     */
    navigateToSearch() {
        wx.navigateTo({
            url: '/pages/community/search/search',
        });
    },
    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.refreshData();
    },
    /**
     * 上拉加载更多
     */
    onReachBottom() {
        this.loadMorePosts();
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage(res) {
        if (res.from === 'button') {
            const { postId, index } = res.target.dataset;
            const post = this.data.posts[index];
            if (post) {
                return {
                    title: `${post.userName}的习惯打卡分享`,
                    path: `/pages/community/post-detail/post-detail?id=${postId}`,
                    imageUrl: post.images && post.images.length > 0
                        ? post.images[0]
                        : '/images/share-default.png',
                };
            }
        }
        return {
            title: '习惯打卡社区',
            path: '/pages/community/community',
        };
    },
    /**
     * 查看所有挑战
     */
    viewAllChallenges(e) {
        wx.navigateTo({
            url: '/pages/community/challenges/challenges',
        });
    },
    /**
     * 查看所有小组
     */
    viewAllGroups() {
        wx.navigateTo({
            url: '/pages/community/groups/groups',
        });
    },
    /**
     * 创建小组
     */
    createGroup() {
        // 检查是否已登录
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none',
            });
            return;
        }
        wx.navigateTo({
            url: '/pages/community/groups/create/create',
        });
    },
    /**
     * 登录
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
                this.loadData();
            }
        });
    },
    /**
     * 添加好友
     */
    addFriend() {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none',
            });
            return;
        }
        wx.navigateTo({
            url: '/pages/community/friends/add-friend',
        });
    },
    /**
     * 选择习惯
     */
    chooseHabit() {
        wx.navigateTo({
            url: '/pages/habits/select/select',
            events: {
                // 监听选择习惯页面返回的数据
                selectHabit: (habit) => {
                    console.log('选择的习惯:', habit);
                    if (habit) {
                        this.setData({
                            'newPost.habitId': habit.id,
                            'newPost.tags': [...this.data.newPost.tags, habit.name],
                        });
                    }
                },
            },
        });
    },
    /**
     * 查看所有动态
     */
    viewAllPosts() {
        console.log('查看所有动态');
        wx.navigateTo({
            url: '/pages/community/posts/posts',
        });
    },
    /**
     * 查看所有好友
     */
    viewAllFriends() {
        wx.navigateTo({
            url: '/pages/community/friends/friends',
        });
    },
    /**
     * 切换标签页
     */
    onTabChange(e) {
        const tabIndex = e.detail.index;
        let activeTab;
        switch (tabIndex) {
            case 0:
                activeTab = 'posts';
                break;
            case 1:
                activeTab = 'challenges';
                break;
            case 2:
                activeTab = 'groups';
                break;
            case 3:
                activeTab = 'friends';
                break;
            default:
                activeTab = 'posts';
        }
        this.setData({
            tabIndex,
            activeTab,
            page: 1,
        });
        // 根据标签页加载不同的数据
        this.loadData();
    },
    /**
     * 创建挑战
     */
    createChallenge() {
        if (!this.data.hasLogin) {
            this.login();
            return;
        }
        wx.navigateTo({
            url: '/pages/community/challenges/create/create',
        });
    },
    /**
     * 查看小组详情
     */
    viewGroupDetail(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/community/groups/detail/detail?id=${id}`,
        });
    },
});
