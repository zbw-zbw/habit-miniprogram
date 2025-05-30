"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 日期工具函数单元测试
 */
const date_1 = require("../../utils/date");
describe('日期工具函数', () => {
    // 测试日期格式化
    describe('formatDate', () => {
        it('应该正确格式化日期', () => {
            const date = new Date(2023, 3, 15); // 2023-04-15
            expect((0, date_1.formatDate)(date)).toBe('2023-04-15');
        });
        it('应该正确格式化包含个位数月份和日期的日期', () => {
            const date = new Date(2023, 0, 5); // 2023-01-05
            expect((0, date_1.formatDate)(date)).toBe('2023-01-05');
        });
    });
    // 测试日期解析
    describe('parseDate', () => {
        it('应该正确解析日期字符串', () => {
            const dateStr = '2023-04-15';
            const date = (0, date_1.parseDate)(dateStr);
            expect(date.getFullYear()).toBe(2023);
            expect(date.getMonth()).toBe(3); // 月份从0开始，所以4月是3
            expect(date.getDate()).toBe(15);
        });
    });
    // 测试获取两个日期之间的天数
    describe('getDaysBetween', () => {
        it('应该正确计算两个日期之间的天数', () => {
            const startDate = new Date(2023, 3, 15); // 2023-04-15
            const endDate = new Date(2023, 3, 20); // 2023-04-20
            expect((0, date_1.getDaysBetween)(startDate, endDate)).toBe(5);
        });
        it('应该正确处理相同日期', () => {
            const date = new Date(2023, 3, 15);
            expect((0, date_1.getDaysBetween)(date, date)).toBe(0);
        });
    });
    // 测试判断两个日期是否是同一天
    describe('isSameDay', () => {
        it('应该正确判断两个日期是否为同一天', () => {
            const date1 = new Date(2023, 3, 15, 10, 30); // 2023-04-15 10:30
            const date2 = new Date(2023, 3, 15, 15, 45); // 2023-04-15 15:45
            expect((0, date_1.isSameDay)(date1, date2)).toBe(true);
        });
        it('应该正确判断不同日期', () => {
            const date1 = new Date(2023, 3, 15);
            const date2 = new Date(2023, 3, 16);
            expect((0, date_1.isSameDay)(date1, date2)).toBe(false);
        });
    });
    // 测试计算两个日期之间的天数差
    describe('daysBetween', () => {
        it('应该正确计算两个日期之间的天数差', () => {
            const date1 = new Date(2023, 3, 15); // 2023-04-15
            const date2 = new Date(2023, 3, 20); // 2023-04-20
            expect((0, date_1.daysBetween)(date1, date2)).toBe(5);
        });
        it('应该接受日期字符串', () => {
            expect((0, date_1.daysBetween)('2023-04-15', '2023-04-20')).toBe(5);
        });
    });
    // 测试检查是否为连续日期
    describe('isConsecutiveDate', () => {
        it('应该正确判断连续日期', () => {
            const date1 = new Date(2023, 3, 15); // 2023-04-15
            const date2 = new Date(2023, 3, 16); // 2023-04-16
            expect((0, date_1.isConsecutiveDate)(date1, date2)).toBe(true);
        });
        it('应该正确判断非连续日期', () => {
            const date1 = new Date(2023, 3, 15); // 2023-04-15
            const date2 = new Date(2023, 3, 17); // 2023-04-17
            expect((0, date_1.isConsecutiveDate)(date1, date2)).toBe(false);
        });
    });
    // 测试获取一周的日期范围
    describe('getWeekRange', () => {
        it('应该返回正确的一周日期范围（周一开始）', () => {
            // 2023-04-18是周二
            const weekRange = (0, date_1.getWeekRange)(new Date(2023, 3, 18), 1);
            expect(weekRange).toHaveLength(7);
            expect(weekRange[0]).toBe('2023-04-17'); // 周一
            expect(weekRange[6]).toBe('2023-04-23'); // 周日
        });
        it('应该返回正确的一周日期范围（周日开始）', () => {
            // 2023-04-18是周二
            const weekRange = (0, date_1.getWeekRange)(new Date(2023, 3, 18), 0);
            expect(weekRange).toHaveLength(7);
            expect(weekRange[0]).toBe('2023-04-16'); // 周日
            expect(weekRange[6]).toBe('2023-04-22'); // 周六
        });
    });
    // 测试获取一个月的日期范围
    describe('getMonthRange', () => {
        it('应该返回正确的一个月日期范围', () => {
            const monthRange = (0, date_1.getMonthRange)(2023, 4); // 2023年4月
            expect(monthRange).toHaveLength(30); // 4月有30天
            expect(monthRange[0]).toBe('2023-04-01');
            expect(monthRange[29]).toBe('2023-04-30');
        });
        it('应该处理2月份的闰年', () => {
            const leapYear = (0, date_1.getMonthRange)(2020, 2); // 2020年2月（闰年）
            expect(leapYear).toHaveLength(29);
            const nonLeapYear = (0, date_1.getMonthRange)(2023, 2); // 2023年2月（非闰年）
            expect(nonLeapYear).toHaveLength(28);
        });
    });
    // 测试获取一个月的天数
    describe('getDaysInMonth', () => {
        it('应该返回正确的月份天数', () => {
            expect((0, date_1.getDaysInMonth)(2023, 1)).toBe(31); // 1月有31天
            expect((0, date_1.getDaysInMonth)(2023, 4)).toBe(30); // 4月有30天
            expect((0, date_1.getDaysInMonth)(2023, 2)).toBe(28); // 2023年2月有28天（非闰年）
            expect((0, date_1.getDaysInMonth)(2020, 2)).toBe(29); // 2020年2月有29天（闰年）
        });
    });
});
