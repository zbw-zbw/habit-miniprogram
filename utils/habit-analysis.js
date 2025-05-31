"use strict";
/**
 * 习惯分析工具函数
 * 提供各种习惯数据分析方法
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecommendations = exports.analyzeHabitPatterns = exports.analyzeBestPeriods = exports.analyzePerformanceLevel = void 0;
const date_1 = require("./date");
/**
 * 分析习惯性能水平
 * @param completionRate 完成率
 * @returns 性能水平：excellent(优秀), good(良好), average(一般), needsImprovement(需要改进)
 */
function analyzePerformanceLevel(completionRate) {
    if (completionRate >= 80) {
        return 'excellent';
    }
    else if (completionRate >= 60) {
        return 'good';
    }
    else if (completionRate >= 40) {
        return 'average';
    }
    else {
        return 'needsImprovement';
    }
}
exports.analyzePerformanceLevel = analyzePerformanceLevel;
/**
 * 分析最佳时段
 * @param habit 习惯数据
 * @param checkins 打卡记录
 * @returns 最佳时段分析结果
 */
function analyzeBestPeriods(habit, checkins) {
    // 过滤出已完成的打卡记录
    const completedCheckins = checkins.filter(c => c.isCompleted);
    // 按周几统计
    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const dayStats = [0, 0, 0, 0, 0, 0, 0];
    const dayCompletions = [0, 0, 0, 0, 0, 0, 0];
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    // 计算每天的完成情况
    checkins.forEach(checkin => {
        const date = new Date(checkin.date);
        const dayOfWeek = date.getDay(); // 0是周日，1-6是周一到周六
        const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 转换为0-6表示周一到周日
        dayTotals[index]++;
        if (checkin.isCompleted) {
            dayCompletions[index]++;
        }
    });
    // 计算每天的完成率
    const dayPerformance = dayTotals.map((total, index) => {
        return total > 0 ? (dayCompletions[index] / total) * 100 : 0;
    });
    // 找出最佳天和最差天
    let bestDayIndex = 0;
    let worstDayIndex = 0;
    let maxRate = dayPerformance[0];
    let minRate = dayPerformance[0];
    for (let i = 1; i < dayPerformance.length; i++) {
        if (dayTotals[i] > 0) {
            if (dayPerformance[i] > maxRate) {
                maxRate = dayPerformance[i];
                bestDayIndex = i;
            }
            if (dayPerformance[i] < minRate || minRate === 0) {
                minRate = dayPerformance[i];
                worstDayIndex = i;
            }
        }
    }
    // 分析结果
    return {
        dayPerformance,
        dayNames,
        bestDay: {
            day: dayNames[bestDayIndex],
            rate: maxRate.toFixed(1)
        },
        worstDay: {
            day: dayNames[worstDayIndex],
            rate: minRate.toFixed(1)
        }
    };
}
exports.analyzeBestPeriods = analyzeBestPeriods;
/**
 * 分析习惯模式
 * @param habit 习惯数据
 * @param checkins 打卡记录
 * @returns 习惯模式分析结果
 */
function analyzeHabitPatterns(habit, checkins) {
    // 过滤出已完成的打卡记录
    const completedCheckins = checkins.filter(c => c.isCompleted);
    // 1. 分析周期性
    const periodicity = analyzePeriodicity(habit, checkins);
    // 2. 分析时间分布
    const timeDistribution = analyzeTimeDistribution(completedCheckins);
    // 3. 分析连续记录
    const streaks = analyzeStreaks(checkins);
    // 组合分析结果
    return {
        periodicity,
        timeDistribution,
        streaks
    };
}
exports.analyzeHabitPatterns = analyzeHabitPatterns;
/**
 * 分析习惯周期性
 * @param habit 习惯数据
 * @param checkins 打卡记录
 * @returns 周期性分析结果
 */
