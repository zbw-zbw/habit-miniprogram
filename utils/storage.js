"use strict";
/**
 * 本地存储工具函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthData = exports.clearAllData = exports.getAllHabitStats = exports.saveAllHabitStats = exports.getHabitStats = exports.saveHabitStats = exports.getTheme = exports.saveTheme = exports.getHabitById = exports.getToken = exports.saveToken = exports.getUserInfo = exports.saveUserInfo = exports.getCheckinsByHabitId = exports.getCheckins = exports.saveCheckins = exports.getHabits = exports.saveHabits = exports.createTestData = exports.clearStorage = exports.removeStorage = exports.getStorage = exports.setStorage = void 0;
/**
 * 设置本地存储
 * @param key 存储键
 * @param data 存储数据
 */
const setStorage = (key, data) => {
    try {
        wx.setStorageSync(key, data);
    }
    catch (error) {
        console.error(`设置本地存储失败: ${key}`, error);
    }
};
exports.setStorage = setStorage;
/**
 * 获取本地存储
 * @param key 存储键
 * @param defaultValue 默认值
 * @returns 存储数据
 */
const getStorage = (key, defaultValue) => {
    try {
        const value = wx.getStorageSync(key);
        return (value === '' || value === null || value === undefined) ? defaultValue : value;
    }
    catch (error) {
        console.error(`获取本地存储失败: ${key}`, error);
        return defaultValue;
    }
};
exports.getStorage = getStorage;
/**
 * 移除本地存储
 * @param key 存储键
 */
const removeStorage = (key) => {
    try {
        wx.removeStorageSync(key);
    }
    catch (error) {
        console.error(`移除本地存储失败: ${key}`, error);
    }
};
exports.removeStorage = removeStorage;
/**
 * 清除所有本地存储
 */
const clearStorage = () => {
    try {
        wx.clearStorageSync();
    }
    catch (error) {
        console.error('清除本地存储失败', error);
    }
};
exports.clearStorage = clearStorage;
/**
 * 创建测试数据
 */
const createTestData = () => {
    // 检查是否已经有数据
    const existingHabits = (0, exports.getStorage)('habits', []);
    if (existingHabits.length > 0) {
        return; // 已有数据，不需要创建测试数据
    }
    // 创建测试习惯
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30); // 30天前开始
    const formatDateStr = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const testHabits = [
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
    const testCheckins = [];
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
    (0, exports.saveHabits)(testHabits);
    (0, exports.saveCheckins)(testCheckins);
};
exports.createTestData = createTestData;
/**
 * 存储习惯数据
 * @param habits 习惯数组
 */
const saveHabits = (habits) => {
    try {
        wx.setStorageSync('habits', habits);
    }
    catch (e) {
        console.error('保存习惯数据失败:', e);
    }
};
exports.saveHabits = saveHabits;
/**
 * 获取习惯数据
 * @returns 习惯数组
 */
const getHabits = () => {
    try {
        return wx.getStorageSync('habits') || [];
    }
    catch (e) {
        console.error('获取习惯数据失败:', e);
        return [];
    }
};
exports.getHabits = getHabits;
/**
 * 存储打卡记录
 * @param checkins 打卡记录数组
 */
const saveCheckins = (checkins) => {
    try {
        wx.setStorageSync('checkins', checkins);
    }
    catch (e) {
        console.error('保存打卡记录失败:', e);
    }
};
exports.saveCheckins = saveCheckins;
/**
 * 获取打卡记录
 * @returns 打卡记录数组
 */
const getCheckins = () => {
    try {
        return wx.getStorageSync('checkins') || [];
    }
    catch (e) {
        console.error('获取打卡记录失败:', e);
        return [];
    }
};
exports.getCheckins = getCheckins;
/**
 * 根据习惯ID获取打卡记录
 * @param habitId 习惯ID
 * @returns 打卡记录数组
 */
