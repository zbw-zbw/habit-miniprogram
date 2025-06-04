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
                    method: 'GET',
                });
                return res.data;
            }
        }
        catch (error) {
        }
        return [];
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
                    method: 'GET',
                });
                return res.data;
            }
        }
        catch (error) {
        }
        return null;
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
                    data: chain,
                });
                return res.data;
            }
        }
        catch (error) {
            return null;
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
                    method: 'DELETE',
                });
            }
            return true;
        }
        catch (error) {
        }
        return false;
    }
}
exports.HabitChainService = HabitChainService;