function analyzePeriodicity(habit, checkins) {
    // 统计每周几的完成情况
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // 周一到周日的完成次数
    const totalDays = [0, 0, 0, 0, 0, 0, 0]; // 周一到周日的总次数
    checkins.forEach(checkin => {
        const date = new Date(checkin.date);
        const dayOfWeek = date.getDay(); // 0是周日，1-6是周一到周六
        const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 转换为0-6表示周一到周日
        totalDays[index]++;
        if (checkin.isCompleted) {
            dayCounts[index]++;
        }
    });
    // 计算每天的完成率
    const dayRates = totalDays.map((total, index) => {
        return total > 0 ? (dayCounts[index] / total) * 100 : 0;
    });
    // 识别显著高于平均的日期
    const averageRate = dayRates.reduce((sum, rate) => sum + rate, 0) / 7;
    const significantThreshold = averageRate * 1.3; // 高于平均30%认为是显著
    const dominantDays = dayRates
        .map((rate, index) => ({ rate, index }))
        .filter(item => item.rate > significantThreshold && item.rate > 50)
        .map(item => item.index);
    // 计算置信度
    const confidence = dominantDays.length > 0
        ? dominantDays.reduce((sum, index) => sum + dayRates[index], 0) / dominantDays.length
        : 0;
    return {
        hasPattern: dominantDays.length > 0,
        dominantDays,
        confidence,
        dayRates
    };
}
/**
 * 分析时间分布
 * @param completedCheckins 已完成的打卡记录
 * @returns 时间分布分析结果
 */
function analyzeTimeDistribution(completedCheckins) {
    // 只处理有时间记录的打卡
    const checkinsWithTime = completedCheckins.filter(c => c.time);
    if (checkinsWithTime.length === 0) {
        return {
            bestTime: null,
            distribution: [0, 0, 0, 0],
            timeNames: ['早晨', '中午', '下午', '晚上']
        };
    }
    // 定义时间段
    const timeSlots = [
        { name: '早晨', start: 5, end: 11 },
        { name: '中午', start: 11, end: 14 },
        { name: '下午', start: 14, end: 18 },
        { name: '晚上', start: 18, end: 24 }
    ];
    // 统计每个时间段的打卡次数
    const timeCounts = [0, 0, 0, 0];
    checkinsWithTime.forEach(checkin => {
        const timeStr = checkin.time;
        const hour = parseInt(timeStr.split(':')[0]);
        for (let i = 0; i < timeSlots.length; i++) {
            if (hour >= timeSlots[i].start && hour < timeSlots[i].end) {
                timeCounts[i]++;
                break;
            }
            else if (hour >= 0 && hour < 5) {
                // 凌晨算作晚上
                timeCounts[3]++;
                break;
            }
        }
    });
    // 计算分布比例
    const total = timeCounts.reduce((sum, count) => sum + count, 0);
    const distribution = timeCounts.map(count => (count / total) * 100);
    // 找出最佳时间
    const bestTimeIndex = timeCounts.indexOf(Math.max(...timeCounts));
    return {
        bestTime: {
            name: timeSlots[bestTimeIndex].name,
            ratio: Math.round(distribution[bestTimeIndex])
        },
        distribution,
        timeNames: timeSlots.map(slot => slot.name)
    };
}
/**
 * 分析连续记录
 * @param checkins 打卡记录
 * @returns 连续记录分析结果
 */
function analyzeStreaks(checkins) {
    if (checkins.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            averageStreak: 0,
            streakHistory: []
        };
    }
    // 按日期排序
    const sortedCheckins = [...checkins].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // 计算所有连续记录
    const streaks = [];
    let currentStreak = 0;
    let longestStreak = 0;
    // 遍历打卡记录
    for (let i = 0; i < sortedCheckins.length; i++) {
        if (sortedCheckins[i].isCompleted) {
            currentStreak++;
            // 检查是否是最后一条记录或下一条不是连续的
            if (i === sortedCheckins.length - 1 ||
                !isContinuousDate(sortedCheckins[i].date, sortedCheckins[i + 1].date) ||
                !sortedCheckins[i + 1].isCompleted) {
                if (currentStreak > 0) {
                    streaks.push(currentStreak);
                    longestStreak = Math.max(longestStreak, currentStreak);
                    currentStreak = 0;
                }
            }
        }
        else {
            // 重置当前连续记录
            if (currentStreak > 0) {
                streaks.push(currentStreak);
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 0;
            }
        }
    }
    // 检查当前连续记录
    const today = (0, date_1.formatDate)(new Date());
    const lastCheckin = sortedCheckins[sortedCheckins.length - 1];
    let currentStreakCount = 0;
    if (lastCheckin && lastCheckin.isCompleted &&
        (lastCheckin.date === today || isContinuousDate(lastCheckin.date, today))) {
        // 从最后一条记录向前计算当前连续天数
        currentStreakCount = 1;
        let currentIndex = sortedCheckins.length - 1;
        while (currentIndex > 0 &&
            sortedCheckins[currentIndex].isCompleted &&
            isContinuousDate(sortedCheckins[currentIndex - 1].date, sortedCheckins[currentIndex].date) &&
            sortedCheckins[currentIndex - 1].isCompleted) {
            currentStreakCount++;
            currentIndex--;
        }
    }
    // 计算平均连续天数
    const averageStreak = streaks.length > 0
        ? streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length
        : 0;
    return {
        currentStreak: currentStreakCount,
        longestStreak,
        averageStreak: parseFloat(averageStreak.toFixed(1)),
        streakHistory: streaks
    };
}
/**
 * 检查两个日期是否连续
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 是否连续
 */
