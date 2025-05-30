"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitChainService = void 0;
const request_1 = require("../utils/request");
const storage_keys_1 = require("../utils/storage-keys");
/**
 * 习惯链服务
 * 负责习惯链的增删改查操作
 */
class HabitChainService {
    /**
     * 获取用户的所有习惯链
     */
    async getUserChains() {
        try {
            // 优先从服务器获取
            if (wx.getStorageSync(storage_keys_1.StorageKeys.TOKEN)) {
                const res = await (0, request_1.request)({
                    url: '/api/habit-chains',
                    method: 'GET'
                });
                // 保存到本地存储
                wx.setStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS, res.data);
                return res.data;
            }
            // 从本地存储获取
            const chains = wx.getStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS) || [];
            return chains;
        }
        catch (error) {
            console.error('获取习惯链失败', error);
            // 从本地存储获取
            const chains = wx.getStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS) || [];
            return chains;
        }
    }
    /**
     * 根据ID获取习惯链
     * @param id 习惯链ID
     */
    async getChainById(id) {
        try {
            // 优先从服务器获取
            if (wx.getStorageSync(storage_keys_1.StorageKeys.TOKEN)) {
                const res = await (0, request_1.request)({
                    url: `/api/habit-chains/${id}`,
                    method: 'GET'
                });
                return res.data;
            }
            // 从本地存储获取
            const chains = wx.getStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS) || [];
            return chains.find((chain) => chain.id === id) || null;
        }
        catch (error) {
            console.error('获取习惯链详情失败', error);
            // 从本地存储获取
            const chains = wx.getStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS) || [];
            return chains.find((chain) => chain.id === id) || null;
        }
    }
    /**
     * 保存习惯链
     * @param chain 习惯链
     */
    async saveChain(chain) {
        try {
            // 优先保存到服务器
            if (wx.getStorageSync(storage_keys_1.StorageKeys.TOKEN)) {
                const isNew = !chain.id || chain.id.startsWith('chain_');
                const res = await (0, request_1.request)({
                    url: isNew ? '/api/habit-chains' : `/api/habit-chains/${chain.id}`,
                    method: isNew ? 'POST' : 'PUT',
                    data: chain
                });
                // 更新本地存储
                const chains = wx.getStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS) || [];
                const index = chains.findIndex((c) => c.id === chain.id);
                if (index > -1) {
                    chains[index] = res.data;
                }
                else {
                    chains.push(res.data);
                }
                wx.setStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS, chains);
                return res.data;
            }
            // 保存到本地存储
            const chains = wx.getStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS) || [];
            const index = chains.findIndex((c) => c.id === chain.id);
            // 更新时间
            chain.updatedAt = new Date().toISOString();
            if (index > -1) {
                chains[index] = chain;
            }
            else {
                chains.push(chain);
            }
            wx.setStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS, chains);
            return chain;
        }
        catch (error) {
            console.error('保存习惯链失败', error);
            // 保存到本地存储
            const chains = wx.getStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS) || [];
            const index = chains.findIndex((c) => c.id === chain.id);
            // 更新时间
            chain.updatedAt = new Date().toISOString();
            if (index > -1) {
                chains[index] = chain;
            }
            else {
                chains.push(chain);
            }
            wx.setStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS, chains);
            return chain;
        }
    }
    /**
     * 删除习惯链
     * @param id 习惯链ID
     */
    async deleteChain(id) {
        try {
            // 优先从服务器删除
            if (wx.getStorageSync(storage_keys_1.StorageKeys.TOKEN)) {
                await (0, request_1.request)({
                    url: `/api/habit-chains/${id}`,
                    method: 'DELETE'
                });
            }
            // 从本地存储删除
            const chains = wx.getStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS) || [];
            const newChains = chains.filter((chain) => chain.id !== id);
            wx.setStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS, newChains);
            return true;
        }
        catch (error) {
            console.error('删除习惯链失败', error);
            // 从本地存储删除
            const chains = wx.getStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS) || [];
            const newChains = chains.filter((chain) => chain.id !== id);
            wx.setStorageSync(storage_keys_1.StorageKeys.HABIT_CHAINS, newChains);
            return true;
        }
    }
}
exports.HabitChainService = HabitChainService;
