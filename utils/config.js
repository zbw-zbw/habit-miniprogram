"use strict";
/**
 * 环境配置文件
 * 用于存储不同环境的配置信息
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.getConfig = exports.getEnvType = void 0;
// 获取当前环境
const getEnvType = () => {
    try {
        // 获取小程序环境信息
        const accountInfo = wx.getAccountInfoSync();
        const env = accountInfo.miniProgram.envVersion;
        // 映射微信环境到我们的环境类型
        switch (env) {
            case 'develop': // 开发环境
                return 'development';
            case 'trial': // 体验版环境
                return 'test';
            case 'release': // 正式环境
                return 'production';
            default: // 默认为开发环境
                return 'development';
        }
    }
    catch (e) {
        console.error('获取环境信息失败', e);
        // 默认为开发环境
        return 'development';
    }
};
exports.getEnvType = getEnvType;
// 不同环境的配置
const configs = {
    development: {
        API_BASE_URL: 'http://localhost:3000',
        IMAGE_BASE_URL: 'http://localhost:3000/uploads'
    },
    test: {
        API_BASE_URL: 'https://api-test.yourapp.com',
        IMAGE_BASE_URL: 'https://api-test.yourapp.com/uploads'
    },
    production: {
        API_BASE_URL: 'https://api.yourapp.com',
        IMAGE_BASE_URL: 'https://api.yourapp.com/uploads'
    }
};
// 获取当前环境的配置
const getConfig = () => {
    const envType = (0, exports.getEnvType)();
    return configs[envType];
};
exports.getConfig = getConfig;
// 导出所有配置项，方便直接使用
exports.config = (0, exports.getConfig)();
