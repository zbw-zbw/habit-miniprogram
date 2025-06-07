/**
 * 环境配置文件
 * 用于存储不同环境的配置信息
 */

// 环境类型
export type EnvType = 'development' | 'test' | 'production';

// 获取当前环境
export const getEnvType = (): EnvType => {
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
  } catch (e) {
    console.error('获取环境信息失败', e);
    // 默认为开发环境
    return 'development';
  }
};

// 环境配置
interface EnvConfig {
  API_BASE_URL: string;
  IMAGE_BASE_URL: string;
  FALLBACK_API_URL?: string; // 备用API地址
  // 可以添加更多配置项
}

// 不同环境的配置
const configs: Record<EnvType, EnvConfig> = {
  development: {
    // 修改为本地网络IP，使手机可以访问到开发服务器
    // 使用实际的IP地址而不是localhost
    API_BASE_URL: 'http://192.168.31.117:3000',
    IMAGE_BASE_URL: 'http://192.168.31.117:3000/uploads',
    // 开发环境的备用API（可以是公共的mock API）
    FALLBACK_API_URL: 'https://mock.apifox.cn/m1/2572446-0-default'
  },
  test: {
    // 测试环境API地址 - 替换为你的测试服务器地址
    API_BASE_URL: 'https://api-test.yourhabitapp.com',
    IMAGE_BASE_URL: 'https://api-test.yourhabitapp.com/uploads',
    // 测试环境备用API
    FALLBACK_API_URL: 'https://mock.apifox.cn/m1/2572446-0-default'
  },
  production: {
    // 生产环境API地址 - 替换为你的生产服务器地址
    API_BASE_URL: 'https://api.yourhabitapp.com',
    IMAGE_BASE_URL: 'https://api.yourhabitapp.com/uploads',
    // 生产环境备用API
    FALLBACK_API_URL: 'https://api-backup.yourhabitapp.com'
  }
};

// 获取当前环境的配置
export const getConfig = (): EnvConfig => {
  const envType = getEnvType();
  return configs[envType];
};

// 导出所有配置项，方便直接使用
export const config = getConfig(); 
