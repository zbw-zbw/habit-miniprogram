"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllHabitCardsData = exports.getHabitCardData = void 0;
const api_1 = require("./api");
const date_1 = require("../utils/date");
/**
 * 为习惯卡片获取完整数据
 * @param habitId 习惯ID
 * @returns 包含习惯信息、统计数据和今日打卡状态的对象
 */
const getHabitCardData = async (habitId) => {
    try {
        // 记录开始时间
        const startTime = Date.now();
        console.log(`开始获取习惯[${habitId}]数据...`);
        // 并行获取习惯详情、统计数据和今日打卡记录
        const [habit, stats, todayCheckins] = await Promise.all([
            api_1.habitAPI.getHabit(habitId),
            api_1.habitAPI.getHabitStats(habitId),
            api_1.checkinAPI.getCheckins({
                habitId,
                startDate: (0, date_1.getCurrentDate)(),
                endDate: (0, date_1.getCurrentDate)()
            })
        ]);
        // 检查今日是否已完成
        const isCompletedToday = todayCheckins.some(c => c.isCompleted);
        // 如果今日已完成，更新最后完成日期，但保留原始完成率
        if (isCompletedToday) {
            stats.lastCompletedDate = (0, date_1.getCurrentDate)();
            // 不再强制设置completionRate为100%
        }
        // 返回完整数据
        const result = {
            habit,
            stats,
            isCompletedToday
        };
        // 记录完成时间
        const endTime = Date.now();
        console.log(`习惯[${habitId}]数据获取完成，耗时: ${endTime - startTime}ms`);
        console.log('习惯详情:', habit);
        console.log('统计数据:', stats);
        console.log('今日打卡状态:', isCompletedToday);
        return result;
    }
    catch (error) {
        console.error(`获取习惯[${habitId}]数据失败:`, error);
        throw error;
    }
};
exports.getHabitCardData = getHabitCardData;
/**
 * 获取全部习惯卡片数据
 * @returns 包含所有习惯及其统计数据的数组
 */
const getAllHabitCardsData = async () => {
    try {
        // 记录开始时间
        const startTime = Date.now();
        console.log('开始获取所有习惯卡片数据...');
        // 获取所有习惯
        const habits = await api_1.habitAPI.getHabits();
        console.log(`获取到${habits.length}个习惯`);
        // 获取今日日期
        const today = (0, date_1.getCurrentDate)();
        // 获取今日所有打卡记录
        const todayCheckins = await api_1.checkinAPI.getCheckins({
            startDate: today,
            endDate: today
        });
        console.log(`获取到${todayCheckins.length}条今日打卡记录`);
        // 创建已完成习惯ID的集合
        const completedHabitIds = new Set();
        todayCheckins.forEach(checkin => {
            if (checkin.isCompleted) {
                // 兼容不同格式的打卡记录
                const habitId = checkin.habit || checkin.habitId;
                if (habitId) {
                    completedHabitIds.add(habitId);
                }
            }
        });
        console.log('今日已完成习惯IDs:', [...completedHabitIds]);
        // 为每个习惯获取统计数据
        const habitsWithStats = await Promise.all(habits.map(async (habit) => {
            const habitId = habit._id;
            if (!habitId)
                return null;
            try {
                // 获取习惯统计数据
                const stats = await api_1.habitAPI.getHabitStats(habitId);
                // 检查是否今日已完成
                const isCompletedToday = completedHabitIds.has(habitId);
                // 如果今日已完成，更新最后完成日期，但保留原始完成率
                if (isCompletedToday) {
                    stats.lastCompletedDate = today;
                    // 不再强制设置completionRate为100%
                }
                return {
                    habit,
                    stats,
                    isCompletedToday
                };
            }
            catch (error) {
                console.error(`获取习惯[${habitId}]统计数据失败:`, error);
                return null;
            }
        }));
        // 过滤掉null值
        const validHabitsWithStats = habitsWithStats.filter(Boolean);
        // 记录完成时间
        const endTime = Date.now();
        console.log(`所有习惯卡片数据获取完成，耗时: ${endTime - startTime}ms`);
        return validHabitsWithStats;
    }
    catch (error) {
        console.error('获取所有习惯卡片数据失败:', error);
        throw error;
    }
};
exports.getAllHabitCardsData = getAllHabitCardsData;
