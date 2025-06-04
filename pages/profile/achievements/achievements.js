"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 成就列表页面
 */
const achievement_1 = require("../../../utils/achievement");
Page({
    /**
     * 页面的初始数据
     */
    data: {
        allAchievements: [],
        filteredAchievements: [],
        loading: true,
        activeTab: 'all'
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        this.loadAchievements();
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 如果已经加载过成就，则刷新数据
        if (this.data.allAchievements.length > 0) {
            this.loadAchievements();
        }
    },
    /**
     * 加载成就列表
     */
    async loadAchievements() {
        this.setData({ loading: true });
        try {
            // 获取所有成就
            const achievements = await achievement_1.achievementService.getAllAchievements();
            this.setData({
                allAchievements: achievements,
                loading: false
            });
            // 根据当前选中的标签筛选成就
            this.filterAchievements();
        }
        catch (error) {
            this.setData({
                loading: false,
                allAchievements: [],
                filteredAchievements: []
            });
            wx.showToast({
                title: '加载失败',
                icon: 'error'
            });
        }
    },
    /**
     * 根据标签筛选成就
     */
    filterAchievements() {
        const { allAchievements, activeTab } = this.data;
        let filteredAchievements = [...allAchievements];
        // 根据标签筛选
        if (activeTab === 'completed') {
            filteredAchievements = allAchievements.filter(a => a.isCompleted);
        }
        else if (activeTab === 'in-progress') {
            filteredAchievements = allAchievements.filter(a => !a.isCompleted);
        }
        this.setData({ filteredAchievements });
    },
    /**
     * 切换标签
     */
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        if (tab !== this.data.activeTab) {
            this.setData({ activeTab: tab });
            this.filterAchievements();
        }
    },
    /**
     * 查看成就详情
     */
    viewAchievementDetail(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `./detail/detail?id=${id}`
        });
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '我的成就列表',
            path: '/pages/profile/achievements/achievements'
        };
    }
});
