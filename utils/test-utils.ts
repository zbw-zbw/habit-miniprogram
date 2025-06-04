/**
 * 测试工具
 * 用于全面测试系统功能
 */
import { habitAPI, checkinAPI, userAPI, communityAPI } from '../services/api';
import { formatDate } from './date';

/**
 * 测试管理器
 */
export class TestManager {
  /**
   * 测试API服务可用性
   */
  static async testAPIAvailability(): Promise<boolean> {
    try {
      // 尝试获取习惯列表
      await habitAPI.getHabits();
      
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 测试数据流程
   */
  static async testDataFlow(): Promise<void> {
    
    
    try {
      // 1. 创建一个测试习惯
      
      const habitData = {
        name: '测试习惯' + Date.now(),
        description: '用于测试的习惯',
        category: 'test',
        icon: 'test',
        color: '#4F7CFF',
        frequency: {
          type: 'daily' as const
        },
        reminder: {
          enabled: false,
          time: '08:00'
        },
        isArchived: false,
        startDate: formatDate(new Date())
      };
      
      const habit = await habitAPI.createHabit(habitData);
      
      
      // 2. 创建一个测试打卡
      
      const checkinData = {
        habitId: habit.id,
        date: formatDate(new Date()),
        isCompleted: true,
        note: '测试打卡',
        time: new Date().toTimeString().substring(0, 5)
      };
      
      const checkin = await checkinAPI.createCheckin(checkinData);
      
      
      // 3. 获取习惯统计
      
      const stats = await habitAPI.getHabitStats(habit.id);
      
      
      // 4. 更新习惯
      
      const updatedHabitData = {
        ...habitData,
        name: habitData.name + ' (已更新)',
        description: habitData.description + ' (已更新)'
      };
      
      const updatedHabit = await habitAPI.updateHabit(habit.id, updatedHabitData);
      
      
      // 5. 归档习惯
      
      const archivedHabit = await habitAPI.updateHabit(habit.id, {
        isArchived: true
      });
      
      
      // 6. 获取习惯列表
      
      const habits = await habitAPI.getHabits();
      
      
      // 7. 删除测试习惯
      
      const deleteResult = await habitAPI.deleteHabit(habit.id);
      
      
      
    } catch (error) {
      
    }
  }

  /**
   * 测试离线功能
   */
  static testOfflineFeatures(): void {
    
    
    try {
      // 测试本地存储
      
      wx.setStorageSync('testKey', { value: 'testValue', timestamp: Date.now() });
      const storedValue = wx.getStorageSync('testKey');
      
      if (storedValue && storedValue.value === 'testValue') {
        
      } else {
        
      }
      
      // 清理测试数据
      wx.removeStorageSync('testKey');
      
      
    } catch (error) {
      
    }
  }

  /**
   * 测试同步管理器
   */
  static testSyncManager(): void {
    
    
    try {
      // 创建一个测试打卡记录
      const testCheckin = {
        habitId: 'test-habit-id',
        date: formatDate(new Date()),
        isCompleted: true,
        note: '测试离线打卡',
        pendingSync: true,
        createdAt: new Date().toISOString()
      };
      
      // 保存到待同步列表
      const pendingCheckins = wx.getStorageSync('pendingCheckins') || [];
      pendingCheckins.push(testCheckin);
      wx.setStorageSync('pendingCheckins', pendingCheckins);
      
      
      
      // 导入同步管理器
      const SyncManager = require('./sync-manager').SyncManager;
      
      // 测试同步功能
      SyncManager.syncPendingCheckins()
        .then(hasMoreData => {
          
        })
        .catch(error => {
          
        });
      
      
    } catch (error) {
      
    }
  }

  /**
   * 运行所有测试
   */
  static async runAllTests(): Promise<void> {
    
    
    // 测试API可用性
    const apiAvailable = await this.testAPIAvailability();
    
    // 如果API可用，测试数据流程
    if (apiAvailable) {
      await this.testDataFlow();
    }
    
    // 测试离线功能
    this.testOfflineFeatures();
    
    // 测试同步管理器
    this.testSyncManager();
    
    
  }
} 
