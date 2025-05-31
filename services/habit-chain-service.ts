import { HabitChain } from '../utils/habit-chain';
import { request } from '../utils/request';
import { StorageKeys } from '../utils/storage-keys';

/**
 * 习惯链服务
 * 负责习惯链的增删改查操作
 */
export class HabitChainService {
  /**
   * 获取用户的所有习惯链
   */
  async getUserChains(): Promise<HabitChain[]> {
    try {
      // 优先从服务器获取
      if (wx.getStorageSync(StorageKeys.TOKEN)) {
        const res = await request<HabitChain[]>({
          url: '/api/habit-chains',
          method: 'GET',
        });

        return res.data;
      }
    } catch (error) {
      console.error('获取习惯链失败', error);
    }

    return [];
  }

  /**
   * 根据ID获取习惯链
   * @param id 习惯链ID
   */
  async getChainById(id: string): Promise<HabitChain | null> {
    try {
      // 优先从服务器获取
      if (wx.getStorageSync(StorageKeys.TOKEN)) {
        const res = await request<HabitChain>({
          url: `/api/habit-chains/${id}`,
          method: 'GET',
        });

        return res.data;
      }
    } catch (error) {
      console.error('获取习惯链详情失败', error);
    }

    return null;
  }

  /**
   * 保存习惯链
   * @param chain 习惯链
   */
  async saveChain(chain: HabitChain): Promise<HabitChain> {
    try {
      // 优先保存到服务器
      if (wx.getStorageSync(StorageKeys.TOKEN)) {
        const isNew = !chain.id || chain.id.startsWith('chain_');

        const res = await request<HabitChain>({
          url: isNew ? '/api/habit-chains' : `/api/habit-chains/${chain.id}`,
          method: isNew ? 'POST' : 'PUT',
          data: chain,
        });

        return res.data;
      }
    } catch (error) {
      console.error('保存习惯链失败', error);
      return null;
    }
  }

  /**
   * 删除习惯链
   * @param id 习惯链ID
   */
  async deleteChain(id: string): Promise<boolean> {
    try {
      // 优先从服务器删除
      if (wx.getStorageSync(StorageKeys.TOKEN)) {
        await request({
          url: `/api/habit-chains/${id}`,
          method: 'DELETE',
        });
      }

      return true;
    } catch (error) {
      console.error('删除习惯链失败', error);
    }

    return false;
  }
}