function isContinuousDate(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    // 将时间部分设置为0，只比较日期
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    // 计算两个日期之间的天数差
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
}
/**
 * 生成个性化建议
 * @param habit 习惯数据
 * @param analysisData 分析数据
 * @returns 建议列表
 */
function generateRecommendations(habit, analysisData) {
    const recommendations = [];
    const { performanceLevel, currentStreak, completionRate, bestPeriods, patterns } = analysisData;
    // 1. 根据性能水平生成建议
    if (performanceLevel === 'excellent') {
        recommendations.push({
            type: 'achievement',
            title: '保持良好状态',
            description: '你的习惯已经形成得很好，尝试设定更高的目标来挑战自己。',
            actionType: 'upgrade',
            actionText: '提高目标'
        });
    }
    else if (performanceLevel === 'needsImprovement') {
        recommendations.push({
            type: 'improvement',
            title: '简化习惯',
            description: '完成率较低，考虑降低习惯难度或拆分为更小的步骤。',
            actionType: 'simplify',
            actionText: '修改习惯'
        });
    }
    // 2. 根据连续记录生成建议
    if (currentStreak > 0) {
        recommendations.push({
            type: 'streak',
            title: '保持连续',
            description: `你已连续完成${currentStreak}天，不要打破这个链条！`,
            actionType: 'continue',
            actionText: '继续坚持'
        });
    }
    else if (completionRate > 0) {
        recommendations.push({
            type: 'restart',
            title: '重新开始',
            description: '连续记录已中断，今天是重新开始的好时机。',
            actionType: 'checkin',
            actionText: '立即打卡'
        });
    }
    // 3. 根据最佳时段生成建议
    if (bestPeriods && bestPeriods.bestDay) {
        recommendations.push({
            type: 'timing',
            title: '利用最佳时间',
            description: `数据显示，你在${bestPeriods.bestDay.day}的完成率最高，尽量在这天安排更重要的习惯。`,
            actionType: 'schedule',
            actionText: '调整提醒'
        });
    }
    // 4. 根据习惯模式生成建议
    if (patterns && patterns.timeDistribution && patterns.timeDistribution.bestTime) {
        recommendations.push({
            type: 'pattern',
            title: '固定时间段',
            description: `你通常在${patterns.timeDistribution.bestTime.name}完成习惯，考虑设置这个时间段的固定提醒。`,
            actionType: 'reminder',
            actionText: '设置提醒'
        });
    }
    // 5. 通用建议
    recommendations.push({
        type: 'general',
        title: '环境提示',
        description: '在环境中设置视觉提示，比如便利贴或物品摆放，帮助你记住习惯。',
        actionType: 'tips',
        actionText: '更多建议'
    });
    return recommendations;
}
exports.generateRecommendations = generateRecommendations;
/**
 * 计算标准差
 * @param values 数值数组
 * @returns 标准差
 */
function calculateStandardDeviation(values) {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(variance);
}
/**
 * 判断某日期是否应该执行习惯
 * @param habit 习惯对象
 * @param dateStr 日期字符串 YYYY-MM-DD
 * @returns 是否应该执行
 */
function shouldDoHabitOnDate(habit, dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0-6，周日到周六
    // 检查习惯开始日期
    if (new Date(dateStr) < new Date(habit.startDate)) {
        return false;
    }
    // 检查习惯结束日期
    if (habit.endDate && new Date(dateStr) > new Date(habit.endDate)) {
        return false;
    }
    // 根据频率类型判断
    switch (habit.frequency.type) {
        case 'daily':
            return true;
        case 'weekly':
            // 检查是否为指定的星期几
            return habit.frequency.days?.includes(day) || false;
        case 'monthly':
            // 每月固定日期
            return date.getDate() === habit.frequency.interval;
        default:
            // 其他类型暂不支持
            return false;
    }
}
