"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncManager = void 0;
/**
 * 同步管理器
 * 用于在网络恢复后同步本地数据到服务器
 */
const api_1 = require("../services/api");
/**
 * 同步管理器
 */
class SyncManager {
    /**
     * 同步本地打卡数据
     * @returns Promise<boolean> 是否有数据需要同步
     */
    static async syncPendingCheckins() {
        // 如果正在同步，则不执行
        if (this.isSyncing) {
            return false;
        }
        // 获取待同步的打卡记录
        const pendingCheckins = wx.getStorageSync('pendingCheckins') || [];
        if (pendingCheckins.length === 0) {
            return false;
        }
        // 标记开始同步
        this.isSyncing = true;
        try {
            // 检查网络状态
            const networkType = await this.getNetworkType();
            if (networkType === 'none') {
                this.isSyncing = false;
                return true; // 仍有数据需要同步
            }
            // 逐条同步打卡记录
            const successIndices = [];
            const syncPromises = pendingCheckins.map(async (checkin, index) => {
                try {
                    // 移除pendingSync标记
                    const { pendingSync, photos, ...checkinData } = checkin;
                    // 如果有图片，先上传图片
                    if (photos && photos.length > 0) {
                        const uploadPromises = photos.map(async (photoPath) => {
                            try {
                                const result = await api_1.communityAPI.uploadImage(photoPath);
                                return result.url;
                            }
                            catch (error) {
                                return null;
                            }
                        });
                        const uploadedPhotos = await Promise.all(uploadPromises);
                        const validPhotos = uploadedPhotos.filter(url => url !== null);
                        // 将有效的图片URL添加到打卡数据中
                        checkinData.photos = validPhotos;
                    }
                    // 提交打卡记录
                    await api_1.checkinAPI.createCheckin(checkinData);
                    // 记录成功的索引
                    successIndices.push(index);
                    return true;
                }
                catch (error) {
                    return false;
                }
            });
            // 等待所有同步任务完成
            await Promise.all(syncPromises);
            // 从待同步列表中移除已成功同步的记录
            const newPendingCheckins = pendingCheckins.filter((_, index) => !successIndices.includes(index));
            wx.setStorageSync('pendingCheckins', newPendingCheckins);
            // 标记同步完成
            this.isSyncing = false;
            // 返回是否还有待同步的记录
            return newPendingCheckins.length > 0;
        }
        catch (error) {
            this.isSyncing = false;
            return true; // 仍有数据需要同步
        }
    }
    /**
     * 获取网络类型
     * @returns Promise<string> 网络类型
     */
    static getNetworkType() {
        return new Promise((resolve) => {
            wx.getNetworkType({
                success(res) {
                    resolve(res.networkType);
                },
                fail() {
                    resolve('none');
                }
            });
        });
    }
    /**
     * 监听网络状态变化
     * 当网络恢复时自动同步数据
     */
    static listenNetworkStatus() {
        wx.onNetworkStatusChange(async (res) => {
            if (res.isConnected) {
                await this.syncPendingCheckins();
            }
        });
    }
    /**
     * 初始化同步管理器
     */
    static init() {
        // 监听网络状态变化
        this.listenNetworkStatus();
        // 应用启动时尝试同步一次
        this.syncPendingCheckins();
    }
}
exports.SyncManager = SyncManager;
/**
 * 是否正在同步
 */
SyncManager.isSyncing = false;
