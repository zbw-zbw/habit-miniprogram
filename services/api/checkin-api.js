"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.checkinAPI = void 0;
/**
 * 打卡相关API
 */
var request_1 = require("../../utils/request");
exports.checkinAPI = {
    /**
     * 获取打卡记录
     * @param params 查询参数
     * @returns Promise<ICheckin[]>
     */
    getCheckins: function (params) {
        return (0, request_1.get)('/api/checkins', params);
    },
    /**
     * 获取习惯打卡记录
     * @param habitId 习惯ID
     * @returns Promise<ICheckin[]>
     */
    getHabitCheckins: function (habitId) {
        return (0, request_1.get)("/api/habits/".concat(habitId, "/checkins"));
    },
    /**
     * 获取单个打卡记录
     * @param id 打卡记录ID
     * @returns Promise<ICheckin>
     */
    getCheckin: function (id) {
        return (0, request_1.get)("/api/checkins/".concat(id));
    },
    /**
     * 创建打卡记录
     * @param checkinData 打卡数据
     * @returns Promise<ICheckin>
     */
    createCheckin: function (checkinData) {
        // 确保habitId或habit至少有一个
        if (!checkinData.habitId && !checkinData.habit) {
            return Promise.reject(new Error('习惯ID不能为空'));
        }
        // 将habitId复制到habit字段，以满足服务器端要求
        var data = __assign({}, checkinData);
        if (!data.habit && data.habitId) {
            data.habit = data.habitId;
        }
        return (0, request_1.post)('/api/checkins', data);
    },
    /**
     * 更新打卡记录
     * @param id 打卡记录ID
     * @param checkin 打卡记录数据
     * @returns Promise<ICheckin>
     */
    updateCheckin: function (id, checkin) {
        return (0, request_1.put)("/api/checkins/".concat(id), checkin);
    },
    /**
     * 删除打卡记录
     * @param id 打卡记录ID
     * @returns Promise<void>
     */
    deleteCheckin: function (id) {
        return (0, request_1.del)("/api/checkins/".concat(id));
    }
};
