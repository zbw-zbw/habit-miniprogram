/**
 * 本地存储工具函数
 */

/**
 * 设置本地存储
 * @param key 存储键
 * @param data 存储数据
 */
export const setStorage = <T>(key: string, data: T): void => {
  try {
    wx.setStorageSync(key, data);
  } catch (error) {
    console.error(`设置本地存储失败: ${key}`, error);
  }
};

/**
 * 获取本地存储
 * @param key 存储键
 * @param defaultValue 默认值
 * @returns 存储数据
 */
export const getStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const value = wx.getStorageSync(key);
    return (value === '' || value === null || value === undefined) ? defaultValue : value;
  } catch (error) {
    console.error(`获取本地存储失败: ${key}`, error);
    return defaultValue;
  }
};

/**
 * 移除本地存储
 * @param key 存储键
 */
export const removeStorage = (key: string): void => {
  try {
    wx.removeStorageSync(key);
  } catch (error) {
    console.error(`移除本地存储失败: ${key}`, error);
  }
};

/**
 * 清除所有本地存储
 */
export const clearStorage = (): void => {
  try {
    wx.clearStorageSync();
  } catch (error) {
    console.error('清除本地存储失败', error);
  }
};

/**
 * 创建测试数据
 */
export const createTestData = (): void => {
  // 检查是否已经有数据
  const existingHabits = getStorage<IHabit[]>('habits', []);
  if (existingHabits.length > 0) {
    return; // 已有数据，不需要创建测试数据
  }

  // 创建测试习惯
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 30); // 30天前开始
  
  const formatDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const testHabits: IHabit[] = [
    {
      id: 'habit-1',
      name: '每日阅读',
      description: '每天阅读30分钟，提高知识储备',
      icon: 'book',
      color: '#4F7CFF',
      frequency: {
        type: 'daily'
      },
      startDate: formatDateStr(startDate),
      target: 30,
      unit: '分钟',
      reminder: {
        enabled: true,
        time: '20:00'
      },
      category: '学习',
      isArchived: false,
      createdAt: startDate.toISOString()
    },
    {
      id: 'habit-2',
      name: '晨跑',
      description: '坚持晨跑，保持健康体魄',
      icon: 'run',
      color: '#67C23A',
      frequency: {
        type: 'weekly',
        days: [1, 3, 5] // 周一、三、五
      },
      startDate: formatDateStr(startDate),
      target: 30,
      unit: '分钟',
      reminder: {
        enabled: true,
        time: '07:00'
      },
      category: '健康',
      isArchived: false,
      createdAt: startDate.toISOString()
    },
    {
      id: 'habit-3',
      name: '冥想',
      description: '每天冥想，平静心灵',
      icon: 'meditation',
      color: '#E6A23C',
      frequency: {
        type: 'daily'
      },
      startDate: formatDateStr(startDate),
      target: 15,
      unit: '分钟',
      reminder: {
        enabled: true,
        time: '22:00'
      },
      category: '健康',
      isArchived: false,
      createdAt: startDate.toISOString()
    }
  ];

  // 创建测试打卡记录
  const testCheckins: ICheckin[] = [];
  
  // 为每个习惯创建过去30天的随机打卡记录
  testHabits.forEach(habit => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = formatDateStr(date);
      
      // 随机决定是否完成
      const isCompleted = Math.random() > 0.3; // 70% 的概率完成
      
      // 检查这一天是否应该执行该习惯
      let shouldDo = true;
      if (habit.frequency.type === 'weekly' && habit.frequency.days) {
        const dayOfWeek = date.getDay() || 7; // 转换为1-7，表示周一到周日
        shouldDo = habit.frequency.days.includes(dayOfWeek);
      }
      
      if (shouldDo) {
        testCheckins.push({
          id: `checkin-${habit.id}-${dateStr}`,
          habitId: habit.id,
          date: dateStr,
          isCompleted,
          createdAt: date.toISOString()
        });
      }
    }
  });

  // 保存测试数据
  saveHabits(testHabits);
  saveCheckins(testCheckins);
};

/**
 * 存储习惯数据
 * @param habits 习惯数组
 */
export const saveHabits = (habits: IHabit[]): void => {
  try {
    wx.setStorageSync('habits', habits);
  } catch (e) {
    console.error('保存习惯数据失败:', e);
  }
};

/**
 * 获取习惯数据
 * @returns 习惯数组
 */
