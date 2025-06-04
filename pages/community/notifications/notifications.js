"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 社区通知页面
const api_1 = require("../../../services/api");
const use_auth_1 = require("../../../utils/use-auth");
const util_1 = require("../../../utils/util");
Page({
    data: {
        activeTab: 'all',
        tabIndex: 0,
        tabName: '全部',
        notifications: [],
        loading: false,
        hasMore: true,
        page: 1,
        limit: 20,
        unreadCount: 0,
        hasLogin: false
    },
    onLoad() {
        // 使用useAuth工具获取全局登录状态
        (0, use_auth_1.useAuth)(this);
        this.loadNotifications(true);
    },
    // 处理tab-bar组件的标签切换事件
    onTabChange(e) {
        const index = e.detail.index;
        let activeTab = 'all';
        let tabName = '全部';
        switch (index) {
            case 0:
                activeTab = 'all';
                tabName = '全部';
                break;
            case 1:
                activeTab = 'like';
                tabName = '点赞';
                break;
            case 2:
                activeTab = 'comment';
                tabName = '评论';
                break;
            case 3:
                activeTab = 'follow';
                tabName = '关注';
                break;
            case 4:
                activeTab = 'system';
                tabName = '系统';
                break;
            default:
                break;
        }
        if (activeTab === this.data.activeTab)
            return;
        this.setData({
            activeTab,
            tabIndex: index,
            tabName,
            notifications: [],
            page: 1,
            hasMore: true
        });
        this.loadNotifications(true);
    },
    // 加载通知
    loadNotifications(isRefresh = false) {
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }
        const { activeTab, page, limit } = this.data;
        if (isRefresh) {
            this.setData({
                page: 1,
                notifications: [],
                loading: true
            });
        }
        else {
            this.setData({ loading: true });
        }
        // 根据标签确定请求参数
        const params = {
            page: isRefresh ? 1 : page,
            limit
        };
        if (activeTab !== 'all') {
            params.type = activeTab;
        }
        api_1.notificationAPI.getNotifications(params)
            .then((result) => {
            const { notifications, pagination, unreadCount } = result;
            // 格式化通知数据
            const formattedNotifications = notifications.map((notification) => {
                return {
                    ...notification,
                    timeAgo: this.formatTimeAgo(notification.createdAt),
                    time: this.formatTimeAgo(notification.createdAt)
                };
            });
            this.setData({
                notifications: isRefresh ? formattedNotifications : [...this.data.notifications, ...formattedNotifications],
                hasMore: pagination.page < pagination.pages,
                page: isRefresh ? 2 : page + 1,
                unreadCount,
                loading: false
            });
            if (isRefresh) {
                wx.stopPullDownRefresh();
            }
        })
            .catch((error) => {
            this.setData({ loading: false });
            if (isRefresh) {
                wx.stopPullDownRefresh();
            }
            wx.showToast({
                title: '获取通知失败',
                icon: 'none'
            });
        });
    },
    // 标记通知为已读
    markAsRead(e) {
        const { id, index } = e.currentTarget.dataset;
        const notifications = [...this.data.notifications];
        const notification = notifications[index];
        if (notification.isRead)
            return;
        api_1.notificationAPI.markAsRead(id)
            .then(() => {
            notifications[index].isRead = true;
            this.setData({
                notifications,
                unreadCount: Math.max(0, this.data.unreadCount - 1)
            });
        })
            .catch((error) => {
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        });
    },
    // 标记所有通知为已读
    markAllAsRead() {
        if (this.data.unreadCount === 0)
            return;
        wx.showModal({
            title: '标记全部已读',
            content: '确定要将所有通知标记为已读吗？',
            success: (res) => {
                if (res.confirm) {
                    const params = this.data.activeTab !== 'all' ? { type: this.data.activeTab } : undefined;
                    api_1.notificationAPI.markAllAsRead(params ? params.type : undefined)
                        .then(() => {
                        // 更新通知列表中的已读状态
                        const notifications = this.data.notifications.map((notification) => ({
                            ...notification,
                            isRead: true
                        }));
                        this.setData({
                            notifications,
                            unreadCount: 0
                        });
                        wx.showToast({
                            title: '已全部标记为已读',
                            icon: 'success'
                        });
                    })
                        .catch((error) => {
                        wx.showToast({
                            title: '操作失败',
                            icon: 'none'
                        });
                    });
                }
            }
        });
    },
    // 删除通知
    deleteNotification(e) {
        const { id, index } = e.currentTarget.dataset;
        wx.showModal({
            title: '删除通知',
            content: '确定要删除这条通知吗？',
            success: (res) => {
                if (res.confirm) {
                    api_1.notificationAPI.deleteNotification(id)
                        .then(() => {
                        const notifications = [...this.data.notifications];
                        const isUnread = !notifications[index].isRead;
                        notifications.splice(index, 1);
                        this.setData({
                            notifications,
                            unreadCount: isUnread ? Math.max(0, this.data.unreadCount - 1) : this.data.unreadCount
                        });
                        wx.showToast({
                            title: '已删除',
                            icon: 'success'
                        });
                    })
                        .catch((error) => {
                        wx.showToast({
                            title: '删除失败',
                            icon: 'none'
                        });
                    });
                }
            }
        });
    },
    // 下拉刷新
    onPullDownRefresh() {
        this.loadNotifications(true);
    },
    // 上拉加载更多
    onReachBottom() {
        if (!this.data.loading && this.data.hasMore) {
            this.loadNotifications();
        }
    },
    // 加载更多
    loadMore() {
        if (!this.data.loading && this.data.hasMore) {
            this.loadNotifications();
        }
    },
    // 处理通知点击
    handleNotification(e) {
        const { id, type, targetId } = e.currentTarget.dataset;
        const index = this.data.notifications.findIndex(item => item.id === id);
        if (index === -1)
            return;
        const notification = this.data.notifications[index];
        // 如果未读，先标记为已读
        if (!notification.isRead) {
            // 直接调用API而不是通过事件处理函数
            api_1.notificationAPI.markAsRead(id)
                .then(() => {
                const notifications = [...this.data.notifications];
                notifications[index].isRead = true;
                this.setData({
                    notifications,
                    unreadCount: Math.max(0, this.data.unreadCount - 1)
                });
            })
                .catch((error) => {
                wx.showToast({
                    title: '操作失败',
                    icon: 'none'
                });
            });
        }
        // 根据通知类型跳转到相应页面
        switch (type) {
            case 'like':
            case 'comment':
                if (notification.post) {
                    wx.navigateTo({
                        url: `/pages/community/post-detail/post-detail?id=${notification.post.id || targetId}`
                    });
                }
                break;
            case 'follow':
                if (notification.sender) {
                    wx.navigateTo({
                        url: `/pages/community/user-profile/user-profile?id=${notification.sender.id || targetId}`
                    });
                }
                break;
            case 'challenge':
                if (notification.relatedChallenge) {
                    wx.navigateTo({
                        url: `/pages/community/challenges/detail/detail?id=${notification.relatedChallenge._id || targetId}`
                    });
                }
                break;
            case 'habit':
                if (notification.relatedHabit) {
                    wx.navigateTo({
                        url: `/pages/habits/detail/detail?id=${notification.relatedHabit._id || targetId}`
                    });
                }
                break;
            case 'system':
                // 系统通知可能没有特定跳转
                break;
            default:
                break;
        }
    },
    // 切换关注状态
    toggleFollow(e) {
        // 注意：在WXML中应该使用catchtap而不是bindtap来阻止事件冒泡
        const { id, index } = e.currentTarget.dataset;
        const notifications = [...this.data.notifications];
        const notification = notifications[index];
        if (!this.data.hasLogin) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return;
        }
        const isFollowing = notification.isFollowing;
        // 调用关注/取消关注API
        wx.showLoading({ title: isFollowing ? '取消关注中...' : '关注中...' });
        // 这里假设有一个userAPI.toggleFollow方法
        // 实际使用时需替换为真实的API调用
        const toggleFollowPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({});
            }, 500);
        });
        toggleFollowPromise
            .then(() => {
            wx.hideLoading();
            // 更新本地状态
            notifications[index].isFollowing = !isFollowing;
            this.setData({ notifications });
            wx.showToast({
                title: isFollowing ? '已取消关注' : '已关注',
                icon: 'success'
            });
        })
            .catch((error) => {
            wx.hideLoading();
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        });
    },
    // 格式化时间
    formatTimeAgo(time) {
        return (0, util_1.formatTimeAgo)(time);
    },
    // 返回上一页
    goBack() {
        wx.navigateBack();
    }
});
