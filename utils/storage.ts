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
    return (value === "" || value === null || value === undefined) ? defaultValue : value;
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
 * 存储习惯数据
 * @param habits 习惯数组
 */
export const saveHabits = (habits: IHabit[]): void => {
  setStorage('habits', habits);
};

/**
 * 获取习惯数据
 * @returns 习惯数组
 */
export const getHabits = (): IHabit[] => {
  return getStorage<IHabit[]>('habits', []);
};

/**
 * 存储打卡记录
 * @param checkins 打卡记录数组
 */
export const saveCheckins = (checkins: ICheckin[]): void => {
  setStorage('checkins', checkins);
};

/**
 * 获取打卡记录
 * @returns 打卡记录数组
 */
export const getCheckins = (): ICheckin[] => {
  return getStorage<ICheckin[]>('checkins', []);
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
  setStorage('userInfo', userInfo);
};

/**
 * 获取用户信息
 * @returns 用户信息
 */
export const getUserInfo = (): IUserInfo | null => {
  return getStorage<IUserInfo | null>('userInfo', null);
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
 * 保存主题设置
 * @param theme 主题名称
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