export const getHabits = (): IHabit[] => {
  try {
    return wx.getStorageSync('habits') || [];
  } catch (e) {
    console.error('获取习惯数据失败:', e);
    return [];
  }
};

/**
 * 存储打卡记录
 * @param checkins 打卡记录数组
 */
export const saveCheckins = (checkins: ICheckin[]): void => {
  try {
    wx.setStorageSync('checkins', checkins);
  } catch (e) {
    console.error('保存打卡记录失败:', e);
  }
};

/**
 * 获取打卡记录
 * @returns 打卡记录数组
 */
export const getCheckins = (): ICheckin[] => {
  try {
    return wx.getStorageSync('checkins') || [];
  } catch (e) {
    console.error('获取打卡记录失败:', e);
    return [];
  }
};

/**
 * 根据习惯ID获取打卡记录
 * @param habitId 习惯ID
 * @returns 打卡记录数组
 */
export const getCheckinsByHabitId = (habitId: string): ICheckin[] => {
  const checkins = getCheckins();
  return checkins.filter(checkin => checkin.habitId === habitId);
};

/**
 * 保存用户信息
 * @param userInfo 用户信息
 */
export const saveUserInfo = (userInfo: IUserInfo): void => {
  try {
    wx.setStorageSync('userInfo', userInfo);
  } catch (e) {
    console.error('保存用户信息失败:', e);
  }
};

/**
 * 获取用户信息
 * @returns 用户信息
 */
export const getUserInfo = (): IUserInfo | null => {
  try {
    return wx.getStorageSync('userInfo') || null;
  } catch (e) {
    console.error('获取用户信息失败:', e);
    return null;
  }
};

/**
 * 保存登录令牌
 * @param token 登录令牌
 */
export const saveToken = (token: string): void => {
  setStorage('token', token);
};

/**
 * 获取登录令牌
 * @returns 登录令牌
 */
export const getToken = (): string => {
  return getStorage<string>('token', '');
};

/**
 * 根据ID获取习惯
 * @param habitId 习惯ID
 * @returns 习惯数据或null
 */
export const getHabitById = (habitId: string): IHabit | null => {
  const habits = getHabits();
  return habits.find(habit => habit.id === habitId) || null;
};

/**
 * 保存主题设置
 * @param theme 主题
 */
export const saveTheme = (theme: 'light' | 'dark'): void => {
  setStorage('theme', theme);
};

/**
 * 获取主题设置
 * @returns 主题名称
 */
export const getTheme = (): 'light' | 'dark' => {
  return getStorage<'light' | 'dark'>('theme', 'light');
};

/**
 * 保存习惯统计数据到本地存储
 * @param habitId 习惯ID
 * @param stats 统计数据
 */
export const saveHabitStats = (habitId: string, stats: IHabitStats): void => {
  try {
    const allStats = wx.getStorageSync('habitStats') || {};
    allStats[habitId] = stats;
    wx.setStorageSync('habitStats', allStats);
  } catch (e) {
    console.error('保存习惯统计数据失败:', e);
  }
};

/**
 * 获取本地存储的习惯统计数据
 * @param habitId 习惯ID
 * @returns 统计数据或null
 */
export const getHabitStats = (habitId: string): IHabitStats | null => {
  try {
    const allStats = wx.getStorageSync('habitStats') || {};
    return allStats[habitId] || null;
  } catch (e) {
    console.error('获取习惯统计数据失败:', e);
    return null;
  }
};

/**
 * 保存所有习惯统计数据
 * @param stats 所有习惯的统计数据
 */
export const saveAllHabitStats = (stats: Record<string, IHabitStats>): void => {
  try {
    wx.setStorageSync('habitStats', stats);
  } catch (e) {
    console.error('保存所有习惯统计数据失败:', e);
  }
};

/**
 * 获取所有习惯统计数据
 * @returns 所有习惯的统计数据
 */
export const getAllHabitStats = (): Record<string, IHabitStats> => {
  try {
    return wx.getStorageSync('habitStats') || {};
  } catch (e) {
    console.error('获取所有习惯统计数据失败:', e);
    return {};
  }
};

/**
 * 清除所有本地存储的数据
 */
export const clearAllData = (): void => {
  try {
    wx.clearStorageSync();
  } catch (e) {
    console.error('清除本地存储失败:', e);
  }
};

/**
 * 清除认证相关数据
 */
export const clearAuthData = (): void => {
  try {
    wx.removeStorageSync('token');
    wx.removeStorageSync('refreshToken');
  } catch (e) {
    console.error('清除认证数据失败:', e);
  }
}; 