const getCheckinsByHabitId = (habitId) => {
    const checkins = (0, exports.getCheckins)();
    return checkins.filter(checkin => checkin.habitId === habitId);
};
exports.getCheckinsByHabitId = getCheckinsByHabitId;
/**
 * 保存用户信息
 * @param userInfo 用户信息
 */
const saveUserInfo = (userInfo) => {
    try {
        wx.setStorageSync('userInfo', userInfo);
    }
    catch (e) {
        console.error('保存用户信息失败:', e);
    }
};
exports.saveUserInfo = saveUserInfo;
/**
 * 获取用户信息
 * @returns 用户信息
 */
const getUserInfo = () => {
    try {
        return wx.getStorageSync('userInfo') || null;
    }
    catch (e) {
        console.error('获取用户信息失败:', e);
        return null;
    }
};
exports.getUserInfo = getUserInfo;
/**
 * 保存登录令牌
 * @param token 登录令牌
 */
const saveToken = (token) => {
    (0, exports.setStorage)('token', token);
};
exports.saveToken = saveToken;
/**
 * 获取登录令牌
 * @returns 登录令牌
 */
const getToken = () => {
    return (0, exports.getStorage)('token', '');
};
exports.getToken = getToken;
/**
 * 根据ID获取习惯
 * @param habitId 习惯ID
 * @returns 习惯数据或null
 */
const getHabitById = (habitId) => {
    const habits = (0, exports.getHabits)();
    return habits.find(habit => habit.id === habitId) || null;
};
exports.getHabitById = getHabitById;
/**
 * 保存主题设置
 * @param theme 主题
 */
const saveTheme = (theme) => {
    (0, exports.setStorage)('theme', theme);
};
exports.saveTheme = saveTheme;
/**
 * 获取主题设置
 * @returns 主题名称
 */
const getTheme = () => {
    return (0, exports.getStorage)('theme', 'light');
};
exports.getTheme = getTheme;
/**
 * 保存习惯统计数据到本地存储
 * @param habitId 习惯ID
 * @param stats 统计数据
 */
const saveHabitStats = (habitId, stats) => {
    try {
        const allStats = wx.getStorageSync('habitStats') || {};
        allStats[habitId] = stats;
        wx.setStorageSync('habitStats', allStats);
    }
    catch (e) {
        console.error('保存习惯统计数据失败:', e);
    }
};
exports.saveHabitStats = saveHabitStats;
/**
 * 获取本地存储的习惯统计数据
 * @param habitId 习惯ID
 * @returns 统计数据或null
 */
const getHabitStats = (habitId) => {
    try {
        const allStats = wx.getStorageSync('habitStats') || {};
        return allStats[habitId] || null;
    }
    catch (e) {
        console.error('获取习惯统计数据失败:', e);
        return null;
    }
};
exports.getHabitStats = getHabitStats;
/**
 * 保存所有习惯统计数据
 * @param stats 所有习惯的统计数据
 */
const saveAllHabitStats = (stats) => {
    try {
        wx.setStorageSync('habitStats', stats);
    }
    catch (e) {
        console.error('保存所有习惯统计数据失败:', e);
    }
};
exports.saveAllHabitStats = saveAllHabitStats;
/**
 * 获取所有习惯统计数据
 * @returns 所有习惯的统计数据
 */
const getAllHabitStats = () => {
    try {
        return wx.getStorageSync('habitStats') || {};
    }
    catch (e) {
        console.error('获取所有习惯统计数据失败:', e);
        return {};
    }
};
exports.getAllHabitStats = getAllHabitStats;
/**
 * 清除所有本地存储的数据
 */
const clearAllData = () => {
    try {
        wx.clearStorageSync();
    }
    catch (e) {
        console.error('清除本地存储失败:', e);
    }
};
exports.clearAllData = clearAllData;
/**
 * 清除认证相关数据
 */
const clearAuthData = () => {
    try {
        wx.removeStorageSync('token');
        wx.removeStorageSync('refreshToken');
    }
    catch (e) {
        console.error('清除认证数据失败:', e);
    }
};
exports.clearAuthData = clearAuthData;
