"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 社区页面
 */
const api_1 = require("../../services/api");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        activeTab: 'follow',
        loading: true,
        hasLogin: false,
        userInfo: null,
        posts: [],
        challenges: [],
        friends: [],
        hasMore: true,
        showPostModal: false,
        newPost: {
            content: '',
            images: [],
            tags: []
        },
        page: 1,
        pageSize: 10
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        // 检查登录状态
        const app = getApp();
        this.setData({
            userInfo: app.globalData.userInfo,
            hasLogin: app.globalData.hasLogin
        });
        this.loadData();
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 每次显示页面时刷新数据
        this.refreshData();
    },
    /**
     * 加载数据
     */
    loadData() {
        this.setData({ loading: true });
        // 并行加载数据
        Promise.all([
            this.loadPosts(),
            this.loadChallenges(),
            this.loadFriends()
        ])
            .catch(error => {
            console.error('加载社区数据失败:', error);
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
        this.setData({
            activeTab: tab,
            page: 1,
            posts: []
        }, () => {
            this.refreshData();
        });
    },
    /**
     * 加载社区动态
     */
    loadPosts() {
        const { activeTab, page, pageSize } = this.data;
        return api_1.communityAPI.getPosts({
            type: activeTab,
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
            console.error('加载社区动态失败:', error);
            wx.showToast({
                title: '加载动态失败',
                icon: 'none'
            });
            return Promise.reject(error);
        });
    },
    /**
     * 加载热门挑战
     */
    loadChallenges() {
        return api_1.communityAPI.getChallenges({ limit: 3 })
            .then(challenges => {
            this.setData({ challenges });
            return challenges;
        })
            .catch(error => {
            console.error('加载热门挑战失败:', error);
            return Promise.reject(error);
        });
    },
    /**
     * 加载好友列表
     */
    loadFriends() {
        return api_1.communityAPI.getFriends()
            .then(friends => {
            this.setData({ friends });
            return friends;
        })
            .catch(error => {
            console.error('加载好友列表失败:', error);
            return Promise.reject(error);
        });
    },
    /**
     * 刷新数据
     */
    refreshData() {
        // 重置页码
        this.setData({
            page: 1,
            hasMore: true
        });
        // 根据当前标签加载不同数据
        const { activeTab } = this.data;
        wx.showNavigationBarLoading();
        this.loadPosts()
            .then(() => {
            // 如果是关注标签，还需要刷新好友列表
            if (activeTab === 'follow') {
                return this.loadFriends();
            }
            // 明确返回类型，避免Promise<void>和Promise<IFriend[]>类型不匹配问题
            return Promise.resolve([]);
        })
            .catch((error) => {
            console.error('刷新数据失败:', error);
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
        const { postId } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/community/post-detail/post-detail?id=${postId}`
        });
    },
    /**
     * 查看挑战详情
     */
    viewChallengeDetail(e) {
        const { challengeId } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/community/challenges/detail/detail?id=${challengeId}`
        });
    },
    /**
     * 查看用户资料
     */
    viewUserProfile(e) {
        const { userId } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/profile/user/user?id=${userId}`
        });
    },
    /**
     * 点赞动态
     */
    likePost(e) {
        const { postId, index } = e.currentTarget.dataset;
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
        (isLiked ? api_1.communityAPI.unlikePost(postId) : api_1.communityAPI.likePost(postId))
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
        const { postId } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/community/post-detail/post-detail?id=${postId}&focus=comment`
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
        const { challengeId, index } = e.currentTarget.dataset;
        const challenge = this.data.challenges[index];
        if (!challenge)
            return;
        wx.showLoading({
            title: '处理中'
        });
        api_1.communityAPI.joinChallenge(challengeId)
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
     * 显示创建动态模态框
     */
    showCreatePost() {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }
        this.setData({
            showPostModal: true,
            newPost: {
                content: '',
                images: [],
                tags: []
            }
        });
    },
    /**
     * 隐藏创建动态模态框
     */
    hideCreatePost() {
        this.setData({
            showPostModal: false
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
                icon: 'none'
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
                    'newPost.images': [...images, ...res.tempFilePaths]
                });
            }
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
            'newPost.images': images
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
                icon: 'none'
            });
            return;
        }
        tags.push(tag);
        this.setData({
            'newPost.tags': tags
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
            'newPost.tags': tags
        });
    },
    /**
     * 输入内容
     */
    inputContent(e) {
        this.setData({
            'newPost.content': e.detail.value
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
                icon: 'none'
            });
            return;
        }
        wx.showLoading({
            title: '发布中'
        });
        // 如果有图片，先上传图片
        const uploadImages = images.length > 0
            ? this.uploadImages(images)
            : Promise.resolve([]);
        uploadImages
            .then((imageUrls) => {
            // 创建动态
            return api_1.communityAPI.createPost({
                content: content.trim(),
                images: imageUrls,
                tags,
                habitId
            });
        })
            .then((post) => {
            wx.hideLoading();
            wx.showToast({
                title: '发布成功',
                icon: 'success'
            });
            // 关闭模态框
            this.hideCreatePost();
            // 刷新数据
            this.refreshData();
        })
            .catch((error) => {
            console.error('发布动态失败:', error);
            wx.hideLoading();
            wx.showToast({
                title: '发布失败',
                icon: 'none'
            });
        });
    },
    /**
     * 上传图片
     */
    uploadImages(images) {
        return Promise.all(images.map(image => api_1.communityAPI.uploadImage(image)
            .then(result => result.url)));
    },
    /**
     * 导航到通知页面
     */
    navigateToNotifications() {
        wx.navigateTo({
            url: '/pages/community/notifications/notifications'
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
                    imageUrl: post.images && post.images.length > 0 ? post.images[0] : '/images/share-default.png'
                };
            }
        }
        return {
            title: '习惯打卡社区',
            path: '/pages/community/community'
        };
    },
    /**
     * 查看所有挑战
     */
    viewAllChallenges(e) {
        wx.navigateTo({
            url: '/pages/community/challenges/challenges'
        });
    },
    /**
     * 查看所有小组
     */
    viewAllGroups() {
        wx.navigateTo({
            url: '/pages/community/groups/groups'
        });
    }
});
