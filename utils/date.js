"use strict";
/**
 * 日期工具函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthRange = exports.getWeekRange = exports.isConsecutiveDate = exports.getCurrentWeekDates = exports.addDays = exports.daysBetween = exports.getLastDayOfMonth = exports.getFirstDayOfMonth = exports.getFirstDayOfWeek = exports.isSameDay = exports.getPastDates = exports.getDateAfter = exports.getDateBefore = exports.getDaysInMonth = exports.getDayOfMonth = exports.getDayOfWeek = exports.getDaysBetween = exports.parseDate = exports.formatTime = exports.formatDate = exports.getCurrentDate = void 0;
/**
 * 获取当前日期，格式为YYYY-MM-DD
 */
function getCurrentDate() {
    const now = new Date();
    return formatDate(now);
}
exports.getCurrentDate = getCurrentDate;
/**
 * 格式化日期，格式为YYYY-MM-DD
 * @param date 日期对象
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
exports.formatDate = formatDate;
/**
 * 格式化时间，格式为HH:MM
 * @param date 日期对象
 */
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
exports.formatTime = formatTime;
/**
 * 解析日期字符串，格式为YYYY-MM-DD
 * @param dateStr 日期字符串
 */
function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}
exports.parseDate = parseDate;
/**
 * 获取两个日期之间的天数
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
function getDaysBetween(startDate, endDate) {
    const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return Math.round(Math.abs((start.getTime() - end.getTime()) / oneDay));
}
exports.getDaysBetween = getDaysBetween;
/**
 * 获取日期是星期几（0-6，0表示星期日）
 * @param date 日期对象
 */
function getDayOfWeek(date) {
    return date.getDay();
}
exports.getDayOfWeek = getDayOfWeek;
/**
 * 获取日期是一个月中的第几天（1-31）
 * @param date 日期对象
 */
function getDayOfMonth(date) {
    return date.getDate();
}
exports.getDayOfMonth = getDayOfMonth;
/**
 * 获取一个月的天数
 * @param year 年份
 * @param month 月份（1-12）
 */
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}
exports.getDaysInMonth = getDaysInMonth;
/**
 * 获取前n天的日期
 * @param days 天数
 */
function getDateBefore(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}
exports.getDateBefore = getDateBefore;
/**
 * 获取后n天的日期
 * @param days 天数
 */
function getDateAfter(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}
exports.getDateAfter = getDateAfter;
/**
 * 获取过去n天的日期数组
 * @param days 天数
 */
function getPastDates(days) {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = getDateBefore(i);
        dates.push(formatDate(date));
    }
    return dates;
}
exports.getPastDates = getPastDates;
/**
 * 判断两个日期是否是同一天
 * @param date1 日期1
 * @param date2 日期2
 */
function isSameDay(date1, date2) {
    return (date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate());
}
exports.isSameDay = isSameDay;
/**
 * 获取日期所在周的第一天（星期日）
 * @param date 日期对象
 */
function getFirstDayOfWeek(date) {
    const day = date.getDay();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
}
exports.getFirstDayOfWeek = getFirstDayOfWeek;
/**
 * 获取日期所在月的第一天
 * @param date 日期对象
 */
function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}
exports.getFirstDayOfMonth = getFirstDayOfMonth;
/**
 * 获取日期所在月的最后一天
 * @param date 日期对象
 */
function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
exports.getLastDayOfMonth = getLastDayOfMonth;
/**
 * 计算两个日期之间的天数差
 * @param start 起始日期
 * @param end 结束日期
 * @returns 天数差
 */
function daysBetween(start, end) {
    // 将时间部分清零，只比较日期
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    // 转换为毫秒并计算差值
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
exports.daysBetween = daysBetween;
/**
 * 向日期添加指定天数
 * @param date 原始日期
 * @param days 要添加的天数
 * @returns 新日期
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
exports.addDays = addDays;
/**
 * 获取当前周的日期列表（周一到周日）
 * @returns 当前周的日期数组
 */
function getCurrentWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0是周日，1-6是周一到周六
    // 调整到本周一
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    // 生成周一到周日的日期数组
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date);
    }
    return weekDates;
}
exports.getCurrentWeekDates = getCurrentWeekDates;
/**
 * 检查是否为连续日期
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 如果两个日期相邻，则返回 true
 */
const isConsecutiveDate = (date1, date2) => {
    return daysBetween(date1, date2) === 1;
};
exports.isConsecutiveDate = isConsecutiveDate;
/**
 * 获取一周的日期范围
 * @param date 指定日期，默认为当前日期
 * @param startDay 一周的起始日，0表示周日，1表示周一，默认为1
 * @returns 包含一周日期的数组，格式为 'YYYY-MM-DD'
 */
const getWeekRange = (date = new Date(), startDay = 1) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDay(); // 0-6，0表示周日
    // 计算本周第一天的偏移量
    const diff = (day < startDay ? 7 : 0) + day - startDay;
    // 获取本周第一天
    const firstDay = new Date(d);
    firstDay.setDate(d.getDate() - diff);
    // 生成一周的日期
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(firstDay);
        currentDate.setDate(firstDay.getDate() + i);
        weekDates.push(formatDate(currentDate));
    }
    return weekDates;
};
exports.getWeekRange = getWeekRange;
/**
 * 获取一个月的日期范围
 * @param year 年份，默认为当前年份
 * @param month 月份（1-12），默认为当前月份
 * @returns 包含一个月所有日期的数组，格式为 'YYYY-MM-DD'
 */
const getMonthRange = (year = new Date().getFullYear(), month = new Date().getMonth() + 1) => {
    // 获取指定月份的天数
    const daysInMonth = new Date(year, month, 0).getDate();
    // 生成月份的所有日期
    const monthDates = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month - 1, i);
        monthDates.push(formatDate(date));
    }
    return monthDates;
};
exports.getMonthRange = getMonthRange;
